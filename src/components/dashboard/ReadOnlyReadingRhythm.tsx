import { useState, useEffect, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ReadOnlyReadingRhythm() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarSettings, setCalendarSettings] = useState<Record<string, any>>({})
  const [dailyReadings, setDailyReadings] = useState<any[]>([])
  const [allReaders, setAllReaders] = useState<any[]>([])
  const [dailyReaders, setDailyReaders] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)

        const [
          { data: settingsData },
          { data: readingsData },
          { data: allReadersData },
          { data: readersByDayData },
        ] = await Promise.all([
          supabase
            .from('calendar_settings')
            .select('*')
            .gte('date', format(monthStart, 'yyyy-MM-dd'))
            .lte('date', format(monthEnd, 'yyyy-MM-dd')),
          supabase.rpc('get_daily_readings_by_day', { p_month: monthStart.toISOString() }),
          supabase.from('gis_users').select('usuario_id, nome').order('nome'),
          supabase.rpc('get_readers_by_day' as any, { p_month: monthStart.toISOString() }),
        ])

        const settingsMap = (settingsData || []).reduce(
          (acc: any, curr: any) => ({ ...acc, [curr.date]: curr }),
          {},
        )
        setCalendarSettings(settingsMap)

        const parsedReadings =
          typeof readingsData === 'string' ? JSON.parse(readingsData) : readingsData || []
        setDailyReadings(parsedReadings)

        setAllReaders(allReadersData || [])

        const parsedReadersByDay =
          typeof readersByDayData === 'string'
            ? JSON.parse(readersByDayData)
            : readersByDayData || []
        const readersMap = parsedReadersByDay.reduce(
          (acc: any, curr: any) => ({ ...acc, [curr.date_label]: curr.readers }),
          {},
        )
        setDailyReaders(readersMap)
      } catch (err: any) {
        console.error('Error loading rhythm data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentDate])

  const getActiveWorkersCount = (dateStr: string) => {
    const worked = dailyReaders[dateStr] || []
    const settings = calendarSettings[dateStr] || {}
    const ignored = settings.ignored_readers || []
    const added = settings.added_readers || []
    const statuses = settings.reader_statuses || {}
    let count = 0
    allReaders.forEach((readerObj) => {
      const reader = readerObj.usuario_id
      const status = statuses[reader] || 'ativo'
      if (status !== 'ativo') return

      const didWork = worked.some((r) => r.usuario_id === reader)
      if ((didWork && !ignored.includes(reader)) || added.includes(reader)) count++
    })
    return count
  }

  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }),
    [currentDate],
  )
  const emptyCells = Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
    <div key={`empty-${i}`} className="min-h-[110px] sm:min-h-[120px] bg-slate-50/50" />
  ))

  return (
    <Card className="w-full border-slate-200 shadow-sm shrink-0 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Ritmo de Leitura
          </CardTitle>
          <CardDescription>Acompanhamento mensal de leituras (Consulta)</CardDescription>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 border border-slate-200 rounded-md p-1 shadow-sm h-9">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="h-7 w-7 text-slate-600 hover:bg-white shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-28 h-7 text-center font-semibold text-xs capitalize text-slate-700 hover:bg-white px-0"
              >
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-3" align="center">
              <div className="flex items-center gap-2 mb-3">
                <Select
                  value={currentDate.getFullYear().toString()}
                  onValueChange={(val) => {
                    const newDate = new Date(currentDate)
                    newDate.setFullYear(parseInt(val, 10))
                    setCurrentDate(newDate)
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs font-semibold">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(
                      (year) => (
                        <SelectItem key={year} value={year.toString()} className="text-xs">
                          {year}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => i).map((month) => {
                  const d = new Date(currentDate.getFullYear(), month, 1)
                  return (
                    <Button
                      key={month}
                      variant={currentDate.getMonth() === month ? 'default' : 'ghost'}
                      className="h-8 text-xs capitalize"
                      onClick={() => {
                        const newDate = new Date(currentDate)
                        newDate.setMonth(month)
                        setCurrentDate(newDate)
                        setIsCalendarOpen(false)
                      }}
                    >
                      {format(d, 'MMM', { locale: ptBR })}
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="h-7 w-7 text-slate-600 hover:bg-white shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="bg-slate-200 gap-px border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div className="grid grid-cols-7 gap-px">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div
                key={day}
                className="h-8 bg-slate-50 flex items-center justify-center font-semibold text-[11px] text-slate-600 uppercase"
              >
                {day}
              </div>
            ))}
            {emptyCells}
            {daysInMonth.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const isWorkingDay = calendarSettings[dateStr]?.is_working_day ?? true
              const hasVenc = calendarSettings[dateStr]?.vencimento_padrao
              const dailyStats = dailyReadings.find((r) => r.date_label === dateStr)
              const workersCount = getActiveWorkersCount(dateStr)
              const average =
                workersCount > 0 && dailyStats
                  ? Math.round(dailyStats.total_read / workersCount)
                  : 0

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[110px] sm:min-h-[120px] h-full p-1.5 flex flex-col relative overflow-hidden',
                    isWorkingDay ? (hasVenc ? 'bg-emerald-50/60' : 'bg-white') : 'bg-red-50/30',
                  )}
                >
                  <div className="flex justify-between items-start w-full z-10 relative">
                    <div className="flex flex-col gap-1 items-start relative shrink-0 z-20">
                      <span
                        className={cn(
                          'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full',
                          isToday(date)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : hasVenc
                              ? 'text-emerald-800 bg-emerald-200/60'
                              : 'text-slate-700 bg-slate-100',
                        )}
                      >
                        {format(date, 'd')}
                      </span>
                      {hasVenc && (
                        <span className="text-[8px] font-bold text-emerald-700 px-1 py-0.5 bg-emerald-100 border border-emerald-200 rounded-sm text-center leading-none mt-0.5">
                          Venc
                          <br />
                          {calendarSettings[dateStr].vencimento_padrao}
                        </span>
                      )}
                    </div>

                    <div className="absolute inset-x-0 top-0 pt-0 sm:pt-1 flex flex-col items-center justify-start pointer-events-none z-10">
                      {dailyStats && dailyStats.total_read > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-lg sm:text-xl font-black text-slate-800 leading-none">
                            {dailyStats.total_read.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            Leituras
                          </span>
                          {workersCount > 0 && (
                            <span className="text-[8px] sm:text-[9px] text-slate-500 mt-1 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                              Média: {average}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-1 relative shrink-0 z-20">
                      {!isWorkingDay && (
                        <span className="text-[8px] font-bold text-red-600 uppercase px-1 py-[1px] bg-red-100 rounded-sm whitespace-nowrap">
                          Não Útil
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
