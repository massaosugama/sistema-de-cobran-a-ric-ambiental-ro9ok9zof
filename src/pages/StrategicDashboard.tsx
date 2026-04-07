import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
} from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { Target, Users, Zap, Wallet, TrendingDown, Lightbulb, Activity } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6']

const MOCK_D1 = [
  { date: '2024-01', value: 1200000 },
  { date: '2024-02', value: 1150000 },
  { date: '2024-03', value: 1080000 },
  { date: '2024-04', value: 950000 },
]

const MOCK_D2 = [
  { month: '10/2024', value: 350000, cases: 120 },
  { month: '11/2024', value: 420000, cases: 150 },
  { month: '12/2024', value: 290000, cases: 90 },
]

const MOCK_D3 = [
  { step: 'WTK PASSIVO', volume: 1500 },
  { step: 'TEL ATIVO', volume: 950 },
  { step: 'SMS', volume: 3000 },
  { step: 'E-MAIL', volume: 2100 },
]

const MOCK_D4 = [
  { operator: 'João Silva', contacts: 450, recoveries: 32, recovered_value: 45000 },
  { operator: 'Maria Souza', contacts: 520, recoveries: 41, recovered_value: 58000 },
  { operator: 'Carlos Mendes', contacts: 380, recoveries: 28, recovered_value: 39000 },
]

const MOCK_D6 = [
  { profile_type: 'Residencial (PF)', volume: 3500, value: 1800000 },
  { profile_type: 'Comercial (PJ)', volume: 850, value: 2400000 },
]

export default function StrategicDashboard() {
  const [data, setData] = useState({
    d1_history: MOCK_D1,
    d2_monthly: MOCK_D2,
    d3_funnel: MOCK_D3,
    d4_performance: MOCK_D4,
    d6_profiles: MOCK_D6,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: rpcData, error } = await supabase.rpc('get_strategic_dashboard_data')
      if (!error && rpcData) {
        setData({
          d1_history: rpcData.d1_history?.length > 0 ? rpcData.d1_history : MOCK_D1,
          d2_monthly: rpcData.d2_monthly?.length > 0 ? rpcData.d2_monthly : MOCK_D2,
          d3_funnel: rpcData.d3_funnel?.length > 0 ? rpcData.d3_funnel : MOCK_D3,
          d4_performance: rpcData.d4_performance?.length > 0 ? rpcData.d4_performance : MOCK_D4,
          d6_profiles: rpcData.d6_profiles?.length > 0 ? rpcData.d6_profiles : MOCK_D6,
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const metaPlanejada = 500000
  const metaRealizada = data.d4_performance.reduce((acc, curr) => acc + curr.recovered_value, 0)
  const percentMeta = Math.min((metaRealizada / metaPlanejada) * 100, 100)

  const lastValue =
    data.d1_history.length > 0 ? data.d1_history[data.d1_history.length - 1].value : 1000000
  const projections = [
    { month: 'Atual', value: lastValue },
    { month: 'Mês +1', value: lastValue * 0.95 },
    { month: 'Mês +2', value: lastValue * 0.88 },
    { month: 'Mês +3', value: lastValue * 0.8 },
  ]

  const getRecommendations = () => {
    const recs = []
    const pf = data.d6_profiles.find((p: any) => p.profile_type === 'Residencial (PF)')
    const pj = data.d6_profiles.find((p: any) => p.profile_type === 'Comercial (PJ)')

    if (pf && pj && pj.value > pf.value) {
      recs.push({
        icon: Wallet,
        text: 'O perfil Comercial concentra maior valor financeiro. Sugerimos criar uma fila exclusiva para grandes devedores PJ.',
      })
    } else {
      recs.push({
        icon: Users,
        text: 'O volume de devedores Residenciais é expressivo. Ações em massa como SMS e E-mail podem trazer retorno rápido.',
      })
    }

    if (data.d3_funnel.length > 0) {
      recs.push({
        icon: Zap,
        text: `O canal '${data.d3_funnel[0].step}' é o mais volumoso. Avalie a taxa de conversão deste canal para otimizar os custos.`,
      })
    }
    recs.push({
      icon: Target,
      text: 'Com a projeção de queda da inadimplência, revise as metas mensais para garantir o engajamento contínuo dos operadores.',
    })
    return recs
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Painel Estratégico</h2>
          <p className="text-muted-foreground">
            Indicadores, metas e performance da operação de cobrança
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* D1: Inadimplência Acumulada */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>1. Valor da Inadimplência Acumulada</CardTitle>
            <CardDescription>Evolução histórica e impacto no caixa</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Valor (R$)', color: '#3b82f6' } }}
              className="h-[300px] w-full"
            >
              <AreaChart data={data.d1_history}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  fill="var(--color-value)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* D2: Inadimplência Mensal */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>2. Inadimplência Mensal</CardTitle>
            <CardDescription>Volume acumulado desde Out/24 por mês (Ref)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Valor (R$)', color: '#f59e0b' } }}
              className="h-[300px] w-full"
            >
              <BarChart data={data.d2_monthly}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* D4: Desempenho do Setor */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>4. Desempenho do Setor</CardTitle>
            <CardDescription>Volume de contatos e recuperação por agente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador</TableHead>
                    <TableHead className="text-right">Contatos</TableHead>
                    <TableHead className="text-right">Recuperações</TableHead>
                    <TableHead className="text-right">Valor Recuperado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.d4_performance.map((op: any, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{op.operator || 'Sistema/Auto'}</TableCell>
                      <TableCell className="text-right">{op.contacts}</TableCell>
                      <TableCell className="text-right">{op.recoveries}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(op.recovered_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* D3: Régua de Cobrança */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>3. Régua de Cobrança</CardTitle>
            <CardDescription>Volume de contatos por etapa/canal</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ volume: { label: 'Volume', color: '#10b981' } }}
              className="h-[300px] w-full"
            >
              <BarChart data={data.d3_funnel} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="step"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="volume" fill="var(--color-volume)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* D5: Metas */}
        <Card className="col-span-full md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> 5. Metas Mensais
            </CardTitle>
            <CardDescription>Comparativo Realizado x Planejado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium">Progresso da Meta</span>
                <span className="text-2xl font-bold text-primary">{percentMeta.toFixed(1)}%</span>
              </div>
              <Progress value={percentMeta} className="h-4" />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Realizado: {formatCurrency(metaRealizada)}</span>
                <span>Alvo: {formatCurrency(metaPlanejada)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* D6: Análise de Perfis */}
        <Card className="col-span-full md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> 6. Perfis (Residencial x Comercial)
            </CardTitle>
            <CardDescription>Distribuição do valor financeiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.d6_profiles}
                    dataKey="value"
                    nameKey="profile_type"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.d6_profiles.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {data.d6_profiles.map((entry: any, index: number) => (
                <div key={index} className="flex items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  {entry.profile_type}: {formatCurrency(entry.value)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* D7: Projeções */}
        <Card className="col-span-full md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" /> 7. Projeções
            </CardTitle>
            <CardDescription>Estimativa de queda da inadimplência (3 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: 'Estimativa (R$)', color: '#8b5cf6' } }}
              className="h-[200px] w-full"
            >
              <LineChart data={projections}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* D8: Recomendações */}
        <Card className="col-span-full lg:col-span-7 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Lightbulb className="w-5 h-5" /> 8. Recomendações e Insights
            </CardTitle>
            <CardDescription>
              Ações sugeridas com base na análise automatizada dos dados atuais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {getRecommendations().map((rec, i) => (
                <div key={i} className="flex gap-3 bg-white p-4 rounded-lg shadow-sm border">
                  <div className="mt-0.5 bg-primary/10 p-2 rounded-md h-fit">
                    <rec.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
