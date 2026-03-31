import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, Search, MapPin, CheckCircle2, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function Reversions() {
  const { user } = useAuth()
  const [rawResults, setRawResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<'meus' | 'todos'>('meus')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'revertidos'>('todos')
  const [search, setSearch] = useState('')
  const [searchAddress, setSearchAddress] = useState('')

  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)

  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())

  useEffect(() => {
    setLoading(true)

    let query = supabase
      .from('contact_history')
      .select('*, profiles(name, first_name, last_name, color), contact_results(*, settlements(*))')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (startDate) {
      query = query.gte('created_at', startOfDay(startDate).toISOString())
    }
    if (endDate) {
      query = query.lte('created_at', endOfDay(endDate).toISOString())
    }

    query.then(async ({ data }) => {
      if (data && data.length > 0) {
        const ucs = [...new Set(data.map((d) => d.uc).filter(Boolean))]
        const { data: debts } = await supabase
          .from('pending_debts')
          .select('uc, cod_pess_fat, endereco, pessoa_fatura_nome')
          .in('uc', ucs)

        const enriched = data.map((r) => {
          const debt = debts?.find((d) => d.uc === r.uc && d.cod_pess_fat === r.cod_pess_fat)
          const result =
            r.contact_results && r.contact_results.length > 0 ? r.contact_results[0] : null
          return {
            ...r,
            endereco: debt?.endereco || '',
            nome_cliente:
              debt?.pessoa_fatura_nome ||
              result?.settlements?.pessoa_fatura_nome ||
              'Não identificado',
            is_reverted: !!result,
            result_data: result,
          }
        })
        setRawResults(enriched)
      } else {
        setRawResults([])
      }
      setLoading(false)
    })
  }, [startDate, endDate])

  const groupedResults = useMemo(() => {
    let res = rawResults

    if (view === 'meus') {
      res = res.filter((r) => r.operator_id === user?.id)
    }

    if (filterStatus === 'revertidos') {
      res = res.filter((r) => r.is_reverted)
    }

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase()
      res = res.filter(
        (r) =>
          r.uc?.toLowerCase().includes(lowerSearch) ||
          (r.nome_cliente && r.nome_cliente.toLowerCase().includes(lowerSearch)),
      )
    }

    if (debouncedSearchAddress) {
      const lowerAddr = debouncedSearchAddress.toLowerCase()
      res = res.filter((r) => r.endereco && r.endereco.toLowerCase().includes(lowerAddr))
    }

    const groups: Record<string, { opName: string; opColor: string; items: any[] }> = {}

    res.forEach((item) => {
      const opId = item.operator_id || 'unassigned'
      if (!groups[opId]) {
        const profile = item.profiles
        groups[opId] = {
          opName: profile?.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : profile?.name || 'Desconhecido',
          opColor: profile?.color || '#94a3b8',
          items: [],
        }
      }
      groups[opId].items.push(item)
    })

    Object.values(groups).forEach((group) => {
      group.items.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    })

    return Object.values(groups).sort((a, b) => a.opName.localeCompare(b.opName))
  }, [rawResults, view, filterStatus, user?.id, debouncedSearch, debouncedSearchAddress])

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Reversões & Resultados
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors focus:outline-none">
                  <AlertCircle className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 bg-amber-50 border-amber-200 shadow-md rounded-xl"
                align="start"
              >
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Aviso de Dados Históricos
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Os valores, faturas e indicadores apresentados nesta tela são dados estáticos (
                  <strong>snapshots</strong>) registrados no exato momento da abertura do
                  atendimento. Eles servem exclusivamente para o monitoramento de resultados
                  históricos e mensuração de reversão de dívidas, não devendo ser confundidos com os
                  saldos atualizados exibidos nas telas de atendimento. Apenas baixas identificadas
                  como CONV.ARREC ou DEB.AUTO geram reversões automáticas.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-slate-500 mt-1 font-medium">
            Acompanhamento de todos os atendimentos e suas eventuais conversões.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 w-full xl:w-auto">
          <div className="flex flex-wrap items-end gap-2 w-full xl:w-auto">
            <div className="flex flex-col w-[48%] sm:w-auto">
              <span className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-0.5">
                Data De
              </span>
              <Input
                type="date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setStartDate(e.target.value ? parseISO(e.target.value) : new Date())
                }
                className="h-10 bg-white rounded-xl border-slate-200 text-sm px-3 shadow-sm focus-visible:ring-primary/20 w-full sm:w-[135px]"
              />
            </div>
            <div className="flex flex-col w-[48%] sm:w-auto">
              <span className="text-[10px] text-slate-500 uppercase font-bold ml-1 mb-0.5">
                Data Até
              </span>
              <Input
                type="date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(e.target.value ? parseISO(e.target.value) : new Date())}
                className="h-10 bg-white rounded-xl border-slate-200 text-sm px-3 shadow-sm focus-visible:ring-primary/20 w-full sm:w-[135px]"
              />
            </div>

            <div className="relative w-full sm:w-[180px] mt-1 sm:mt-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre UC, Nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
              />
            </div>
            <div className="relative w-full sm:w-[180px] mt-1 sm:mt-0">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre Endereço"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="pl-9 rounded-xl bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 xl:mt-0">
            <div className="bg-slate-200/50 p-1 rounded-lg inline-flex flex-1 sm:flex-none h-10 items-center">
              <button
                onClick={() => setView('meus')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none whitespace-nowrap',
                  view === 'meus'
                    ? 'bg-white shadow text-primary'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Meus
              </button>
              <button
                onClick={() => setView('todos')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none whitespace-nowrap',
                  view === 'todos'
                    ? 'bg-white shadow text-primary'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Todos
              </button>
            </div>

            <div className="bg-slate-200/50 p-1 rounded-lg inline-flex flex-1 sm:flex-none h-10 items-center">
              <button
                onClick={() => setFilterStatus('todos')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none whitespace-nowrap',
                  filterStatus === 'todos'
                    ? 'bg-white shadow text-primary'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Todos Atendimentos
              </button>
              <button
                onClick={() => setFilterStatus('revertidos')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none whitespace-nowrap',
                  filterStatus === 'revertidos'
                    ? 'bg-white shadow text-primary'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Só Revertidos
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex-1 flex items-center justify-center text-slate-500 font-medium">
          Carregando resultados...
        </div>
      ) : groupedResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          <TrendingUp className="w-10 h-10 text-slate-300 mb-4" />
          <p className="font-medium text-lg">Nenhum atendimento encontrado.</p>
          <p className="text-sm">Altere os filtros para buscar mais resultados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedResults.map((group, idx) => (
            <Card key={idx} className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader
                className="px-5 py-3 border-b flex flex-row items-center justify-between"
                style={{ backgroundColor: `${group.opColor}15` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-sm"
                    style={{ backgroundColor: group.opColor }}
                  >
                    {group.opName.charAt(0).toUpperCase()}
                  </div>
                  <CardTitle className="text-base text-slate-800">{group.opName}</CardTitle>
                </div>
                <div className="bg-white border px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                  {group.items.length} atendimentos
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[450px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Devedor / UC</TableHead>
                        <TableHead>Atendimento / Snapshot</TableHead>
                        <TableHead>Baixa Detectada</TableHead>
                        <TableHead className="text-center">Tempo</TableHead>
                        <TableHead className="text-right">Pontos</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((res) => (
                        <TableRow key={res.id}>
                          <TableCell>
                            <span
                              className="font-bold text-slate-800 line-clamp-1"
                              title={res.nome_cliente}
                            >
                              {res.nome_cliente}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-semibold text-sm text-slate-600">
                                UC {res.uc}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Cod: {res.cod_pess_fat}
                              </span>
                            </div>
                            {res.endereco && (
                              <span
                                className="text-xs text-slate-500 line-clamp-1 mt-0.5"
                                title={res.endereco}
                              >
                                {res.endereco}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">Valor Dívida:</span>
                                <span className="font-semibold">
                                  R${' '}
                                  {(res.snapshot_valor_total || 0).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                                {res.created_at
                                  ? format(parseISO(res.created_at), 'dd/MM/yyyy HH:mm')
                                  : '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {res.is_reverted && res.result_data ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-500">Valor Baixado:</span>
                                  <span className="font-bold text-emerald-600">
                                    R${' '}
                                    {(res.result_data.valor_recuperado || 0).toLocaleString(
                                      'pt-BR',
                                      {
                                        minimumFractionDigits: 2,
                                      },
                                    )}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  {res.result_data.data_baixa
                                    ? format(parseISO(res.result_data.data_baixa), 'dd/MM/yyyy')
                                    : '-'}
                                  <span className="mx-1">•</span>
                                  <span className="uppercase font-semibold">
                                    {res.result_data.settlements?.tipo_baixa || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400 italic">
                                Aguardando pagamento...
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {res.is_reverted && res.result_data ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                {res.result_data.dias_para_reversao}{' '}
                                {res.result_data.dias_para_reversao === 1 ? 'dia' : 'dias'}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {res.is_reverted && res.result_data ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-600 text-sm font-bold">
                                +{res.result_data.pontos_reversao}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {res.is_reverted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-sm">
                                <CheckCircle2 className="w-3 h-3" />
                                Revertido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">
                                <Clock className="w-3 h-3" />
                                Pendente
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
