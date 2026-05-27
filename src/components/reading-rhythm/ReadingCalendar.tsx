import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CloudRain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ReadingCalendar({
  currentMonth,
  settings,
  onSelectDate,
}: {
  currentMonth: Date
  settings: Record<string, any>
  onSelectDate: (d: Date) => void
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-3 text-muted-foreground font-medium uppercase tracking-wider">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isDayToday = isToday(day)
            const daySettings = settings[dateStr]
            const isWorking = daySettings ? daySettings.is_working_day : true
            const weather = daySettings?.weather_condition || 'normal'

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(day)}
                className={cn(
                  'relative h-12 w-full flex flex-col items-center justify-center rounded-md border text-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  !isCurrentMonth && 'text-muted-foreground opacity-50 bg-muted/30 border-dashed',
                  !isWorking &&
                    'bg-destructive/10 text-destructive border-destructive/20 line-through decoration-destructive/50',
                  isDayToday &&
                    'border-primary text-primary font-bold shadow-sm ring-1 ring-primary ring-offset-1',
                )}
              >
                <span>{format(day, 'd')}</span>
                {weather === 'chuvoso' && (
                  <CloudRain className="w-3.5 h-3.5 text-blue-500 absolute bottom-1 right-1 drop-shadow-sm" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
