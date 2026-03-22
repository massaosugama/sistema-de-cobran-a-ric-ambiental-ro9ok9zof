import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { format, isBefore, startOfToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarDays,
  CheckCircle2,
  Edit2,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
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

interface EnrichedTask {
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

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null)
  const [actionInput, setActionInput] = useState('')
  const [dateInput, setDateInput] = useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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

  const filteredTasks = tasks.filter((t) => view === 'todos' || t.operator_id === user?.id)

  const isTaskOverdue = (dateStr: string | null) => {
    if (!dateStr) return false
    return isBefore(parseISO(dateStr), startOfToday())
  }

  const overdueTasks = filteredTasks.filter((t) => isTaskOverdue(t.due_date))
  const upcomingTasks = filteredTasks.filter((t) => !isTaskOverdue(t.due_date))

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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {task.operator?.color && (
            <div
              className="w-3 h-3 rounded-full shadow-inner border border-slate-200"
              style={{ backgroundColor: task.operator.color }}
            />
          )}
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {task.operator?.name || 'Desconhecido'}
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md',
            isTaskOverdue(task.due_date) ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700',
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {task.due_date ? format(parseISO(task.due_date), 'dd/MM/yyyy') : '-'}
        </div>
      </div>

      <div className="mb-2">
        <h3 className="font-bold text-slate-900 line-clamp-1" title={task.debt?.nome}>
          UC {task.uc} • {task.debt?.nome || 'Cliente'}
        </h3>
        <p className="text-sm font-semibold text-primary">
          R${' '}
          {task.debt?.valor_total
            ? task.debt.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            : '0,00'}
        </p>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex-1">
        <p className="text-sm font-medium text-slate-800 line-clamp-2" title={task.action}>
          {task.action}
        </p>
        {task.lastNote && (
          <p
            className="text-xs text-slate-500 italic mt-2 pt-2 border-t border-slate-200 line-clamp-2"
            title={task.lastNote}
          >
            " {task.lastNote} "
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleComplete(task.id)}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2 -ml-2"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Concluir
        </Button>
        <div className="flex gap-1 -mr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditTaskModal(task)}
            className="h-8 w-8 text-slate-400 hover:text-primary"
            title="Editar este agendamento"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openNewTaskModal(task)}
            className="h-8 w-8 text-slate-400 hover:text-primary"
            title="Novo Follow-up para este cliente"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Follow-up</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Gerencie seus retornos agendados e acompanhe compromissos.
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
        <div className="py-20 text-center text-slate-500 font-medium">Buscando tarefas...</div>
      ) : tasks.length === 0 ? (
        <div className="py-20 text-center text-slate-500 font-medium border-2 border-dashed border-slate-200 rounded-2xl">
          Nenhum follow-up pendente encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card className="border-red-100 shadow-sm bg-red-50/20">
            <CardHeader className="pb-3 border-b border-red-100">
              <CardTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Atrasados
                <span className="ml-auto bg-red-100 text-red-700 py-0.5 px-2.5 rounded-full text-xs">
                  {overdueTasks.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {overdueTasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  Nenhum compromisso atrasado.
                </p>
              ) : (
                overdueTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm bg-blue-50/20">
            <CardHeader className="pb-3 border-b border-blue-100">
              <CardTitle className="text-lg font-bold text-blue-700 flex items-center gap-2">
                <Clock className="w-5 h-5" /> Próximos
                <span className="ml-auto bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs">
                  {upcomingTasks.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  Nenhum compromisso agendado para hoje ou futuro.
                </p>
              ) : (
                upcomingTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </CardContent>
          </Card>
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
