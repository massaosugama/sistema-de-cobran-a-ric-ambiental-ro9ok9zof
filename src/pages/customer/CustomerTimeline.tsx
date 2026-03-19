import { useEffect, useState } from 'react'
import { PhoneCall, MessageSquare, DollarSign, Mail, HelpCircle } from 'lucide-react'
import { getContactHistory, getSettlementsByUc } from '@/services/data'

export function CustomerTimeline({ uc }: { uc: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [contacts, settlements] = await Promise.all([
          getContactHistory(uc),
          getSettlementsByUc(uc),
        ])

        const formattedContacts = contacts.map((c: any) => ({
          id: c.id,
          date: c.created_at,
          type: c.contact_type,
          operator: c.profiles?.name || 'Operador',
          status: c.status,
          note: c.notes,
          isPayment: false,
        }))

        const formattedSettlements = settlements.map((s: any) => ({
          id: s.id,
          date: s.databaixa_inicial || s.neg_data,
          type: 'Baixa',
          operator: 'Sistema',
          status: s.tipo_baixa || 'Acordo',
          note: `Baixa/Acordo de R$ ${s.valor_total || s.neg_valor_acordo} referente a ${s.refs || 'N/A'}`,
          isPayment: true,
        }))

        const merged = [...formattedContacts, ...formattedSettlements]
          .filter((e) => e.date) // ensure date exists
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setEvents(merged)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [uc])

  const getIcon = (type: string) => {
    if (type?.includes('WTK')) return <MessageSquare className="h-4 w-4" />
    if (type?.includes('E-MAIL')) return <Mail className="h-4 w-4" />
    if (type === 'Baixa') return <DollarSign className="h-4 w-4" />
    if (type?.includes('TEL')) return <PhoneCall className="h-4 w-4" />
    return <HelpCircle className="h-4 w-4" />
  }

  const getColor = (type: string) => {
    if (type?.includes('WTK')) return 'bg-emerald-100 text-emerald-600 border-emerald-200'
    if (type === 'Baixa') return 'bg-primary/10 text-primary border-primary/20'
    if (type?.includes('E-MAIL')) return 'bg-slate-100 text-slate-600 border-slate-200'
    return 'bg-blue-100 text-blue-600 border-blue-200'
  }

  return (
    <div className="p-6">
      <h3 className="font-semibold text-lg mb-6 sticky top-0 bg-card z-10 py-2 border-b">
        Histórico 360°
      </h3>
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Carregando histórico...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-slate-500 font-medium">
          Nenhuma interação readsfgistrada.
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {events.map((interaction, idx) => (
            <div
              key={interaction.id || idx}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${getColor(interaction.type)}`}
              >
                {getIcon(interaction.type)}
              </div>

              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-white shadow-subtle hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm text-primary">{interaction.type}</span>
                  <time className="text-xs text-muted-foreground font-medium">
                    {new Date(interaction.date).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(interaction.date).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${interaction.isPayment ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/10'}`}
                  >
                    {interaction.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{interaction.note}</p>
                <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1 border-t pt-2">
                  <span>Operador:</span>
                  <span className="font-medium text-slate-700">{interaction.operator}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
