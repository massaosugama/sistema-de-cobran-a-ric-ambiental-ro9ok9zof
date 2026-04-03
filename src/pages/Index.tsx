import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Briefcase,
  CircleDollarSign,
  Split,
  Headphones,
  ListTodo,
  UserCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getDashboardEvolution } from '@/services/debts'
import { getProfiles, getOperatorStats } from '@/services/data'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

const EvolutionIndicator = ({
  current,
  previous,
  inverse = false,
}: {
  current?: number
  previous?: number
  inverse?: boolean
}) => {
  const c = current || 0
  const p = previous || 0
  const diff = c - p

  if (diff === 0) {
    return <span className="text-xs text-muted-foreground mt-1 block">Sem variação</span>
  }

  const isPositive = diff > 0
  const isGood = inverse ? !isPositive : isPositive

  const colorClass = isGood ? 'text-emerald-600' : 'text-destructive'
  const Icon = isPositive ? TrendingUp : TrendingDown

  const percent = p > 0 ? ((Math.abs(diff) / p) * 100).toFixed(1) : '100'
  const formattedPercent = Number(percent) % 1 === 0 ? Math.round(Number(percent)) : percent

  return (
    <span className={`text-xs font-medium flex items-center mt-1 ${colorClass}`}>
      <Icon className="h-3 w-3 mr-1" />
      {formattedPercent}%<span className="text-muted-foreground ml-1 font-normal">vs. ontem</span>
    </span>
  )
}

export default function Index() {
  const [evolution, setEvolution] = useState<{ portfolio: any; productivity: any }>({
    portfolio: { current: {}, previous: {} },
    productivity: { current: {}, previous: {} },
  })
  const [profiles, setProfiles] = useState<any[]>([])
  const [operatorStats, setOperatorStats] = useState<Record<string, any>>({})
  const [nowTime, setNowTime] = useState(Date.now())
  const { user } = useAuth()
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Operador'

  useEffect(() => {
    // Keeps the online status calculations fresh
    const timer = setInterval(() => setNowTime(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    getDashboardEvolution()
      .then((data) => {
        if (data) setEvolution(data)
      })
      .catch(console.error)

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

    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.new && payload.new.id) {
            setProfiles((current) =>
              current.map((p) =>
                p.id === payload.new.id ? { ...p, last_login: payload.new.last_login } : p,
              ),
            )
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_history' },
        (payload) => {
          const opId = payload.new.operator_id
          if (opId) {
            setOperatorStats((prev) => {
              const curr = prev[opId] || {
                today_contacts: 0,
                total_contacts: 0,
                today_followups: 0,
                total_followups: 0,
              }
              return {
                ...prev,
                [opId]: {
                  ...curr,
                  today_contacts: Number(curr.today_contacts) + 1,
                  total_contacts: Number(curr.total_contacts) + 1,
                },
              }
            })
            setEvolution((prev) => {
              if (!prev || !prev.productivity || !prev.productivity.current) return prev
              return {
                ...prev,
                productivity: {
                  ...prev.productivity,
                  current: {
                    ...prev.productivity.current,
                    contacts: Number(prev.productivity.current.contacts || 0) + 1,
                  },
                },
              }
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'follow_up_tasks' },
        (payload) => {
          const opId = payload.new.operator_id
          if (opId) {
            setOperatorStats((prev) => {
              const curr = prev[opId] || {
                today_contacts: 0,
                total_contacts: 0,
                today_followups: 0,
                total_followups: 0,
              }
              return {
                ...prev,
                [opId]: {
                  ...curr,
                  today_followups: Number(curr.today_followups) + 1,
                  total_followups: Number(curr.total_followups) + 1,
                },
              }
            })
            setEvolution((prev) => {
              if (!prev || !prev.productivity || !prev.productivity.current) return prev
              return {
                ...prev,
                productivity: {
                  ...prev.productivity,
                  current: {
                    ...prev.productivity.current,
                    followups: Number(prev.productivity.current.followups || 0) + 1,
                  },
                },
              }
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const adminProfiles = profiles.filter((p) => p.role === 'admin' || p.is_admin)
  const consultaProfiles = profiles.filter((p) => p.role === 'consultas' && !p.is_admin)
  const operadorProfiles = profiles.filter(
    (p) => p.role !== 'admin' && p.role !== 'consultas' && !p.is_admin,
  )

  const renderProfileRow = (p: any) => {
    const isCurrentUser = p.id === user?.id
    const isOnline =
      isCurrentUser || (p.last_login && nowTime - new Date(p.last_login).getTime() < 3 * 60 * 1000)

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
              {displayName} {isCurrentUser && '(Você)'}
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
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
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
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo(a) de volta, {name}. Aqui está o panorama estratégico de recuperação.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-sm font-medium">Total da Carteira (UC + Pessoa)</CardTitle>
              <div className="text-3xl font-bold mt-2">
                {evolution.portfolio.current.total_cases || 0}
              </div>
              <EvolutionIndicator
                current={evolution.portfolio.current.total_cases}
                previous={evolution.portfolio.previous.total_cases}
                inverse
              />
            </div>
            <div className="flex flex-col items-end">
              <Briefcase className="h-4 w-4 text-muted-foreground mb-3" />
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                  Faturas Retidas
                </p>
                <div className="text-xl font-bold text-slate-700">
                  {evolution.portfolio.current.total_retidas_cases || 0}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 border-t border-slate-100 mt-2">
            <div>
              <p className="text-[11px] text-amber-700/70 font-bold uppercase tracking-wider mb-0.5">
                Lotes Vagos
              </p>
              <div className="text-lg font-bold text-amber-600">
                {evolution.portfolio.current.total_lotes_cases || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Valores da Carteira</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start mt-1">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Faturas Emitidas</p>
                <div className="text-lg font-bold text-primary">
                  R${' '}
                  {(evolution.portfolio.current.total_value || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <EvolutionIndicator
                  current={evolution.portfolio.current.total_value}
                  previous={evolution.portfolio.previous.total_value}
                  inverse
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Faturas Retidas</p>
                <div className="text-lg font-bold text-slate-700">
                  R${' '}
                  {(evolution.portfolio.current.total_retidas || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <EvolutionIndicator
                  current={evolution.portfolio.current.total_retidas}
                  previous={evolution.portfolio.previous.total_retidas}
                  inverse
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-amber-700/70 font-bold uppercase tracking-wider mb-0.5">
                Lotes Vagos
              </p>
              <div className="text-sm font-bold text-amber-600">
                R${' '}
                {(evolution.portfolio.current.total_lotes_value || 0).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saldo Vencido vs. A Vencer</CardTitle>
            <Split className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-start mt-1">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Vencido</p>
                <div className="text-lg font-bold text-destructive">
                  R${' '}
                  {(evolution.portfolio.current.total_vencido || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <EvolutionIndicator
                  current={evolution.portfolio.current.total_vencido}
                  previous={evolution.portfolio.previous.total_vencido}
                  inverse
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">A Vencer</p>
                <div className="text-lg font-bold text-emerald-600">
                  R${' '}
                  {(evolution.portfolio.current.total_a_vencer || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <EvolutionIndicator
                  current={evolution.portfolio.current.total_a_vencer}
                  previous={evolution.portfolio.previous.total_a_vencer}
                  inverse
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evolution.productivity.current.contacts || 0}</div>
            <EvolutionIndicator
              current={evolution.productivity.current.contacts}
              previous={evolution.productivity.previous.contacts}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Follow-ups</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evolution.productivity.current.followups || 0}
            </div>
            <EvolutionIndicator
              current={evolution.productivity.current.followups}
              previous={evolution.productivity.previous.followups}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cadastros Atualizados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">0</div>
            <EvolutionIndicator current={0} previous={0} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
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
                  <TableHead>Operadores de Cobrança</TableHead>
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
                  <>
                    {operadorProfiles.map(renderProfileRow)}

                    {consultaProfiles.length > 0 && (
                      <>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell
                            colSpan={6}
                            className="font-semibold text-sm text-slate-800 py-2 bg-slate-50"
                          >
                            Usuários de Consultas
                          </TableCell>
                        </TableRow>
                        {consultaProfiles.map(renderProfileRow)}
                      </>
                    )}

                    {adminProfiles.length > 0 && (
                      <>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell
                            colSpan={6}
                            className="font-semibold text-sm text-slate-800 py-2 bg-slate-50"
                          >
                            Usuários Admin
                          </TableCell>
                        </TableRow>
                        {adminProfiles.map(renderProfileRow)}
                      </>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
