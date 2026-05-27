import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CheckCircle2,
  Ban,
  Search,
  Edit3,
  UserCog,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from 'lucide-react'
import { getUpdates } from '@/services/cadastral-updates'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TableToolbar } from './TableToolbar'
import { TablePagination } from './TablePagination'
import { UpdateDialog } from './UpdateDialog'
import { toast } from '@/hooks/use-toast'

export function RequestsTable({
  onViewCustomer,
}: {
  onViewCustomer: (uc: string, cod: string) => void
}) {
  const [activeTab, setActiveTab] = useState('pending')
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [limit, setLimit] = useState(50)
  const [page, setPage] = useState(1)
  const [orderBy, setOrderBy] = useState('created_at')
  const [orderDesc, setOrderDesc] = useState(true)

  const [selectedUpdate, setSelectedUpdate] = useState<any>(null)
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, limit, activeTab])

  const load = async () => {
    setLoading(true)
    try {
      const offset = (page - 1) * limit
      const res = await getUpdates(activeTab, debouncedSearch, orderBy, orderDesc, limit, offset)
      setData(res.data)
      setTotal(res.count)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar fila.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [activeTab, debouncedSearch, limit, page, orderBy, orderDesc])

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

  const Th = ({ col, label }: { col: string; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-slate-100 transition-colors select-none"
      onClick={() => handleSort(col)}
    >
      <div className="flex items-center">
        {label} <SortIcon col={col} />
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="w-4 h-4" /> Pendentes
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex gap-2">
            <CheckCircle2 className="w-4 h-4" /> Concluídas
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex gap-2">
            <Ban className="w-4 h-4" /> Canceladas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
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
                <Th col="created_at" label="Data / Solicitante" />
                <Th col="customer_name" label="Devedor / UC" />
                <TableHead>{activeTab === 'pending' ? 'Observações' : 'Tratativa'}</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 animate-pulse text-slate-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">
                          {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <UserCog className="w-3 h-3" /> {item.requester_name || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold truncate max-w-[200px] text-slate-900">
                          {item.customer_name}
                        </span>
                        <span className="text-xs font-medium text-slate-500">UC: {item.uc}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activeTab === 'pending' ? (
                        <p className="text-sm text-slate-600 truncate max-w-md" title={item.notes}>
                          {item.notes || '-'}
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold">
                            {item.resolved_at
                              ? format(new Date(item.resolved_at), 'dd/MM/yyyy HH:mm', {
                                  locale: ptBR,
                                })
                              : '-'}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Ban className="w-3 h-3 text-red-500" />
                            )}
                            {item.resolver_name || '-'}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUpdate(item)
                            setDialogMode('view')
                          }}
                          className="text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                        {activeTab === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUpdate(item)
                              setDialogMode('edit')
                            }}
                            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </Card>

      <UpdateDialog
        selectedUpdate={selectedUpdate}
        onClose={() => setSelectedUpdate(null)}
        dialogMode={dialogMode}
        onSuccess={load}
        onViewCustomer={onViewCustomer}
      />
    </div>
  )
}
