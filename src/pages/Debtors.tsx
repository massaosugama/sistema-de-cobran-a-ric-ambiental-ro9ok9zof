import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function Debtors() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Devedores</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Base consolidada de clientes com pendências financeiras.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Em Desenvolvimento
          </CardTitle>
          <CardDescription>
            A gestão centralizada de devedores está sendo estruturada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Acesse a "Fila Rápida" para interagir com as pendências atuais que requerem follow-up.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
