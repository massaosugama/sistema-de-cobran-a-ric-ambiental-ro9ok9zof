import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Clock, ArrowRight, ArrowLeft, CheckCircle2, Undo2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { StrategicAnalysisModal } from '@/components/StrategicAnalysisModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ColumnDef {
  id: string
  title: string
  nextStatus: string | null
  prevStatus?: string | null
  matchStatuses?: string[]
}

interface QueueBoardProps {
  title: string
  description: string
  icon: any
  queueType: 'cut' | 'recut' | 'ferrule'
  columns: ColumnDef[]
  allowUnassign?: boolean
}

export function QueueBoard({
  title,
  description,
  icon: Icon,
  queueType,
  columns,
  allowUnassign,
}: QueueBoardProps) {
  const { profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('strategic_assignments')
      .select(`
        *,
        operator:profiles!strategic_assignments_operator_id_fkey(first_name, last_name, name, color)
      `)
      .eq('queue_type', queueType)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao buscar registros')
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [queueType])

  const handleUnassign = async (id: string) => {
    if (isConsultas) return toast.error('Acesso restrito.')
    const { error } = await supabase.from('strategic_assignments').delete().eq('id', id)

    if (error) {
      toast.error('Erro ao desfazer atribuição')
    } else {
      toast.success('Atribuição desfeita com sucesso!')
      fetchItems()
    }
  }

  const handleMove = async (id: string, nextStatus: string) => {
    if (isConsultas) return toast.error('Acesso restrito.')
    const { error } = await supabase
      .from('strategic_assignments')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success('Status atualizado com sucesso!')
      fetchItems()
    }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    const lower = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.uc?.toLowerCase().includes(lower) ||
        item.snapshot_nome_cliente?.toLowerCase().includes(lower) ||
        item.cod_pess_fat?.toLowerCase().includes(lower),
    )
  }, [items, searchTerm])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-4 bg-slate-50/50">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar UC ou Nome..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = filteredItems.filter((i) =>
            col.matchStatuses ? col.matchStatuses.includes(i.status) : i.status === col.id,
          )
          return (
            <div
              key={col.id}
              className="flex flex-col w-80 shrink-0 h-full bg-slate-200/50 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
            >
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-700 text-sm">{col.title}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {colItems.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colItems.map((item) => (
                  <Card
                    key={item.id}
                    className="shadow-sm border-slate-200 hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedItem(item)
                      setIsModalOpen(true)
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div
                          className="font-bold text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/customer/${item.uc}_${item.cod_pess_fat}`}>
                            UC: {item.uc}
                          </Link>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.snapshot_valor_vencido || 0)}
                        </span>
                      </div>
                      <p
                        className="text-xs text-slate-600 font-medium line-clamp-2 mb-3"
                        title={item.snapshot_nome_cliente}
                      >
                        {item.snapshot_nome_cliente || 'Cliente não identificado'}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center text-[10px] text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(parseISO(item.created_at), 'dd/MM/yyyy')}
                        </div>

                        <div className="flex items-center gap-1">
                          {allowUnassign && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Desfazer Atribuição"
                                  disabled={isConsultas}
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Desfazer Atribuição</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja desfazer a atribuição à esta Fila?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUnassign(item.id)
                                    }}
                                  >
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {col.prevStatus && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMove(item.id, col.prevStatus!)
                              }}
                              disabled={isConsultas}
                            >
                              <ArrowLeft className="w-3 h-3 mr-1" /> Voltar
                            </Button>
                          )}
                          {col.nextStatus && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMove(item.id, col.nextStatus!)
                              }}
                              disabled={isConsultas}
                            >
                              Avançar <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {!col.nextStatus && (
                            <div className="flex items-center text-[10px] text-emerald-600 font-bold ml-1">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {colItems.length === 0 && !loading && (
                  <div className="text-center p-4 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    Nenhum registro nesta etapa.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <StrategicAnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assignment={selectedItem}
        onSaved={fetchItems}
        queueType={queueType}
      />
    </div>
  )
}
