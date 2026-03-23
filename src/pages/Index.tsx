import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarDays, TrendingUp, Users, Target, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getDebts, getPortfolioStats, ParsedDebt } from '@/services/debts'
import { getProfiles, getOperatorStats } from '@/services/data'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const [queue, setQueue] = useState<ParsedDebt[]>([])
  const [portfolioStats, setPortfolioStats] = useState({ total_cases: 0, total_value: 0 })
  const [profiles, setProfiles] = useState<any[]>([])
  const [operatorStats, setOperatorStats] = useState<Record<string, any>>({})
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

    getProfiles().then(setProfiles).catch(console.error)
    getOperatorStats()
      .then((stats) => {
        const statsMap: Record<string, any> = {}
        stats.forEach((s: any) => {
          statsMap[s.operator_id] = s
        })
        setOperatorStats(statsMap)
      })
      .catch(console.error)
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
            <p className="text-xs text-muted-foreground mt-1">Dívida (relação UC + pessoa)</p>
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

      <div className="flex flex-col gap-6">
        <Card>
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
                      <Link to={`/customer/${debt.id}`}>Atender</Link>
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

        <Card>
          <CardHeader>
            <CardTitle>Equipe Operacional</CardTitle>
            <CardDescription>
              Status atual de conexão e indicadores de produtividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-center">Atend. (Hoje)</TableHead>
                  <TableHead className="text-center">Atend. (Total)</TableHead>
                  <TableHead className="text-center">Follow-ups (Hoje)</TableHead>
                  <TableHead className="text-center">Follow-ups (Total)</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((p) => {
                    const isOnline = p.id === user?.id
                    const displayName = p.name || p.email.split('@')[0]
                    const stats = operatorStats[p.id] || {
                      today_contacts: 0,
                      total_contacts: 0,
                      today_followups: 0,
                      total_followups: 0,
                    }

                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {displayName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {displayName} {isOnline && '(Você)'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{stats.today_contacts}</TableCell>
                        <TableCell className="text-center">{stats.total_contacts}</TableCell>
                        <TableCell className="text-center">{stats.today_followups}</TableCell>
                        <TableCell className="text-center">{stats.total_followups}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                              isOnline
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
                            />
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
