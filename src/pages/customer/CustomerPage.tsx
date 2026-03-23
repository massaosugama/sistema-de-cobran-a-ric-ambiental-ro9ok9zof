import { useParams, Navigate } from 'react-router-dom'
import { CustomerHeader } from './CustomerHeader'
import { CustomerInfo } from './CustomerInfo'
import { CustomerTimeline } from './CustomerTimeline'
import { CustomerActionForm } from './CustomerActionForm'
import { RelatedDebts } from './RelatedDebts'
import { useEffect, useState } from 'react'
import { getDebtByUc, ParsedDebt } from '@/services/debts'

export default function CustomerPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<ParsedDebt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      const [uc, personCode] = id.split('_')
      setLoading(true)
      getDebtByUc(uc, personCode)
        .then((data) => {
          setCustomer(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [id])

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        Buscando dados do devedor...
      </div>
    )
  if (!customer) return <Navigate to="/queue" replace />

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in-up">
      <CustomerHeader customer={customer} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 space-y-0">
          <CustomerInfo customer={customer} />
          <RelatedDebts customer={customer} />
        </div>

        <div className="lg:col-span-5 h-[calc(100vh-220px)] lg:sticky lg:top-20 overflow-y-auto pr-2 rounded-lg border bg-card shadow-sm">
          <CustomerTimeline customer={customer} />
        </div>

        <div className="lg:col-span-4 space-y-6 h-auto">
          <CustomerActionForm customer={customer} />
        </div>
      </div>
    </div>
  )
}
