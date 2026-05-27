import { useEffect, useState, useMemo, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { StrategicAnalysisModal } from '@/components/StrategicAnalysisModal'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Scale,
  Scissors,
  Split,
  Target,
  Wrench,
  UserMinus,
  FileSearch,
  ThumbsDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function DropZone({ queue, title, icon: Icon, onDropItems }: any) {
  const [isOver, setIsOver] = useState(false)

  const getZoneStyles = () => {
    switch (queue) {
      case 'strategic':
        return {
          wrapper: isOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-indigo-300',
          icon: 'bg-indigo-100 text-indigo-700',
        }
      case 'legal':
        return {
          wrapper: isOver
            ? 'border-orange-500 bg-orange-50'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-orange-300',
          icon: 'bg-orange-100 text-orange-700',
        }
      case 'cut':
        return {
          wrapper: isOver
            ? 'border-red-500 bg-red-50'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-red-300',
          icon: 'bg-red-100 text-red-700',
        }
      case 'recut':
        return {
          wrapper: isOver
            ? 'border-purple-500 bg-purple-50'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-purple-300',
          icon: 'bg-purple-100 text-purple-700',
        }
      case 'ferrule':
        return {
          wrapper: isOver
            ? 'border-stone-500 bg-stone-50'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-stone-300',
          icon: 'bg-stone-100 text-stone-700',
        }
      case 'non_effective_cut':
        return {
          wrapper: isOver
            ? 'border-pink-500 bg-pink-50'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-pink-300',
          icon: 'bg-pink-100 text-pink-700',
        }
      default:
        return { wrapper: '', icon: '' }
    }
  }

  const styles = getZoneStyles()

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const data = e.dataTransfer.getData('application/json')
        if (data) {
          try {
            const parsed = JSON.parse(data)
            onDropItems(parsed, queue)
          } catch {
            /* intentionally ignored */
          }
        }
      }}
      className={cn(
        'flex-1 min-w-[180px] flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 shadow-sm cursor-crosshair',
        styles.wrapper,
      )}
    >
      <div
        className={cn('p-2.5 rounded-lg shadow-sm bg-white border border-slate-100', styles.icon)}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm whitespace-nowrap">{title}</h4>
        <p className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
          Solte aqui para atribuir
        </p>
      </div>
    </div>
  )
}

export default function StrategicAssignmentII() {
  const { user, profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const [debts, setDebts] = useState<any[]>([])
  const [readingsMap, setReadingsMap] = useState<Record<string, string>>({})
  const [operators, setOperators] = useState<any[]>([])
  const [availableRefs, setAvailableRefs] = useState<string[]>([])

  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [periods, setPeriods] = useState<string[]>([])

  const [searchText, setSearchText] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [lotesFilter, setLotesFilter] = useState('com_ligacoes')
  const [retidasFilter, setRetidasFilter] = useState('sem_retidas')
  const [situacaoLigacaoFilter, setSituacaoLigacaoFilter] = useState('todos')
  const [comConsumoFilter, setComConsumoFilter] = useState('todos')
  const [quantConsumo, setQuantConsumo] = useState('')
  const [selectedDailyReadingRefs, setSelectedDailyReadingRefs] = useState<string[]>([])
  const [availableDailyReadingRefs, setAvailableDailyReadingRefs] = useState<string[]>([])

  const [selectedDebts, setSelectedDebts] = useState<Set<string>>(new Set())
  const [lastSelected, setLastSelected] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState('')
  const [loading, setLoading] = useState(false)

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [queueFilters, setQueueFilters] = useState<string[]>([])
  const isFirstMount = useRef(true)

  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 1000

  const [analysisAssignment, setAnalysisAssignment] = useState<any>(null)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const [analysisQueueType, setAnalysisQueueType] = useState('strategic')

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    handleSearch(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueFilters])

  useEffect(() => {
    fetchOperators()
    fetchRefs()
    fetchDailyReadingRefs()

    const saved = localStorage.getItem('strategicFiltersII')
    if (saved) {
      try {
        const { min, max, per } = JSON.parse(saved)
        if (min) setMinValue(min)
        if (max) setMaxValue(max)
        if (per) setPeriods(per)
      } catch (e) {
        // Ignore parse error
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'strategicFiltersII',
      JSON.stringify({ min: minValue, max: maxValue, per: periods }),
    )
  }, [minValue, maxValue, periods])

  const fetchOperators = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, first_name')
      .eq('is_active', true)
    setOperators(data || [])
  }

  const fetchRefs = async () => {
    const { data } = await supabase.rpc('get_distinct_refs')
    if (data) {
      setAvailableRefs(data.map((d: any) => d.ref))
    }
  }

  const fetchDailyReadingRefs = async () => {
    const { data } = await supabase.rpc('get_daily_readings_references')
    if (data) {
      setAvailableDailyReadingRefs(data.map((d: any) => d.referencia))
    }
  }

  const handleSearch = async (isLoadMore = false) => {
    setLoading(true)
    const currentOffset = isLoadMore ? offset + limit : 0

    let q = supabase
      .from('vw_queue_debts')
      .select('*')
      .limit(limit)
      .range(currentOffset, currentOffset + limit - 1)

    if (minValue) q = q.gte('valor_vencido', parseFloat(minValue))
    if (maxValue) q = q.lte('valor_vencido', parseFloat(maxValue))

    if (periods.length > 0) {
      const orConditions = periods.map((p) => `refs.ilike.%${p}%`).join(',')
      q = q.or(orConditions)
    }

    if (searchText) {
      q = q.or(
        `uc.ilike.%${searchText}%,pessoa_fatura_nome.ilike.%${searchText}%,cod_pess_fat.ilike.%${searchText}%`,
      )
    }

    if (searchAddress) {
      q = q.ilike('endereco', `%${searchAddress}%`)
    }

    if (lotesFilter === 'com_ligacoes') {
      q = q.or('setor.neq.4036,setor.is.null')
    } else if (lotesFilter === 'so_lotes') {
      q = q.eq('setor', '4036')
    }

    if (retidasFilter === 'com_retidas') {
      q = q.gt('valor_retidas_em_aberto', 0)
    } else if (retidasFilter === 'sem_retidas') {
      q = q.or('valor_retidas_em_aberto.lte.0,valor_retidas_em_aberto.is.null')
    }

    if (situacaoLigacaoFilter === 'susp_deb') {
      q = q.eq('situacao_ligacao' as any, 'SUSP_DEB')
    } else if (situacaoLigacaoFilter === 'ativo') {
      q = q.eq('situacao_ligacao' as any, 'ATIVO')
    }

    if (queueFilters.length > 0) {
      const orConditions: string[] = []

      const hasStrategic = queueFilters.includes('strategic')
      const hasLegal = queueFilters.includes('legal')
      const hasCut = queueFilters.includes('cut')
      const hasRecut = queueFilters.includes('recut')
      const hasFerrule = queueFilters.includes('ferrule')
      const hasUnassigned = queueFilters.includes('unassigned')

      if (hasStrategic) orConditions.push('is_strategic.eq.true')
      if (hasLegal) orConditions.push('is_legal.eq.true')
      if (hasCut) orConditions.push('is_cut.eq.true')
      if (hasRecut) orConditions.push('is_recut.eq.true')
      if (hasFerrule) orConditions.push('is_ferrule.eq.true')

      if (hasUnassigned) {
        orConditions.push(
          'and(is_strategic.is.null,is_legal.is.null,is_cut.is.null,is_recut.is.null,is_ferrule.is.null)',
        )
        orConditions.push(
          'and(is_strategic.eq.false,is_legal.eq.false,is_cut.eq.false,is_recut.eq.false,is_ferrule.eq.false)',
        )
      }

      if (orConditions.length > 0) {
        q = q.or(orConditions.join(','))
      }
    }

    q = q.order('valor_vencido', { ascending: false, nullsFirst: false })

    const { data, error } = await q

    if (error) {
      toast.error('Erro ao buscar dívidas')
    } else {
      let newDebts = data || []

      if (comConsumoFilter === 'so_com_consumo') {
        const ucs = Array.from(new Set(newDebts.map((d) => d.uc)))
        if (ucs.length > 0) {
          let rQ = supabase
            .from('daily_readings')
            .select('uc, data_referencia, consumo_real')
            .in('uc', ucs)
          if (quantConsumo) {
            rQ = rQ.gte('consumo_real', parseFloat(quantConsumo))
          } else {
            rQ = rQ.not('consumo_real', 'is', null)
          }

          const { data: rData } = await rQ
          const validUcs = new Set<string>()

          if (rData) {
            rData.forEach((r: any) => {
              if (selectedDailyReadingRefs.length > 0) {
                if (r.data_referencia) {
                  const d = new Date(r.data_referencia)
                  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
                  const yyyy = String(d.getUTCFullYear())
                  if (selectedDailyReadingRefs.includes(`${mm}/${yyyy}`)) {
                    validUcs.add(r.uc)
                  }
                }
              } else {
                validUcs.add(r.uc)
              }
            })
          }

          newDebts = newDebts.filter((d) => validUcs.has(d.uc))
        }
      }

      const ucsToFetch = Array.from(new Set(newDebts.map((d) => d.uc)))
      const newReadings: Record<string, string[]> = {}

      if (ucsToFetch.length > 0) {
        const { data: readingsData } = await supabase
          .from('daily_readings')
          .select('uc, data_referencia, consumo_real')
          .in('uc', ucsToFetch)
          .not('consumo_real', 'is', null)
          .order('data_referencia', { ascending: false })

        if (readingsData) {
          readingsData.forEach((r: any) => {
            if (r.data_referencia && r.consumo_real !== null) {
              const date = new Date(r.data_referencia)
              if (!isNaN(date.getTime())) {
                const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
                const yy = String(date.getUTCFullYear()).slice(-2)
                const str = `${yy}/${mm}-${r.consumo_real}`

                if (!newReadings[r.uc]) newReadings[r.uc] = []
                if (
                  !newReadings[r.uc].some((existing: string) => existing.startsWith(`${yy}/${mm}`))
                ) {
                  newReadings[r.uc].push(str)
                }
              }
            }
          })
        }
      }

      const formattedReadings: Record<string, string> = {}
      for (const uc in newReadings) {
        formattedReadings[uc] = newReadings[uc].slice(0, 6).reverse().join('  ')
      }

      const { data: nonEffCut } = await supabase
        .from('strategic_assignments')
        .select('uc')
        .eq('queue_type', 'non_effective_cut')
        .in('status', ['s1_telefones', 's2_pesquisa', 's3_sem_dados', 's4_manual'])

      const activeNonEffUcs = new Set(nonEffCut?.map((a) => a.uc) || [])

      newDebts = newDebts.map((d: any) => ({
        ...d,
        is_non_effective_cut: activeNonEffUcs.has(d.uc),
      }))

      if (queueFilters.includes('unassigned')) {
        newDebts = newDebts.filter((d: any) => !d.is_non_effective_cut)
      }

      if (isLoadMore) {
        setDebts((prev) => [...prev, ...newDebts])
        setReadingsMap((prev) => ({ ...prev, ...formattedReadings }))
      } else {
        setDebts(newDebts)
        setSelectedDebts(new Set())
        setLastSelected(null)
        setReadingsMap(formattedReadings)
      }
      setOffset(currentOffset)
      setHasMore(newDebts.length === limit)
    }
    setLoading(false)
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedDebts = useMemo(() => {
    if (!sortConfig) return debts
    return [...debts].sort((a, b) => {
      let aVal = a[sortConfig.key] || 0
      let bVal = b[sortConfig.key] || 0

      if (sortConfig.key === 'uc') {
        aVal = Number(String(aVal).replace(/\D/g, '')) || 0
        bVal = Number(String(bVal).replace(/\D/g, '')) || 0
      } else if (sortConfig.key === 'ultima_data_criacao_os') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [debts, sortConfig])

  const toggleSelection = (key: string, event?: any) => {
    const newSet = new Set(selectedDebts)
    if (event?.shiftKey && lastSelected) {
      const currentIndex = sortedDebts.findIndex((d) => `${d.uc}-${d.cod_pess_fat}` === key)
      const lastIndex = sortedDebts.findIndex((d) => `${d.uc}-${d.cod_pess_fat}` === lastSelected)
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)
        for (let i = start; i <= end; i++) {
          newSet.add(`${sortedDebts[i].uc}-${sortedDebts[i].cod_pess_fat}`)
        }
      }
    } else {
      if (newSet.has(key)) newSet.delete(key)
      else newSet.add(key)
    }
    setSelectedDebts(newSet)
    setLastSelected(key)
  }

  const selectAll = () => {
    if (selectedDebts.size === debts.length) setSelectedDebts(new Set())
    else setSelectedDebts(new Set(debts.map((d) => `${d.uc}-${d.cod_pess_fat}`)))
  }

  const getTransferItems = () =>
    sortedDebts.filter((d) => selectedDebts.has(`${d.uc}-${d.cod_pess_fat}`))

  const getNonEffectiveCutStatus = (debt: any, rPhones: any[]) => {
    if (!debt) return 's3_sem_dados'
    const hasResearched = Array.isArray(rPhones) && rPhones.length > 0

    const hasPhone =
      debt.pessoa_fatura_celular ||
      debt.proprietario_celular ||
      debt.responsavel_celular ||
      hasResearched

    if (hasPhone) return 's1_telefones'

    const cleanDoc = (doc?: string) => doc?.replace(/\D/g, '') || ''
    const validDoc = (doc?: string) => {
      const clean = cleanDoc(doc)
      return clean.length === 11 || clean.length === 14
    }

    const hasValidDoc =
      validDoc(debt.pessoa_fatura_cpf_cnpj) ||
      validDoc(debt.proprietario_cpf_cnpj) ||
      validDoc(debt.responsavel_cpf_cnpj)

    if (hasValidDoc) return 's2_pesquisa'

    return 's3_sem_dados'
  }

  const handleDropToQueue = async (
    dataArray: any[],
    targetQueue: 'strategic' | 'legal' | 'cut' | 'recut' | 'ferrule' | 'non_effective_cut',
  ) => {
    if (isConsultas) {
      toast.error('Seu perfil não tem permissão para realizar esta ação.')
      return
    }
    const queueName =
      targetQueue === 'strategic'
        ? 'Estratégias'
        : targetQueue === 'legal'
          ? 'Jurídico'
          : targetQueue === 'cut'
            ? 'Corte'
            : targetQueue === 'ferrule'
              ? 'Ferrule'
              : targetQueue === 'non_effective_cut'
                ? 'Corte ñ Efetivo'
                : 'Re-Corte'

    const validItems = dataArray.filter((d) => {
      if (
        (targetQueue === 'strategic' && d.is_strategic) ||
        (targetQueue === 'legal' && d.is_legal) ||
        (targetQueue === 'cut' && d.is_cut) ||
        (targetQueue === 'recut' && d.is_recut) ||
        (targetQueue === 'ferrule' && d.is_ferrule) ||
        (targetQueue === 'non_effective_cut' && d.is_non_effective_cut)
      ) {
        toast.error(`A UC ${d.uc} Pessoa ${d.cod_pess_fat} já está atribuída à Fila ${queueName}`)
        return false
      }
      return true
    })

    if (validItems.length === 0) return

    const ucs = validItems.map((d) => d.uc)

    let rPhonesMap = new Map()
    if (targetQueue === 'non_effective_cut') {
      const { data: rPhones } = await supabase
        .from('researched_phones')
        .select('uc, cod_pess_fat, phones')
        .in('uc', ucs)
      rPhones?.forEach((r) => rPhonesMap.set(`${r.uc}-${r.cod_pess_fat}`, r.phones))
    }

    const { data: existing } = await supabase
      .from('strategic_assignments')
      .select('id, uc, cod_pess_fat, queue_type, status')
      .in('uc', ucs)
      .order('created_at', { ascending: false })

    const existingMap = new Map()
    if (existing) {
      existing.forEach((e) => {
        const key = `${e.uc}-${e.cod_pess_fat}`
        if (!existingMap.has(key)) existingMap.set(key, e)
      })
    }

    const inserts: any[] = []
    const updates: any[] = []

    validItems.forEach((d) => {
      const key = `${d.uc}-${d.cod_pess_fat}`
      const initialStatus =
        targetQueue === 'strategic'
          ? 'unassigned'
          : targetQueue === 'legal'
            ? 'a_encaminhar'
            : targetQueue === 'non_effective_cut'
              ? getNonEffectiveCutStatus(d, rPhonesMap.get(key))
              : 'para_abrir_os'

      const baseData = {
        queue_type: targetQueue,
        status: initialStatus,
        snapshot_valor_vencido: d.valor_vencido,
        snapshot_qt_fats: d.qt_fats,
        snapshot_refs: d.refs,
        snapshot_valor_total: d.valor_total,
        snapshot_nome_cliente: d.pessoa_fatura_nome,
        assigned_by: user?.id,
      }

      if (existingMap.has(key)) {
        const ext = existingMap.get(key)
        updates.push({
          id: ext.id,
          ...baseData,
          previous_queue: ext.queue_type,
          previous_status: ext.status,
          operator_id: null,
          uc: d.uc,
          cod_pess_fat: d.cod_pess_fat,
        })
      } else {
        inserts.push({
          uc: d.uc,
          cod_pess_fat: d.cod_pess_fat,
          ...baseData,
        })
      }
    })

    let hasError = false
    if (inserts.length > 0) {
      const { error } = await supabase.from('strategic_assignments').insert(inserts)
      if (error) hasError = true
    }
    if (updates.length > 0) {
      const { error } = await supabase.from('strategic_assignments').upsert(updates)
      if (error) hasError = true
    }

    if (hasError) {
      toast.error('Erro ao transferir alguns registros')
    } else {
      toast.success(`${validItems.length} registro(s) transferido(s) para a Fila ${queueName}!`)
      setSelectedDebts(new Set())
      setLastSelected(null)
      setTimeout(() => handleSearch(false), 500)
    }
  }

  const handleAssign = async () => {
    if (isConsultas) return toast.error('Seu perfil não tem permissão para realizar esta ação.')
    if (!selectedOperator) return toast.error('Selecione um operador')
    if (selectedDebts.size === 0) return toast.error('Selecione dívidas')

    const items = getTransferItems()
    const ucs = items.map((d) => d.uc)

    const { data: existing } = await supabase
      .from('strategic_assignments')
      .select('id, uc, cod_pess_fat, queue_type, status')
      .in('uc', ucs)
      .order('created_at', { ascending: false })

    const existingMap = new Map()
    if (existing) {
      existing.forEach((e) => {
        const key = `${e.uc}-${e.cod_pess_fat}`
        if (!existingMap.has(key)) existingMap.set(key, e)
      })
    }

    const inserts: any[] = []
    const updates: any[] = []

    items.forEach((d) => {
      const key = `${d.uc}-${d.cod_pess_fat}`
      const baseData = {
        operator_id: selectedOperator,
        assigned_by: user?.id,
        status: 'pending',
        snapshot_valor_vencido: d.valor_vencido,
        snapshot_qt_fats: d.qt_fats,
        snapshot_refs: d.refs,
        snapshot_valor_total: d.valor_total,
        snapshot_nome_cliente: d.pessoa_fatura_nome,
        queue_type: 'strategic',
      }

      if (existingMap.has(key)) {
        const ext = existingMap.get(key)
        updates.push({
          id: ext.id,
          ...baseData,
          previous_queue: ext.queue_type,
          previous_status: ext.status,
          uc: d.uc,
          cod_pess_fat: d.cod_pess_fat,
        })
      } else {
        inserts.push({
          uc: d.uc,
          cod_pess_fat: d.cod_pess_fat,
          ...baseData,
        })
      }
    })

    let hasError = false
    if (inserts.length > 0) {
      const { error } = await supabase.from('strategic_assignments').insert(inserts)
      if (error) hasError = true
    }
    if (updates.length > 0) {
      const { error } = await supabase.from('strategic_assignments').upsert(updates)
      if (error) hasError = true
    }

    if (hasError) {
      toast.error('Erro ao atribuir registros')
    } else {
      toast.success('Dívidas atribuídas ao operador com sucesso!')
      setSelectedDebts(new Set())
      setLastSelected(null)
      setTimeout(() => handleSearch(false), 500)
    }
  }

  const handleOpenAnalysis = async (debt: any) => {
    setLoading(true)
    const { data: existing } = await supabase
      .from('strategic_assignments')
      .select('*, operator:profiles!strategic_assignments_operator_id_fkey(*)')
      .eq('uc', debt.uc)
      .eq('cod_pess_fat', debt.cod_pess_fat)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      setAnalysisQueueType(existing.queue_type)
      setAnalysisAssignment(existing)
      setIsAnalysisModalOpen(true)
      setLoading(false)
    } else {
      if (isConsultas) {
        toast.error('Seu perfil não permite iniciar análises.')
        setLoading(false)
        return
      }
      const newAssignment = {
        uc: debt.uc,
        cod_pess_fat: debt.cod_pess_fat,
        queue_type: 'strategic',
        status: 'started',
        snapshot_valor_vencido: debt.valor_vencido,
        snapshot_qt_fats: debt.qt_fats,
        snapshot_refs: debt.refs,
        snapshot_valor_total: debt.valor_total,
        snapshot_nome_cliente: debt.pessoa_fatura_nome,
        assigned_by: user?.id,
        operator_id: user?.id,
      }

      const { data: inserted, error } = await supabase
        .from('strategic_assignments')
        .insert([newAssignment])
        .select('*, operator:profiles!strategic_assignments_operator_id_fkey(*)')
        .single()

      if (error) {
        toast.error('Erro ao iniciar análise')
        setLoading(false)
      } else {
        setAnalysisQueueType(inserted.queue_type)
        setAnalysisAssignment(inserted)
        setIsAnalysisModalOpen(true)
        setLoading(false)
        handleSearch(false)
      }
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const exportToCSV = () => {
    if (sortedDebts.length === 0) return

    const headers = [
      'UC',
      'Código Pessoa',
      'Nome Cliente',
      'Valor Total',
      'Valor Vencido',
      'Qtde Faturas',
      'Referências',
      'Último Contato',
    ]

    const rows = sortedDebts.map((d) => {
      const ultimoContato = d.latest_contact_date
        ? new Date(d.latest_contact_date).toLocaleString('pt-BR')
        : ''
      return [
        d.uc,
        d.cod_pess_fat,
        `"${(d.pessoa_fatura_nome || '').replace(/"/g, '""')}"`,
        d.valor_total || 0,
        d.valor_vencido || 0,
        d.qt_fats || 0,
        `"${(d.refs || '').replace(/\b(\d{2})\/(\d{2})\b/g, '$2/$1')}"`,
        `"${ultimoContato}"`,
      ]
    })

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `exportacao_estrategia_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
      <div>
        <h2 className="font-bold tracking-tight text-slate-800 text-[1.84rem]">
          Gestão Dinâmica entre Filas
        </h2>
        <p className="text-muted-foreground">
          Arraste e solte registros para atribuí-los rapidamente a diferentes filas de atuação.
        </p>
      </div>

      <div className="flex flex-col space-y-6">
        <div className="w-full">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Filtros de Busca - salvos conforme o uso</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 items-start">
              <div className="space-y-2">
                <Label>Valor Vencido Mínimo</Label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Vencido Máximo</Label>
                <Input
                  type="number"
                  placeholder="Ex: 5000"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2 flex-1 min-w-[250px]">
                <Label>Períodos (REFS)</Label>
                <div className="bg-slate-100 p-1.5 rounded-md max-h-24 overflow-y-auto border border-slate-200">
                  <ToggleGroup
                    type="multiple"
                    value={periods}
                    onValueChange={setPeriods}
                    className="justify-start flex-wrap gap-1"
                  >
                    {availableRefs.map((ref) => (
                      <ToggleGroupItem
                        key={ref}
                        value={ref}
                        className="text-[10px] px-2 py-1 h-6 font-medium shadow-sm bg-white data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {ref.replace(/\b(\d{2})\/(\d{2})\b/g, '$2/$1')}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 border-orange-200 shadow-sm bg-white">
            <CardHeader className="pb-4 bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-sm font-semibold text-orange-800">
                Outros Filtros - preencher a cada pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Filtros Padrão
                </span>
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs">Ligações/Lotes</Label>
                    <Select value={lotesFilter} onValueChange={setLotesFilter}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="com_ligacoes">Só com Ligações</SelectItem>
                        <SelectItem value="so_lotes">Só lotes vagos</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Retidas</Label>
                    <Select value={retidasFilter} onValueChange={setRetidasFilter}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="com_retidas">Contém Retidas</SelectItem>
                        <SelectItem value="sem_retidas">Não contém Retidas</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label className="text-xs">
                      Filtre UC / qualquer parte do nome ou cpf/cnpj
                    </Label>
                    <Input
                      className="h-9"
                      placeholder="UC, Nome, CPF ou CNPJ"
                      value={searchText}
                      onChange={(e) => {
                        const val = e.target.value
                        setSearchText(val)
                        if (val && /^\d+$/.test(val)) {
                          setSortConfig({ key: 'uc', direction: 'asc' })
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label className="text-xs">digite qualquer parte do Endereço</Label>
                    <Input
                      className="h-9"
                      placeholder="Ex: Rua das Flores"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full mt-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Filtros para Ação Re-Corte
                </span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="space-y-2">
                    <Label className="text-xs">Situação Ligação</Label>
                    <Select value={situacaoLigacaoFilter} onValueChange={setSituacaoLigacaoFilter}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        <SelectItem value="susp_deb">Suspensas (SUSP_DEB)</SelectItem>
                        <SelectItem value="ativo">Ativos (ATIVO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Com Consumo</Label>
                    <Select value={comConsumoFilter} onValueChange={setComConsumoFilter}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="so_com_consumo">Só com consumo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {comConsumoFilter === 'so_com_consumo' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Quant. Consumo</Label>
                        <Input
                          type="number"
                          className="h-9 w-[140px]"
                          placeholder="Ex: 50"
                          value={quantConsumo}
                          onChange={(e) => setQuantConsumo(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 flex-1 min-w-[250px]">
                        <Label className="text-xs">Ref. Leitura (Opcional)</Label>
                        <div className="bg-slate-100 p-1 rounded-md max-h-24 overflow-y-auto border border-slate-200">
                          <ToggleGroup
                            type="multiple"
                            value={selectedDailyReadingRefs}
                            onValueChange={setSelectedDailyReadingRefs}
                            className="justify-start flex-wrap gap-1"
                          >
                            {availableDailyReadingRefs.map((ref) => (
                              <ToggleGroupItem
                                key={ref}
                                value={ref}
                                className="text-[10px] px-2 py-1 h-6 font-medium shadow-sm bg-white data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                              >
                                {ref}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => handleSearch(false)}
              disabled={loading}
              size="lg"
              className="w-full md:w-auto"
            >
              {loading ? 'Buscando...' : 'Buscar Dívidas'}
            </Button>
          </div>
        </div>

        <Card className="w-full bg-slate-100/50 border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-200/50 bg-white/50">
            <CardTitle className="text-lg">Zonas de Atribuição</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Arraste os registros da tabela abaixo e solte-os nas filas para transferir.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center p-4">
            <DropZone
              queue="strategic"
              title="Fila Estratégias"
              icon={Target}
              onDropItems={handleDropToQueue}
            />
            <DropZone
              queue="legal"
              title="Fila Jurídico"
              icon={Scale}
              onDropItems={handleDropToQueue}
            />
            <DropZone
              queue="cut"
              title="Fila Corte"
              icon={Scissors}
              onDropItems={handleDropToQueue}
            />
            <DropZone
              queue="recut"
              title="Fila Re-Corte"
              icon={Split}
              onDropItems={handleDropToQueue}
            />
            <DropZone
              queue="ferrule"
              title="Fila Ferrule"
              icon={Wrench}
              onDropItems={handleDropToQueue}
            />
            <DropZone
              queue="non_effective_cut"
              title="Fila Corte ñ Ef."
              icon={ThumbsDown}
              onDropItems={handleDropToQueue}
            />
          </CardContent>
        </Card>

        <div className="w-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4 flex flex-col space-y-4">
              <div className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Resultados</CardTitle>
                  <CardDescription>
                    {debts.length} encontradas, {selectedDebts.size} selecionadas.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue placeholder="Atribuir Operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.id} value={op.id} className="text-xs">
                          {op.first_name || op.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-9" onClick={handleAssign} disabled={isConsultas}>
                    Confirmar
                  </Button>
                  <div className="flex gap-1 ml-2 border-l border-slate-200 pl-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => handleDropToQueue(getTransferItems(), 'strategic')}
                      disabled={selectedDebts.size === 0 || isConsultas}
                      title="Transferir para Estratégias"
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-orange-600 border-orange-200 hover:bg-orange-50"
                      onClick={() => handleDropToQueue(getTransferItems(), 'legal')}
                      disabled={selectedDebts.size === 0 || isConsultas}
                      title="Transferir para Jurídico"
                    >
                      <Scale className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDropToQueue(getTransferItems(), 'cut')}
                      disabled={selectedDebts.size === 0 || isConsultas}
                      title="Transferir para Corte"
                    >
                      <Scissors className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => handleDropToQueue(getTransferItems(), 'recut')}
                      disabled={selectedDebts.size === 0 || isConsultas}
                      title="Transferir para Re-Corte"
                    >
                      <Split className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-stone-600 border-stone-200 hover:bg-stone-50"
                      onClick={() => handleDropToQueue(getTransferItems(), 'ferrule')}
                      disabled={selectedDebts.size === 0 || isConsultas}
                      title="Transferir para Ferrule"
                    >
                      <Wrench className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-pink-600 border-pink-200 hover:bg-pink-50"
                      onClick={() => handleDropToQueue(getTransferItems(), 'non_effective_cut')}
                      disabled={selectedDebts.size === 0 || isConsultas}
                      title="Transferir para Corte ñ Ef."
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">Filtrar por Fila:</span>
                <ToggleGroup
                  type="multiple"
                  value={queueFilters}
                  onValueChange={setQueueFilters}
                  className="justify-start gap-1"
                >
                  <ToggleGroupItem
                    value="strategic"
                    aria-label="Estratégias"
                    className="h-7 px-2 data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700 border border-transparent data-[state=on]:border-indigo-200"
                    title="Mostrar apenas Fila Estratégias"
                  >
                    <Target className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="legal"
                    aria-label="Jurídico"
                    className="h-7 px-2 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 border border-transparent data-[state=on]:border-orange-200"
                    title="Mostrar apenas Fila Jurídico"
                  >
                    <Scale className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="cut"
                    aria-label="Corte"
                    className="h-7 px-2 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 border border-transparent data-[state=on]:border-red-200"
                    title="Mostrar apenas Fila Corte"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="recut"
                    aria-label="Re-Corte"
                    className="h-7 px-2 data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 border border-transparent data-[state=on]:border-purple-200"
                    title="Mostrar apenas Fila Re-Corte"
                  >
                    <Split className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="ferrule"
                    aria-label="Ferrule"
                    className="h-7 px-2 data-[state=on]:bg-stone-100 data-[state=on]:text-stone-700 border border-transparent data-[state=on]:border-stone-200"
                    title="Mostrar apenas Fila Ferrule"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="unassigned"
                    aria-label="Sem fila"
                    className="h-7 px-2 data-[state=on]:bg-slate-200 data-[state=on]:text-slate-800 border border-transparent data-[state=on]:border-slate-300"
                    title="Mostrar apenas Sem fila"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </ToggleGroupItem>
                </ToggleGroup>
                {queueFilters.length === 0 && (
                  <span className="text-[10px] text-slate-400 ml-2 italic">
                    Exibindo todos os registros.
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="border-t [&>div]:max-h-[600px] [&>div]:overflow-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-20 shadow-sm [&_th]:bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        <Checkbox
                          checked={debts.length > 0 && selectedDebts.size === debts.length}
                          onCheckedChange={selectAll}
                        />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                        onClick={() => handleSort('uc')}
                      >
                        <div className="flex items-center gap-1">
                          UC
                          {sortConfig?.key === 'uc' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead
                        className="text-right cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                        onClick={() => handleSort('valor_vencido')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Valor Vencido
                          {sortConfig?.key === 'valor_vencido' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                        onClick={() => handleSort('qt_fats')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Faturas
                          {sortConfig?.key === 'qt_fats' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Referências</TableHead>
                      <TableHead className="w-[160px]">Consumos</TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                        onClick={() => handleSort('qtd_os_total_cancel_devolv')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          OS Canc.
                          {sortConfig?.key === 'qtd_os_total_cancel_devolv' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none hover:bg-slate-100/80 transition-colors group"
                        onClick={() => handleSort('ultima_data_criacao_os')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Última OS
                          {sortConfig?.key === 'ultima_data_criacao_os' ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Negoc. Vencida</TableHead>
                      <TableHead className="w-[50px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDebts.map((d) => {
                      const key = `${d.uc}-${d.cod_pess_fat}`
                      return (
                        <TableRow
                          key={key}
                          draggable={!isConsultas}
                          onDragStart={(e) => {
                            if (isConsultas) {
                              e.preventDefault()
                              return
                            }
                            let toDrag = []
                            if (selectedDebts.has(key)) {
                              toDrag = sortedDebts.filter((item) =>
                                selectedDebts.has(`${item.uc}-${item.cod_pess_fat}`),
                              )
                            } else {
                              toDrag = [d]
                            }
                            e.dataTransfer.setData('application/json', JSON.stringify(toDrag))
                          }}
                          className={cn(
                            'cursor-grab active:cursor-grabbing hover:bg-slate-50/80',
                            selectedDebts.has(key) ? 'bg-primary/5' : '',
                          )}
                          onClick={(e) => toggleSelection(key, e)}
                        >
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedDebts.has(key)}
                              onCheckedChange={() => toggleSelection(key)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                              <span>{d.uc}</span>
                              <div className="flex gap-1 flex-wrap">
                                {d.is_strategic && (
                                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                    [Estratégica]
                                  </span>
                                )}
                                {d.is_legal && (
                                  <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-0.5">
                                    <Scale className="w-2.5 h-2.5" /> [Jurídico]
                                  </span>
                                )}
                                {d.is_cut && (
                                  <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-0.5">
                                    <Scissors className="w-2.5 h-2.5" /> [Corte]
                                  </span>
                                )}
                                {d.is_recut && (
                                  <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-0.5">
                                    <Split className="w-2.5 h-2.5" /> [Re-Corte]
                                  </span>
                                )}
                                {d.is_ferrule && (
                                  <span className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-0.5">
                                    <Wrench className="w-2.5 h-2.5" /> [Ferrule]
                                  </span>
                                )}
                                {d.is_non_effective_cut && (
                                  <span className="bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap flex items-center gap-0.5">
                                    <ThumbsDown className="w-2.5 h-2.5" /> [Corte ñ Ef.]
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate"
                            title={d.pessoa_fatura_nome}
                          >
                            {d.pessoa_fatura_nome}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(d.valor_vencido)}
                          </TableCell>
                          <TableCell className="text-center">{d.qt_fats}</TableCell>
                          <TableCell className="text-xs">
                            {d.refs ? d.refs.replace(/\b(\d{2})\/(\d{2})\b/g, '$2/$1') : ''}
                          </TableCell>
                          <TableCell className="text-[10px] whitespace-normal leading-tight font-medium text-slate-600">
                            {readingsMap[d.uc] || '-'}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {d.qtd_os_total_cancel_devolv || 0}
                          </TableCell>
                          <TableCell className="text-center text-xs text-slate-600">
                            {d.ultima_data_criacao_os
                              ? (() => {
                                  const [yyyy, mm, dd] = d.ultima_data_criacao_os
                                    .split('T')[0]
                                    .split('-')
                                  return `${dd}/${mm}/${yyyy.slice(-2)}`
                                })()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {d.tem_negociacao_vencida ? (
                              <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                SIM
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">NÃO</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenAnalysis(d)
                              }}
                              title="Analisar"
                            >
                              <FileSearch className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {debts.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-12">
                          Nenhuma dívida encontrada. Ajuste os filtros e clique em Buscar.
                        </TableCell>
                      </TableRow>
                    )}
                    {(hasMore || debts.length > 0) && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-4 bg-slate-50/50">
                          <div className="flex justify-center gap-4 flex-col sm:flex-row max-w-2xl mx-auto">
                            <Button
                              variant="secondary"
                              onClick={exportToCSV}
                              disabled={loading || sortedDebts.length === 0}
                              className="w-full sm:w-1/2"
                            >
                              Exportar registros visíveis
                            </Button>
                            {hasMore && (
                              <Button
                                variant="outline"
                                onClick={() => handleSearch(true)}
                                disabled={loading}
                                className="w-full sm:w-1/2"
                              >
                                {loading ? 'Carregando...' : 'Carregar Mais Resultados'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StrategicAnalysisModal
        open={isAnalysisModalOpen}
        onOpenChange={setIsAnalysisModalOpen}
        assignment={analysisAssignment}
        onSaved={() => handleSearch(false)}
        queueType={analysisQueueType}
      />
    </div>
  )
}
