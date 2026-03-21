import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function Settlements() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Baixas Processadas</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Histórico cumulativo de pagamentos e acordos realizados.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500" />
            Em Desenvolvimento
          </CardTitle>
          <CardDescription>
            A visualização detalhada das baixas está sendo construída.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Você já pode realizar a importação de novas baixas através do menu "Importação".
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
