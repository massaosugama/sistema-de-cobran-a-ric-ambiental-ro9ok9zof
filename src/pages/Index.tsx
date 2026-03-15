import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, TrendingUp, Users, Target, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CURRENT_USER } from '@/lib/mock'

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

const RECENT_ACTIVITIES = [
  {
    id: 1,
    action: 'Promessa de Pagamento',
    target: 'UC 1098234',
    time: '10 min atrás',
    status: 'success',
  },
  { id: 2, action: 'Contato WTK', target: 'UC 1098235', time: '45 min atrás', status: 'default' },
  { id: 3, action: 'Recusa', target: 'UC 1098236', time: '2 horas atrás', status: 'destructive' },
]

export default function Index() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Operacional</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vinda de volta, {CURRENT_USER.name}. Aqui está o resumo do seu dia.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Minhas Pendências</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-destructive font-medium">8 atrasadas</span> para hoje
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pontos Acumulados</CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{CURRENT_USER.points}</div>
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
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">João Silva (UC 1098{i}4)</span>
                    <span className="text-xs text-muted-foreground">
                      Retorno agendado - Promessa de R$ 500
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/customer/1">Atender</Link>
                  </Button>
                </div>
              ))}
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
              {LEADERBOARD.map((user, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex-1 flex items-center gap-3">
                    <span
                      className={`font-bold w-4 text-center ${idx === 0 ? 'text-warning' : 'text-muted-foreground'}`}
                    >
                      {idx + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Badge
                    variant={idx === 0 ? 'default' : 'secondary'}
                    className={idx === 0 ? 'bg-primary' : ''}
                  >
                    {user.points} pts
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
