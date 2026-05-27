import { Sheet, SheetContent } from '@/components/ui/sheet'
import { CustomerHeader } from '@/pages/customer/CustomerHeader'
import { CustomerInfo } from '@/pages/customer/CustomerInfo'
import { CustomerTimeline } from '@/pages/customer/CustomerTimeline'
import { CustomerActionForm } from '@/pages/customer/CustomerActionForm'
import { RelatedDebts } from '@/pages/customer/RelatedDebts'
import { type ParsedDebt } from '@/services/debts'

export function CustomerSheetWrapper({
  isOpen,
  onClose,
  customer,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  customer: ParsedDebt | null
  isLoading: boolean
}) {
  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 flex flex-col bg-slate-50 border-l-0 shadow-2xl transition-all duration-300 sm:max-w-none md:max-w-none lg:max-w-[85vw] xl:max-w-[1200px]"
      >
        {isLoading || !customer ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 font-medium animate-pulse gap-4 py-20">
            Carregando dados da UC...
          </div>
        ) : (
          <div className="flex-1 p-0 sm:p-0">
            <div className="space-y-6 pb-20 md:pb-0 px-4 sm:px-6 animate-in fade-in duration-300 py-6">
              <CustomerHeader customer={customer} isSheet={true} onClose={onClose} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                  <CustomerInfo customer={customer} />
                  <RelatedDebts customer={customer} />
                </div>
                <div className="lg:col-span-5 h-[calc(100vh-220px)] lg:sticky lg:top-0 overflow-y-auto pr-2 rounded-lg border bg-white shadow-sm">
                  <CustomerTimeline customer={customer} />
                </div>
                <div className="lg:col-span-4 space-y-6 h-auto">
                  <CustomerActionForm customer={customer} isSheet={true} onClose={onClose} />
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
