import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const recoveryData = [
  { month: 'Jun', recuperado: 15000, meta: 20000 },
  { month: 'Jul', recuperado: 18000, meta: 20000 },
  { month: 'Ago', recuperado: 22000, meta: 20000 },
  { month: 'Set', recuperado: 25000, meta: 25000 },
  { month: 'Out', recuperado: 32000, meta: 25000 },
  { month: 'Nov', recuperado: 14500, meta: 30000 }, // Current month
]

const operatorData = [
  { name: 'Ana Costa', esforco: 150, qualidade: 80, resultado: 250 },
  { name: 'Marcos P.', esforco: 120, qualidade: 60, resultado: 180 },
  { name: 'Juliana S.', esforco: 180, qualidade: 90, resultado: 150 },
  { name: 'Carlos T.', esforco: 90, qualidade: 40, resultado: 100 },
]

const chartConfig = {
  recuperado: { label: 'Recuperado (R$)', color: 'hsl(var(--primary))' },
  meta: { label: 'Meta', color: 'hsl(var(--muted-foreground))' },
  esforco: { label: 'Pts. Esforço', color: 'hsl(var(--chart-3))' },
  qualidade: { label: 'Pts. Qualidade', color: 'hsl(var(--accent))' },
  resultado: { label: 'Pts. Resultado', color: 'hsl(var(--primary))' },
}

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Inteligência & Relatórios
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Análise de produtividade, recuperação financeira e pontuação geral.
          </p>
        </div>
        <Select defaultValue="nov">
          <SelectTrigger className="w-[180px] rounded-full font-medium border-slate-200 bg-white">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="nov">Novembro 2023</SelectItem>
            <SelectItem value="out">Outubro 2023</SelectItem>
            <SelectItem value="set">Setembro 2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white pb-6 border-b border-slate-50">
            <CardTitle className="font-bold text-slate-900">
              Evolução de Recuperação (Baixas)
            </CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Comparativo de valor recuperado vs Meta estabelecida.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={recoveryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRecuperado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-recuperado)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-recuperado)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: '#64748b', fontWeight: 600 }}
                />
                <YAxis
                  tickFormatter={(val) => `R$${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontWeight: 600 }}
                  dx={-10}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      className="rounded-xl shadow-lg border-slate-200"
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="meta"
                  stroke="var(--color-meta)"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="recuperado"
                  stroke="var(--color-recuperado)"
                  fill="url(#fillRecuperado)"
                  strokeWidth={3}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white pb-6 border-b border-slate-50">
            <CardTitle className="font-bold text-slate-900">
              Composição de Pontos por Operador
            </CardTitle>
            <CardDescription className="font-medium text-slate-500">
              Visão das 3 camadas: Esforço, Qualidade e Resultado Financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={operatorData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={32}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: '#64748b', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontWeight: 600 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="rounded-xl shadow-lg border-slate-200" />
                  }
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar
                  dataKey="esforco"
                  stackId="a"
                  fill="var(--color-esforco)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar dataKey="qualidade" stackId="a" fill="var(--color-qualidade)" />
                <Bar
                  dataKey="resultado"
                  stackId="a"
                  fill="var(--color-resultado)"
                  radius={[4, 4, 0, 0]}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
