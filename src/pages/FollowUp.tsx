import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Eye,
  RotateCcw,
  Search,
  MapPin,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useDebounce } from '@/hooks/use-debounce'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CustomerActionForm } from '@/pages/customer/CustomerActionForm'
import { getDebts, type ParsedDebt } from '@/services/debts'

export interface EnrichedTask {
  id: string
  uc: string
  cod_pess_fat: string
  action: string
  due_date: string
  operator_id: string
  completed: boolean
  operator?: { name: string; color: string }
  debt?: {
    valor_total: number
    qt_fats: number
    nome: string
    document?: string
    endereco?: string
  }
  lastNote?: string
}

function DebtSearch({ onSelect }: { onSelect: (debt: ParsedDebt) => void }) {
  const [search, setSearch] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)
  const [results, setResults] = useState<ParsedDebt[]>([])
  const [loading, setLoading] = useState(false)

  const hasSearch = debouncedSearch.length >= 3
  const hasAddress = debouncedSearchAddress.length >= 3

  useEffect(() => {
    if (!hasSearch && !hasAddress) {
      setResults([])
      return
    }
    setLoading(true)
    getDebts(
      hasSearch ? debouncedSearch : undefined,
      undefined,
      hasAddress ? debouncedSearchAddress : undefined,
    )
      .then((data) => {
        const all = [...data.unattended, ...data.attended]
        const unique = Array.from(
          new Map(all.map((item) => [`${item.uc}_${item.personCode}`, item])).values(),
        )
        setResults(unique)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [debouncedSearch, debouncedSearchAddress, hasSearch, hasAddress])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="UC, Nome ou CPF/CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white h-11 rounded-xl border-slate-200 shadow-sm"
          />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filtre por Endereço..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="pl-9 bg-white h-11 rounded-xl border-slate-200 shadow-sm"
          />
        </div>
      </div>
      {loading && <div className="text-sm text-slate-500 text-center py-4">Buscando...</div>}
      {!loading && (hasSearch || hasAddress) && results.length === 0 && (
        <div className="text-sm text-slate-500 text-center py-4">Nenhuma dívida encontrada.</div>
      )}
      {!loading && !hasSearch && !hasAddress && (
        <div className="text-sm text-slate-500 text-center py-8">
          Digite pelo menos 3 caracteres em algum dos campos para buscar.
        </div>
      )}
      <div className="space-y-2">
        {results.map((r) => (
          <div
            key={`${r.uc}_${r.personCode}`}
            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all"
            onClick={() => onSelect(r)}
          >
            <p className="font-bold text-sm text-slate-800">{r.name || 'Sem nome'}</p>
            <div className="mt-1.5 space-y-1">
              <p className="text-[13px] font-medium text-slate-600">
                UC: {r.uc} <span className="mx-1 text-slate-300">•</span>{' '}
                <span className="font-bold text-slate-700">
                  R$ {r.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </p>
              {r.address && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-slate-500 line-clamp-1" title={r.address}>
                    {r.address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center text-[10px] text-primary hover:text-primary/80 hover:bg-primary/20 bg-primary/10 px-1.5 py-0.5 rounded font-bold transition-colors shrink-0"
                  >
                    <MapPin className="w-3 h-3 mr-1" /> Mapa
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FollowUp() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [view, setView] = useState<'meus' | 'todos'>('meus')
  const [tasks, setTasks] = useState<EnrichedTask[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [search, setSearch] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)

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

  // New follow-up inside modal state
  const [taskHistory, setTaskHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [newActionInput, setNewActionInput] = useState('')
  const [newDateInput, setNewDateInput] = useState<Date | undefined>(undefined)
  const [isNewCalendarOpen, setIsNewCalendarOpen] = useState(false)

  // New Activity Sheet State
  const [isNewActivitySheetOpen, setIsNewActivitySheetOpen] = useState(false)
  const [preFilledDate, setPreFilledDate] = useState<Date | undefined>(undefined)
  const [selectedNewDebt, setSelectedNewDebt] = useState<ParsedDebt | null>(null)

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
        .select(
          'uc, cod_pess_fat, valor_total, qt_fats, pessoa_fatura_nome, ta_nome_de_quem, pessoa_fatura_cpf_cnpj, endereco',
        )
        .in('uc', ucs)

      const enriched = rawTasks.map((t) => {
        const op = profiles?.find((p) => p.id === t.operator_id)
        const debt = debts?.find((d) => d.uc === t.uc && d.cod_pess_fat === t.cod_pess_fat)
        return {
          ...t,
          operator: op
            ? { name: op.first_name || op.name || 'Operador', color: op.color || '#94a3b8' }
            : undefined,
          debt: debt
            ? {
                valor_total: debt.valor_total || 0,
                qt_fats: debt.qt_fats || 1,
                nome: debt.pessoa_fatura_nome || debt.ta_nome_de_quem || '',
                document: debt.pessoa_fatura_cpf_cnpj || '',
                endereco: debt.endereco || '',
              }
            : undefined,
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

  useEffect(() => {
    const handleContactAdded = () => {
      fetchTasks()
      setIsNewActivitySheetOpen(false)
      setSelectedNewDebt(null)
    }
    window.addEventListener('contact-added', handleContactAdded)
    return () => window.removeEventListener('contact-added', handleContactAdded)
  }, [])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => view === 'todos' || t.operator_id === user?.id)

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase()
      result = result.filter(
        (t) =>
          t.uc.toLowerCase().includes(lowerSearch) ||
          (t.debt?.nome && t.debt.nome.toLowerCase().includes(lowerSearch)) ||
          (t.debt?.document && t.debt.document.toLowerCase().includes(lowerSearch)),
      )
    }

    if (debouncedSearchAddress) {
      const lowerAddr = debouncedSearchAddress.toLowerCase()
      result = result.filter(
        (t) => t.debt?.endereco && t.debt.endereco.toLowerCase().includes(lowerAddr),
      )
    }

    return result
  }, [tasks, view, user?.id, debouncedSearch, debouncedSearchAddress])

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
    () => filteredTasks.filter((t) => isTaskOverdue(t.due_date) && !t.completed),
    [filteredTasks],
  )
  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t) => !isTaskOverdue(t.due_date) && !t.completed),
    [filteredTasks],
  )
  const completedTasks = useMemo(
    () =>
      filteredTasks
        .filter((t) => t.completed)
        .sort((a, b) => {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        }),
    [filteredTasks],
  )

  const openEditTaskModal = async (task: EnrichedTask) => {
    setEditingTask(task)
    setActionInput(task.action || '')
    setDateInput(task.due_date ? parseISO(task.due_date) : new Date())
    setNewActionInput('')
    setNewDateInput(undefined)
    setModalOpen(true)

    setLoadingHistory(true)
    const { data: history } = await supabase
      .from('contact_history')
      .select('*, profiles(name)')
      .eq('uc', task.uc)
      .order('created_at', { ascending: false })
      .limit(20)

    setTaskHistory(history || [])
    setLoadingHistory(false)
  }

  const handleSaveCurrent = async () => {
    if (!editingTask || !actionInput || !dateInput) return
    setIsSaving(true)
    try {
      const updatedDate = format(dateInput, 'yyyy-MM-dd')
      await supabase
        .from('follow_up_tasks')
        .update({ action: actionInput, due_date: updatedDate })
        .eq('id', editingTask.id)

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, action: actionInput, due_date: updatedDate } : t,
        ),
      )
      toast({ title: 'Sucesso', description: 'Lembrete atualizado.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao atualizar lembrete.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompleteCurrent = async (id: string) => {
    setIsSaving(true)
    try {
      await supabase.from('follow_up_tasks').update({ completed: true }).eq('id', id)
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)))
      if (editingTask?.id === id) {
        setEditingTask((prev) => (prev ? { ...prev, completed: true } : null))
      }
      toast({ title: 'Sucesso', description: 'Atividade marcada como concluída!' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao concluir tarefa.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResumeTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setIsSaving(true)
    try {
      await supabase.from('follow_up_tasks').update({ completed: false }).eq('id', id)
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)))
      if (editingTask?.id === id) {
        setEditingTask((prev) => (prev ? { ...prev, completed: false } : null))
      }
      toast({
        title: 'Atividade Retomada',
        description: 'A atividade voltou para suas pendências.',
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao retomar tarefa.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateNew = async () => {
    if (!editingTask || !newActionInput || !newDateInput) return
    setIsSaving(true)
    try {
      const payload = {
        uc: editingTask.uc,
        cod_pess_fat: editingTask.cod_pess_fat,
        action: newActionInput,
        due_date: format(newDateInput, 'yyyy-MM-dd'),
        operator_id: user?.id,
        completed: false,
      }
      await supabase.from('follow_up_tasks').insert([payload])
      toast({ title: 'Sucesso', description: 'Novo follow-up agendado.' })
      fetchTasks()
      setModalOpen(false)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar novo agendamento.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDropTask = async (taskId: string, newDateStr: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.completed || task.due_date === newDateStr) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, due_date: newDateStr } : t)))
    try {
      await supabase.from('follow_up_tasks').update({ due_date: newDateStr }).eq('id', taskId)
      toast({
        title: 'Reagendado',
        description: `Tarefa movida para ${format(parseISO(newDateStr), 'dd/MM/yyyy')}`,
      })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao reagendar tarefa.', variant: 'destructive' })
      fetchTasks()
    }
  }

  const TaskCard = ({ task }: { task: EnrichedTask }) => (
    <div
      draggable={!task.completed}
      onDragStart={(e) => {
        if (task.completed) return
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'border rounded-xl p-3 shadow-sm transition-all group flex flex-col relative animate-fade-in',
        !task.completed &&
          'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300',
        task.completed
          ? 'bg-slate-50 border-slate-200 text-slate-500'
          : 'bg-white border-slate-200',
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {task.operator?.color && (
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full shadow-inner',
                task.completed && 'opacity-50',
              )}
              style={{ backgroundColor: task.operator.color }}
            />
          )}
          <span
            className={cn(
              'text-[11px] font-bold uppercase tracking-wider',
              task.completed ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {task.operator?.name || 'Desconhecido'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {task.completed && (
            <div className="flex items-center text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100/50">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
            </div>
          )}
          <div
            className={cn(
              'flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
              task.completed
                ? 'bg-slate-100 text-slate-500'
                : isTaskOverdue(task.due_date)
                  ? 'bg-red-50 text-red-700'
                  : 'bg-blue-50 text-blue-700',
            )}
          >
            <CalendarDays className="w-3 h-3" />
            {task.due_date ? format(parseISO(task.due_date), 'dd/MM') : '-'}
          </div>
        </div>
      </div>

      <div className="mb-2">
        <h3
          className={cn(
            'font-bold text-sm leading-tight line-clamp-1',
            task.completed ? 'text-slate-500 line-through opacity-80' : 'text-slate-800',
          )}
          title={task.debt?.nome}
        >
          UC {task.uc}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1 truncate" title={task.debt?.nome}>
          {task.debt?.nome || 'Cliente'}
        </p>
        <p
          className={cn(
            'text-xs font-semibold mt-0.5',
            task.completed ? 'text-slate-400' : 'text-primary',
          )}
        >
          R${' '}
          {task.debt?.valor_total
            ? task.debt.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            : '0,00'}
        </p>
      </div>

      <div
        className={cn(
          'p-2 rounded-lg border mb-3',
          task.completed
            ? 'bg-slate-100/50 border-slate-200 opacity-80'
            : 'bg-slate-50/80 border-slate-100/80',
        )}
      >
        <p
          className={cn(
            'text-[12px] font-medium line-clamp-2 leading-relaxed',
            task.completed ? 'text-slate-400' : 'text-slate-700',
          )}
          title={task.action}
        >
          {task.action}
        </p>
      </div>

      <div className="flex items-center justify-end mt-auto pt-2 border-t border-slate-100 gap-2">
        {task.completed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleResumeTask(task.id, e)}
            className="h-7 px-3 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            disabled={isSaving}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retomar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEditTaskModal(task)}
          className={cn(
            'h-7 px-3 text-xs font-medium',
            task.completed
              ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              : 'text-primary hover:text-primary hover:bg-primary/10',
          )}
        >
          {task.completed ? (
            <>
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Consultar
            </>
          ) : (
            <>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Abrir Lembrete
            </>
          )}
        </Button>
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
              emptyMsg="Nenhum compromisso pendente."
              icon={<Clock className="w-5 h-5" />}
              colorClass="text-blue-700 bg-blue-50"
            />
            <TaskList
              title="Concluídos"
              tasks={completedTasks}
              emptyMsg="Nenhum compromisso concluído recentemente."
              icon={<CheckCircle2 className="w-5 h-5" />}
              colorClass="text-emerald-700 bg-emerald-50"
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
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const taskId = e.dataTransfer.getData('text/plain')
                  if (taskId) {
                    handleDropTask(taskId, dateStr)
                  }
                }}
                className={cn(
                  'border-r border-b p-1.5 sm:p-2 flex flex-col cursor-pointer transition-colors relative group overflow-hidden',
                  !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white',
                  isSelected
                    ? 'ring-2 ring-primary ring-inset z-10 bg-primary/5'
                    : 'hover:bg-slate-50',
                  isToday && !isSelected && 'bg-slate-50',
                )}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreFilledDate(day)
                        setSelectedNewDebt(null)
                        setIsNewActivitySheetOpen(true)
                      }}
                      className={cn(
                        'text-xs font-medium mb-1.5 text-center w-6 h-6 ml-auto flex items-center justify-center rounded-full shrink-0 transition-colors cursor-pointer z-20',
                        isToday
                          ? 'bg-primary text-white'
                          : !isCurrentMonth
                            ? 'text-slate-400'
                            : 'text-slate-700',
                        'hover:bg-primary/20 hover:text-primary',
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Incluir atividade</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable={!t.completed}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditTaskModal(t)
                      }}
                      className={cn(
                        'text-[10px] leading-tight px-1.5 py-1 rounded border-l-[3px] truncate flex items-center gap-1.5 transition-all shadow-sm',
                        t.completed
                          ? 'bg-slate-100/50 text-slate-500'
                          : 'bg-slate-100/80 text-slate-700 hover:brightness-95 cursor-grab active:cursor-grabbing',
                      )}
                      style={{
                        borderLeftColor: t.completed ? '#cbd5e1' : t.operator?.color || '#94a3b8',
                      }}
                      title={`${t.debt?.nome || 'Cliente'} - ${t.action}`}
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.operator?.color || '#94a3b8' }}
                        />
                      )}
                      <span
                        className={cn(
                          'truncate font-medium',
                          t.completed && 'line-through opacity-80',
                        )}
                      >
                        UC {t.uc}
                      </span>
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Follow-up</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Painel de gestão atividades de follow-up.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre UC, Nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
              />
            </div>
            <div className="relative w-full sm:w-[220px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre Endereço"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
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
                Meus
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
                Todos
              </button>
            </div>
            <Button
              onClick={() => {
                setPreFilledDate(undefined)
                setSelectedNewDebt(null)
                setIsNewActivitySheetOpen(true)
              }}
              className="w-full sm:w-auto px-4"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Atividade</span>
            </Button>
          </div>
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

      {/* Modal Edição Lembrete Existente */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
          <div className="p-5 pb-4 border-b bg-white shrink-0">
            <DialogTitle className="text-xl">Central de Decisão</DialogTitle>
            <DialogDescription>Detalhes do follow-up e histórico de atendimento.</DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider font-semibold">
                  Cliente
                </span>
                <strong
                  className="text-slate-800 block truncate text-base"
                  title={editingTask?.debt?.nome}
                >
                  {editingTask?.debt?.nome || 'Não informado'}
                </strong>
                <span className="text-slate-500 block mt-1 font-medium">UC: {editingTask?.uc}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider font-semibold">
                  Dívida Relacionada
                </span>
                <strong className="text-rose-600 block text-base">
                  R${' '}
                  {editingTask?.debt?.valor_total?.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  }) || '0,00'}
                </strong>
                <span className="text-slate-500 block mt-1 font-medium">
                  Quantidade de Parcelas: {editingTask?.debt?.qt_fats || 1}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto min-h-[350px]">
              <div className="flex flex-col space-y-3 h-full">
                <h4 className="font-semibold text-sm flex items-center text-slate-800 shrink-0">
                  <Clock className="w-4 h-4 mr-2 text-slate-500" /> Histórico de Atendimentos
                </h4>
                <div className="bg-white border rounded-xl p-3 flex-1 overflow-y-auto shadow-sm">
                  {loadingHistory ? (
                    <div className="text-sm text-slate-500 text-center py-8">
                      Carregando histórico...
                    </div>
                  ) : taskHistory.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center py-8">
                      Nenhum atendimento registrado.
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                      {taskHistory.map((h) => (
                        <div key={h.id} className="relative pl-6">
                          <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white bg-primary/20 shadow-sm" />
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span className="font-semibold text-slate-700">{h.contact_type}</span>
                            <span>{format(parseISO(h.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-100">
                            {h.notes || 'Nenhuma observação registrada.'}
                          </p>
                          <div className="text-[10px] text-slate-400 font-medium">
                            <span className="text-slate-500 font-semibold">{h.status}</span> •{' '}
                            {h.profiles?.name || 'Sistema'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col h-full">
                <Tabs defaultValue="actions" className="flex-1 flex flex-col">
                  <TabsList className="grid grid-cols-2 shrink-0 h-10">
                    <TabsTrigger value="actions">Tarefa Atual</TabsTrigger>
                    <TabsTrigger value="new">Nova Tarefa</TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="actions"
                    className="flex-1 overflow-y-auto bg-white border rounded-xl p-4 mt-2 shadow-sm space-y-4 data-[state=inactive]:hidden flex flex-col"
                  >
                    <div className="space-y-2">
                      <Label>Ação / Lembrete Atual</Label>
                      <Textarea
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        className="resize-none h-24 text-sm"
                        disabled={editingTask?.completed}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data do Retorno</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            disabled={editingTask?.completed}
                            className={cn(
                              'w-full justify-start text-left font-medium h-9',
                              !dateInput && 'text-slate-400',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {dateInput
                              ? format(dateInput, 'PPP', { locale: ptBR })
                              : 'Selecione uma data'}
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

                    {!editingTask?.completed ? (
                      <div className="flex flex-col gap-2 pt-2 border-t mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveCurrent}
                          disabled={isSaving}
                        >
                          Salvar Alterações
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          onClick={() => handleCompleteCurrent(editingTask?.id!)}
                          disabled={isSaving}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir Atividade
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t mt-auto flex flex-col gap-3">
                        <div className="text-center text-sm font-semibold text-emerald-600 flex items-center justify-center bg-emerald-50 py-3 rounded-lg border border-emerald-100/50">
                          <CheckCircle2 className="w-5 h-5 mr-2" /> Atividade Concluída
                        </div>
                        <Button
                          variant="outline"
                          className="w-full shadow-sm text-slate-600"
                          onClick={(e) => handleResumeTask(editingTask.id, e)}
                          disabled={isSaving}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" /> Retomar Atividade
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="new"
                    className="flex-1 overflow-y-auto bg-white border rounded-xl p-4 mt-2 shadow-sm space-y-4 data-[state=inactive]:hidden flex flex-col"
                  >
                    <div className="space-y-2">
                      <Label>Observação do Novo Lembrete</Label>
                      <Textarea
                        value={newActionInput}
                        onChange={(e) => setNewActionInput(e.target.value)}
                        placeholder="Ex: Retornar para confirmar pagamento..."
                        className="resize-none h-24 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nova Data do Retorno</Label>
                      <Popover open={isNewCalendarOpen} onOpenChange={setIsNewCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-medium h-9',
                              !newDateInput && 'text-slate-400',
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {newDateInput
                              ? format(newDateInput, 'PPP', { locale: ptBR })
                              : 'Selecione uma data'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newDateInput}
                            onSelect={(d) => {
                              setNewDateInput(d)
                              setIsNewCalendarOpen(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="pt-2 border-t mt-auto">
                      <Button
                        className="w-full shadow-sm"
                        size="sm"
                        onClick={handleCreateNew}
                        disabled={isSaving || !newActionInput || !newDateInput}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Follow-up
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-white shrink-0 flex justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gaveta de Inclusão de Nova Atividade */}
      <Sheet open={isNewActivitySheetOpen} onOpenChange={setIsNewActivitySheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-slate-50 p-0 flex flex-col">
          <SheetHeader className="p-6 bg-white border-b shrink-0">
            <SheetTitle>Incluir Nova Atividade</SheetTitle>
            <SheetDescription>
              Busque uma dívida para vincular o novo registro de atendimento.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 p-6 overflow-y-auto">
            {!selectedNewDebt ? (
              <DebtSearch onSelect={setSelectedNewDebt} />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/80"></div>
                  <div className="pl-1 flex-1">
                    <p className="font-bold text-sm text-slate-900">{selectedNewDebt.name}</p>
                    <div className="mt-1 space-y-1">
                      <p className="text-[13px] font-medium text-slate-600">
                        UC: {selectedNewDebt.uc}
                      </p>
                      {selectedNewDebt.address && (
                        <div className="flex items-center flex-wrap gap-2 pr-2">
                          <p className="text-[12px] text-slate-500 leading-tight">
                            {selectedNewDebt.address}
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedNewDebt.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] text-primary hover:text-primary/80 hover:bg-primary/20 bg-primary/10 px-1.5 py-0.5 rounded font-bold transition-colors shrink-0"
                          >
                            <MapPin className="w-3 h-3 mr-1" /> Mapa
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNewDebt(null)}
                    className="font-semibold text-slate-600 hover:text-slate-900 shrink-0"
                  >
                    Trocar
                  </Button>
                </div>
                <CustomerActionForm
                  key={`${selectedNewDebt.id}_${preFilledDate ? preFilledDate.toISOString() : 'no_date'}`}
                  customer={selectedNewDebt}
                  isSheet={true}
                  onClose={() => setIsNewActivitySheetOpen(false)}
                  initialDate={preFilledDate}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
