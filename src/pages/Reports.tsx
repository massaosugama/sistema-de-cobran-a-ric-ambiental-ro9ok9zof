import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  CalendarIcon,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

const parseQuality = (qr: string | null) => {
  const defaultRet = {
    phones: [] as string[],
    statuses: [] as string[],
    rawStatuses: [] as string[],
    isOwner: false,
    unknownProperty: false,
    otherUc: false,
    updateRegistration: false,
  }
  if (!qr) return defaultRet
  try {
    const p = JSON.parse(qr)
    const phoneList: string[] = []
    const statusList: string[] = []
    const extractedStatuses: string[] = []
    if (p.phoneStatuses && typeof p.phoneStatuses === 'object') {
      Object.entries(p.phoneStatuses).forEach(([phone, val]) => {
        if (typeof val === 'string' && val) {
          phoneList.push(phone)
          statusList.push(val)
          extractedStatuses.push(val)
        }
      })
    }
    if (phoneList.length === 0 && (p.phoneStatus || p.status_telefone)) {
      const s = p.phoneStatus || p.status_telefone
      statusList.push(s)
      extractedStatuses.push(s)
    }
    return {
      phones: phoneList,
      statuses: statusList,
      rawStatuses: extractedStatuses,
      isOwner: p.isOwner || p.falei_titular || p.talkedToOwner || false,
      unknownProperty: p.unknownProperty || p.desconhece_imovel || false,
      otherUc: p.otherUc || p.outra_uc || false,
      updateRegistration: p.updateRegistration || p.atualizar_cadastro || false,
    }
  } catch {
    return { ...defaultRet, statuses: qr ? [qr] : [], rawStatuses: qr ? [qr] : [] }
  }
}

const formatBool = (v: any) =>
  v === true || v === 'true' || v === 'Sim'
    ? 'Sim'
    : v === false || v === 'false' || v === 'Não'
      ? 'Não'
      : '-'
const formatCurrency = (v: number | null) =>
  v == null ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function DatePicker({
  date,
  setDate,
  label,
}: {
  date: Date | undefined
  setDate: (d: Date | undefined) => void
  label: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal bg-white h-9',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{date ? format(date, 'dd/MM/yyyy') : label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

export default function Reports() {
  const [data, setData] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const pageSize = 100

  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [operatorId, setOperatorId] = useState('all')
  const [phoneStatus, setPhoneStatus] = useState('all')
  const [queueType, setQueueType] = useState('all')

  const [globalSearch, setGlobalSearch] = useState('')
  const debouncedGlobalSearch = useDebounce(globalSearch, 500)

  const [operators, setOperators] = useState<{ id: string; name: string }[]>([])
  const [availablePhoneStatuses, setAvailablePhoneStatuses] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, first_name, email')
      .then(({ data }) => {
        if (data)
          setOperators(data.map((d) => ({ id: d.id, name: d.name || d.first_name || d.email })))
      })
    supabase
      .from('contact_history')
      .select('quality_result')
      .not('quality_result', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3000)
      .then(({ data }) => {
        if (data) {
          const statuses = new Set<string>()
          data.forEach((r) => {
            const q = parseQuality(r.quality_result)
            if (q.rawStatuses && q.rawStatuses.length > 0)
              q.rawStatuses.forEach((s: string) => statuses.add(s))
          })
          setAvailablePhoneStatuses(Array.from(statuses).filter(Boolean).sort())
        }
      })
  }, [])

  const loadData = useCallback(
    async (pageIndex: number) => {
      setLoading(true)
      try {
        let q = supabase
          .from('contact_history')
          .select('*, profiles(name, first_name, email)', { count: 'exact' })
          .order('created_at', { ascending: false })
        if (dateFrom) q = q.gte('created_at', dateFrom.toISOString())
        if (dateTo) {
          const end = new Date(dateTo)
          end.setHours(23, 59, 59, 999)
          q = q.lte('created_at', end.toISOString())
        }
        if (operatorId !== 'all') q = q.eq('operator_id', operatorId)
        if (phoneStatus !== 'all') q = q.ilike('quality_result', `%${phoneStatus}%`)
        if (queueType !== 'all') q = q.eq('queue_type', queueType)
        if (debouncedGlobalSearch)
          q = q.or(`uc.ilike.%${debouncedGlobalSearch}%,notes.ilike.%${debouncedGlobalSearch}%`)

        const from = pageIndex * pageSize
        const to = from + pageSize - 1
        q = q.range(from, to)

        const { data: resData, count, error } = await q
        if (error) throw error

        setData(resData || [])
        setTotalCount(count || 0)
        setPage(pageIndex)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [dateFrom, dateTo, operatorId, phoneStatus, queueType, debouncedGlobalSearch, pageSize],
  )

  useEffect(() => {
    loadData(0)
  }, [loadData])

  const exportToCSV = (exportData: any[]) => {
    const headers = [
      'UC',
      'Valor Divida',
      'Origem/Fila',
      'Operador',
      'Data e Hora',
      'Canal Contato',
      'Resultado Contato',
      'Telefone 1',
      'Status Tel. 1',
      'Telefone 2',
      'Status Tel. 2',
      'Telefone 3',
      'Status Tel. 3',
      'Falou Titular?',
      'Desconhece Imovel?',
      'Outra UC?',
      'Atualizar Cad?',
      'Qtd Faturas',
      'Ref Faturas',
      'Observacoes',
    ]
    const rows = exportData.map((item) => {
      const q = parseQuality(item.quality_result)
      const opName =
        item.profiles?.name || item.profiles?.first_name || item.operator_id || 'SISTEMA'
      const qTypeStr =
        item.queue_type === 'strategic'
          ? 'Estratégia'
          : item.queue_type === 'legal'
            ? 'Jurídico'
            : 'Atendimento Geral'
      return [
        item.uc,
        item.snapshot_valor_total,
        qTypeStr,
        opName,
        format(new Date(item.created_at), 'dd/MM/yyyy HH:mm:ss'),
        item.contact_type,
        item.status,
        q.phones[0] || '',
        q.statuses[0] || '',
        q.phones[1] || '',
        q.statuses[1] || '',
        q.phones[2] || '',
        q.statuses[2] || '',
        formatBool(q.isOwner),
        formatBool(q.unknownProperty),
        formatBool(q.otherUc),
        formatBool(q.updateRegistration),
        item.snapshot_qt_fats,
        item.snapshot_refs,
        item.notes?.replace(/(\r\n|\n|\r)/gm, ' ') || '',
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(';')
    })
    const blob = new Blob(['\uFEFF' + [headers.join(';'), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_atendimentos_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    link.click()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      let allData: any[] = []
      let currentFrom = 0
      const limit = 1000
      while (true) {
        let q = supabase
          .from('contact_history')
          .select('*, profiles(name, first_name, email)')
          .order('created_at', { ascending: false })
          .range(currentFrom, currentFrom + limit - 1)
        if (dateFrom) q = q.gte('created_at', dateFrom.toISOString())
        if (dateTo) {
          const end = new Date(dateTo)
          end.setHours(23, 59, 59, 999)
          q = q.lte('created_at', end.toISOString())
        }
        if (operatorId !== 'all') q = q.eq('operator_id', operatorId)
        if (phoneStatus !== 'all') q = q.ilike('quality_result', `%${phoneStatus}%`)
        if (queueType !== 'all') q = q.eq('queue_type', queueType)
        if (debouncedGlobalSearch)
          q = q.or(`uc.ilike.%${debouncedGlobalSearch}%,notes.ilike.%${debouncedGlobalSearch}%`)

        const { data: batch, error } = await q
        if (error) throw error
        if (!batch || batch.length === 0) break
        allData.push(...batch)
        if (batch.length < limit) break
        currentFrom += limit
      }
      exportToCSV(allData)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 pt-6 bg-slate-50/50 min-h-screen">
      <div className="shrink-0 mb-6 flex flex-col gap-2 animate-fade-in-up">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
          Relatórios de Atendimentos
        </h1>
        <p className="text-sm text-slate-500">
          Histórico e exportação de todos os contatos realizados pela equipe.
        </p>
      </div>

      <Card
        className="mb-6 shadow-sm border-slate-200 animate-fade-in-up"
        style={{ animationDelay: '50ms' }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
            <Filter className="w-4 h-4" /> Filtros de Busca
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Busca Global
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="UC ou Obs..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="pl-8 h-9 bg-white text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fila / Origem
              </label>
              <Select value={queueType} onValueChange={setQueueType}>
                <SelectTrigger className="h-9 bg-white text-sm">
                  <SelectValue placeholder="Todas as Filas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Filas</SelectItem>
                  <SelectItem value="strategic">Fila Estratégias</SelectItem>
                  <SelectItem value="legal">Fila Jurídico</SelectItem>
                  <SelectItem value="general">Atendimento Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Operador
              </label>
              <Select value={operatorId} onValueChange={setOperatorId}>
                <SelectTrigger className="h-9 bg-white text-sm">
                  <SelectValue placeholder="Todos Operadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Operadores</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Status do Contato
              </label>
              <Select value={phoneStatus} onValueChange={setPhoneStatus}>
                <SelectTrigger className="h-9 bg-white text-sm">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  {availablePhoneStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Data Inicial
              </label>
              <DatePicker label="Data Inicial" date={dateFrom} setDate={setDateFrom} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Data Final
              </label>
              <DatePicker label="Data Final" date={dateTo} setDate={setDateTo} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm border-slate-200 animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b bg-white shrink-0 space-y-0">
          <CardTitle className="text-base font-bold text-slate-800">
            Resultados ({totalCount})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={totalCount === 0 || exporting}
            className="h-8 text-xs bg-slate-50 hover:bg-slate-100"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto relative">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <TableRow className="text-[11px] whitespace-nowrap uppercase tracking-wider bg-slate-100/50">
                <TableHead className="font-bold text-slate-600">UC</TableHead>
                <TableHead className="font-bold text-slate-600">Dívida</TableHead>
                <TableHead className="font-bold text-slate-600">Origem/Fila</TableHead>
                <TableHead className="font-bold text-slate-600">Operador</TableHead>
                <TableHead className="font-bold text-slate-600">Data/Hora</TableHead>
                <TableHead className="font-bold text-slate-600">Canal</TableHead>
                <TableHead className="font-bold text-slate-600">Resultado</TableHead>
                <TableHead className="font-bold text-slate-600">Tel. 1</TableHead>
                <TableHead className="font-bold text-slate-600">Status 1</TableHead>
                <TableHead className="font-bold text-slate-600">Titular?</TableHead>
                <TableHead className="font-bold text-slate-600">Obs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => {
                const q = parseQuality(r.quality_result)
                return (
                  <TableRow
                    key={r.id}
                    className="text-xs whitespace-nowrap hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="font-bold text-slate-900">{r.uc}</TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {formatCurrency(r.snapshot_valor_total)}
                    </TableCell>
                    <TableCell>
                      {r.queue_type === 'strategic' ? (
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Estratégia
                        </span>
                      ) : r.queue_type === 'legal' ? (
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Jurídico
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Geral
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{r.profiles?.name || r.profiles?.first_name || 'SISTEMA'}</TableCell>
                    <TableCell className="text-slate-500">
                      {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{r.contact_type}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{q.phones[0] || '-'}</TableCell>
                    <TableCell>{q.statuses[0] || '-'}</TableCell>
                    <TableCell>{formatBool(q.isOwner)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-500" title={r.notes}>
                      {r.notes || '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-slate-500">
                    Nenhum registro encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Buscando dados...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-between px-4 py-2 border-t bg-white shrink-0">
          <span className="text-xs text-slate-500">
            {totalCount > 0
              ? `Mostrando ${page * pageSize + 1} a ${Math.min((page + 1) * pageSize, totalCount)} de ${totalCount}`
              : 'Nenhum registro'}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => loadData(page - 1)}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2 text-slate-600">
              {page + 1} / {Math.ceil(totalCount / pageSize) || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => loadData(page + 1)}
              disabled={(page + 1) * pageSize >= totalCount || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
