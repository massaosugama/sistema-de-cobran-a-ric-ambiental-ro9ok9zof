import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CustomerActionForm } from '@/pages/customer/CustomerActionForm'
import { CustomerHeader } from '@/pages/customer/CustomerHeader'
import { CustomerInfo } from '@/pages/customer/CustomerInfo'
import { CustomerTimeline } from '@/pages/customer/CustomerTimeline'
import { getDebtByUc, type ParsedDebt } from '@/services/debts'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function FollowUpActionSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [customer, setCustomer] = useState<ParsedDebt | null>(null)
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<{ uc: string; cod_pess_fat: string; taskId: string }>
      const { uc, cod_pess_fat, taskId } = customEvent.detail
      setIsOpen(true)
      setLoading(true)

      try {
        const [debt, { data: taskData }] = await Promise.all([
          getDebtByUc(uc, cod_pess_fat),
          supabase.from('follow_up_tasks').select('*').eq('id', taskId).single(),
        ])
        setCustomer(debt)
        setTask(taskData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    window.addEventListener('open-followup-sheet', handleOpen)
    return () => {
      window.removeEventListener('open-followup-sheet', handleOpen)
    }
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-none md:max-w-none lg:max-w-[85vw] xl:max-w-[1200px] sm:p-6 overflow-y-auto bg-slate-50">
        <SheetHeader className="mb-6">
          <SheetTitle>Consultar/Alterar Atendimento</SheetTitle>
          <SheetDescription>
            Realize o atendimento ou reagende a atividade de follow-up.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : customer ? (
          <div className="space-y-6 pb-20 md:pb-0 px-4 sm:px-0">
            <CustomerHeader customer={customer} isSheet={true} onClose={() => setIsOpen(false)} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-3 space-y-6">
                <CustomerInfo customer={customer} />
              </div>
              <div className="lg:col-span-5 h-[calc(100vh-220px)] lg:sticky lg:top-0 overflow-y-auto pr-2 rounded-lg border bg-white shadow-sm">
                <CustomerTimeline customer={customer} />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <CustomerActionForm
                  customer={customer}
                  isSheet={true}
                  onClose={() => setIsOpen(false)}
                  existingTask={task}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">Não foi possível carregar os dados.</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
