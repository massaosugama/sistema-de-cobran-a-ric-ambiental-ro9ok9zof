import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

export function ReadingStatusCards({ data }: { data: any }) {
  if (!data) return null

  const items = [
    { title: 'Adiantado', value: data.adiantado || 0, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Em Dia', value: data.em_dia || 0, icon: Info, color: 'text-yellow-500' },
    { title: 'Atrasado', value: data.atrasado || 0, icon: AlertTriangle, color: 'text-red-500' },
    { title: 'Lido', value: data.lido || 0, icon: Clock, color: 'text-gray-500' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`w-4 h-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
