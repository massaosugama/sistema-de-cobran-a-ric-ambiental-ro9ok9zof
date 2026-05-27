import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Loader2, Trash2, ArrowDown, ArrowUp, ArrowUpDown, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

interface Props {
  status: 'sendo_negativado' | 'negativado' | 'nao_negativar'
  refreshTrigger: number
  onDataChanged: () => void
}

export function SerasaWorkflowTable({ status, refreshTrigger, onDataChanged }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [orderBy, setOrderBy] = useState('updated_at')
  const [orderDesc, setOrderDesc] = useState(true)

  const { toast } = useToast()
  const { profile } = useAuth()
  const limit = 50

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('serasa_workflow')
        .select('*', { count: 'exact' })
        .eq('status', status)

      if (search) {
        query = query.or(`uc.ilike.%${search}%,nome.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`)
      }

      const {
        data: res,
        count,
        error,
      } = await query
        .order(orderBy, { ascending: !orderDesc })
        .range((page - 1) * limit, page * limit - 1)

      if (error) throw error
      setData(res || [])
      setTotalCount(count || 0)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger, search, page, status, orderBy, orderDesc])

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('serasa_workflow').delete().eq('id', id)
      if (error) throw error
      toast({
        title: 'Removido',
        description: 'Registro removido do fluxo e retornado para a etapa anterior.',
      })
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

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Input
          placeholder="Buscar por UC, Nome ou CPF/CNPJ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="max-w-md"
        />
        <div className="text-sm text-slate-500 font-medium">Total: {totalCount} registros</div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleSort('updated_at')}
              >
                <div className="flex items-center">Data {getSortIcon('updated_at')}</div>
              </TableHead>
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
                onClick={() => handleSort('valor_vencido')}
              >
                <div className="flex items-center justify-end">
                  Valor Vencido {getSortIcon('valor_vencido')}
                </div>
              </TableHead>
              {status !== 'negativado' && <TableHead className="w-[130px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={status !== 'negativado' ? 6 : 5} className="h-32 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={status !== 'negativado' ? 6 : 5}
                  className="h-24 text-center text-slate-500"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(status === 'negativado' && 'opacity-60 bg-slate-50')}
                >
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(row.updated_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium">{row.uc}</TableCell>
                  <TableCell>{row.cpf_cnpj}</TableCell>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      row.valor_vencido || 0,
                    )}
                  </TableCell>
                  {status !== 'negativado' && (
                    <TableCell>
                      {profile && profile.role !== 'consultas' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 h-8"
                          onClick={() => handleRemove(row.id)}
                          title="Desfazer e retornar para Devedores a Negativar"
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1" /> Arrepender
                        </Button>
                      )}
                    </TableCell>
                  )}
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
