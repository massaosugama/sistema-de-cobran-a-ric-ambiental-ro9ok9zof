import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { CloudRain } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const chartConfig = {
  green_count: { label: 'Adiantado', color: '#22c55e' },
  yellow_count: { label: 'Em Dia', color: '#eab308' },
  red_count: { label: 'Atrasado', color: '#ef4444' },
  gray_count: { label: 'Sem Ref.', color: '#94a3b8' },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md text-sm min-w-[180px]">
        <p className="font-semibold mb-2 text-foreground">
          {label ? format(parseISO(label), "dd 'de' MMMM", { locale: ptBR }) : ''}
        </p>
        {data.weather_condition === 'chuvoso' && (
          <div className="flex items-center gap-1 text-blue-500 mb-3 font-medium bg-blue-500/10 px-2 py-1 rounded-md w-fit">
            <CloudRain className="w-4 h-4" />
            <span>Clima: Chuvoso</span>
          </div>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">
                {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label || entry.name}
              </span>
            </div>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function ReadingComparisonChart({ data }: { data: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Comparativo de Ritmo (vs Fantasma)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[350px] w-full">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="date_label"
                tickFormatter={(val) => format(parseISO(val), 'dd/MM')}
                className="text-xs"
                tickMargin={10}
              />
              <YAxis className="text-xs" tickFormatter={(val) => `${val}`} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
              />
              <Bar
                dataKey="green_count"
                stackId="a"
                fill={chartConfig.green_count.color}
                radius={[0, 0, 4, 4]}
              />
              <Bar dataKey="yellow_count" stackId="a" fill={chartConfig.yellow_count.color} />
              <Bar dataKey="red_count" stackId="a" fill={chartConfig.red_count.color} />
              <Bar
                dataKey="gray_count"
                stackId="a"
                fill={chartConfig.gray_count.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
