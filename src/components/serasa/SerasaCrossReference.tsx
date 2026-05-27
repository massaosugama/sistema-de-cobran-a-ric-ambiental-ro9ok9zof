import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, Trash2, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { MatchedDebtsDrawer } from './MatchedDebtsDrawer'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { SerasaPortalDrawer } from './SerasaPortalDrawer'
import { SerasaActionDialog } from './SerasaActionDialog'

export function SerasaCrossReference({
  refreshTrigger,
  onDataChanged,
}: {
  refreshTrigger?: number
  onDataChanged?: () => void
}) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [filters, setFilters] = useState({ search: '', possui_debitos: 'todos' })

  const [selectedCpfCnpj, setSelectedCpfCnpj] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [portalDrawerOpen, setPortalDrawerOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 100

  const { toast } = useToast()

  const loadData = async (isLoadMore = false) => {
    setLoading(true)
    const currentOffset = isLoadMore ? offset + limit : 0

    let p_possui_debitos = null
    if (filters.possui_debitos === 'sim') p_possui_debitos = true
    if (filters.possui_debitos === 'nao') p_possui_debitos = false

    const { data: res, error } = await (supabase as any).rpc('get_serasa_cross_reference', {
      p_cpf_cnpj: filters.search || null,
      p_possui_debitos,
      p_baixado_aqui: false,
      p_limit: limit,
      p_offset: currentOffset,
    })

    if (!error) {
      const newData = res || []
      if (isLoadMore) {
        setData((prev) => [...prev, ...newData])
      } else {
        setData(newData)
      }
      setOffset(currentOffset)
      setHasMore(newData.length === limit)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData(false)
  }, [filters.search, filters.possui_debitos, refreshTrigger])

  const handleAtualizar = async () => {
    setUpdating(true)
    try {
      const { error } = await (supabase as any).rpc('update_serasa_debts_status')
      if (error) throw error
      toast({ title: 'Atualização Concluída', description: 'Os registros foram re-checados.' })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (error: any) {
      toast({ title: 'Erro na atualização', description: error.message, variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleBaixarAqui = async (id: string) => {
    try {
      const { error } = await supabase
        .from('serasa_negativations')
        .update({ baixado_aqui: true })
        .eq('id', id)
      if (error) throw error
      toast({
        title: 'Registro Baixado',
        description: 'O registro foi movido para a lista de baixados.',
      })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('serasa_negativations').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Registro Excluído', description: 'O registro foi removido com sucesso.' })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          <div className="flex-1 w-full md:max-w-xs">
            <Input
              placeholder="Buscar CPF/CNPJ ou Nome..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadData(false)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={filters.possui_debitos}
              onValueChange={(val) => setFilters({ ...filters, possui_debitos: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Possui Débitos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não (Pronto p/ Baixa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAtualizar}
            disabled={updating || loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>

        <div className="border rounded-md overflow-x-auto bg-white">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Última Verificação</TableHead>
                <TableHead className="text-center">Possui Débitos</TableHead>
                <TableHead className="w-[180px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'group hover:bg-slate-50/50 transition-all',
                      item.is_blacklisted &&
                        'bg-red-50 hover:bg-red-100 shadow-[inset_0_0_10px_rgba(239,68,68,0.15)] relative',
                      !item.is_blacklisted &&
                        item.possui_debitos === false &&
                        'bg-emerald-50 hover:bg-emerald-100 shadow-[inset_0_0_10px_rgba(16,185,129,0.15)] relative',
                    )}
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {item.is_blacklisted ? (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse"></span>
                      ) : item.possui_debitos === false ? (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 animate-pulse"></span>
                      ) : null}
                      {item.cpf_cnpj}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.nome}>
                      {item.nome}
                    </TableCell>
                    <TableCell>{item.num_contrato}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.valor).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.situacao === 'Ativa' ? 'default' : 'secondary'}
                        className={
                          item.situacao === 'Ativa'
                            ? 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
                            : ''
                        }
                      >
                        {item.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {item.ultima_verificacao
                        ? format(new Date(item.ultima_verificacao), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.is_blacklisted ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200 cursor-default shadow-sm animate-pulse">
                          Black!
                        </Badge>
                      ) : item.possui_debitos ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 cursor-default shadow-sm">
                          Sim
                        </Badge>
                      ) : item.possui_debitos === false ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 cursor-default shadow-sm animate-pulse">
                          Não (Baixar)
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {item.possui_debitos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCpfCnpj(item.cpf_cnpj)
                              setDrawerOpen(true)
                            }}
                            title="Analisar vínculos"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-blue-600 hover:bg-blue-50"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPortalDrawerOpen(true)}
                          title="Baixar Serasa"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-slate-600 hover:bg-slate-100"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBaixarAqui(item.id)}
                          title="Baixar Aqui"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedItem(item)
                            setActionDialogOpen(true)
                          }}
                          title="Ações do Registro"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {hasMore && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 bg-slate-50/50">
                    <Button
                      variant="outline"
                      onClick={() => loadData(true)}
                      disabled={loading}
                      className="w-full max-w-sm"
                    >
                      {loading ? 'Carregando...' : 'Carregar Mais'}
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <MatchedDebtsDrawer
        cpfCnpj={selectedCpfCnpj}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
      <SerasaPortalDrawer isOpen={portalDrawerOpen} onOpenChange={setPortalDrawerOpen} />
      <SerasaActionDialog
        item={selectedItem}
        isOpen={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        onBaixarAqui={handleBaixarAqui}
        onBaixarSerasa={() => setPortalDrawerOpen(true)}
        onExcluir={handleDelete}
      />
    </Card>
  )
}
