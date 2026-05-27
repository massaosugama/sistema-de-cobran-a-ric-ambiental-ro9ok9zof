import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function SerasaBaixadosTable({
  refreshTrigger,
  onDataChanged,
}: {
  refreshTrigger?: number
  onDataChanged?: () => void
}) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 100

  const { toast } = useToast()
  const { profile } = useAuth()

  const loadData = async (isLoadMore = false) => {
    setLoading(true)
    const currentOffset = isLoadMore ? offset + limit : 0

    const { data: res, error } = await (supabase as any).rpc('get_serasa_cross_reference', {
      p_cpf_cnpj: search || null,
      p_possui_debitos: null,
      p_baixado_aqui: true,
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
  }, [search, refreshTrigger])

  const handleRestaurar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('serasa_negativations')
        .update({ baixado_aqui: false })
        .eq('id', id)
      if (error) throw error
      toast({
        title: 'Registro Restaurado',
        description: 'O registro retornou para a lista ativa.',
      })
      await loadData()
      if (onDataChanged) onDataChanged()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este registro?')) return
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
    <Card className="shadow-sm border-slate-200 opacity-80 hover:opacity-100 transition-opacity">
      <CardContent className="p-6">
        <div className="flex mb-6">
          <div className="w-full md:max-w-xs">
            <Input
              placeholder="Buscar CPF/CNPJ ou Nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData(false)}
            />
          </div>
        </div>

        <div className="border rounded-md overflow-x-auto bg-slate-50/50">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Última Verificação</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhum registro baixado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-slate-100/50 transition-all text-slate-600"
                  >
                    <TableCell className="font-medium">{item.cpf_cnpj}</TableCell>
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
                    <TableCell className="text-sm whitespace-nowrap">
                      {item.ultima_verificacao
                        ? format(new Date(item.ultima_verificacao), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {profile && profile.role !== 'consultas' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestaurar(item.id)}
                            title="Restaurar para tabela principal"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-blue-600 hover:bg-blue-50"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            title="Excluir Permanentemente"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {hasMore && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 bg-slate-100/50">
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
    </Card>
  )
}
