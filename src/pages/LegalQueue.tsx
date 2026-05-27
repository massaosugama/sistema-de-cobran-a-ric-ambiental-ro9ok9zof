import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle2, Scale, Clock, Forward, X } from 'lucide-react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StrategicAnalysisModal } from '@/components/StrategicAnalysisModal'

export default function LegalQueue() {
  const { user, profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const [cases, setCases] = useState<any[]>([])
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('strategic_assignments')
      .select(
        '*, operator:profiles!strategic_assignments_operator_id_fkey(first_name, last_name, name, color)',
      )
      .eq('queue_type', 'legal')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao buscar casos do jurídico')
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

    setCases(enrichedData)

    const currentIds = new Set(enrichedData.map((d) => d.id))
    setSelectedCases((prev) => {
      const next = new Set(prev)
      for (const id of next) {
        if (!currentIds.has(id)) next.delete(id)
      }
      return next
    })

    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchCases()
  }, [user])

  const updateStatus = async (id: string, newStatus: string) => {
    if (isConsultas) return toast.error('Acesso restrito.')
    const { error } = await supabase
      .from('strategic_assignments')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) toast.error('Erro ao atualizar status')
    else fetchCases()
  }

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedCases)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedCases(newSet)
  }

  const handleUndoTransfer = async () => {
    if (isConsultas) return toast.error('Acesso restrito.')
    if (selectedCases.size === 0) return
    if (
      !window.confirm(
        'Tem certeza que deseja desfazer a transferência destes casos? Eles retornarão ao seu status anterior.',
      )
    )
      return

    setLoading(true)
    const casesToUpdate = cases.filter((c) => selectedCases.has(c.id))
    let hasError = false

    for (const c of casesToUpdate) {
      const { error } = await supabase
        .from('strategic_assignments')
        .update({
          queue_type: c.previous_queue || 'strategic',
          status: c.previous_status || 'started',
          previous_queue: null,
          previous_status: null,
        })
        .eq('id', c.id)

      if (error) hasError = true
    }

    if (hasError) {
      toast.error('Erro ao desfazer algumas transferências')
    } else {
      toast.success('Transferências desfeitas com sucesso!')
      setSelectedCases(new Set())
      fetchCases()
    }
    setLoading(false)
  }

  const handleOpenModal = (item: any) => {
    setSelectedCase(item)
    setIsModalOpen(true)
  }

  const aEncaminhar = cases.filter((c) => c.status === 'a_encaminhar')
  const encaminhado = cases.filter((c) => c.status === 'encaminhado')
  const finalizado = cases.filter((c) => c.status === 'processo_finalizado')

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
      <div className="p-3 border-b bg-white flex justify-between items-center shrink-0">
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

  const renderCaseCard = (item: any) => (
    <Card
      key={item.id}
      className={cn(
        'mb-3 shadow-sm hover:shadow transition-all border-slate-200 relative group cursor-pointer',
        selectedCases.has(item.id)
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'bg-white',
      )}
      onClick={() => handleOpenModal(item)}
    >
      <CardContent className="p-3 text-sm flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start gap-2 overflow-hidden">
            <div
              className="mt-0.5"
              onClick={(e) => {
                e.stopPropagation()
                toggleSelection(item.id)
              }}
            >
              <Checkbox
                checked={selectedCases.has(item.id)}
                onCheckedChange={() => toggleSelection(item.id)}
              />
            </div>
            <div className="font-bold text-slate-800" title="UC">
              {item.uc}
            </div>
          </div>
          <div className="text-red-600 font-semibold whitespace-nowrap">
            {formatCurrency(item.snapshot_valor_vencido || 0)}
          </div>
        </div>
        <div className="text-slate-600 line-clamp-1 pl-6" title={item.snapshot_nome_cliente}>
          {item.snapshot_nome_cliente || 'N/A'}
        </div>
        <div className="flex items-center gap-2 pl-6 mt-0.5">
          <span className="text-xs text-slate-500 font-medium">Op:</span>
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
        </div>
        <div
          className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 pl-6"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-slate-400 font-medium">
            {item.snapshot_qt_fats} faturas
          </span>
          <div className="flex gap-1">
            {item.status === 'encaminhado' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-700"
                onClick={() => updateStatus(item.id, 'a_encaminhar')}
                title="Voltar"
                disabled={isConsultas}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {item.status === 'processo_finalizado' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-700"
                onClick={() => updateStatus(item.id, 'encaminhado')}
                title="Voltar"
                disabled={isConsultas}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}

            {item.status === 'a_encaminhar' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => updateStatus(item.id, 'encaminhado')}
                disabled={isConsultas}
              >
                Encaminhar <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            {item.status === 'encaminhado' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                onClick={() => updateStatus(item.id, 'processo_finalizado')}
                disabled={isConsultas}
              >
                Finalizar <CheckCircle2 className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="shrink-0 mb-2 flex flex-col xl:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> Fila Jurídico
          </h1>
          <p className="text-sm text-slate-500">
            Acompanhamento de processos encaminhados ao Setor Jurídico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cases.length > 0 && selectedCases.size === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCases(new Set(cases.map((c) => c.id)))}
            >
              Selecionar Todos
            </Button>
          )}
          {selectedCases.size > 0 && (
            <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200 animate-in fade-in zoom-in">
              <span className="text-sm font-bold text-slate-700 px-2">
                {selectedCases.size} selecionado(s)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCases(new Set())}
                className="h-8 text-slate-500 hover:text-slate-700"
              >
                Desmarcar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUndoTransfer}
                className="h-8"
                disabled={isConsultas}
              >
                <X className="w-4 h-4 mr-1" /> Desfazer Encaminhamento
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 -mx-4 sm:mx-0">
        <ResizablePanelGroup
          direction={isMobile ? 'vertical' : 'horizontal'}
          className="border rounded-xl shadow-sm bg-slate-200 overflow-hidden h-full gap-[1px]"
        >
          <ResizablePanel defaultSize={33} minSize={20} className="flex flex-col bg-slate-50/50">
            {renderHeader(
              'A Encaminhar',
              <Clock className="w-4 h-4 text-amber-500" />,
              aEncaminhar.length,
              aEncaminhar,
              'bg-amber-100',
              'text-amber-700',
            )}
            <div className="flex-1 overflow-y-auto p-3">
              {aEncaminhar.map(renderCaseCard)}
              {aEncaminhar.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum caso nesta etapa
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 hover:bg-slate-300 w-1" />

          <ResizablePanel defaultSize={33} minSize={20} className="flex flex-col bg-slate-50/50">
            {renderHeader(
              'Encaminhado',
              <Forward className="w-4 h-4 text-blue-500" />,
              encaminhado.length,
              encaminhado,
              'bg-blue-100',
              'text-blue-700',
            )}
            <div className="flex-1 overflow-y-auto p-3">
              {encaminhado.map(renderCaseCard)}
              {encaminhado.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum caso nesta etapa
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 hover:bg-slate-300 w-1" />

          <ResizablePanel defaultSize={34} minSize={20} className="flex flex-col bg-slate-50/50">
            {renderHeader(
              'Finalizado',
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
              finalizado.length,
              finalizado,
              'bg-emerald-100',
              'text-emerald-700',
            )}
            <div className="flex-1 overflow-y-auto p-3">
              {finalizado.map(renderCaseCard)}
              {finalizado.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum caso nesta etapa
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <StrategicAnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        assignment={selectedCase}
        onSaved={fetchCases}
        queueType="legal"
      />
    </div>
  )
}
