import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  Download,
  Edit,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { useBillingDispatches, sanitizePhone } from '@/hooks/use-billing-dispatches'
import { useAuth } from '@/hooks/use-auth'

export default function BillingDispatches() {
  const { user } = useAuth()
  const [isConsulta, setIsConsulta] = useState(false)

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === 'consultas' || data?.role === 'consulta') {
            setIsConsulta(true)
          }
        })
    }
  }, [user])

  const {
    availableRefs,
    selectedRefs,
    setSelectedRefs,
    daysToDue,
    setDaysToDue,
    minDaysSinceDispatch,
    setMinDaysSinceDispatch,
    minDebtValue,
    setMinDebtValue,
    recordLimit,
    setRecordLimit,
    eligibleItems,
    totalEligibleCount,
    preSelectedItems,
    selectionEligible,
    selectionPreSelected,
    sortCol,
    sortDir,
    toggleSort,
    toggleSelection,
    selectAll,
    moveSelected,
    fetchDebts,
    loading,
    setEligibleItems,
    setPreSelectedItems,
    setSelectionPreSelected,
    searchUcs,
    setSearchUcs,
    searchDate,
    setSearchDate,
    researchedItems,
    reGeneratedItems,
    loadingResearch,
    exportingResearch,
    fetchResearchedItems,
    savePhones,
    handleExportResearched,
    handleGiveUp,
    itemsToExportCount,
    exportingReGen,
    saveReGenPhones,
    handleExportReGen,
    itemsToExportReGenCount,
    reGenPage,
    reGenTotalCount,
  } = useBillingDispatches()

  const { toast } = useToast()
  const [editingReGenItem, setEditingReGenItem] = useState<any | null>(null)
  const [editingReGenText, setEditingReGenText] = useState('')
  const [activeTab, setActiveTab] = useState('envios')
  const [extractionResult, setExtractionResult] = useState<any[] | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [phoneFilters, setPhoneFilters] = useState<Set<string>>(
    new Set([
      'pessoa_fatura_celular',
      'proprietario_celular',
      'responsavel_celular',
      'remover_duplicatas',
    ]),
  )

  const [editingPhonesItem, setEditingPhonesItem] = useState<any | null>(null)
  const [editingPhonesText, setEditingPhonesText] = useState('')

  const togglePhoneFilter = (filter: string, checked: boolean) => {
    setPhoneFilters((prev) => {
      const next = new Set(prev)
      if (checked) next.add(filter)
      else next.delete(filter)
      return next
    })
  }

  const handleEditPhones = (item: any) => {
    setEditingPhonesItem(item)
    setEditingPhonesText(item.telefones_pesquisa || '')
  }

  const handleSavePhones = async () => {
    if (!editingPhonesItem) return
    await savePhones(editingPhonesItem.uc, editingPhonesItem.cod_pess_fat, editingPhonesText)
    setEditingPhonesItem(null)
  }

  const handleSaveReGenPhones = async () => {
    if (!editingReGenItem) return
    await saveReGenPhones(editingReGenItem.uc, editingReGenItem.cod_pess_fat, editingReGenText)
    setEditingReGenItem(null)
  }

  const handleExtract = async () => {
    if (preSelectedItems.length === 0) return
    setExtracting(true)

    const exportData: any[] = []
    const now = new Date().toISOString()
    const updatePayload: any[] = []

    preSelectedItems.forEach((item) => {
      updatePayload.push({ uc: item.uc, cod_pess_fat: item.cod_pess_fat, ultimo_disparo: now })

      let logradouro = item.endereco || ''
      const nIndex = logradouro.search(/N[º°]/i)
      if (nIndex !== -1) {
        logradouro = logradouro.substring(0, nIndex).trim()
      }

      let rawPhones: string[] = []
      if (phoneFilters.has('pessoa_fatura_celular') && item.pessoa_fatura_celular) {
        rawPhones.push(item.pessoa_fatura_celular)
      }
      if (phoneFilters.has('proprietario_celular') && item.proprietario_celular) {
        rawPhones.push(item.proprietario_celular)
      }
      if (phoneFilters.has('responsavel_celular') && item.responsavel_celular) {
        rawPhones.push(item.responsavel_celular)
      }

      let cleanPhones = rawPhones.map((p) => sanitizePhone(p)).filter(Boolean) as string[]

      if (phoneFilters.has('remover_duplicatas')) {
        cleanPhones = Array.from(new Set(cleanPhones))
      }

      if (cleanPhones.length > 0) {
        cleanPhones.forEach((cleanPhone) => {
          exportData.push({
            WHATSAPP: cleanPhone,
            UC: item.uc,
            NOME: item.pessoa_fatura_nome,
            LOGRADOURO: logradouro,
          })
        })
      } else {
        exportData.push({
          WHATSAPP: '',
          UC: item.uc,
          NOME: item.pessoa_fatura_nome,
          LOGRADOURO: logradouro,
        })
      }
    })

    const csvContent = [
      ['WHATSAPP', 'UC', 'NOME', 'LOGRADOURO'].join(';'),
      ...exportData.map((row) => {
        const rawPhone = row.WHATSAPP ? String(row.WHATSAPP).replace(/^="|"$/g, '') : ''
        const rawUC = row.UC ? String(row.UC).replace(/^="|"$/g, '') : ''
        const cleanName = `"${(row.NOME || '').replace(/"/g, '""')}"`
        const cleanLogradouro = `"${(row.LOGRADOURO || '').replace(/"/g, '""')}"`
        return [rawPhone, rawUC, cleanName, cleanLogradouro].join(';')
      }),
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `disparos_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)

    try {
      const batchSize = 500
      for (let i = 0; i < updatePayload.length; i += batchSize) {
        const batch = updatePayload.slice(i, i + batchSize)
        await supabase.rpc('bulk_update_ultimo_disparo', { payload: batch })
      }
      const updatedItems = preSelectedItems.map((i) => ({ ...i, ultimo_disparo: now }))
      setEligibleItems((prev) => [...prev, ...updatedItems])
      setPreSelectedItems([])
      setSelectionPreSelected(new Set())
      setExtractionResult(updatePayload)
      toast({ title: 'Extração Concluída', description: `${exportData.length} registros gerados.` })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erro na extração',
        description: 'Falha ao atualizar banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setExtracting(false)
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ArrowUpDown className="ml-1 h-3 w-3 inline" />
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    )
  }

  const GridTable = ({ title, items, selectedIds, isEligible, limitInput, totalCount }: any) => {
    const allSelected = items.length > 0 && selectedIds.size === items.length
    const displayCount =
      totalCount !== undefined ? `${items.length} de ${totalCount}` : items.length

    return (
      <div className="flex flex-col h-full border rounded-md shadow-sm bg-card overflow-hidden">
        <div className="p-3 bg-muted/30 border-b font-medium text-sm flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center">
            {limitInput}
            <span className="text-muted-foreground ml-2">{displayCount} registros</span>
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[40px] px-2">
                  <Checkbox
                    disabled={isConsulta}
                    checked={allSelected}
                    onCheckedChange={() => selectAll(isEligible)}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer px-2 select-none whitespace-nowrap"
                  onClick={() => isEligible && toggleSort('uc')}
                >
                  UC {isEligible && <SortIcon col="uc" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer px-2 select-none whitespace-nowrap"
                  onClick={() => isEligible && toggleSort('pessoa')}
                >
                  Pessoa {isEligible && <SortIcon col="pessoa" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer px-2 select-none whitespace-nowrap"
                  onClick={() => isEligible && toggleSort('valor')}
                >
                  Valor {isEligible && <SortIcon col="valor" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer px-2 select-none whitespace-nowrap"
                  onClick={() => isEligible && toggleSort('referencia')}
                >
                  Ref {isEligible && <SortIcon col="referencia" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer px-2 select-none whitespace-nowrap"
                  onClick={() => isEligible && toggleSort('vencimento')}
                >
                  Venc {isEligible && <SortIcon col="vencimento" />}
                </TableHead>
                <TableHead
                  className="px-2 select-none text-center whitespace-nowrap text-xs"
                  title="Celular Fatura"
                >
                  Fatu
                </TableHead>
                <TableHead
                  className="px-2 select-none text-center whitespace-nowrap text-xs"
                  title="Celular Proprietário"
                >
                  Prop
                </TableHead>
                <TableHead
                  className="px-2 select-none text-center whitespace-nowrap text-xs"
                  title="Celular Responsável"
                >
                  Resp
                </TableHead>
                <TableHead
                  className="cursor-pointer px-2 select-none whitespace-nowrap"
                  onClick={() => isEligible && toggleSort('disparo')}
                >
                  Últ. Disparo {isEligible && <SortIcon col="disparo" />}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, idx: number) => (
                <TableRow
                  key={item.id}
                  data-state={selectedIds.has(item.id) ? 'selected' : undefined}
                  className={cn('text-xs hover:bg-muted/50', !isConsulta && 'cursor-pointer')}
                  onClick={(e) => !isConsulta && toggleSelection(item.id, idx, e, isEligible)}
                >
                  <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      disabled={isConsulta}
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(c) =>
                        !isConsulta &&
                        toggleSelection(item.id, idx, { shiftKey: false } as any, isEligible)
                      }
                    />
                  </TableCell>
                  <TableCell className="px-2">{item.uc}</TableCell>
                  <TableCell
                    className="px-2 max-w-[150px] truncate"
                    title={item.pessoa_fatura_nome}
                  >
                    {item.pessoa_fatura_nome}
                  </TableCell>
                  <TableCell className="px-2 whitespace-nowrap">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      item.valor_total,
                    )}
                  </TableCell>
                  <TableCell className="px-2 whitespace-nowrap">
                    {item.refsList.join(', ')}
                  </TableCell>
                  <TableCell className="px-2 whitespace-nowrap">
                    {item.dt_vencto_ref_mais_recente
                      ? format(new Date(item.dt_vencto_ref_mais_recente), 'dd/MM/yy')
                      : '-'}
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    <div
                      className={cn(
                        'mx-auto h-2.5 w-2.5 rounded-full',
                        item.pessoa_fatura_celular?.trim() ? 'bg-green-500' : 'bg-muted',
                      )}
                      title={item.pessoa_fatura_celular || 'Sem telefone'}
                    />
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    <div
                      className={cn(
                        'mx-auto h-2.5 w-2.5 rounded-full',
                        item.proprietario_celular?.trim() ? 'bg-green-500' : 'bg-muted',
                      )}
                      title={item.proprietario_celular || 'Sem telefone'}
                    />
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    <div
                      className={cn(
                        'mx-auto h-2.5 w-2.5 rounded-full',
                        item.responsavel_celular?.trim() ? 'bg-green-500' : 'bg-muted',
                      )}
                      title={item.responsavel_celular || 'Sem telefone'}
                    />
                  </TableCell>
                  <TableCell className="px-2 whitespace-nowrap">
                    {item.ultimo_disparo
                      ? format(new Date(item.ultimo_disparo), 'dd/MM/yy HH:mm')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 overflow-hidden">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Disparos de Cobrança</h1>
        <p className="text-sm text-muted-foreground">
          Faça gestão dos disparos de mensagens de cobrança via Whatsapp
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="envios">Gestão de Envios</TabsTrigger>
          <TabsTrigger value="pesquisa">Pesquisa de Telefones</TabsTrigger>
        </TabsList>

        <TabsContent
          value="envios"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col gap-4 outline-none mt-4"
        >
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end bg-card p-4 rounded-lg border shadow-sm shrink-0">
            <div className="grid gap-2">
              <Label>REFS (Referências aa/mm)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[250px] justify-between text-left font-normal bg-background"
                  >
                    {selectedRefs.length > 0
                      ? `${selectedRefs.length} selecionadas`
                      : 'Selecione as referências'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[250px] max-h-[300px] overflow-y-auto">
                  {availableRefs.map((ref) => (
                    <DropdownMenuCheckboxItem
                      key={ref}
                      checked={selectedRefs.includes(ref)}
                      onCheckedChange={(c) =>
                        setSelectedRefs((p) => (c ? [...p, ref] : p.filter((r) => r !== ref)))
                      }
                    >
                      {ref}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid gap-2">
              <Label>Atraso mínimo (dias)</Label>
              <Input
                type="number"
                className="w-full sm:w-[150px] bg-background"
                value={daysToDue}
                onChange={(e) => setDaysToDue(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor mínimo (R$)</Label>
              <Input
                type="number"
                className="w-full sm:w-[150px] bg-background"
                value={minDebtValue === '' ? '' : minDebtValue}
                onChange={(e) =>
                  setMinDebtValue(e.target.value === '' ? '' : Number(e.target.value))
                }
                min={0}
                step="0.01"
                placeholder="Ex: 100"
              />
            </div>
            <div className="grid gap-2">
              <Label>Mínimo de dias desde o último envio</Label>
              <Input
                type="number"
                className="w-full sm:w-[260px] bg-background"
                value={minDaysSinceDispatch === '' ? '' : minDaysSinceDispatch}
                onChange={(e) =>
                  setMinDaysSinceDispatch(e.target.value === '' ? '' : Number(e.target.value))
                }
                min={0}
                placeholder="Deixe em branco para todos"
              />
            </div>
            <Button onClick={fetchDebts} disabled={loading} className="w-full sm:w-[150px]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Buscar Dívidas
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            <div className="flex flex-col gap-4 min-h-0 h-full">
              <div className="flex-1 min-h-0">
                <GridTable
                  title="Registros Elegíveis"
                  items={eligibleItems}
                  selectedIds={selectionEligible}
                  isEligible={true}
                  totalCount={totalEligibleCount}
                  limitInput={
                    <div className="flex items-center gap-2 mr-4">
                      <Label
                        htmlFor="limit-input"
                        className="text-xs text-muted-foreground whitespace-nowrap"
                      >
                        Limite:
                      </Label>
                      <Input
                        id="limit-input"
                        type="number"
                        className="h-7 w-[80px] text-xs bg-background"
                        value={recordLimit}
                        onChange={(e) => setRecordLimit(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  }
                />
              </div>
              <Button
                onClick={() => moveSelected(true)}
                disabled={selectionEligible.size === 0 || isConsulta}
                className="w-full shrink-0"
              >
                <ArrowRight className="mr-2 h-4 w-4 hidden lg:inline" />
                <ArrowDown className="mr-2 h-4 w-4 inline lg:hidden" />
                Selecionar ({selectionEligible.size})
              </Button>
            </div>

            <div className="flex flex-col gap-4 min-h-0 h-full">
              <div className="flex-1 min-h-0">
                <GridTable
                  title="Pré-selecionados"
                  items={preSelectedItems}
                  selectedIds={selectionPreSelected}
                  isEligible={false}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => moveSelected(false)}
                  disabled={selectionPreSelected.size === 0 || isConsulta}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 hidden sm:inline" />
                  <ArrowUp className="mr-2 h-4 w-4 inline sm:hidden" />
                  Desfazer Seleção ({selectionPreSelected.size})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      Telefones desejados
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={phoneFilters.has('pessoa_fatura_celular')}
                      onCheckedChange={(c) => togglePhoneFilter('pessoa_fatura_celular', c)}
                    >
                      pessoa_fatura_celular
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={phoneFilters.has('proprietario_celular')}
                      onCheckedChange={(c) => togglePhoneFilter('proprietario_celular', c)}
                    >
                      proprietario_celular
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={phoneFilters.has('responsavel_celular')}
                      onCheckedChange={(c) => togglePhoneFilter('responsavel_celular', c)}
                    >
                      responsavel_celular
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={phoneFilters.has('remover_duplicatas')}
                      onCheckedChange={(c) => togglePhoneFilter('remover_duplicatas', c)}
                    >
                      remover duplicatas
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={handleExtract}
                  disabled={preSelectedItems.length === 0 || extracting || isConsulta}
                  className="flex-1"
                >
                  {extracting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}{' '}
                  Extrair Arquivo ({preSelectedItems.length})
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="pesquisa"
          className="flex-1 min-h-0 data-[state=active]:flex flex-col gap-4 outline-none mt-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 shrink-0 bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex-1 grid gap-2">
              <Label>Cole as UCs (uma por linha)</Label>
              <Textarea
                className="min-h-[120px] bg-background font-mono text-sm"
                placeholder="UC&#10;125641362&#10;123242363..."
                value={searchUcs}
                onChange={(e) => setSearchUcs(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[250px] flex flex-col gap-4">
              <div className="grid gap-2">
                <Label>Data do último disparo</Label>
                <Input
                  type="date"
                  className="bg-background"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
              <Button
                className="w-full mt-auto"
                onClick={fetchResearchedItems}
                disabled={loadingResearch || !searchUcs.trim() || isConsulta}
              >
                {loadingResearch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar UCs não disparados
              </Button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row flex-1 min-h-0 gap-4">
            <div className="flex-1 min-h-0 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
              <div className="p-3 bg-muted/30 border-b font-medium text-sm flex items-center justify-between">
                <span>Registros Localizados ({researchedItems.length})</span>
              </div>
              <ScrollArea className="flex-1 min-h-[250px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="px-4 whitespace-nowrap">UC</TableHead>
                      <TableHead className="px-4 min-w-[200px]">Pessoa</TableHead>
                      <TableHead className="px-4 whitespace-nowrap">CPF/CNPJ</TableHead>
                      <TableHead className="px-4 whitespace-nowrap">Valor Total</TableHead>
                      <TableHead className="px-4 whitespace-nowrap w-[100px] text-center">
                        Editar
                      </TableHead>
                      <TableHead className="px-4 min-w-[250px]">Telefones Encontrados</TableHead>
                      <TableHead className="px-4 text-right min-w-[100px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {researchedItems.map((item: any) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'text-sm',
                          item.telefones_pesquisa && 'bg-emerald-500/10 hover:bg-emerald-500/20',
                        )}
                      >
                        <TableCell className="px-4">{item.uc}</TableCell>
                        <TableCell
                          className="px-4 max-w-[200px] truncate"
                          title={item.pessoa_fatura_nome}
                        >
                          {item.pessoa_fatura_nome}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {item.pessoa_fatura_cpf_cnpj}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.valor_total)}
                        </TableCell>
                        <TableCell className="px-4 text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPhones(item)}
                            disabled={isConsulta}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </TableCell>
                        <TableCell
                          className="px-4 text-muted-foreground truncate max-w-[250px]"
                          title={item.telefones_pesquisa || ''}
                        >
                          {item.telefones_pesquisa ? (
                            item.telefones_pesquisa
                          ) : (
                            <span className="italic">Nenhum</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGiveUp(item.uc, item.cod_pess_fat)}
                            disabled={isConsulta}
                          >
                            <X className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Desistir</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {researchedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum registro pesquisado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="p-3 bg-muted/30 border-t flex justify-end shrink-0">
                <Button
                  onClick={handleExportResearched}
                  disabled={itemsToExportCount === 0 || exportingResearch || isConsulta}
                >
                  {exportingResearch ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Extrair Arquivo ({itemsToExportCount})
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
              <div className="p-3 bg-muted/30 border-b font-medium text-sm flex items-center justify-between">
                <span>Registros Re-gerados ({reGeneratedItems.length})</span>
              </div>
              <ScrollArea className="flex-1 min-h-[250px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="px-4 whitespace-nowrap">UC</TableHead>
                      <TableHead className="px-4 min-w-[200px]">Pessoa</TableHead>
                      <TableHead className="px-4 whitespace-nowrap">CPF/CNPJ</TableHead>
                      <TableHead className="px-4 whitespace-nowrap">Valor Total</TableHead>
                      <TableHead className="px-4 whitespace-nowrap w-[100px] text-center">
                        Editar
                      </TableHead>
                      <TableHead className="px-4 min-w-[250px]">Telefones (Editados)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reGeneratedItems.map((item: any) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'text-sm',
                          item.telefones_pesquisa && 'bg-emerald-500/10 hover:bg-emerald-500/20',
                        )}
                      >
                        <TableCell className="px-4">{item.uc}</TableCell>
                        <TableCell
                          className="px-4 max-w-[200px] truncate"
                          title={item.pessoa_fatura_nome}
                        >
                          {item.pessoa_fatura_nome}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {item.pessoa_fatura_cpf_cnpj}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.valor_total)}
                        </TableCell>
                        <TableCell className="px-4 text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingReGenItem(item)
                              setEditingReGenText(item.telefones_pesquisa || '')
                            }}
                            disabled={isConsulta}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </TableCell>
                        <TableCell
                          className="px-4 text-muted-foreground truncate max-w-[250px]"
                          title={item.telefones_pesquisa || ''}
                        >
                          {item.telefones_pesquisa ? (
                            <span className={cn(item.is_edited && 'text-amber-500 font-medium')}>
                              {item.telefones_pesquisa}
                            </span>
                          ) : (
                            <span className="italic">Nenhum</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reGeneratedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum registro re-gerado recentemente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="p-3 bg-muted/30 border-t flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground">
                    Página {reGenPage} de {Math.max(1, Math.ceil(reGenTotalCount / 100))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchReGeneratedItems(reGenPage - 1)}
                      disabled={reGenPage === 1 || itemsToExportReGenCount > 0}
                      title={
                        itemsToExportReGenCount > 0
                          ? 'Exporte as alterações antes de mudar de página'
                          : undefined
                      }
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchReGeneratedItems(reGenPage + 1)}
                      disabled={reGenPage * 100 >= reGenTotalCount || itemsToExportReGenCount > 0}
                      title={
                        itemsToExportReGenCount > 0
                          ? 'Exporte as alterações antes de mudar de página'
                          : undefined
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleExportReGen}
                  disabled={itemsToExportReGenCount === 0 || exportingReGen || isConsulta}
                >
                  {exportingReGen ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Extrair Arquivo ({itemsToExportReGenCount})
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!extractionResult} onOpenChange={(o) => !o && setExtractionResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registros Atualizados</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px] border rounded-md p-2 text-sm bg-muted/20">
            {extractionResult?.map((r, i) => (
              <div key={i} className="py-1 border-b last:border-0 border-muted">
                <span className="font-mono text-xs">{r.uc}</span> |{' '}
                <span className="font-mono text-xs text-muted-foreground">{r.cod_pess_fat}</span> |{' '}
                <span className="font-medium text-emerald-600">
                  {format(new Date(r.ultimo_disparo), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPhonesItem} onOpenChange={(o) => !o && setEditingPhonesItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novos Telefones - UC {editingPhonesItem?.uc}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Cole os telefones localizados</Label>
            <Textarea
              className="min-h-[150px] mt-2 font-mono text-sm"
              placeholder="(14) 99686-3992&#10;(11) 97987-3166"
              value={editingPhonesText}
              onChange={(e) => setEditingPhonesText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Você pode colar telefones sem um formato fixo. O sistema extrairá todos os números na
              hora de gerar o arquivo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhonesItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePhones} disabled={isConsulta}>
              Salvar Telefones
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingReGenItem} onOpenChange={(o) => !o && setEditingReGenItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituir Telefones - UC {editingReGenItem?.uc}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Cole os novos telefones</Label>
            <Textarea
              className="min-h-[150px] mt-2 font-mono text-sm"
              placeholder="(14) 99686-3992&#10;(11) 97987-3166"
              value={editingReGenText}
              onChange={(e) => setEditingReGenText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Ao salvar, os novos telefones substituirão os antigos para uma nova extração.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReGenItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveReGenPhones} disabled={isConsulta}>
              Salvar Telefones
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
