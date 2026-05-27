import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle2, PlayCircle, Clock, ArrowRight } from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StrategicAnalysisModal } from '@/components/StrategicAnalysisModal'

export default function StrategicQueue() {
  const { user, profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user) fetchAssignments()
  }, [user, filterMode])

  const fetchAssignments = async () => {
    setLoading(true)
    let query = supabase
      .from('strategic_assignments')
      .select(`
        *,
        operator:profiles!strategic_assignments_operator_id_fkey(first_name, last_name, name, color)
      `)
      .eq('queue_type', 'strategic')
      .in('status', ['pending', 'started', 'completed'])
      .order('created_at', { ascending: false })

    if (filterMode === 'my') {
      query = query.eq('operator_id', user?.id)
    }

    const { data, error } = await query

    if (error) {
      toast.error('Erro ao buscar fila estratégica')
      setLoading(false)
      return
    }

    const ucs = Array.from(new Set(data?.map((d) => d.uc) || []))
    const currentDebts: Record<string, number> = {}

    if (ucs.length > 0) {
      const chunkSize = 200
      for (let i = 0; i < ucs.length; i += chunkSize) {
        const chunk = ucs.slice(i, i + chunkSize)
        const { data: debtsData } = await supabase
          .from('pending_debts')
          .select('uc, cod_pess_fat, valor_vencido')
          .in('uc', chunk)

        if (debtsData) {
          debtsData.forEach((d) => {
            currentDebts[`${d.uc}_${d.cod_pess_fat}`] = Number(d.valor_vencido) || 0
          })
        }
      }
    }

    const enrichedData =
      data?.map((d) => ({
        ...d,
        current_valor_vencido: currentDebts[`${d.uc}_${d.cod_pess_fat}`] || 0,
      })) || []

    setAssignments(enrichedData)
    setLoading(false)
  }

  const pending = useMemo(() => assignments.filter((a) => a.status === 'pending'), [assignments])
  const started = useMemo(() => assignments.filter((a) => a.status === 'started'), [assignments])
  const completed = useMemo(
    () => assignments.filter((a) => a.status === 'completed'),
    [assignments],
  )

  const handleOpenModal = async (assignment: any) => {
    setSelected(assignment)
    setIsModalOpen(true)

    if (assignment.status === 'pending' && !isConsultas) {
      const { error } = await supabase
        .from('strategic_assignments')
        .update({ status: 'started', started_at: new Date().toISOString() })
        .eq('id', assignment.id)

      if (!error) fetchAssignments()
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const calculateTotals = (list: any[]) => {
    const sumSnapshot = list.reduce(
      (acc, curr) => acc + (Number(curr.snapshot_valor_vencido) || 0),
      0,
    )
    const sumCurrent = list.reduce(
      (acc, curr) => acc + (Number(curr.current_valor_vencido) || 0),
      0,
    )
    return { sumSnapshot, sumCurrent }
  }

  const renderHeader = (
    title: string,
    icon: React.ReactNode,
    count: number,
    dataList: any[],
    bgColorClass: string,
    textColorClass: string,
  ) => {
    const { sumSnapshot, sumCurrent } = calculateTotals(dataList)
    return (
      <div className="p-3 border-b bg-slate-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            {icon} {title}
          </h3>
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              bgColorClass,
              textColorClass,
            )}
          >
            {count}
          </span>
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span
            className="text-[10px] font-bold text-emerald-600"
            title="Valor Original (Snapshot)"
          >
            {formatCurrency(sumSnapshot)}
          </span>
          <span className="text-[10px] font-bold text-amber-600" title="Valor Atualizado (Sistema)">
            {formatCurrency(sumCurrent)}
          </span>
        </div>
      </div>
    )
  }

  const renderTable = (data: any[], type: 'pending' | 'started' | 'completed') => (
    <Table>
      <TableHeader className="bg-slate-50 sticky top-0 z-10">
        <TableRow>
          <TableHead>UC</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Operador</TableHead>
          <TableHead className="text-right">Vencido</TableHead>
          <TableHead className="text-center">Fats</TableHead>
          {type === 'completed' && <TableHead className="text-center">Pontos</TableHead>}
          <TableHead className="text-right">Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={type === 'completed' ? 7 : 6}
              className="text-center py-8 text-slate-500"
            >
              Nenhum registro.
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50/50">
              <TableCell className="font-medium text-xs">{item.uc}</TableCell>
              <TableCell
                className="max-w-[150px] truncate text-xs"
                title={item.snapshot_nome_cliente}
              >
                {item.snapshot_nome_cliente || 'N/A'}
              </TableCell>
              <TableCell className="max-w-[120px] truncate">
                {item.operator ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-sm"
                    style={{ backgroundColor: item.operator.color || '#94a3b8' }}
                    title={item.operator.name || item.operator.first_name}
                  >
                    {item.operator.first_name || item.operator.name?.split(' ')[0]}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 whitespace-nowrap shadow-sm">
                    Não Atribuído
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium text-red-600 text-xs">
                {formatCurrency(item.snapshot_valor_vencido || 0)}
              </TableCell>
              <TableCell className="text-center text-xs">{item.snapshot_qt_fats || '-'}</TableCell>
              {type === 'completed' && (
                <TableCell className="text-center text-xs font-bold text-orange-600">
                  +{item.pontos || 0} pts
                </TableCell>
              )}
              <TableCell className="text-right">
                {type !== 'completed' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10 rounded-xl"
                    onClick={() => handleOpenModal(item)}
                    title="Analisar"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-xl"
                    onClick={() => handleOpenModal(item)}
                    title="Ver Análise"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div
      className={cn(
        'animate-fade-in-up flex flex-col min-h-[600px] space-y-4',
        isMobile
          ? 'pb-10'
          : 'h-[calc(100vh-2.5rem)] md:h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4.5rem)] pb-0',
      )}
    >
      <div className="shrink-0 mb-2 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
            Fila de Estratégias
          </h1>
          <p className="text-sm text-slate-500">
            <span>
              Gerencie a atuação sobre a carteira VENCIDA, baseada&nbsp;nas estratégias e
              prioridades da época.
            </span>
            <div>
              <span>A partir de 15/04/2026 o foco está em "limpeza de dívidas antigas".</span>
            </div>
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Button
            variant={filterMode === 'my' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('my')}
            className={cn('h-8 text-xs', filterMode === 'my' && 'bg-white shadow-sm')}
          >
            Minhas Atribuições
          </Button>
          <Button
            variant={filterMode === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('all')}
            className={cn('h-8 text-xs', filterMode === 'all' && 'bg-white shadow-sm')}
          >
            Visualizar Todos
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 -mx-4 sm:mx-0">
        <ResizablePanelGroup
          direction="horizontal"
          className="border rounded-xl shadow-sm bg-slate-200 overflow-hidden h-full gap-[1px]"
        >
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-white">
            {renderHeader(
              'A Trabalhar',
              <Clock className="w-5 h-5 text-slate-500" />,
              pending.length,
              pending,
              'bg-slate-200',
              'text-slate-700',
            )}
            <div className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Carregando...</div>
              ) : (
                renderTable(pending, 'pending')
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-slate-200 hover:bg-slate-300 w-1" />
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-white">
            <ResizablePanelGroup
              direction="vertical"
              className="h-full w-full gap-[1px] bg-slate-200"
            >
              <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col bg-white">
                {renderHeader(
                  'Iniciadas',
                  <PlayCircle className="w-5 h-5 text-blue-500" />,
                  started.length,
                  started,
                  'bg-blue-100',
                  'text-blue-700',
                )}
                <div className="flex-1 overflow-y-auto p-0">
                  {loading ? (
                    <div className="text-center py-8 text-slate-500">Carregando...</div>
                  ) : (
                    renderTable(started, 'started')
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-slate-200 hover:bg-slate-300 h-1" />
              <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col bg-white">
                {renderHeader(
                  'Concluídas',
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                  completed.length,
                  completed,
                  'bg-emerald-100',
                  'text-emerald-700',
                )}
                <div className="flex-1 overflow-y-auto p-0">
                  {loading ? (
                    <div className="text-center py-8 text-slate-500">Carregando...</div>
                  ) : (
                    renderTable(completed, 'completed')
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <StrategicAnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assignment={selected}
        onSaved={fetchAssignments}
        queueType="strategic"
      />
    </div>
  )
}
