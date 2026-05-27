import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Loader2, ArrowRight, ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

interface Props {
  refreshTrigger: number
  onDataChanged: () => void
  selectedRefs: string[] | null
  onRefsChange: (refs: string[]) => void
}

export function SerasaDevedoresANegativarTable({
  refreshTrigger,
  onDataChanged,
  selectedRefs,
  onRefsChange,
}: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [orderBy, setOrderBy] = useState('valor_vencido')
  const [orderDesc, setOrderDesc] = useState(true)
  const [situDoctoFilter, setSituDoctoFilter] = useState<string[]>(['pend'])
  const [availableRefs, setAvailableRefs] = useState<string[]>([])
  const [refsLoaded, setRefsLoaded] = useState(false)
  const [blacklistFilter, setBlacklistFilter] = useState('sem')

  const { toast } = useToast()
  const { profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const limit = 50

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const { data, error } = await supabase.rpc('get_distinct_refs')
        if (error) throw error
        if (data) {
          const refs = data.map((d: any) => d.ref)
          setAvailableRefs(refs)

          if (selectedRefs === null) {
            const currentMonthRef = format(new Date(), 'MM/yyyy')
            const initialSelected = refs.filter((r) => !r.includes(currentMonthRef))
            onRefsChange(initialSelected)
          }
        }
      } catch (err) {
        console.error('Error fetching refs:', err)
      } finally {
        setRefsLoaded(true)
      }
    }
    fetchRefs()
  }, [])

  const fetchData = async () => {
    if (!refsLoaded) return
    setLoading(true)
    try {
      const currentSelectedRefs = selectedRefs || []
      const { data: res, error } = await supabase.rpc('get_devedores_a_negativar', {
        p_search: debouncedSearch,
        p_limit: limit,
        p_offset: (page - 1) * limit,
        p_situ_docto: situDoctoFilter.length > 0 ? situDoctoFilter : null,
        p_order_by: orderBy,
        p_order_desc: orderDesc,
        p_periods: currentSelectedRefs.length > 0 ? currentSelectedRefs : null,
        p_blacklist_filter: blacklistFilter,
      })
      if (error) throw error
      setData(res || [])
      setTotalCount(res?.[0]?.total_count || 0)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [
    refreshTrigger,
    debouncedSearch,
    page,
    orderBy,
    orderDesc,
    situDoctoFilter,
    selectedRefs,
    refsLoaded,
    blacklistFilter,
  ])

  const toggleRef = (ref: string) => {
    const currentSelectedRefs = selectedRefs || []
    const next = currentSelectedRefs.includes(ref)
      ? currentSelectedRefs.filter((r) => r !== ref)
      : [...currentSelectedRefs, ref]
    onRefsChange(next)
    setPage(1)
  }

  const handleMarcarNegativado = async (row: any) => {
    try {
      const { error } = await supabase.from('serasa_workflow').insert({
        uc: row.uc,
        cod_pess_fat: row.cod_pess_fat,
        cpf_cnpj: row.cpf_cnpj,
        nome: row.nome,
        valor_vencido: row.valor_vencido,
        status: 'sendo_negativado',
      })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Registro movido para "Sendo Negativado".' })
      onDataChanged()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleNaoNegativar = async (row: any) => {
    try {
      const { error } = await supabase.from('serasa_workflow').insert({
        uc: row.uc,
        cod_pess_fat: row.cod_pess_fat,
        cpf_cnpj: row.cpf_cnpj,
        nome: row.nome,
        valor_vencido: row.valor_vencido,
        status: 'nao_negativar',
      })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Registro movido para "Não Negativar".' })
      onDataChanged()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDesc(!orderDesc)
    } else {
      setOrderBy(column)
      setOrderDesc(true)
    }
  }

  const getSortIcon = (column: string) => {
    if (orderBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />
    return orderDesc ? <ArrowDown className="ml-2 h-4 w-4" /> : <ArrowUp className="ml-2 h-4 w-4" />
  }

  const handleSituDoctoChange = (val: string, checked: boolean) => {
    if (checked) {
      setSituDoctoFilter((prev) => [...prev, val])
    } else {
      setSituDoctoFilter((prev) => prev.filter((item) => item !== val))
    }
    setPage(1)
  }

  const situDoctoOptions = ['pend', 'contest', 'pend-contest']
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-4">
      {availableRefs.length > 0 && (
        <div className="bg-slate-50 border rounded-md p-3">
          <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Filtro de Referências (Mês/Ano)
          </div>
          <div className="flex flex-wrap gap-2">
            {availableRefs.map((ref) => {
              const currentSelectedRefs = selectedRefs || []
              const isSelected = currentSelectedRefs.includes(ref)
              return (
                <button
                  key={ref}
                  onClick={() => toggleRef(ref)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full border transition-colors',
                    isSelected
                      ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
                  )}
                >
                  {ref}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-xl">
          <Input
            placeholder="Buscar por UC, Nome ou CPF/CNPJ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="flex-1"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shrink-0">
                Situação:{' '}
                {situDoctoFilter.length === 0
                  ? 'Todos'
                  : `${situDoctoFilter.length} selecionado(s)`}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {situDoctoOptions.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt}
                  checked={situDoctoFilter.includes(opt)}
                  onCheckedChange={(checked) => handleSituDoctoChange(opt, checked)}
                >
                  {opt}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select
            value={blacklistFilter}
            onValueChange={(val) => {
              setBlacklistFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px] shrink-0">
              <SelectValue placeholder="Black-list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sem">Sem Black-list</SelectItem>
              <SelectItem value="so">Só Black-list</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-slate-500 font-medium">Total: {totalCount} registros</div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('uc')}
              >
                <div className="flex items-center">UC {getSortIcon('uc')}</div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('cpf_cnpj')}
              >
                <div className="flex items-center">CPF/CNPJ {getSortIcon('cpf_cnpj')}</div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('nome')}
              >
                <div className="flex items-center">Nome {getSortIcon('nome')}</div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('qt_fats')}
              >
                <div className="flex items-center justify-end">
                  Faturas {getSortIcon('qt_fats')}
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('valor_vencido')}
              >
                <div className="flex items-center justify-end">
                  Valor Vencido {getSortIcon('valor_vencido')}
                </div>
              </TableHead>
              <TableHead className="w-[210px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500">
                      Buscando devedores... Isso pode levar alguns segundos.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.uc}</TableCell>
                  <TableCell>{row.cpf_cnpj}</TableCell>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell className="text-right">{row.qt_fats}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      row.valor_vencido || 0,
                    )}
                  </TableCell>
                  <TableCell>
                    {!isConsultas && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-slate-500 hover:text-slate-700"
                          onClick={() => handleNaoNegativar(row)}
                        >
                          Não Negativar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs hover:bg-slate-100"
                          onClick={() => handleMarcarNegativado(row)}
                        >
                          Negativar <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="pointer-events-none">
                Página {page} de {totalPages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={
                  page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
