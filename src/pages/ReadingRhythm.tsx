import { useState, useEffect, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addYears,
  subYears,
  setMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BarChart3,
  Loader2,
  RefreshCw,
  Lock,
  LockOpen,
  Activity,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const getRelativeGradientColor = (
  current: number,
  reference: number,
  isFuture: boolean,
  hasRef: boolean,
  maxPos: number,
  maxNeg: number,
) => {
  if (isFuture) return { bg: '#f8fafc', text: '#94a3b8', border: 'transparent' }
  if (!hasRef || reference === 0) {
    if (current > 0) return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
    return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' }
  }

  const diffPct = (current - reference) / reference
  let normalized = 0

  if (diffPct > 0) {
    normalized = maxPos > 0 ? diffPct / maxPos : 0
  } else if (diffPct < 0) {
    normalized = maxNeg > 0 ? Math.abs(diffPct) / maxNeg : 0
  }

  let r, g, b, text
  if (normalized > 0 && diffPct > 0) {
    r = Math.round(250 + normalized * (22 - 250))
    g = Math.round(204 + normalized * (163 - 204))
    b = Math.round(21 + normalized * (74 - 21))
    text = normalized > 0.5 ? '#ffffff' : '#451a03'
  } else if (normalized > 0 && diffPct < 0) {
    r = Math.round(250 + normalized * (220 - 250))
    g = Math.round(204 + normalized * (38 - 204))
    b = Math.round(21 + normalized * (38 - 21))
    text = normalized > 0.5 ? '#ffffff' : '#451a03'
  } else {
    r = 250
    g = 204
    b = 21
    text = '#451a03'
  }

  return { bg: `rgb(${r}, ${g}, ${b})`, text, border: 'transparent' }
}

export default function ReadingRhythm() {
  const { profile } = useAuth()
  const isConsulta = profile?.role === 'consultas' && !profile?.is_admin

  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarSettings, setCalendarSettings] = useState<Record<string, any>>({})
  const [dailyReadings, setDailyReadings] = useState<any[]>([])
  const [allReaders, setAllReaders] = useState<any[]>([])
  const [dailyReaders, setDailyReaders] = useState<Record<string, any[]>>({})
  const [references, setReferences] = useState<any[]>([])
  const [selectedReferences, setSelectedReferences] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [needsRecalculate, setNeedsRecalculate] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [hasEditedWorkingDays, setHasEditedWorkingDays] = useState(false)
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { toast } = useToast()

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [rangeDates, setRangeDates] = useState<Record<string, Date | undefined>>({})
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false)
  const [detailsDate, setDetailsDate] = useState<string | null>(null)
  const [detailsData, setDetailsData] = useState<any[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const [rulerData, setRulerData] = useState<any>(null)

  const [drawerSettings, setDrawerSettings] = useState({
    is_working_day: true,
    vencimento_padrao: '',
    ignored_readers: [] as string[],
    added_readers: [] as string[],
    reader_statuses: {} as Record<string, string>,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const [
        { data: settingsData, error: settingsError },
        { data: summaryData, error: summaryError },
        { data: allReadersData, error: allReadersError },
        { data: referencesData, error: referencesError },
        { data: needsRecalcData },
        { data: lockData },
      ] = await Promise.all([
        supabase
          .from('calendar_settings')
          .select('*')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd')),
        supabase
          .from('daily_readings_summary' as any)
          .select('*')
          .gte('day', format(monthStart, 'yyyy-MM-dd'))
          .lte('day', format(monthEnd, 'yyyy-MM-dd')),
        supabase
          .from('gis_users')
          .select('usuario_id, nome')
          .eq('is_leiturista' as any, true)
          .order('nome'),
        supabase.rpc('get_daily_readings_references' as any),
        supabase.rpc('check_needs_recalculation' as any, { p_month: monthStart.toISOString() }),
        supabase
          .from('app_settings')
          .select('value')
          .eq('key', `working_days_lock_${format(monthStart, 'yyyy_MM')}`)
          .maybeSingle(),
      ])

      if (settingsError) throw settingsError
      if (summaryError) throw summaryError
      if (allReadersError) console.error('Error fetching readers:', allReadersError)
      if (referencesError) console.error('Error fetching references:', referencesError)

      const settingsMap = (settingsData || []).reduce(
        (acc: any, curr: any) => ({ ...acc, [curr.date]: curr }),
        {},
      )
      setCalendarSettings(settingsMap)

      setAllReaders(allReadersData || [])

      const parsedSummary = summaryData || []
      const formattedReadings = parsedSummary.map((s: any) => ({
        date_label: s.day,
        total_read: s.total_readings,
      }))
      setDailyReadings(formattedReadings)

      const formattedReaders = parsedSummary.reduce((acc: any, curr: any) => {
        const readersArr = Object.entries(curr.reader_stats || {}).map(([key, val]) => ({
          usuario_id: key,
          total_read: val,
        }))
        return { ...acc, [curr.day]: readersArr }
      }, {})
      setDailyReaders(formattedReaders)
      setReferences(referencesData || [])
      setNeedsRecalculate(!!needsRecalcData)
      setIsLocked(lockData?.value?.locked ?? false)
      setHasEditedWorkingDays(false)
    } catch (err: any) {
      setHasError(true)
      const isTimeout =
        err.code === '504' ||
        err.message?.toLowerCase().includes('timeout') ||
        err.message?.includes('fetch') ||
        err.code === '57014'
      toast({
        title: isTimeout ? 'Tempo de resposta excedido' : 'Erro ao carregar dados',
        description: isTimeout
          ? 'Devido ao volume de dados, a consulta demorou muito. Clique em Recarregar ou limpe os filtros.'
          : err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadComparison = async () => {
    if (selectedReferences.length === 0) {
      setComparisonData({})
      return
    }
    try {
      const monthStart = startOfMonth(currentDate)
      const { data, error } = await supabase.rpc('get_reading_rhythm_comparison' as any, {
        p_current_month: monthStart.toISOString(),
        p_references: selectedReferences.map((d: string) => d.substring(0, 10)),
      })
      if (error) throw error
      const parsed = typeof data === 'string' ? JSON.parse(data) : data || []
      const compMap = parsed.reduce(
        (acc: any, curr: any) => ({ ...acc, [curr.date_label]: curr }),
        {},
      )
      setComparisonData(compMap)
    } catch (err: any) {
      toast({ title: 'Erro na comparação', description: err.message, variant: 'destructive' })
    }
  }

  const loadRuler = async () => {
    try {
      const monthStart = startOfMonth(currentDate)
      const { data, error } = await supabase.rpc('get_reading_rhythm_ruler' as any, {
        p_current_month: monthStart.toISOString(),
        p_references: selectedReferences.map((d: string) => d.substring(0, 10)),
      })
      if (error) throw error
      setRulerData(data)
    } catch (err: any) {
      console.error('Error fetching ruler data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentDate])

  useEffect(() => {
    loadComparison()
    loadRuler()
  }, [selectedReferences, currentDate])

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate)
    setSelectedReferences([])
  }

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      const { error } = await supabase.rpc('recalculate_working_days_metrics' as any, {
        p_month: startOfMonth(currentDate).toISOString(),
      })
      if (error) {
        if (
          error.code === '504' ||
          error.message?.toLowerCase().includes('timeout') ||
          error.message?.includes('fetch')
        ) {
          toast({
            title: 'Processamento em andamento',
            description:
              'Devido ao grande volume de dados, o recálculo continua rodando em segundo plano. Atualize a página em alguns instantes.',
          })
          setNeedsRecalculate(false)
        } else {
          throw error
        }
      } else {
        toast({ title: 'Recálculo concluído', description: 'Dias úteis recalculados com sucesso.' })
        setNeedsRecalculate(false)
        loadData()
        loadComparison()
        loadRuler()
      }
    } catch (err: any) {
      toast({ title: 'Erro ao recalcular', description: err.message, variant: 'destructive' })
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleDayDoubleClick = async (date: Date) => {
    if (isConsulta) return
    if (isLocked) {
      toast({
        title: 'Ação bloqueada',
        description: 'O mês está bloqueado para edição de dias úteis.',
        variant: 'destructive',
      })
      return
    }
    const dateStr = format(date, 'yyyy-MM-dd')
    const currentSetting = calendarSettings[dateStr] || {}
    const newIsWorkingDay = !(currentSetting.is_working_day ?? true)

    try {
      const { error } = await supabase
        .from('calendar_settings')
        .upsert(
          { date: dateStr, is_working_day: newIsWorkingDay, updated_at: new Date().toISOString() },
          { onConflict: 'date' },
        )
      if (error) throw error

      setCalendarSettings((prev) => ({
        ...prev,
        [dateStr]: { ...currentSetting, date: dateStr, is_working_day: newIsWorkingDay },
      }))
      setNeedsRecalculate(true)
      setHasEditedWorkingDays(true)
      toast({
        title: 'Status atualizado',
        description: `${format(date, 'dd/MM/yyyy')} definido como ${newIsWorkingDay ? 'Útil' : 'Não Útil'}.`,
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const openDaySettings = (date: Date) => {
    if (isConsulta) return
    const dateStr = format(date, 'yyyy-MM-dd')
    const currentSetting = calendarSettings[dateStr] || {}
    setDrawerSettings({
      is_working_day: currentSetting.is_working_day ?? true,
      vencimento_padrao: currentSetting.vencimento_padrao
        ? String(currentSetting.vencimento_padrao)
        : '',
      ignored_readers: currentSetting.ignored_readers || [],
      added_readers: currentSetting.added_readers || [],
      reader_statuses: currentSetting.reader_statuses || {},
    })
    setRangeDates({})
    setSelectedDate(date)
    setIsDrawerOpen(true)
  }

  const handleSaveDrawerSettings = async () => {
    if (!selectedDate) return
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const currentSetting = calendarSettings[dateStr] || {}
    const newIsWorkingDay = isLocked
      ? (currentSetting.is_working_day ?? true)
      : drawerSettings.is_working_day

    try {
      const { error } = await supabase.from('calendar_settings').upsert(
        {
          date: dateStr,
          is_working_day: newIsWorkingDay,
          vencimento_padrao: drawerSettings.vencimento_padrao
            ? parseInt(drawerSettings.vencimento_padrao)
            : null,
          ignored_readers: drawerSettings.ignored_readers,
          added_readers: drawerSettings.added_readers,
          reader_statuses: drawerSettings.reader_statuses,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'date' },
      )

      if (error) throw error

      setCalendarSettings((prev) => ({
        ...prev,
        [dateStr]: {
          ...currentSetting,
          date: dateStr,
          is_working_day: newIsWorkingDay,
          vencimento_padrao: drawerSettings.vencimento_padrao
            ? parseInt(drawerSettings.vencimento_padrao)
            : null,
          ignored_readers: drawerSettings.ignored_readers,
          added_readers: drawerSettings.added_readers,
          reader_statuses: drawerSettings.reader_statuses,
        },
      }))

      if ((currentSetting.is_working_day ?? true) !== newIsWorkingDay) {
        setNeedsRecalculate(true)
        setHasEditedWorkingDays(true)
      }

      toast({ title: 'Salvo', description: 'Configurações atualizadas com sucesso.' })
      setIsDrawerOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const openDetails = async (dateStr: string) => {
    setDetailsDate(dateStr)
    setIsDetailsDrawerOpen(true)
    setIsLoadingDetails(true)
    try {
      const monthStart = startOfMonth(currentDate)
      const { data, error } = await supabase.rpc('get_reading_rhythm_day_details' as any, {
        p_current_month: monthStart.toISOString(),
        p_date_label: dateStr,
        p_references: selectedReferences.map((d: string) => d.substring(0, 10)),
      })
      if (error) throw error
      setDetailsData(typeof data === 'string' ? JSON.parse(data) : data || [])
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleLockToggle = () => {
    if (isLocked) {
      setIsUnlockDialogOpen(true)
    } else {
      handleLock()
    }
  }

  const handleLock = async () => {
    const monthKey = `working_days_lock_${format(startOfMonth(currentDate), 'yyyy_MM')}`
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: monthKey,
        value: { locked: true },
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      setIsLocked(true)
      toast({ title: 'Mês bloqueado', description: 'A edição de dias úteis foi bloqueada.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleUnlock = async () => {
    const monthKey = `working_days_lock_${format(startOfMonth(currentDate), 'yyyy_MM')}`
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: monthKey,
        value: { locked: false },
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      setIsLocked(false)
      toast({ title: 'Mês desbloqueado', description: 'A edição de dias úteis foi liberada.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setIsUnlockDialogOpen(false)
    }
  }

  const handleApplyRange = async (reader: string, status: string, endDate: Date) => {
    if (!selectedDate) return
    try {
      const { error } = await supabase.rpc('apply_reader_status_range', {
        p_reader_name: reader,
        p_status: status,
        p_start_date: format(selectedDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
      })
      if (error) throw error
      toast({
        title: 'Status aplicado',
        description: `O status "${status}" foi aplicado para ${reader}.`,
      })
      setNeedsRecalculate(true)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao aplicar', description: err.message, variant: 'destructive' })
    }
  }

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

  const maxVariations = useMemo(() => {
    let maxPos = 0
    let maxNeg = 0
    if (rulerData && rulerData.rulers && selectedReferences.length > 0) {
      const currentRuler = rulerData.rulers.find((r: any) => r.is_current)
      if (currentRuler) {
        const isFutureMonth = startOfMonth(currentDate) > startOfMonth(new Date())
        currentRuler.blocks.forEach((block: any) => {
          const isFuture =
            rulerData.current_working_day !== null
              ? block.index > rulerData.current_working_day
              : isFutureMonth

          const hasNoActivity = block.daily === 0 && !isFuture

          if (block.accumulated > 0 && block.ref_acc > 0 && !isFuture && !hasNoActivity) {
            const diffPct = (block.accumulated - block.ref_acc) / block.ref_acc
            if (diffPct > maxPos) maxPos = diffPct
            if (diffPct < -maxNeg) maxNeg = Math.abs(diffPct)
          }
        })
      }
    }
    return { maxPos, maxNeg }
  }, [rulerData, selectedReferences, currentDate])

  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }),
    [currentDate],
  )
  const emptyCells = Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
    <div key={`empty-${i}`} className="min-h-[130px] sm:min-h-[150px] bg-slate-50/50" />
  ))
  const combinedChartData = useMemo(() => {
    if (!rulerData || !rulerData.rulers) return []

    const currentRuler = rulerData.rulers.find((r: any) => r.is_current)
    if (!currentRuler) return []

    const maxDays = rulerData.max_working_days || currentRuler.blocks.length

    const refRuler = rulerData.rulers.find((r: any) => !r.is_current)

    const data = []
    for (let i = 1; i <= maxDays; i++) {
      const currentBlock = currentRuler.blocks.find((b: any) => b.index === i)
      const refBlock = refRuler ? refRuler.blocks.find((b: any) => b.index === i) : null

      const currentDaily = currentBlock ? currentBlock.daily : 0
      const refDaily = refBlock ? refBlock.daily : 0

      let variance = 0
      let varianceStr = '-'
      if (refDaily > 0) {
        variance = ((currentDaily - refDaily) / refDaily) * 100
        varianceStr = `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`
      } else if (currentDaily > 0 && refDaily === 0) {
        varianceStr = '+100.0%'
      }

      data.push({
        index: `D${i}`,
        dayIndex: i,
        current: currentDaily,
        reference: refDaily,
        varianceStr,
        refMonthLabel: refRuler ? refRuler.month : '',
        currentMonthLabel: currentRuler.month,
      })
    }

    return data
  }, [rulerData])

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in">
      <AlertDialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription>
              Os dias úteis já foram definidos. Deseja mesmo fazer edições?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlock}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary" /> Ritmo de Leitura
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
          {hasError && (
            <Button
              variant="destructive"
              size="sm"
              onClick={loadData}
              className="h-10"
              title="Tentar recarregar os dados"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Recarregar</span>
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-10 bg-white',
                  selectedReferences.length > 0 && 'border-primary text-primary',
                )}
              >
                Comparar com {selectedReferences.length > 0 && `(${selectedReferences.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <ScrollArea className="h-64">
                <div className="p-2 flex flex-col gap-1">
                  {references.map((ref) => {
                    const isCurrent =
                      startOfMonth(currentDate).toISOString().substring(0, 7) ===
                      ref.data_ref.substring(0, 7)
                    if (isCurrent) return null

                    const isSelected = selectedReferences.includes(ref.data_ref)
                    return (
                      <div
                        key={ref.data_ref}
                        className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md cursor-pointer"
                      >
                        <Checkbox
                          id={`ref-${ref.data_ref}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReferences((prev) => [...prev, ref.data_ref])
                            } else {
                              setSelectedReferences((prev) =>
                                prev.filter((r) => r !== ref.data_ref),
                              )
                            }
                          }}
                        />
                        <Label
                          htmlFor={`ref-${ref.data_ref}`}
                          className="cursor-pointer flex-1 font-medium text-slate-700"
                        >
                          {ref.referencia}
                        </Label>
                      </div>
                    )
                  })}
                  {references.length === 0 && (
                    <div className="p-2 text-sm text-slate-500 text-center">Nenhuma referência</div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating || loading || isConsulta || !needsRecalculate}
            className={cn(
              'h-10 bg-white transition-all',
              needsRecalculate && 'border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100',
            )}
            title={
              needsRecalculate ? 'Clique para atualizar o cálculo de dias úteis' : 'Cálculo em dia'
            }
          >
            {isRecalculating ? (
              <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 sm:mr-2 text-primary" />
            )}
            <span className="hidden sm:inline">Recalcular Dias</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLockToggle}
            disabled={(!isLocked && !hasEditedWorkingDays) || isConsulta}
            className={cn(
              'h-10 w-10 shrink-0 transition-colors bg-white',
              isLocked
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700'
                : '',
            )}
            title={isLocked ? 'Desbloquear edição de dias úteis' : 'Bloquear edição de dias úteis'}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <LockOpen
                className={cn(
                  'w-4 h-4',
                  !hasEditedWorkingDays ? 'text-slate-300' : 'text-slate-600',
                )}
              />
            )}
          </Button>

          <div className="flex items-center gap-1 sm:gap-2 bg-white border rounded-md p-1 shadow-sm h-10 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDateChange(subMonths(currentDate, 1))}
              className="h-8 w-8 text-slate-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-28 sm:w-36 h-8 text-center font-semibold text-sm capitalize text-slate-700 hover:bg-slate-100"
                >
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="center">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDateChange(subYears(currentDate, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="font-semibold text-sm">{format(currentDate, 'yyyy')}</div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDateChange(addYears(currentDate, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthDate = setMonth(currentDate, i)
                    const isSelected = currentDate.getMonth() === i
                    return (
                      <Button
                        key={i}
                        variant={isSelected ? 'default' : 'ghost'}
                        className="h-8 capitalize text-xs"
                        onClick={() => {
                          handleDateChange(monthDate)
                          setIsMonthPickerOpen(false)
                        }}
                      >
                        {format(monthDate, 'MMM', { locale: ptBR })}
                      </Button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDateChange(addMonths(currentDate, 1))}
              className="h-8 w-8 text-slate-600"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-slate-200 gap-px border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div className="grid grid-cols-7 gap-px">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="h-10 bg-slate-50 flex items-center justify-center font-semibold text-[13px] text-slate-600"
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
              workersCount > 0 && dailyStats ? Math.round(dailyStats.total_read / workersCount) : 0

            return (
              <div
                key={dateStr}
                onDoubleClick={() => handleDayDoubleClick(date)}
                className={cn(
                  'min-h-[130px] sm:min-h-[150px] h-full p-1.5 sm:p-2 flex flex-col transition-all relative group select-none overflow-hidden',
                  isWorkingDay
                    ? hasVenc
                      ? 'bg-emerald-50/60 hover:bg-emerald-100/60'
                      : 'bg-white hover:bg-slate-50'
                    : 'bg-red-50/30 hover:bg-red-50/60',
                )}
              >
                <div className="flex justify-between items-start w-full relative z-10">
                  <div className="flex flex-col gap-1 items-start relative shrink-0 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openDaySettings(date)
                      }}
                      disabled={isConsulta}
                      className={cn(
                        'text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors outline-none focus:ring-2 focus:ring-primary pointer-events-auto',
                        !isConsulta && 'hover:ring-2 hover:ring-primary/50 cursor-pointer',
                        isToday(date)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : !isConsulta
                            ? hasVenc
                              ? 'text-emerald-800 bg-emerald-200/60 hover:bg-emerald-300'
                              : 'text-slate-700 bg-slate-200/50 hover:bg-slate-300'
                            : 'text-slate-700',
                      )}
                      title={!isConsulta ? 'Configurar dia' : ''}
                    >
                      {format(date, 'd')}
                    </button>
                    {hasVenc && (
                      <span
                        className="text-[9px] sm:text-[10px] font-bold text-emerald-700 px-1 py-0.5 bg-emerald-100 border border-emerald-200 rounded-sm text-center leading-none mt-1"
                        title="Vencimento Padrão"
                      >
                        Venc
                        <br />
                        {calendarSettings[dateStr].vencimento_padrao}
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-x-0 top-0 pt-0 sm:pt-1 flex flex-col items-center justify-start pointer-events-none z-10">
                    {dailyStats && dailyStats.total_read > 0 ? (
                      <div className="flex flex-col items-center animate-fade-in-up">
                        <span className="text-xl sm:text-2xl font-black text-slate-800 leading-none">
                          {dailyStats.total_read.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          Leituras
                        </span>
                        {workersCount > 0 && (
                          <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-auto">
                            Média: {average}/leit
                          </span>
                        )}
                      </div>
                    ) : !isConsulta ? (
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-center px-1 leading-tight mt-2 pointer-events-auto">
                        Duplo clique
                        <br className="hidden sm:block" /> para alterar
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-1 relative shrink-0 z-20">
                    {!isWorkingDay && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-red-600 uppercase px-1 sm:px-1.5 py-0.5 bg-red-100 rounded-sm whitespace-nowrap">
                        Não Útil
                      </span>
                    )}
                  </div>
                </div>

                {selectedReferences.length > 0 &&
                  dailyStats &&
                  dailyStats.total_read > 0 &&
                  (() => {
                    const comp = comparisonData[dateStr] || {}
                    const green = comp.green_count || 0
                    const yellow = comp.yellow_count || 0
                    const red = comp.red_count || 0
                    const gray = comp.gray_count || 0
                    const total = green + yellow + red + gray

                    const greenPct = total > 0 ? (green / total) * 100 : 0
                    const yellowPct = total > 0 ? (yellow / total) * 100 : 0
                    const redPct = total > 0 ? (red / total) * 100 : 0
                    const grayPct = total > 0 ? (gray / total) * 100 : 0

                    return (
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className="mt-auto pt-3 w-full z-10 pointer-events-auto cursor-pointer px-1 sm:px-2 hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDetails(dateStr)
                            }}
                          >
                            <div className="flex w-full h-3 sm:h-4 rounded-full overflow-hidden border border-slate-200/50 shadow-sm bg-slate-100">
                              {greenPct > 0 && (
                                <div
                                  style={{ width: `${greenPct}%` }}
                                  className="bg-emerald-500 h-full transition-all"
                                />
                              )}
                              {yellowPct > 0 && (
                                <div
                                  style={{ width: `${yellowPct}%` }}
                                  className="bg-amber-400 h-full transition-all"
                                />
                              )}
                              {redPct > 0 && (
                                <div
                                  style={{ width: `${redPct}%` }}
                                  className="bg-red-500 h-full transition-all"
                                />
                              )}
                              {grayPct > 0 && (
                                <div
                                  style={{ width: `${grayPct}%` }}
                                  className="bg-slate-400 h-full transition-all"
                                />
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-3 space-y-2 border-slate-200 min-w-[180px]">
                          <div className="flex justify-between items-center gap-4 text-emerald-600 font-medium text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              <span>Melhorou</span>
                            </div>
                            <span>{green.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4 text-amber-600 font-medium text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-400" />
                              <span>Manteve</span>
                            </div>
                            <span>{yellow.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4 text-red-600 font-medium text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span>Piorou</span>
                            </div>
                            <span>{red.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4 text-slate-600 font-medium text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-slate-400" />
                              <span>Não Localizados</span>
                            </div>
                            <span>{gray.toLocaleString('pt-BR')}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })()}
              </div>
            )
          })}
        </div>
      </div>

      {rulerData && rulerData.rulers && (
        <Card className="border-slate-200 shadow-sm mt-2 overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-3 pt-4 px-4 sm:px-6">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5 text-primary" /> Régua de Progresso (Acumulado)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 px-4 sm:px-6 pb-6 overflow-x-auto">
            <div className="min-w-max flex flex-col gap-6 relative">
              {rulerData.rulers.map((ruler: any, rIdx: number) => {
                const isCurrentMonth = ruler.is_current
                const isFutureMonth =
                  startOfMonth(currentDate) > startOfMonth(new Date()) && isCurrentMonth

                return (
                  <div key={ruler.month} className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <div className="w-16 sm:w-20 shrink-0 flex items-center justify-end pr-2 text-xs sm:text-sm font-bold text-slate-700">
                        {ruler.month}
                      </div>
                      <div className="flex gap-[2px] relative">
                        {ruler.blocks.map((block: any) => {
                          const isFuture =
                            isCurrentMonth && rulerData.current_working_day !== null
                              ? block.index > rulerData.current_working_day
                              : isFutureMonth

                          const hasNoActivity = block.daily === 0 && !isFuture

                          let colors
                          if (hasNoActivity) {
                            colors = { bg: '#f1f5f9', text: 'transparent', border: '#e2e8f0' }
                          } else if (isCurrentMonth) {
                            const hasRef = selectedReferences.length > 0
                            colors = getRelativeGradientColor(
                              block.accumulated,
                              block.ref_acc || 0,
                              isFuture,
                              hasRef,
                              maxVariations.maxPos,
                              maxVariations.maxNeg,
                            )
                          } else {
                            colors = isFuture
                              ? { bg: '#f8fafc', text: '#94a3b8', border: 'transparent' }
                              : { bg: '#e0e7ff', text: '#3730a3', border: 'transparent' }
                          }

                          return (
                            <div
                              key={block.index}
                              className="flex flex-col items-center w-[52px] sm:w-[60px] shrink-0 relative group"
                            >
                              {isCurrentMonth && rulerData.current_working_day === block.index && (
                                <div className="absolute -top-7 text-primary flex flex-col items-center animate-fade-in-down z-10 drop-shadow-sm">
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-1.5 rounded shadow-sm border border-primary/20">
                                    Hoje
                                  </span>
                                  <ChevronDown className="w-4 h-4 -mt-1" />
                                </div>
                              )}

                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      'w-full h-10 sm:h-12 rounded flex items-center justify-center transition-all border px-0.5',
                                      isFuture && 'opacity-50',
                                    )}
                                    style={{
                                      backgroundColor: colors.bg,
                                      color: colors.text,
                                      borderColor:
                                        colors.border !== 'transparent'
                                          ? colors.border
                                          : 'rgba(0,0,0,0.1)',
                                    }}
                                  >
                                    <span className="text-[9px] sm:text-[10px] font-bold tracking-tighter truncate">
                                      {!isFuture && !hasNoActivity
                                        ? block.accumulated.toLocaleString('pt-BR')
                                        : ''}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 text-sm">
                                  <div className="font-semibold text-slate-900 mb-1">
                                    Dia Útil {block.index} ({ruler.month})
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-500">Leituras no Dia:</span>
                                      <span className="font-medium">
                                        {block.daily.toLocaleString('pt-BR')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-500">Acumulado:</span>
                                      <span className="font-medium">
                                        {block.accumulated.toLocaleString('pt-BR')}
                                      </span>
                                    </div>
                                    {isCurrentMonth &&
                                      selectedReferences.length > 0 &&
                                      !isFuture &&
                                      !hasNoActivity &&
                                      block.ref_acc > 0 && (
                                        <>
                                          <div className="flex justify-between gap-4">
                                            <span className="text-slate-500">
                                              Média Ref. (Acumulado):
                                            </span>
                                            <span className="font-medium">
                                              {Math.round(block.ref_acc).toLocaleString('pt-BR')}
                                            </span>
                                          </div>
                                          <div className="flex justify-between gap-4 pt-1 border-t mt-1">
                                            <span className="text-slate-500">Diferença:</span>
                                            <span
                                              className={cn(
                                                'font-bold',
                                                block.accumulated > block.ref_acc
                                                  ? 'text-emerald-600'
                                                  : block.accumulated < block.ref_acc
                                                    ? 'text-red-600'
                                                    : 'text-amber-600',
                                              )}
                                            >
                                              {block.accumulated - block.ref_acc > 0 ? '+' : ''}
                                              {Math.round(
                                                block.accumulated - block.ref_acc,
                                              ).toLocaleString('pt-BR')}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>

                              {rIdx === rulerData.rulers.length - 1 && (
                                <span
                                  className={cn(
                                    'text-[9px] sm:text-[10px] mt-1 font-medium transition-colors',
                                    isCurrentMonth && rulerData.current_working_day === block.index
                                      ? 'text-primary font-bold'
                                      : 'text-slate-500',
                                  )}
                                >
                                  D{block.index}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 shadow-sm mt-2">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
            <BarChart3 className="w-5 h-5 text-primary" /> Histórico e Volume de Leituras (Dias
            Úteis)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer
            config={{
              current: { label: 'Mês Atual', color: 'hsl(var(--primary))' },
              reference: { label: 'Mês Comparado', color: 'hsl(var(--primary))' },
            }}
            className="h-[300px] w-full"
          >
            <BarChart
              data={combinedChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="index"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <ChartTooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="bg-white border border-slate-200 rounded-md shadow-md p-3 text-sm flex flex-col gap-1 min-w-[200px] z-50">
                      <div className="font-bold text-slate-800 mb-1 border-b pb-1">
                        Dia Útil {data.dayIndex}
                      </div>
                      <div className="flex justify-between gap-4 text-primary font-medium">
                        <span>{data.currentMonthLabel}:</span>
                        <span>{data.current.toLocaleString('pt-BR')} leituras</span>
                      </div>
                      {data.refMonthLabel && (
                        <>
                          <div className="flex justify-between gap-4 text-slate-500">
                            <span>{data.refMonthLabel} (Ref):</span>
                            <span>{data.reference.toLocaleString('pt-BR')} leituras</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-2 border-t mt-1">
                            <span className="text-slate-600 font-medium">Variação:</span>
                            <span
                              className={cn(
                                'font-bold',
                                data.varianceStr.startsWith('+') && data.varianceStr !== '+0.0%'
                                  ? 'text-emerald-600'
                                  : data.varianceStr.startsWith('-') && data.varianceStr !== '-'
                                    ? 'text-red-600'
                                    : 'text-slate-600',
                              )}
                            >
                              {data.varianceStr}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="current"
                fill="var(--color-current)"
                radius={[4, 4, 0, 0]}
                maxBarSize={selectedReferences.length > 0 ? 30 : 40}
              />
              {selectedReferences.length > 0 && (
                <Bar
                  dataKey="reference"
                  fill="var(--color-reference)"
                  opacity={0.35}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />
              )}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[95vw] sm:w-[800px] sm:max-w-none flex flex-col gap-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Configurações do Dia: {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Dia Útil</Label>
              <p className="text-sm text-slate-500">
                {isLocked
                  ? 'A edição de dias úteis está bloqueada no cadeado.'
                  : 'Define se a data é considerada dia útil.'}
              </p>
            </div>
            <Switch
              checked={drawerSettings.is_working_day}
              disabled={isLocked}
              onCheckedChange={(v) => setDrawerSettings((s) => ({ ...s, is_working_day: v }))}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-base">Vencimento Padrão</Label>
            <p className="text-sm text-slate-500">
              Atribua um dos vencimentos padrão para as leituras deste dia.
            </p>
            <RadioGroup
              value={drawerSettings.vencimento_padrao}
              onValueChange={(v) => setDrawerSettings((s) => ({ ...s, vencimento_padrao: v }))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="venc-1" />
                <Label htmlFor="venc-1">1 (Dia 9)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="venc-2" />
                <Label htmlFor="venc-2">2 (Dia 18)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="venc-3" />
                <Label htmlFor="venc-3">3 (Dia 28)</Label>
              </div>
              <div className="flex items-center space-x-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDrawerSettings((s) => ({ ...s, vencimento_padrao: '' }))}
                  className="h-8 text-xs text-slate-500"
                >
                  Limpar
                </Button>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-3 flex-1 flex flex-col">
            <div>
              <Label className="text-base">Gestão de Leituristas</Label>
              <p className="text-sm text-slate-500">
                Selecione quem trabalhou ou altere o status de disponibilidade.
              </p>
            </div>
            <ScrollArea className="flex-1 border rounded-md p-4 min-h-[300px]">
              <div className="flex flex-col gap-3">
                {allReaders.map((readerObj) => {
                  const reader = readerObj.usuario_id
                  const readerName = readerObj.nome || reader

                  const workedInDb = selectedDate
                    ? (dailyReaders[format(selectedDate, 'yyyy-MM-dd')] || []).some(
                        (r) => r.usuario_id === reader,
                      )
                    : false

                  const status = drawerSettings.reader_statuses[reader] || 'ativo'
                  const isChecked =
                    (workedInDb && !drawerSettings.ignored_readers.includes(reader)) ||
                    drawerSettings.added_readers.includes(reader)
                  const isDesligado = status === 'desligado'

                  return (
                    <div
                      key={reader}
                      className={cn(
                        'flex flex-col gap-2 p-3 rounded-md border transition-colors',
                        isDesligado ? 'bg-slate-50 opacity-60 grayscale' : 'bg-white',
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Checkbox
                            id={`reader-${reader}`}
                            checked={isChecked}
                            disabled={status !== 'ativo'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (workedInDb)
                                  setDrawerSettings((prev) => ({
                                    ...prev,
                                    ignored_readers: prev.ignored_readers.filter(
                                      (id) => id !== reader,
                                    ),
                                  }))
                                else
                                  setDrawerSettings((prev) => ({
                                    ...prev,
                                    added_readers: [...prev.added_readers, reader],
                                  }))
                              } else {
                                if (workedInDb)
                                  setDrawerSettings((prev) => ({
                                    ...prev,
                                    ignored_readers: [...prev.ignored_readers, reader],
                                  }))
                                else
                                  setDrawerSettings((prev) => ({
                                    ...prev,
                                    added_readers: prev.added_readers.filter((id) => id !== reader),
                                  }))
                              }
                            }}
                          />
                          <Label
                            htmlFor={`reader-${reader}`}
                            className={cn(
                              'text-sm font-medium cursor-pointer truncate',
                              status !== 'ativo' && 'line-through text-slate-500',
                            )}
                            title={readerName}
                          >
                            {readerName}
                          </Label>
                        </div>

                        <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                          {workedInDb && status === 'ativo' && (
                            <span className="text-[10px] bg-emerald-100/80 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-medium mr-auto sm:mr-0">
                              constam leituras
                            </span>
                          )}
                          <Select
                            value={status}
                            onValueChange={(val) =>
                              setDrawerSettings((s) => ({
                                ...s,
                                reader_statuses: { ...s.reader_statuses, [reader]: val },
                              }))
                            }
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="licenca">Licença/Férias</SelectItem>
                              <SelectItem value="suspenso">Suspenso</SelectItem>
                              <SelectItem value="desligado">Desligado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(status === 'licenca' || status === 'suspenso') && (
                        <div className="flex items-center gap-2 pt-2 border-t mt-1">
                          <span className="text-xs text-slate-500">Repetir até:</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                                {rangeDates[reader]
                                  ? format(rangeDates[reader]!, 'dd/MM/yyyy')
                                  : 'Selecionar data'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={rangeDates[reader]}
                                onSelect={(d) =>
                                  setRangeDates((prev) => ({ ...prev, [reader]: d }))
                                }
                              />
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs shrink-0"
                            disabled={!rangeDates[reader]}
                            onClick={() => handleApplyRange(reader, status, rangeDates[reader]!)}
                          >
                            Aplicar
                          </Button>
                        </div>
                      )}

                      {status === 'desligado' && (
                        <div className="flex items-center gap-2 pt-2 border-t mt-1">
                          <span className="text-xs text-slate-500 flex-1">
                            Aplicar desligamento?
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleApplyRange(reader, status, addYears(selectedDate!, 5))
                            }
                          >
                            Daqui em diante
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {allReaders.length === 0 && (
                  <p className="text-sm text-slate-500 italic text-center py-4">
                    Nenhum leiturista encontrado na base.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
          <SheetFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDrawerSettings}>Salvar Configurações</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailsDrawerOpen} onOpenChange={setIsDetailsDrawerOpen}>
        <SheetContent className="w-[95vw] sm:w-[800px] md:w-[900px] lg:w-[1000px] sm:max-w-none flex flex-col gap-4 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Visão Analítica - Dia {detailsDate ? detailsDate.split('-').reverse().join('/') : ''}
            </SheetTitle>
            <p className="text-sm text-slate-500">
              Detalhamento das UCs lidas nesta data e suas respectivas comparações de dias úteis com
              meses anteriores.
            </p>
          </SheetHeader>

          <ScrollArea className="flex-1 border rounded-md relative bg-white">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-12 text-center">Status</TableHead>
                  <TableHead>UC</TableHead>
                  <TableHead>Data Leitura</TableHead>
                  <TableHead className="text-center">
                    Dia Útil
                    <br />
                    (Mês Atual)
                  </TableHead>
                  <TableHead className="text-center bg-slate-50/50">
                    Dia Útil
                    <br />
                    (Ref.)
                  </TableHead>
                  <TableHead className="text-center text-xs">
                    {format(subMonths(currentDate, 1), 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </TableHead>
                  <TableHead className="text-center text-xs">
                    {format(subMonths(currentDate, 2), 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </TableHead>
                  <TableHead className="text-center text-xs">
                    {format(subMonths(currentDate, 3), 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </TableHead>
                  <TableHead className="text-center text-xs">
                    {format(subMonths(currentDate, 4), 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </TableHead>
                  <TableHead className="text-center text-xs">
                    {format(subMonths(currentDate, 5), 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </TableHead>
                  <TableHead className="text-center text-xs">
                    {format(subMonths(currentDate, 6), 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDetails ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : detailsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-slate-500">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  detailsData.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            'w-3 h-3 rounded-full mx-auto shadow-sm',
                            row.status === 'gray' && 'bg-slate-400',
                            row.status === 'red' && 'bg-red-500',
                            row.status === 'yellow' && 'bg-amber-400',
                            row.status === 'green' && 'bg-emerald-500',
                          )}
                          title={
                            row.status === 'gray'
                              ? 'Não Localizado'
                              : row.status === 'red'
                                ? 'Piorou'
                                : row.status === 'yellow'
                                  ? 'Manteve'
                                  : 'Melhorou'
                          }
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{row.uc}</TableCell>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {row.data_leitura_real
                          ? row.data_leitura_real.split('-').reverse().join('/')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {row.working_day_index}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700 bg-slate-50/50">
                        {row.avg_ref_index ?? '-'}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {row.m1 ?? '-'}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {row.m2 ?? '-'}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {row.m3 ?? '-'}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {row.m4 ?? '-'}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {row.m5 ?? '-'}
                      </TableCell>
                      <TableCell className="text-center text-slate-500 text-sm">
                        {row.m6 ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
