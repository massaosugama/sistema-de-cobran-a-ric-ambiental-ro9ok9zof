import { useEffect, useState, useMemo } from 'react'
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
import { ArrowDown, ArrowUp, ArrowUpDown, Scale, Scissors, Split, ThumbsDown } from 'lucide-react'

export default function StrategicAssignment() {
  const { user, profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const [debts, setDebts] = useState<any[]>([])
  const [assigned, setAssigned] = useState<any[]>([])
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

  const [selectedDebts, setSelectedDebts] = useState<Set<string>>(new Set())
  const [lastSelected, setLastSelected] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState('')
  const [loading, setLoading] = useState(false)

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set())
  const [assignedOperator, setAssignedOperator] = useState('')

  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 1000

  useEffect(() => {
    fetchOperators()
    fetchAssigned()
    fetchRefs()

    const saved = localStorage.getItem('strategicFilters')
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
      'strategicFilters',
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

  const fetchAssigned = async () => {
    const { data } = await supabase
      .from('strategic_assignments')
      .select(`
        id, uc, cod_pess_fat, status, operator_id, queue_type,
        profiles!strategic_assignments_operator_id_fkey(name, first_name)
      `)
      .eq('queue_type', 'strategic')
      .order('created_at', { ascending: false })
      .limit(50)
    setAssigned(data || [])
  }

  const handleSearch = async (isLoadMore = false) => {
    setLoading(true)
    const currentOffset = isLoadMore ? offset + limit : 0

    const { data, error } = await supabase.rpc('get_assignable_debts', {
      p_min_value: minValue ? parseFloat(minValue) : null,
      p_max_value: maxValue ? parseFloat(maxValue) : null,
      p_periods: periods.length > 0 ? periods : null,
      p_search_text: searchText || null,
      p_search_address: searchAddress || null,
      p_lotes: lotesFilter,
      p_retidas: retidasFilter,
      p_situacao_ligacao: situacaoLigacaoFilter,
      p_limit: limit,
      p_offset: currentOffset,
    } as any)

    if (error) {
      toast.error('Erro ao buscar dívidas')
    } else {
      const newDebts = data || []
      if (isLoadMore) {
        setDebts((prev) => [...prev, ...newDebts])
      } else {
        setDebts(newDebts)
        setSelectedDebts(new Set())
        setLastSelected(null)
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

  const toggleAssignedSelection = (id: string) => {
    const newSet = new Set(selectedAssigned)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedAssigned(newSet)
  }

  const selectAllAssigned = () => {
    if (selectedAssigned.size === assigned.length) setSelectedAssigned(new Set())
    else setSelectedAssigned(new Set(assigned.map((a) => a.id)))
  }

  const handleAssign = async () => {
    if (isConsultas) return toast.error('Acesso restrito.')
    if (!selectedOperator) return toast.error('Selecione um operador')
    if (selectedDebts.size === 0) return toast.error('Selecione dívidas')

    const { data: existing } = await supabase
      .from('strategic_assignments')
      .select('id, uc, cod_pess_fat')
      .in(
        'uc',
        Array.from(selectedDebts).map((key) => key.split('-')[0]),
      )
      .eq('queue_type', 'strategic')
      .eq('status', 'unassigned')

    const existingMap = new Map(existing?.map((e) => [`${e.uc}-${e.cod_pess_fat}`, e.id]) || [])

    const inserts: any[] = []
    const updates: any[] = []

    Array.from(selectedDebts).forEach((key) => {
      const [uc, cod_pess_fat] = key.split('-')
      const debt = debts.find((d) => d.uc === uc && d.cod_pess_fat === cod_pess_fat)

      const baseData = {
        operator_id: selectedOperator,
        assigned_by: user?.id,
        status: 'pending',
        snapshot_valor_vencido: debt?.valor_vencido,
        snapshot_qt_fats: debt?.qt_fats,
        snapshot_refs: debt?.refs,
        snapshot_valor_total: debt?.valor_total,
        snapshot_nome_cliente: debt?.pessoa_fatura_nome,
      }

      if (existingMap.has(key)) {
        updates.push({
          id: existingMap.get(key),
          ...baseData,
          queue_type: 'strategic',
          uc,
          cod_pess_fat,
        })
      } else {
        inserts.push({
          uc,
          cod_pess_fat,
          queue_type: 'strategic',
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
      toast.success('Dívidas atribuídas com sucesso!')
      setSelectedDebts(new Set())
      setLastSelected(null)
      handleSearch()
      fetchAssigned()
    }
  }

  const handleUndoAssignment = async () => {
    if (isConsultas) return toast.error('Acesso restrito.')
    if (selectedAssigned.size === 0) return toast.error('Selecione atribuições')
    const { error } = await supabase
      .from('strategic_assignments')
      .update({ operator_id: null, status: 'unassigned' })
      .in('id', Array.from(selectedAssigned))
    if (error) {
      toast.error('Erro ao desfazer atribuições')
    } else {
      toast.success('Atribuições desfeitas!')
      setSelectedAssigned(new Set())
      fetchAssigned()
      handleSearch()
    }
  }

  const handleReassign = async () => {
    if (isConsultas) return toast.error('Acesso restrito.')
    if (!assignedOperator) return toast.error('Selecione o novo operador')
    if (selectedAssigned.size === 0) return toast.error('Selecione atribuições')
    const { error } = await supabase
      .from('strategic_assignments')
      .update({ operator_id: assignedOperator, status: 'pending' })
      .in('id', Array.from(selectedAssigned))
    if (error) {
      toast.error('Erro ao re-atribuir')
    } else {
      toast.success('Atribuições transferidas!')
      setSelectedAssigned(new Set())
      setAssignedOperator('')
      fetchAssigned()
    }
  }

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

  const handleTransferToQueue = async (
    targetQueue: 'legal' | 'cut' | 'recut' | 'non_effective_cut',
  ) => {
    if (isConsultas) return toast.error('Acesso restrito.')
    if (selectedDebts.size === 0) return toast.error('Selecione dívidas')

    const ucs = Array.from(selectedDebts).map((key) => key.split('-')[0])

    let fullDebtsMap = new Map()
    let rPhonesMap = new Map()
    if (targetQueue === 'non_effective_cut') {
      const { data: full } = await supabase
        .from('pending_debts')
        .select(
          'uc, cod_pess_fat, pessoa_fatura_celular, proprietario_celular, responsavel_celular, pessoa_fatura_cpf_cnpj, proprietario_cpf_cnpj, responsavel_cpf_cnpj',
        )
        .in('uc', ucs)

      full?.forEach((f) => fullDebtsMap.set(`${f.uc}-${f.cod_pess_fat}`, f))

      const { data: rPhones } = await supabase
        .from('researched_phones')
        .select('uc, cod_pess_fat, phones')
        .in('uc', ucs)

      rPhones?.forEach((r) => rPhonesMap.set(`${r.uc}-${r.cod_pess_fat}`, r.phones))
    }

    const { data: existing } = await supabase
      .from('strategic_assignments')
      .select('id, uc, cod_pess_fat')
      .in('uc', ucs)
      .eq('queue_type', 'strategic')
      .eq('status', 'unassigned')

    const existingMap = new Map(existing?.map((e) => [`${e.uc}-${e.cod_pess_fat}`, e.id]) || [])

    const inserts: any[] = []
    const updates: any[] = []

    Array.from(selectedDebts).forEach((key) => {
      const [uc, cod_pess_fat] = key.split('-')
      const debt = debts.find((d) => d.uc === uc && d.cod_pess_fat === cod_pess_fat)

      const initialStatus =
        targetQueue === 'legal'
          ? 'a_encaminhar'
          : targetQueue === 'non_effective_cut'
            ? getNonEffectiveCutStatus(fullDebtsMap.get(key), rPhonesMap.get(key))
            : 'para_abrir_os'

      const baseData = {
        operator_id: user?.id,
        status: initialStatus,
        snapshot_valor_vencido: debt?.valor_vencido,
        snapshot_qt_fats: debt?.qt_fats,
        snapshot_refs: debt?.refs,
        snapshot_valor_total: debt?.valor_total,
        snapshot_nome_cliente: debt?.pessoa_fatura_nome,
      }

      if (existingMap.has(key)) {
        updates.push({
          id: existingMap.get(key),
          ...baseData,
          queue_type: targetQueue,
          previous_queue: 'strategic',
          previous_status: 'unassigned',
          uc,
          cod_pess_fat,
        })
      } else {
        inserts.push({
          uc,
          cod_pess_fat,
          queue_type: targetQueue,
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
      toast.error('Erro ao transferir registros')
    } else {
      const queueName =
        targetQueue === 'legal'
          ? 'Jurídico'
          : targetQueue === 'cut'
            ? 'Corte'
            : targetQueue === 'non_effective_cut'
              ? 'Corte ñ Efetivo'
              : 'Re-Corte'
      toast.success(`Dívidas transferidas para a Fila ${queueName}!`)
      setSelectedDebts(new Set())
      setLastSelected(null)
      handleSearch()
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
      <div>
        <h2 className="font-bold tracking-tight text-slate-800 text-[1.84rem]">
          Atribuição de Dívidas para Fila Estratégias
        </h2>
        <p className="text-muted-foreground">
          <span>
            <span>
              Gerencie a atuação sobre a carteira VENCIDA, baseada&nbsp;nas estratégias e
              prioridades da época.
            </span>
          </span>
          <div>
            <span>A partir de 15/04/2026 - foco na "limpeza de dívidas antigas"</span>
            <span></span>
          </div>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
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
                        {ref}
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
            <CardContent className="flex flex-wrap gap-4 items-start pt-4">
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

              <div className="space-y-2">
                <Label className="text-xs">Situação Ligação</Label>
                <Select value={situacaoLigacaoFilter} onValueChange={setSituacaoLigacaoFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="susp_deb">Suspensas (SUSP_DEB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="text-xs">Filtre UC / qualquer parte do nome ou cpf/cnpj</Label>
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

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  {debts.length} encontradas, {selectedDebts.size} selecionadas.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o Operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.first_name || op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={isConsultas}>
                  Atribuir a(o)
                </Button>
                <Button
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 gap-2 ml-2 px-2"
                  onClick={() => handleTransferToQueue('legal')}
                  disabled={selectedDebts.size === 0 || isConsultas}
                  title="Transferir p/ Jurídico"
                >
                  <Scale className="w-4 h-4" /> <span className="hidden xl:inline">Jurídico</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 gap-2 ml-2 px-2"
                  onClick={() => handleTransferToQueue('cut')}
                  disabled={selectedDebts.size === 0 || isConsultas}
                  title="Transferir p/ Corte"
                >
                  <Scissors className="w-4 h-4" /> <span className="hidden xl:inline">Corte</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 gap-2 ml-2 px-2"
                  onClick={() => handleTransferToQueue('recut')}
                  disabled={selectedDebts.size === 0 || isConsultas}
                  title="Transferir p/ Re-Corte"
                >
                  <Split className="w-4 h-4" /> <span className="hidden xl:inline">Re-Corte</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 gap-2 ml-2 px-2"
                  onClick={() => handleTransferToQueue('non_effective_cut')}
                  disabled={selectedDebts.size === 0 || isConsultas}
                  title="Transferir p/ Corte ñ Ef."
                >
                  <ThumbsDown className="w-4 h-4" />{' '}
                  <span className="hidden xl:inline">Corte ñ Ef.</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="border-t max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
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
                      <TableHead className="text-center">Negoc. Venc.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDebts.map((d) => {
                      const key = `${d.uc}-${d.cod_pess_fat}`
                      return (
                        <TableRow
                          key={key}
                          className={
                            selectedDebts.has(key)
                              ? 'bg-primary/5 cursor-pointer'
                              : 'cursor-pointer'
                          }
                          onClick={(e) => toggleSelection(key, e)}
                        >
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedDebts.has(key)}
                              onCheckedChange={() => toggleSelection(key)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{d.uc}</TableCell>
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
                          <TableCell className="text-xs">{d.refs}</TableCell>
                          <TableCell className="text-center">
                            {d.tem_negociacao_vencida ? (
                              <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                SIM
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">NÃO</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {debts.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          Nenhuma dívida encontrada. Ajuste os filtros e clique em Buscar.
                        </TableCell>
                      </TableRow>
                    )}
                    {hasMore && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 bg-slate-50/50">
                          <Button
                            variant="outline"
                            onClick={() => handleSearch(true)}
                            disabled={loading}
                            className="w-full max-w-sm"
                          >
                            {loading ? 'Carregando...' : 'Carregar Mais Resultados'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-1">
                <CardTitle>Já Atribuídas</CardTitle>
                <CardDescription>Últimos 50 registros atribuídos</CardDescription>
              </div>
              {selectedAssigned.size > 0 && (
                <div className="flex flex-col gap-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedAssigned.size} selecionadas
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleUndoAssignment}
                      className="flex-1 text-xs h-8"
                      disabled={isConsultas}
                    >
                      Desfazer
                    </Button>
                    <div className="flex gap-1 flex-1">
                      <Select value={assignedOperator} onValueChange={setAssignedOperator}>
                        <SelectTrigger className="w-full h-8 text-xs border-slate-300">
                          <SelectValue placeholder="Operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.id} value={op.id} className="text-xs">
                              {op.first_name || op.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleReassign}
                        className="h-8 text-xs px-2"
                        disabled={!assignedOperator || isConsultas}
                      >
                        Re-atribuir
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="border-t max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        <Checkbox
                          checked={assigned.length > 0 && selectedAssigned.size === assigned.length}
                          onCheckedChange={selectAllAssigned}
                        />
                      </TableHead>
                      <TableHead>UC</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assigned.map((a) => (
                      <TableRow
                        key={a.id}
                        className={`cursor-pointer ${selectedAssigned.has(a.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleAssignedSelection(a.id)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedAssigned.has(a.id)}
                            onCheckedChange={() => toggleAssignedSelection(a.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-xs">{a.uc}</TableCell>
                        <TableCell
                          className="text-xs truncate max-w-[100px]"
                          title={a.profiles?.first_name || a.profiles?.name}
                        >
                          {a.profiles?.first_name || a.profiles?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                              a.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : a.status === 'started'
                                  ? 'bg-blue-100 text-blue-700'
                                  : a.status === 'unassigned'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {a.status === 'pending'
                              ? 'Pendente'
                              : a.status === 'started'
                                ? 'Iniciado'
                                : a.status === 'unassigned'
                                  ? 'Não atribuído'
                                  : 'Concluído'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {assigned.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8 text-sm"
                        >
                          Nenhuma atribuição recente.
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
    </div>
  )
}
