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

    const checkTasks = async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data: tasks, error } = await supabase
        .from('follow_up_tasks')
        .select('*')
        .eq('operator_id', user.id)
        .eq('completed', false)
        .eq('is_active', true)
        .lte('due_date', today)

      if (error || !tasks) return

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

        toast(`Heiy, lembre-se que você ficou de contatar "${customerName}", da UC ${task.uc}.`, {
          duration: 30000, // 30 segundos na tela
          icon: '⏰',
          action: {
            label: 'Já Concluído',
            onClick: async () => {
              await supabase.from('follow_up_tasks').update({ completed: true }).eq('id', task.id)

              toast.success('Atividade concluída com sucesso!')
              notifiedTasks.current.add(task.id)
              snoozedTasks.current.delete(task.id)
            },
          },
          cancel: {
            label: 'Sonecar',
            onClick: () => {
              snoozedTasks.current.set(task.id, now + 15 * 60 * 1000) // soneca por 15 minutos
              notifiedTasks.current.delete(task.id)
              toast.info('Lembrete adiado por 15 minutos.')
            },
          },
          onDismiss: () => {
            notifiedTasks.current.add(task.id)
          },
          onAutoClose: () => {
            notifiedTasks.current.add(task.id)
          },
        })

        notifiedTasks.current.add(task.id)

        // Pequeno delay para não sobrepor muitos alertas ao mesmo tempo
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    checkTasks()

    // Verifica de 30 em 30 minutos
    const interval = setInterval(checkTasks, 30 * 60 * 1000)

    // Verifica os lembretes sonecados a cada 1 minuto
    const snoozeInterval = setInterval(() => {
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
      clearInterval(interval)
      clearInterval(snoozeInterval)
    }
  }, [user])
}
