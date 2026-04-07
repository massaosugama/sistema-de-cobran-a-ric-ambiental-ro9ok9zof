import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Search, ChevronLeft, ChevronRight, MapPin, Clock, ArrowRight } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { CustomerActionForm } from '@/pages/customer/CustomerActionForm'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { parseDebtRow, type ParsedDebt } from '@/services/debts'

export type QueueDebt = ParsedDebt & {
  latest_contact_date?: string | null
  operator_ids?: string[] | null
  contact_count?: number
}

export default function Queue() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  // Global Filters State
  const [filterConnection, setFilterConnection] = useState('ligacao')
  const [filterStatus, setFilterStatus] = useState('emitidas')
  const [filterDue, setFilterDue] = useState('vencidos')
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalAddress, setGlobalAddress] = useState('')
  const debouncedGlobalSearch = useDebounce(globalSearch, 500)
  const debouncedGlobalAddress = useDebounce(globalAddress, 500)

  // Debtors State
  const [debtors, setDebtors] = useState<QueueDebt[]>([])
  const [debtorsCount, setDebtorsCount] = useState(0)
  const [debtorsLoading, setDebtorsLoading] = useState(false)
  const [debtorsPage, setDebtorsPage] = useState(1)
  const [debtorsPageSize, setDebtorsPageSize] = useState('10')
  const [debtorsSortBy, setDebtorsSortBy] = useState('valor_total')

  // Attended State
  const [contacts, setContacts] = useState<QueueDebt[]>([])
  const [contactsCount, setContactsCount] = useState(0)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsPage, setContactsPage] = useState(1)
  const [contactsPageSize, setContactsPageSize] = useState('10')
  const [contactsSortBy, setContactsSortBy] = useState('latest_contact_date')
  const [attendedOperator, setAttendedOperator] = useState<string>('todos')

  // Operators List
  const [operators, setOperators] = useState<any[]>([])

  // Action Sheet State
  const [selectedDebt, setSelectedDebt] = useState<QueueDebt | null>(null)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (user) {
      setAttendedOperator(user.id)
    }
  }, [user])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, first_name, last_name, color')
      .order('first_name', { ascending: true })
      .then(({ data }) => {
        if (data) setOperators(data)
      })
  }, [])

  const applyGlobalFilters = useCallback(
    (q: any) => {
      if (filterConnection === 'ligacao') {
        q = q.or('setor.neq.4036,setor.is.null')
      } else if (filterConnection === 'lotes') {
        q = q.eq('setor', '4036')
      }

      if (filterStatus === 'emitidas') {
        q = q.or('valor_retidas_em_aberto.lte.0,valor_retidas_em_aberto.is.null')
      } else if (filterStatus === 'retidas') {
        q = q.gt('valor_retidas_em_aberto', 0)
      }

      if (filterDue === 'vencidos') {
        q = q.gt('valor_vencido', 0)
      } else if (filterDue === 'a_vencer') {
        q = q.gt('valor_a_vencer', 0)
      }

      if (debouncedGlobalSearch) {
        q = q.or(
          `uc.ilike.%${debouncedGlobalSearch}%,pessoa_fatura_nome.ilike.%${debouncedGlobalSearch}%,cod_pess_fat.ilike.%${debouncedGlobalSearch}%`,
        )
      }
      if (debouncedGlobalAddress) {
        q = q.ilike('endereco', `%${debouncedGlobalAddress}%`)
      }
      return q
    },
    [filterConnection, filterStatus, filterDue, debouncedGlobalSearch, debouncedGlobalAddress],
  )

  const fetchDebtors = useCallback(async () => {
    setDebtorsLoading(true)
    try {
      let q = supabase.from('vw_pending_debts_with_contacts' as any).select('*', { count: 'exact' })
      q = applyGlobalFilters(q)

      const size = parseInt(debtorsPageSize)
      const from = (debtorsPage - 1) * size
      const to = from + size - 1

      if (debtorsSortBy === 'uc') {
        q = q.order('uc', { ascending: true })
      } else if (debtorsSortBy === 'nome') {
        q = q.order('pessoa_fatura_nome', { ascending: true, nullsFirst: false })
      } else {
        q = q.order('valor_total', { ascending: false })
      }

      q = q.range(from, to)

      const { data, count, error } = await q
      if (!error && data) {
        setDebtors(
          data.map((row: any) => ({
            ...parseDebtRow(row),
            latest_contact_date: row.latest_contact_date,
            operator_ids: row.operator_ids,
            contact_count: row.contact_count,
          })),
        )
        setDebtorsCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDebtorsLoading(false)
    }
  }, [applyGlobalFilters, debtorsPage, debtorsPageSize, debtorsSortBy])

  const fetchContacts = useCallback(async () => {
    if (!attendedOperator) return
    setContactsLoading(true)
    try {
      let q = supabase.from('vw_pending_debts_with_contacts' as any).select('*', { count: 'exact' })
      q = q.gt('contact_count', 0)
      q = applyGlobalFilters(q)

      if (attendedOperator !== 'todos') {
        q = q.contains('operator_ids', `["${attendedOperator}"]`)
      }

      const size = parseInt(contactsPageSize)
      const from = (contactsPage - 1) * size
      const to = from + size - 1

      if (contactsSortBy === 'uc') {
        q = q.order('uc', { ascending: true })
      } else if (contactsSortBy === 'nome') {
        q = q.order('pessoa_fatura_nome', { ascending: true, nullsFirst: false })
      } else if (contactsSortBy === 'valor_total') {
        q = q.order('valor_total', { ascending: false })
      } else {
        q = q.order('latest_contact_date', { ascending: false })
      }

      q = q.range(from, to)

      const { data, count, error } = await q
      if (!error && data) {
        setContacts(
          data.map((row: any) => ({
            ...parseDebtRow(row),
            latest_contact_date: row.latest_contact_date,
            operator_ids: row.operator_ids,
            contact_count: row.contact_count,
          })),
        )
        setContactsCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setContactsLoading(false)
    }
  }, [applyGlobalFilters, attendedOperator, contactsPage, contactsPageSize, contactsSortBy])

  useEffect(() => {
    fetchDebtors()
  }, [fetchDebtors])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    const handleContactAdded = () => {
      fetchContacts()
      fetchDebtors()
      setIsActionSheetOpen(false)
      setSelectedDebt(null)
    }
    window.addEventListener('contact-added', handleContactAdded)
    return () => window.removeEventListener('contact-added', handleContactAdded)
  }, [fetchContacts, fetchDebtors])

  const handleAtender = (debt: QueueDebt) => {
    setSelectedDebt(debt)
    setIsActionSheetOpen(true)
  }

  const renderPagination = (
    page: number,
    setPage: (p: number) => void,
    totalCount: number,
    pageSize: string,
  ) => {
    const size = parseInt(pageSize)
    const totalPages = Math.ceil(totalCount / size)
    const from = (page - 1) * size + 1
    const to = Math.min(page * size, totalCount)

    return (
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-slate-500">
          {totalCount > 0 ? `Mostrando ${from} a ${to} de ${totalCount}` : 'Nenhum registro'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2 text-slate-600">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderDebtCard = (debt: QueueDebt, isAttended: boolean) => (
    <div
      key={`${debt.uc}_${debt.personCode}`}
      className="p-4 border-b bg-white hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 group"
    >
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-[13px] font-bold text-slate-800 truncate uppercase">
          {debt.name || 'SEM NOME'}
        </h3>
        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
          <span>UC: {debt.uc}</span>
          {debt.personCode && <span>• {debt.personCode}</span>}
        </div>
        {isAttended && (
          <div className="text-[11px] font-bold text-slate-700">
            R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
        {debt.address && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
            <span className="truncate uppercase">{debt.address}</span>
            <MapPin className="w-3 h-3 shrink-0 text-blue-500" />
          </div>
        )}
        {debt.operator_ids && debt.operator_ids.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {debt.operator_ids.map((opId) => {
              const op = operators.find((o) => o.id === opId)
              return (
                <span
                  key={opId}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase"
                  style={{ backgroundColor: op?.color || '#64748b' }}
                >
                  {op?.first_name || op?.name?.substring(0, 4) || 'OP'}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-between h-full min-h-[60px] gap-2">
        {!isAttended ? (
          <div className="text-[13px] font-bold text-slate-800">
            R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        ) : (
          <div className="flex items-center text-[11px] text-slate-500 font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {debt.latest_contact_date
              ? format(parseISO(debt.latest_contact_date), 'dd/MM às HH:mm')
              : '-'}
          </div>
        )}

        <button
          onClick={() => handleAtender(debt)}
          className="text-slate-300 hover:text-primary transition-colors mt-auto"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  const renderDebtorsQueue = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-bold text-base text-slate-800">Fila de Devedores</h2>
            <p className="text-[11px] text-slate-500">Novas oportunidades de negociação</p>
          </div>
          <Select
            value={debtorsPageSize}
            onValueChange={(v) => {
              setDebtorsPageSize(v)
              setDebtorsPage(1)
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Select
            value={debtorsSortBy}
            onValueChange={(v) => {
              setDebtorsSortBy(v)
              setDebtorsPage(1)
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="valor_total">Valor Total da Dívida</SelectItem>
              <SelectItem value="uc">UC</SelectItem>
              <SelectItem value="nome">Nome do Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
        <span>Devedor / UC</span>
        <span className="w-32 text-right pr-6">Valor Vencido</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {debtorsLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
        ) : debtors.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Nenhum devedor encontrado.</div>
        ) : (
          debtors.map((d) => renderDebtCard(d, false))
        )}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        {renderPagination(debtorsPage, setDebtorsPage, debtorsCount, debtorsPageSize)}
      </div>
    </div>
  )

  const renderAttendedQueue = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-bold text-base text-blue-600">Fila de Atendimento</h2>
            <p className="text-[11px] text-slate-500">Meus contatos em andamento</p>
          </div>
          <Select
            value={contactsPageSize}
            onValueChange={(v) => {
              setContactsPageSize(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Select
            value={attendedOperator}
            onValueChange={(v) => {
              setAttendedOperator(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs bg-white">
              <SelectValue placeholder="Atendente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {operators.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.first_name || op.name || 'Sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={contactsSortBy}
            onValueChange={(v) => {
              setContactsSortBy(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs bg-white">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest_contact_date">Data do Contato</SelectItem>
              <SelectItem value="valor_total">Valor Total da Dívida</SelectItem>
              <SelectItem value="uc">UC</SelectItem>
              <SelectItem value="nome">Nome do Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
        <span>Devedor / UC</span>
        <span className="w-32 text-right pr-6">Último Contato</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {contactsLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Nenhum atendimento.</div>
        ) : (
          contacts.map((c) => renderDebtCard(c, true))
        )}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        {renderPagination(contactsPage, setContactsPage, contactsCount, contactsPageSize)}
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        'animate-fade-in-up flex flex-col min-h-[600px] space-y-4',
        isMobile
          ? 'pb-10'
          : 'h-[calc(100vh-2.5rem)] md:h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4.5rem)] pb-0',
      )}
    >
      <div className="shrink-0 mb-2 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">Fila Rápida</h1>
          <p className="text-sm text-slate-500">
            Gerencie seus contatos pendentes e acompanhe suas negociações em andamento.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 xl:justify-end">
            <Select
              value={filterConnection}
              onValueChange={(v) => {
                setFilterConnection(v)
                setDebtorsPage(1)
                setContactsPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ligacao">Só com Ligação</SelectItem>
                <SelectItem value="lotes">Só Lotes Vagos</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v)
                setDebtorsPage(1)
                setContactsPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emitidas">Só Emitidas</SelectItem>
                <SelectItem value="retidas">Só Retidas</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterDue}
              onValueChange={(v) => {
                setFilterDue(v)
                setDebtorsPage(1)
                setContactsPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vencidos">Vencidos</SelectItem>
                <SelectItem value="a_vencer">A Vencer</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 xl:justify-end">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre UC, qualquer parte do nome ou Cpf/Cnpj"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
                className="pl-9 h-9 bg-white"
              />
            </div>
            <div className="relative w-full sm:w-[300px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Digite qualquer parte do Endereço"
                value={globalAddress}
                onChange={(e) => {
                  setGlobalAddress(e.target.value)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
                className="pl-9 h-9 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 -mx-4 sm:mx-0">
        {isMobile ? (
          <div className="flex flex-col gap-6 h-full overflow-y-auto px-4 sm:px-0">
            <div className="h-[600px] border rounded-xl overflow-hidden shadow-sm shrink-0">
              {renderDebtorsQueue()}
            </div>
            <div className="h-[600px] border rounded-xl overflow-hidden shadow-sm shrink-0">
              {renderAttendedQueue()}
            </div>
          </div>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="border rounded-xl shadow-sm bg-slate-200 overflow-hidden h-full gap-[1px]"
          >
            <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-white">
              {renderDebtorsQueue()}
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-slate-200 hover:bg-slate-300 w-1" />
            <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-white">
              {renderAttendedQueue()}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      <Sheet open={isActionSheetOpen} onOpenChange={setIsActionSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-slate-50 p-0 flex flex-col">
          <SheetHeader className="p-6 bg-white border-b shrink-0">
            <SheetTitle>Atendimento Rápido</SheetTitle>
            <SheetDescription>
              Registre o contato e defina o próximo passo para este devedor.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedDebt && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/80"></div>
                  <div className="pl-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-500">UC {selectedDebt.uc}</span>
                      <span className="text-sm font-black text-rose-600">
                        R${' '}
                        {selectedDebt.totalDebt.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-900">
                      {selectedDebt.name || 'Sem nome'}
                    </p>
                    {selectedDebt.address && (
                      <p className="text-[12px] text-slate-500 leading-tight mt-2 flex gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {selectedDebt.address}
                      </p>
                    )}
                  </div>
                </div>
                <CustomerActionForm
                  key={selectedDebt.id}
                  customer={selectedDebt}
                  isSheet={true}
                  onClose={() => setIsActionSheetOpen(false)}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
