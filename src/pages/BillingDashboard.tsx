import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/client'
import {
  Map,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  CalendarDays,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

interface RouteStat {
  id: string
  route: string
  cycle: string
  expectedUcs: number
  readUcs: number
  percentage: number
  remainingDays: number
  criticality: string
}

interface EvolutionStat {
  month_label: string
  ref_date: string
  total_expected: number
  total_read: number
}

interface RhythmStatus {
  atrasado: number
  em_dia: number
  adiantado: number
  lido: number
  current_working_day: number
}

export default function BillingDashboard() {
  const [routes, setRoutes] = useState<RouteStat[]>([])
  const [evolution, setEvolution] = useState<EvolutionStat[]>([])
  const [rhythm, setRhythm] = useState<RhythmStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [routesRes, evRes, rhythmRes] = await Promise.all([
        supabase.rpc('get_billing_routes_stats'),
        supabase.rpc('get_daily_readings_evolution' as any),
        supabase.rpc('get_reading_rhythm_status' as any),
      ])
      if (routesRes.data) setRoutes(routesRes.data as RouteStat[])
      if (evRes.data) setEvolution(evRes.data as EvolutionStat[])
      if (rhythmRes.data) setRhythm(rhythmRes.data as RhythmStatus)
      setLoading(false)
    }
    fetchData()
  }, [])

  const getBadge = (crit: string) => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold'
    if (crit === 'Concluída')
      return (
        <span className={cn(base, 'bg-emerald-100 text-emerald-800')}>
          <CheckCircle2 className="w-3 h-3 mr-1" /> Concluída
        </span>
      )
    if (crit === 'Atrasada')
      return (
        <span className={cn(base, 'bg-red-100 text-red-800')}>
          <AlertCircle className="w-3 h-3 mr-1" /> Atrasada
        </span>
      )
    if (crit === 'Prazo Curto')
      return (
        <span className={cn(base, 'bg-amber-100 text-amber-800')}>
          <Clock className="w-3 h-3 mr-1" /> Prazo Curto
        </span>
      )
    if (crit === 'Em Andamento')
      return (
        <span className={cn(base, 'bg-blue-100 text-blue-800')}>
          <Activity className="w-3 h-3 mr-1" /> Em Andamento
        </span>
      )
    return <span className={cn(base, 'bg-slate-100 text-slate-800')}>Não Iniciada</span>
  }

  const atRisk = routes.filter(
    (r) => r.criticality === 'Atrasada' || r.criticality === 'Prazo Curto',
  )
  const ucsRisk = atRisk.reduce((acc, r) => acc + (r.expectedUcs - r.readUcs), 0)
  const cycRisk = new Set(atRisk.map((r) => r.cycle)).size

  const getCycleGroup = (c: string) => {
    const num = parseInt(c.replace(/\D/g, ''))
    return isNaN(num)
      ? 'Outros'
      : num <= 10
        ? 'Ciclos 1-10'
        : num <= 20
          ? 'Ciclos 11-20'
          : 'Ciclos 21+'
  }

  const renderBlock = (title: string) => {
    const data = routes.filter((r) => getCycleGroup(r.cycle) === title)
    const exp = data.reduce((a, r) => a + r.expectedUcs, 0)
    const read = data.reduce((a, r) => a + r.readUcs, 0)
    const pct = exp > 0 ? Math.round((read / exp) * 100) : 0
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-slate-700">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-slate-800">{pct}%</span>
            <span className="text-sm text-muted-foreground">
              {read} / {exp} UCs
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent>
      </Card>
    )
  }

  if (loading)
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Painel de Controle de Rotas</h2>
        <p className="text-muted-foreground">Acompanhamento de rotas de leitura e faturamento.</p>
      </div>

      {rhythm && (
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Ritmo de Leitura (Mês Atual)
            </CardTitle>
            <CardDescription>
              Hoje é o <strong>{rhythm.current_working_day}º Dia Útil</strong> do mês. Status das
              UCs não lidas com base na média histórica:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">
                  Adiantado:{' '}
                  <span className="font-bold">{rhythm.adiantado.toLocaleString('pt-BR')}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">
                  Em Dia: <span className="font-bold">{rhythm.em_dia.toLocaleString('pt-BR')}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">
                  Atrasado:{' '}
                  <span className="font-bold">{rhythm.atrasado.toLocaleString('pt-BR')}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-sm font-medium text-slate-600">
                  Já Lidas: <span className="font-bold">{rhythm.lido.toLocaleString('pt-BR')}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex gap-4">
            <div className="p-4 bg-red-100 rounded-full text-red-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Rotas em Risco</p>
              <h3 className="text-3xl font-bold">{atRisk.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex gap-4">
            <div className="p-4 bg-amber-100 rounded-full text-amber-600">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">UCs em Risco (Não Lidas)</p>
              <h3 className="text-3xl font-bold">{ucsRisk}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex gap-4">
            <div className="p-4 bg-orange-100 rounded-full text-orange-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ciclos em Alerta</p>
              <h3 className="text-3xl font-bold">{cycRisk}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderBlock('Ciclos 1-10')}
        {renderBlock('Ciclos 11-20')}
        {renderBlock('Ciclos 21+')}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Rotas Críticas e Em Andamento
          </CardTitle>
          <CardDescription>Visualização das rotas com prioridade de atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-y-auto max-h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Esperadas</TableHead>
                  <TableHead className="text-right">Lidas</TableHead>
                  <TableHead className="text-right">Progresso</TableHead>
                  <TableHead className="text-right">Restantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes
                  .filter((r) => r.criticality !== 'Concluída')
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.route}</TableCell>
                      <TableCell>{r.cycle}</TableCell>
                      <TableCell className="text-center">{getBadge(r.criticality)}</TableCell>
                      <TableCell className="text-right">{r.expectedUcs}</TableCell>
                      <TableCell className="text-right">{r.readUcs}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm w-9">{r.percentage}%</span>
                          <Progress value={r.percentage} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium',
                          r.remainingDays < 0
                            ? 'text-red-600'
                            : r.remainingDays <= 2
                              ? 'text-amber-600'
                              : 'text-emerald-600',
                        )}
                      >
                        {r.remainingDays} dias
                      </TableCell>
                    </TableRow>
                  ))}
                {routes.filter((r) => r.criticality !== 'Concluída').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma rota crítica ou em andamento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico e Volume de Leituras</CardTitle>
          <CardDescription>
            Evolução histórica da quantidade total de leituras por referência (mês/ano)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total_expected: { label: 'Total Esperado', color: '#3b82f6' },
              total_read: { label: 'Total Lido', color: '#10b981' },
            }}
            className="h-[300px] w-full"
          >
            <AreaChart data={evolution}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month_label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickFormatter={(val) =>
                  new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(val)
                }
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: any) => new Intl.NumberFormat('pt-BR').format(Number(value))}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="total_expected"
                stroke="var(--color-total_expected)"
                fill="var(--color-total_expected)"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="total_read"
                stroke="var(--color-total_read)"
                fill="var(--color-total_read)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
