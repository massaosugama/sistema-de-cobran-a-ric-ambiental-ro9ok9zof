import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, TrendingUp, Users, Target, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDebts, getPortfolioStats, ParsedDebt } from '@/services/debts'
import { useAuth } from '@/hooks/use-auth'

const LEADERBOARD = [
  {
    name: 'Ana Costa',
    points: 1245,
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=12',
  },
  {
    name: 'Marcos P.',
    points: 1102,
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
  },
  {
    name: 'Juliana S.',
    points: 980,
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=5',
  },
]

export default function Index() {
  const [queue, setQueue] = useState<ParsedDebt[]>([])
  const [portfolioStats, setPortfolioStats] = useState({ total_cases: 0, total_value: 0 })
  const { user } = useAuth()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Operador'

  useEffect(() => {
    getDebts()
      .then((d) => {
        if (Array.isArray(d)) {
          setQueue(d.slice(0, 3))
        } else if (d && d.unattended) {
          setQueue(d.unattended.slice(0, 3))
        }
      })
      .catch(console.error)

    getPortfolioStats().then(setPortfolioStats).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Operacional</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo(a) de volta, {name}. Aqui está o resumo do seu dia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total da Carteira</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats.total_cases}</div>
            <p className="text-xs text-muted-foreground mt-1">Casos únicos (UC + Pessoa)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pontos Acumulados</CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">1245</div>
            <p className="text-xs text-muted-foreground mt-1">+120 desde ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recuperação (R$)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">R$ 14.500</div>
            <p className="text-xs text-muted-foreground mt-1">Nesta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contatos Realizados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground mt-1">Meta diária: 120</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fila Rápida</CardTitle>
            <CardDescription>Próximas ações agendadas para o seu turno.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queue.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma ação pendente.</p>
              ) : (
                queue.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm">
                        {debt.name} (UC {debt.uc})
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Valor: R${' '}
                        {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Button size="sm" variant="secondary" asChild>
                      <Link to={`/customer/${debt.uc}`}>Atender</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary" asChild>
              <Link to="/queue">
                Ver todas <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ranking de Qualidade</CardTitle>
            <CardDescription>Baseado no sistema de pontos (Esforço + Resultado)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {LEADERBOARD.map((u, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex-1 flex items-center gap-3">
                    <span
                      className={`font-bold w-4 text-center ${idx === 0 ? 'text-warning' : 'text-muted-foreground'}`}
                    >
                      {idx + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{u.name}</span>
                  </div>
                  <Badge
                    variant={idx === 0 ? 'default' : 'secondary'}
                    className={idx === 0 ? 'bg-primary' : ''}
                  >
                    {u.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
