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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  PhoneCall,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  MapPin,
} from 'lucide-react'
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

export default function Queue() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  // Debtors State
  const [debtors, setDebtors] = useState<ParsedDebt[]>([])
  const [debtorsCount, setDebtorsCount] = useState(0)
  const [debtorsLoading, setDebtorsLoading] = useState(false)
  const [debtorsPage, setDebtorsPage] = useState(1)
  const [debtorsPageSize, setDebtorsPageSize] = useState('10')
  const [debtorsSortBy, setDebtorsSortBy] = useState('valor_total')
  const [debtSearch, setDebtSearch] = useState('')
  const debouncedDebtSearch = useDebounce(debtSearch, 500)

  // Attended State
  const [contacts, setContacts] = useState<any[]>([])
  const [contactsCount, setContactsCount] = useState(0)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsPage, setContactsPage] = useState(1)
  const [contactsPageSize, setContactsPageSize] = useState('10')
  const [attendedOperator, setAttendedOperator] = useState<string>('todos')

  // Operators List
  const [operators, setOperators] = useState<any[]>([])

  // Action Sheet State
  const [selectedDebt, setSelectedDebt] = useState<ParsedDebt | null>(null)
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

  const fetchDebtors = useCallback(async () => {
    setDebtorsLoading(true)
    try {
      let q = supabase.from('pending_debts').select('*', { count: 'exact' })

      if (debouncedDebtSearch) {
        q = q.or(
          `uc.ilike.%${debouncedDebtSearch}%,pessoa_fatura_nome.ilike.%${debouncedDebtSearch}%,cod_pess_fat.ilike.%${debouncedDebtSearch}%`,
        )
      }

      const size = parseInt(debtorsPageSize)
      const from = (debtorsPage - 1) * size
      const to = from + size - 1

      if (debtorsSortBy === 'uc') {
        q = q.order('uc', { ascending: true })
      } else if (debtorsSortBy === 'nome') {
        q = q.order('pessoa_fatura_nome', { ascending: true })
      } else {
        q = q.order('valor_total', { ascending: false })
      }

      q = q.range(from, to)

      const { data, count, error } = await q
      if (!error && data) {
        setDebtors(data.map(parseDebtRow))
        setDebtorsCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDebtorsLoading(false)
    }
  }, [debouncedDebtSearch, debtorsPage, debtorsPageSize, debtorsSortBy])

  const fetchContacts = useCallback(async () => {
    if (!attendedOperator) return
    setContactsLoading(true)
    try {
      let q = supabase
        .from('contact_history')
        .select(
          '*, profiles!contact_history_operator_id_fkey(name, first_name, last_name, color)',
          { count: 'exact' },
        )
        .eq('is_active', true)

      if (attendedOperator !== 'todos') {
        q = q.eq('operator_id', attendedOperator)
      }

      const size = parseInt(contactsPageSize)
      const from = (contactsPage - 1) * size
      const to = from + size - 1

      q = q.order('created_at', { ascending: false }).range(from, to)

      const { data, count, error } = await q
      if (!error && data) {
        setContacts(data)
        setContactsCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setContactsLoading(false)
    }
  }, [attendedOperator, contactsPage, contactsPageSize])

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

  const handleAtender = (debt: ParsedDebt) => {
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

  const renderDebtorsQueue = () => (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-4 border-b bg-white shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-primary" /> Fila de Devedores
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar UC, Nome ou CPF/CNPJ..."
              value={debtSearch}
              onChange={(e) => {
                setDebtSearch(e.target.value)
                setDebtorsPage(1)
              }}
              className="pl-9 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20"
            />
          </div>
          <Select
            value={debtorsSortBy}
            onValueChange={(v) => {
              setDebtorsSortBy(v)
              setDebtorsPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl bg-white border-slate-200 shadow-sm shrink-0">
              <div className="flex items-center gap-2 text-slate-600">
                <ArrowUpDown className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  <SelectValue placeholder="Ordenar por" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uc">UC</SelectItem>
              <SelectItem value="valor_total">Valor Total da Dívida</SelectItem>
              <SelectItem value="nome">Nome do Cliente</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={debtorsPageSize}
            onValueChange={(v) => {
              setDebtorsPageSize(v)
              setDebtorsPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[90px] h-10 rounded-xl bg-white border-slate-200 shadow-sm shrink-0">
              <SelectValue placeholder="Qtd" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {debtorsLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando fila...</div>
        ) : debtors.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
            Nenhum devedor encontrado.
          </div>
        ) : (
          debtors.map((debt) => (
            <div
              key={`${debt.uc}_${debt.personCode}`}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/50 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    UC {debt.uc}
                  </span>
                  <span className="text-sm font-black text-rose-600">
                    R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 truncate" title={debt.name}>
                  {debt.name || 'Sem nome'}
                </h3>
                {debt.address && (
                  <p
                    className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate"
                    title={debt.address}
                  >
                    <MapPin className="w-3 h-3 shrink-0" /> {debt.address}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleAtender(debt)}
                className="shrink-0 w-full sm:w-auto shadow-sm"
              >
                Atender Cliente
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        {renderPagination(debtorsPage, setDebtorsPage, debtorsCount, debtorsPageSize)}
      </div>
    </div>
  )

  const renderAttendedQueue = () => (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-4 border-b bg-white shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Fila de Atendimento
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={attendedOperator}
            onValueChange={(v) => {
              setAttendedOperator(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-full h-10 rounded-xl bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  <SelectValue placeholder="Filtrar Atendente" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Atendentes</SelectItem>
              {operators.map((op) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.first_name
                    ? `${op.first_name} ${op.last_name || ''}`.trim()
                    : op.name || 'Sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={contactsPageSize}
            onValueChange={(v) => {
              setContactsPageSize(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[90px] h-10 rounded-xl bg-white border-slate-200 shadow-sm shrink-0">
              <SelectValue placeholder="Qtd" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {contactsLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando fila...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
            Nenhum atendimento registrado.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: contact.profiles?.color || '#94a3b8' }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {contact.profiles?.first_name || contact.profiles?.name || 'Operador'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(parseISO(contact.created_at), 'dd/MM/yy HH:mm')}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  UC {contact.uc}
                </span>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {contact.contact_type || 'Contato'}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                {contact.notes || 'Sem observações.'}
              </p>
              {contact.status && (
                <div className="mt-2 text-[10px] font-medium text-slate-500">
                  Status: <span className="font-semibold text-slate-700">{contact.status}</span>
                </div>
              )}
            </div>
          ))
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
      <div className="shrink-0">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Fila Rápida</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Gestão ágil de devedores e histórico de atendimentos.
        </p>
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
            className="border rounded-xl shadow-sm bg-white overflow-hidden h-full"
          >
            <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-white">
              {renderDebtorsQueue()}
            </ResizablePanel>
            <ResizableHandle withHandle />
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
