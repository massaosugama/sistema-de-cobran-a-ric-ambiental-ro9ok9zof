import { useParams, Navigate } from 'react-router-dom'
import { MOCK_CUSTOMERS } from '@/lib/mock'
import { CustomerHeader } from './CustomerHeader'
import { CustomerInfo } from './CustomerInfo'
import { CustomerTimeline } from './CustomerTimeline'
import { CustomerActionForm } from './CustomerActionForm'

export default function CustomerPage() {
  const { id } = useParams()
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id)

  if (!customer) {
    return <Navigate to="/queue" replace />
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in-up">
      <CustomerHeader customer={customer} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Context & Data */}
        <div className="lg:col-span-3 space-y-6">
          <CustomerInfo customer={customer} />
        </div>

        {/* Center Column: Timeline */}
        <div className="lg:col-span-5 h-[calc(100vh-220px)] lg:sticky lg:top-20 overflow-y-auto pr-2 rounded-lg border bg-card shadow-sm">
          <CustomerTimeline />
        </div>

        {/* Right Column: Action Form */}
        <div className="lg:col-span-4 space-y-6 h-auto">
          <CustomerActionForm customer={customer} />
        </div>
      </div>
    </div>
  )
}
