import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Inteligência & Relatórios
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Análise de produtividade, recuperação financeira e pontuação geral.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Em Desenvolvimento
          </CardTitle>
          <CardDescription>
            Os relatórios e dashboards detalhados estão sendo estruturados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Em breve você terá acesso a visões consolidadas e métricas de desempenho da equipe.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
