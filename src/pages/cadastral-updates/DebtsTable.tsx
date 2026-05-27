import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { getCadastralDebts } from '@/services/cadastral-updates'
import { TableToolbar } from './TableToolbar'
import { TablePagination } from './TablePagination'

export function DebtsTable({
  filterType,
  onViewCustomer,
}: {
  filterType: 'no_phone' | 'invalid_doc'
  onViewCustomer: (uc: string, cod: string) => void
}) {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [limit, setLimit] = useState(50)
  const [page, setPage] = useState(1)
  const [orderBy, setOrderBy] = useState('valor_vencido')
  const [orderDesc, setOrderDesc] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, limit, filterType])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const offset = (page - 1) * limit
        const res = await getCadastralDebts(
          filterType,
          debouncedSearch,
          orderBy,
          orderDesc,
          limit,
          offset,
        )
        setData(res.data)
        setTotal(res.count)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filterType, debouncedSearch, limit, page, orderBy, orderDesc])

  const handleSort = (col: string) => {
    if (orderBy === col) {
      setOrderDesc(!orderDesc)
    } else {
      setOrderBy(col)
      setOrderDesc(true)
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (orderBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400" />
    return orderDesc ? (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    )
  }

  const Th = ({
    col,
    label,
    className = '',
  }: {
    col: string
    label: string
    className?: string
  }) => (
    <TableHead
      className={`cursor-pointer hover:bg-slate-100 transition-colors select-none ${className}`}
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center">
        {label} <SortIcon col={col} />
      </div>
    </TableHead>
  )

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-300">
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        limit={limit}
        onLimitChange={setLimit}
        total={total}
      />
      <div className="overflow-x-auto min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <Th col="uc" label="UC" />
              <Th col="pessoa_fatura_nome" label="Devedor" />
              <Th col="pessoa_fatura_cpf_cnpj" label="Documento" />
              {filterType === 'invalid_doc' && <Th col="pessoa_fatura_celular" label="Celular" />}
              <Th col="valor_total" label="Valor Total" />
              <Th col="valor_vencido" label="Valor Vencido" />
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 animate-pulse">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => (
                <TableRow key={i} className="hover:bg-slate-50/80">
                  <TableCell className="font-bold text-slate-900">{item.uc}</TableCell>
                  <TableCell className="font-semibold text-slate-700 truncate max-w-[200px]">
                    {item.pessoa_fatura_nome}
                  </TableCell>
                  <TableCell>{item.pessoa_fatura_cpf_cnpj || '-'}</TableCell>
                  {filterType === 'invalid_doc' && (
                    <TableCell>{item.pessoa_fatura_celular || '-'}</TableCell>
                  )}
                  <TableCell>R$ {Number(item.valor_total).toFixed(2)}</TableCell>
                  <TableCell className="text-red-600 font-bold">
                    R$ {Number(item.valor_vencido).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewCustomer(item.uc, item.cod_pess_fat)}
                      className="text-slate-400 hover:text-primary rounded-full bg-slate-100/50 hover:bg-primary/10"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={page} limit={limit} total={total} onPageChange={setPage} />
    </Card>
  )
}
