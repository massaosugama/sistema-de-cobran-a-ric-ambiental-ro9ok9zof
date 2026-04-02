import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useFollowUpReminders() {
  const { user } = useAuth()
  const notifiedTasks = useRef<Set<string>>(new Set())
  const snoozedTasks = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!user) return

    let isChecking = false
    let checkTimeoutId: NodeJS.Timeout
    let snoozeIntervalId: NodeJS.Timeout

    const checkTasks = async () => {
      if (isChecking) return
      isChecking = true

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('reminder_enabled, snooze_enabled, reminder_interval, snooze_interval')
          .eq('id', user.id)
          .single()

        const reminderEnabled = profile?.reminder_enabled ?? true
        const snoozeEnabled = profile?.snooze_enabled ?? true
        const reminderInterval = (profile?.reminder_interval ?? 30) * 60 * 1000
        const snoozeInterval = (profile?.snooze_interval ?? 15) * 60 * 1000

        clearTimeout(checkTimeoutId)

        if (!reminderEnabled) {
          // Se desligado, checa de novo em 5 min apenas para caso reative sem realtime
          checkTimeoutId = setTimeout(checkTasks, 5 * 60 * 1000)
          return
        }

        const today = new Date().toISOString().split('T')[0]

        const { data: tasks, error } = await supabase
          .from('follow_up_tasks')
          .select('*')
          .eq('operator_id', user.id)
          .eq('completed', false)
          .eq('is_active', true)
          .lte('due_date', today)

        if (error || !tasks) {
          checkTimeoutId = setTimeout(checkTasks, reminderInterval)
          return
        }

        const now = Date.now()

        for (const task of tasks) {
          // Pula se está sonecando
          if (snoozedTasks.current.has(task.id) && snoozedTasks.current.get(task.id)! > now) {
            continue
          }

          // Pula se já foi notificado
          if (notifiedTasks.current.has(task.id)) {
            continue
          }

          let customerName = 'Cliente'
          if (task.uc) {
            const { data: debt } = await supabase
              .from('pending_debts')
              .select('pessoa_fatura_nome')
              .eq('uc', task.uc)
              .limit(1)
              .maybeSingle()

            if (debt?.pessoa_fatura_nome) {
              customerName = debt.pessoa_fatura_nome
            }
          }

          const actionBtn = {
            label: 'Já Concluído',
            onClick: async () => {
              await supabase.from('follow_up_tasks').update({ completed: true }).eq('id', task.id)
              toast.success('Atividade concluída com sucesso!')
              notifiedTasks.current.add(task.id)
              snoozedTasks.current.delete(task.id)
            },
          }

          const cancelBtn = snoozeEnabled
            ? {
                label: 'Sonecar',
                onClick: () => {
                  snoozedTasks.current.set(task.id, now + snoozeInterval)
                  notifiedTasks.current.delete(task.id)
                  toast.info(`Lembrete adiado por ${profile?.snooze_interval ?? 15} minutos.`)
                },
              }
            : undefined

          toast(`Heiy, lembre-se que você ficou de contatar "${customerName}", da UC ${task.uc}.`, {
            duration: 30000,
            icon: '⏰',
            action: actionBtn,
            cancel: cancelBtn,
            onDismiss: () => {
              notifiedTasks.current.add(task.id)
            },
            onAutoClose: () => {
              notifiedTasks.current.add(task.id)
            },
          })

          notifiedTasks.current.add(task.id)
          await new Promise((r) => setTimeout(r, 1000))
        }

        checkTimeoutId = setTimeout(checkTasks, reminderInterval)
      } catch (err) {
        checkTimeoutId = setTimeout(checkTasks, 30 * 60 * 1000)
      } finally {
        isChecking = false
      }
    }

    checkTasks()

    // Realtime para quando o usuário atualizar as preferências na tela de configurações
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
          checkTasks()
        },
      )
      .subscribe()

    // Verifica os lembretes sonecados a cada 1 minuto
    snoozeIntervalId = setInterval(() => {
      const now = Date.now()
      let shouldCheck = false
      snoozedTasks.current.forEach((snoozeUntil, taskId) => {
        if (snoozeUntil <= now) {
          snoozedTasks.current.delete(taskId)
          notifiedTasks.current.delete(taskId)
          shouldCheck = true
        }
      })
      if (shouldCheck) {
        checkTasks()
      }
    }, 60 * 1000)

    return () => {
      clearTimeout(checkTimeoutId)
      clearInterval(snoozeIntervalId)
      supabase.removeChannel(channel)
    }
  }, [user])
}
