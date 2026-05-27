import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, PhoneOff, Download, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { id: 's1_telefones', title: '1. Telefones' },
  { id: 's2_pesquisa', title: '2. Pesquisa' },
  { id: 's3_sem_dados', title: '3. Sem Dados' },
  { id: 's4_manual', title: '4. Manual' },
]

export default function NonEffectiveCutQueue() {
  const { profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    const { data: assignments, error } = await supabase
      .from('strategic_assignments')
      .select(`*`)
      .eq('queue_type', 'non_effective_cut')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao buscar registros')
      setLoading(false)
      return
    }

    const ucs = assignments?.map((a) => a.uc) || []

    let debtsMap = new Map()
    if (ucs.length > 0) {
      const { data: debts } = await supabase
        .from('pending_debts')
        .select(
          'uc, cod_pess_fat, pessoa_fatura_celular, proprietario_celular, responsavel_celular, pessoa_fatura_cpf_cnpj, proprietario_cpf_cnpj, responsavel_cpf_cnpj',
        )
        .in('uc', ucs)

      debts?.forEach((d) => debtsMap.set(`${d.uc}-${d.cod_pess_fat}`, d))
    }

    const merged =
      assignments?.map((a) => ({
        ...a,
        debtDetails: debtsMap.get(`${a.uc}-${a.cod_pess_fat}`),
      })) || []

    setItems(merged)
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleUnassign = async (id: string) => {
    if (isConsultas) return toast.error('Acesso restrito.')
    const { error } = await supabase.from('strategic_assignments').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao desfazer atribuição')
    } else {
      toast.success('Atribuição desfeita!')
      fetchItems()
    }
  }

  const handleExportCSV = () => {
    const s1Items = items.filter((i) => i.status === 's1_telefones')
    if (s1Items.length === 0) return toast.info('Nenhum registro na sub-sessão 1 para exportar.')

    let csv = 'UC;NOME;VALOR_VENCIDO;TELEFONE_1;TELEFONE_2;TELEFONE_3\n'
    s1Items.forEach((item) => {
      const d = item.debtDetails
      const t1 = d?.pessoa_fatura_celular || ''
      const t2 = d?.proprietario_celular || ''
      const t3 = d?.responsavel_celular || ''
      const val = item.snapshot_valor_vencido || 0
      csv += `${item.uc};"${item.snapshot_nome_cliente || ''}";${val};"${t1}";"${t2}";"${t3}"\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fila_corte_n_efetivo_telefones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverCol(colId)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverCol(null)
    if (isConsultas) return toast.error('Acesso restrito.')

    const itemId = e.dataTransfer.getData('text/plain')
    if (!itemId) return

    const item = items.find((i) => i.id === itemId)
    if (!item || item.status === colId) return

    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: colId } : i)))

    const { error } = await supabase
      .from('strategic_assignments')
      .update({ status: colId, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) {
      toast.error('Erro ao mover registro.')
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
        item.cod_pess_fat?.toLowerCase().includes(lower) ||
        item.debtDetails?.pessoa_fatura_cpf_cnpj?.toLowerCase().includes(lower),
    )
  }, [items, searchTerm])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-4 bg-slate-50/50">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-lg">
            <PhoneOff className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fila Corte ñ Efetivo</h1>
            <p className="text-sm text-slate-500">
              Gerenciamento de casos com baixa efetividade para ações de corte.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar UC, Nome ou CPF..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colItems = filteredItems.filter((i) => i.status === col.id)
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                'flex flex-col w-80 shrink-0 h-full rounded-xl overflow-hidden border shadow-sm transition-colors duration-200',
                dragOverCol === col.id
                  ? 'bg-pink-50 border-pink-300'
                  : 'bg-slate-200/50 border-slate-200',
              )}
            >
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-700 text-sm">{col.title}</h3>
                <div className="flex items-center gap-2">
                  {col.id === 's1_telefones' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-500 hover:text-primary"
                      onClick={handleExportCSV}
                      title="Exportar CSV (WeTalkie)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {colItems.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    draggable={!isConsultas}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    className={cn(
                      'cursor-grab active:cursor-grabbing',
                      isConsultas && 'cursor-default',
                    )}
                  >
                    <Card className="shadow-sm border-slate-200 hover:border-pink-300 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-sm text-pink-600 hover:underline">
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
                          className="text-xs text-slate-600 font-medium line-clamp-2 mb-2"
                          title={item.snapshot_nome_cliente}
                        >
                          {item.snapshot_nome_cliente || 'Cliente não identificado'}
                        </p>

                        {col.id === 's2_pesquisa' && item.debtDetails?.pessoa_fatura_cpf_cnpj && (
                          <div
                            className="text-[10px] font-mono bg-slate-100 p-1.5 rounded mb-2 select-all cursor-text"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-slate-400 font-sans mr-1 select-none">
                              CPF/CNPJ:
                            </span>
                            {item.debtDetails.pessoa_fatura_cpf_cnpj}
                          </div>
                        )}

                        {col.id === 's1_telefones' && (
                          <div className="text-[10px] text-slate-500 mb-2 bg-slate-50 p-1.5 rounded truncate">
                            {[
                              item.debtDetails?.pessoa_fatura_celular,
                              item.debtDetails?.proprietario_celular,
                              item.debtDetails?.responsavel_celular,
                            ]
                              .filter(Boolean)
                              .join(' / ') || 'Sem telefone válido'}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Faturas: {item.snapshot_qt_fats}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}
                                title="Desfazer Atribuição"
                                disabled={isConsultas}
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Desfazer Atribuição</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover este registro da Fila Corte ñ
                                  Efetivo?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleUnassign(item.id)}>
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                {colItems.length === 0 && !loading && (
                  <div className="text-center p-4 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    Arraste registros para cá.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
