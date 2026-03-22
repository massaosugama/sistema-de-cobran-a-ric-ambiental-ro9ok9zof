import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  format,
  isBefore,
  startOfToday,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarDays,
  CheckCircle2,
  Edit2,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

export interface EnrichedTask {
  id: string
  uc: string
  cod_pess_fat: string
  action: string
  due_date: string
  operator_id: string
  operator?: { name: string; color: string }
  debt?: { valor_total: number; nome: string }
  lastNote?: string
}

export default function FollowUp() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [view, setView] = useState<'meus' | 'todos'>('meus')
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [loading, setLoading] = useState(true)

  // Layout State
  const [isMobile, setIsMobile] = useState(false)

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null)
  const [actionInput, setActionInput] = useState('')
  const [dateInput, setDateInput] = useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data: rawTasks } = await supabase
        .from('follow_up_tasks')
        .select('*')
        .eq('completed', false)
        .order('due_date', { ascending: true })
      if (!rawTasks || rawTasks.length === 0) {
        setTasks([])
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, color, first_name, last_name')

      const ucs = [...new Set(rawTasks.map((t) => t.uc).filter(Boolean))]
      const { data: debts } = await supabase
        .from('pending_debts')
        .select('uc, cod_pess_fat, valor_total, pessoa_fatura_nome, ta_nome_de_quem')
        .in('uc', ucs)
      const { data: contacts } = await supabase
        .from('contact_history')
        .select('uc, cod_pess_fat, notes')
        .in('uc', ucs)
        .order('created_at', { ascending: false })

      const enriched = rawTasks.map((t) => {
        const op = profiles?.find((p) => p.id === t.operator_id)
        const debt = debts?.find((d) => d.uc === t.uc && d.cod_pess_fat === t.cod_pess_fat)
        const note = contacts?.find(
          (c) => c.uc === t.uc && c.cod_pess_fat === t.cod_pess_fat && c.notes,
        )
        return {
          ...t,
          operator: op
            ? { name: op.first_name || op.name || 'Operador', color: op.color || '#94a3b8' }
            : undefined,
          debt: debt
            ? {
                valor_total: debt.valor_total || 0,
                nome: debt.pessoa_fatura_nome || debt.ta_nome_de_quem || '',
              }
            : undefined,
          lastNote: note?.notes || undefined,
        }
      })
      setTasks(enriched as EnrichedTask[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => view === 'todos' || t.operator_id === user?.id)
  }, [tasks, view, user?.id])

  const tasksByDate = useMemo(() => {
    return filteredTasks.reduce(
      (acc, task) => {
        if (task.due_date) {
          if (!acc[task.due_date]) acc[task.due_date] = []
          acc[task.due_date].push(task)
        }
        return acc
      },
      {} as Record<string, EnrichedTask[]>,
    )
  }, [filteredTasks])

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    return filteredTasks.filter((t) => t.due_date === format(selectedDate, 'yyyy-MM-dd'))
  }, [filteredTasks, selectedDate])

  const isTaskOverdue = (dateStr: string | null) => {
    if (!dateStr) return false
    return isBefore(parseISO(dateStr), startOfToday())
  }

  const overdueTasks = useMemo(
    () => filteredTasks.filter((t) => isTaskOverdue(t.due_date)),
    [filteredTasks],
  )
  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t) => !isTaskOverdue(t.due_date)),
    [filteredTasks],
  )

  const handleComplete = async (id: string) => {
    try {
      await supabase.from('follow_up_tasks').update({ completed: true }).eq('id', id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast({ title: 'Sucesso', description: 'Follow-up marcado como concluído!' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a tarefa.',
        variant: 'destructive',
      })
    }
  }

  const openNewTaskModal = (baseTask: EnrichedTask) => {
    setEditingTask({
      ...baseTask,
      id: 'new',
      action: '',
      due_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setActionInput('')
    setDateInput(new Date())
    setModalOpen(true)
  }

  const openEditTaskModal = (task: EnrichedTask) => {
    setEditingTask(task)
    setActionInput(task.action || '')
    setDateInput(task.due_date ? parseISO(task.due_date) : new Date())
    setModalOpen(true)
  }

  const handleSaveModal = async () => {
    if (!editingTask || !actionInput || !dateInput) {
      toast({ title: 'Atenção', description: 'Preencha a ação e a data.', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    const payload = {
      uc: editingTask.uc,
      cod_pess_fat: editingTask.cod_pess_fat,
      action: actionInput,
      due_date: format(dateInput, 'yyyy-MM-dd'),
      operator_id: user?.id,
    }

    try {
      if (editingTask.id === 'new') {
        await supabase.from('follow_up_tasks').insert([payload])
        toast({ title: 'Sucesso', description: 'Novo follow-up criado.' })
      } else {
        await supabase.from('follow_up_tasks').update(payload).eq('id', editingTask.id)
        toast({ title: 'Sucesso', description: 'Follow-up atualizado.' })
      }
      setModalOpen(false)
      fetchTasks()
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao salvar follow-up.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const TaskCard = ({ task }: { task: EnrichedTask }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col relative animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {task.operator?.color && (
            <div
              className="w-2.5 h-2.5 rounded-full shadow-inner"
              style={{ backgroundColor: task.operator.color }}
            />
          )}
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {task.operator?.name || 'Desconhecido'}
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
            isTaskOverdue(task.due_date) ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700',
          )}
        >
          <CalendarDays className="w-3 h-3" />
          {task.due_date ? format(parseISO(task.due_date), 'dd/MM') : '-'}
        </div>
      </div>

      <div className="mb-2">
        <h3
          className="font-bold text-slate-800 text-sm leading-tight line-clamp-1"
          title={task.debt?.nome}
        >
          UC {task.uc}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1 truncate" title={task.debt?.nome}>
          {task.debt?.nome || 'Cliente'}
        </p>
        <p className="text-xs font-semibold text-primary mt-0.5">
          R${' '}
          {task.debt?.valor_total
            ? task.debt.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            : '0,00'}
        </p>
      </div>

      <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100/80 mb-3">
        <p
          className="text-[12px] font-medium text-slate-700 line-clamp-2 leading-relaxed"
          title={task.action}
        >
          {task.action}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleComplete(task.id)}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-7 px-2 -ml-2 text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Concluir
        </Button>
        <div className="flex gap-0.5 -mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditTaskModal(task)}
            className="h-7 w-7 text-slate-400 hover:text-primary"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openNewTaskModal(task)}
            className="h-7 w-7 text-slate-400 hover:text-primary"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  const TaskList = ({
    title,
    tasks,
    emptyMsg,
    icon,
    colorClass,
  }: {
    title: string
    tasks: EnrichedTask[]
    emptyMsg: string
    icon: React.ReactNode
    colorClass: string
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
        <div className={cn('p-1.5 rounded-md', colorClass)}>{icon}</div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <span className="ml-auto bg-white border shadow-sm text-slate-600 py-0.5 px-2.5 rounded-full text-xs font-semibold">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-100 rounded-xl bg-white/50">
            {emptyMsg}
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )

  const renderSidebarView = () => (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-4 border-b bg-white flex justify-between items-center shrink-0 h-[65px]">
        <h2 className="font-bold text-lg text-slate-800 line-clamp-1">
          {selectedDate ? `Tarefas: ${format(selectedDate, 'dd/MM/yyyy')}` : 'Atividades'}
        </h2>
        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(null)}
            className="h-8 text-xs text-slate-500 hover:text-slate-800 -mr-2"
          >
            <FilterX className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedDate ? (
          <TaskList
            title={`Agendadas`}
            tasks={selectedDateTasks}
            emptyMsg="Nenhuma tarefa para este dia."
            icon={<CalendarDays className="w-5 h-5" />}
            colorClass="text-indigo-700 bg-indigo-50"
          />
        ) : (
          <>
            <TaskList
              title="Atrasados"
              tasks={overdueTasks}
              emptyMsg="Nenhum compromisso atrasado."
              icon={<AlertCircle className="w-5 h-5" />}
              colorClass="text-red-700 bg-red-50"
            />
            <TaskList
              title="Próximos"
              tasks={upcomingTasks}
              emptyMsg="Nenhum compromisso agendado."
              icon={<Clock className="w-5 h-5" />}
              colorClass="text-blue-700 bg-blue-50"
            />
          </>
        )}
      </div>
    </div>
  )

  const renderCalendarView = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between shrink-0 bg-white h-[65px]">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-xl text-slate-800 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 text-slate-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="h-8 font-medium text-slate-600"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 text-slate-500"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        <div className="grid grid-cols-7 border-b bg-slate-50 shrink-0">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-r last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(0,1fr)] overflow-y-auto">
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDate[dateStr] || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'border-r border-b p-1.5 sm:p-2 flex flex-col cursor-pointer transition-colors relative group overflow-hidden',
                  !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white',
                  isSelected
                    ? 'ring-2 ring-primary ring-inset z-10 bg-primary/5'
                    : 'hover:bg-slate-50',
                  isToday && !isSelected && 'bg-slate-50',
                )}
              >
                <div
                  className={cn(
                    'text-xs font-medium mb-1.5 text-center w-6 h-6 ml-auto flex items-center justify-center rounded-full shrink-0',
                    isToday
                      ? 'bg-primary text-white'
                      : !isCurrentMonth
                        ? 'text-slate-400'
                        : 'text-slate-700',
                  )}
                >
                  {format(day, 'd')}
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="text-[10px] leading-tight px-1.5 py-1 rounded bg-slate-100/80 border-l-[3px] truncate shadow-sm flex items-center gap-1.5 transition-all hover:brightness-95"
                      style={{ borderLeftColor: t.operator?.color || '#94a3b8' }}
                      title={`${t.debt?.nome || 'Cliente'} - ${t.action}`}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.operator?.color || '#94a3b8' }}
                      />
                      <span className="truncate text-slate-700 font-medium">UC {t.uc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'animate-fade-in-up',
        isMobile
          ? 'space-y-6 pb-10 flex flex-col'
          : 'flex flex-col h-[calc(100dvh-7.5rem)] min-h-[600px] space-y-4 pb-4',
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Follow-up</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Painel de gestão de compromissos operacionais.
          </p>
        </div>
        <div className="bg-slate-200/50 p-1 rounded-lg inline-flex w-full sm:w-auto">
          <button
            onClick={() => setView('meus')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold transition-all flex-1 sm:flex-none',
              view === 'meus'
                ? 'bg-white shadow text-primary'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            Meus Compromissos
          </button>
          <button
            onClick={() => setView('todos')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-semibold transition-all flex-1 sm:flex-none',
              view === 'todos'
                ? 'bg-white shadow text-primary'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            Equipe (Todos)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex-1 flex items-center justify-center text-slate-500 font-medium">
          Carregando painel...
        </div>
      ) : (
        <div className="flex-1 min-h-0 -mx-4 sm:mx-0">
          {isMobile ? (
            <div className="flex flex-col gap-6 h-full overflow-y-auto px-4 sm:px-0">
              <div className="h-[500px] border rounded-xl overflow-hidden shadow-sm shrink-0">
                {renderCalendarView()}
              </div>
              <div className="border rounded-xl overflow-hidden shadow-sm flex-1 min-h-[400px]">
                {renderSidebarView()}
              </div>
            </div>
          ) : (
            <ResizablePanelGroup
              direction="horizontal"
              className="border rounded-xl shadow-sm bg-white overflow-hidden h-full"
            >
              <ResizablePanel
                defaultSize={30}
                minSize={25}
                maxSize={45}
                className="flex flex-col bg-slate-50/50"
              >
                {renderSidebarView()}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} className="flex flex-col bg-white">
                {renderCalendarView()}
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTask?.id === 'new' ? 'Novo Follow-up' : 'Editar Follow-up'}
            </DialogTitle>
            <DialogDescription>
              {editingTask?.id === 'new'
                ? `Agendando para UC ${editingTask?.uc}`
                : 'Atualize os detalhes do compromisso abaixo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ação / Lembrete</Label>
              <Input
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder="Ex: Retornar para negociar entrada"
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Retorno</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-medium h-10',
                      !dateInput && 'text-slate-400',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {dateInput ? format(dateInput, 'PPP', { locale: ptBR }) : 'Selecione uma data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateInput}
                    onSelect={(d) => {
                      setDateInput(d)
                      setIsCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveModal} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
