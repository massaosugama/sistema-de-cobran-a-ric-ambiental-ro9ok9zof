import { useState, useEffect } from 'react'
import {
  CalendarIcon,
  Send,
  Sparkles,
  CheckSquare,
  Phone,
  Eye,
  AlertTriangle,
  Search,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { addContact } from '@/services/data'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { getDebtByUc, type ParsedDebt } from '@/services/debts'
import { CustomerHeader } from './CustomerHeader'
import { CustomerInfo } from './CustomerInfo'
import { CustomerTimeline } from './CustomerTimeline'

export function CustomerActionForm({
  customer,
  isSheet,
  onClose,
  initialDate,
}: {
  customer: ParsedDebt
  isSheet?: boolean
  onClose?: () => void
  initialDate?: Date
}) {
  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [channel, setChannel] = useState('TEL ATIVO')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  const [phoneStatuses, setPhoneStatuses] = useState<
    Record<string, 'a_verificar' | 'validado' | 'invalido' | undefined>
  >({})
  const [talkedToOwner, setTalkedToOwner] = useState<boolean | null>(null)
  const [unknownProperty, setUnknownProperty] = useState<boolean | null>(null)
  const [responsibleForOtherUc, setResponsibleForOtherUc] = useState<boolean | null>(null)
  const [generateUpdate, setGenerateUpdate] = useState<boolean | null>(null)
  const [updateNotes, setUpdateNotes] = useState('')

  const [showErrors, setShowErrors] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cadastralRules, setCadastralRules] = useState({
    phones: false,
    talkedToOwner: false,
    unknownProperty: false,
    responsibleForOtherUc: false,
    generateUpdate: false,
  })
  const [isSearchUcSheetOpen, setIsSearchUcSheetOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [searchResults, setSearchResults] = useState<(ParsedDebt & { address?: string })[] | null>(
    null,
  )
  const [searchedCustomer, setSearchedCustomer] = useState<ParsedDebt | null>(null)
  const [isSearchingUc, setIsSearchingUc] = useState(false)
  const [isLoadingFullCustomer, setIsLoadingFullCustomer] = useState(false)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)

  const { toast } = useToast()
  const { user, profile } = useAuth()

  const isConsultas = profile?.role === 'consultas'

  const handleAdvancedSearch = async (termParam?: string, addressParam?: string) => {
    const term = (termParam !== undefined ? termParam : searchTerm).trim()
    const address = (addressParam !== undefined ? addressParam : searchAddress).trim()

    if (term.length < 3 && address.length < 3) {
      toast({
        title: 'Aviso',
        description: 'Digite pelo menos 3 caracteres para buscar.',
        variant: 'destructive',
      })
      return
    }

    setIsSearchingUc(true)
    try {
      let q = supabase.from('pending_debts').select('*')

      if (term) {
        const orConditions = [
          `uc.ilike.%${term}%`,
          `pessoa_fatura_nome.ilike.%${term}%`,
          `pessoa_fatura_cpf_cnpj.ilike.%${term}%`,
          `proprietario_nome.ilike.%${term}%`,
          `proprietario_cpf_cnpj.ilike.%${term}%`,
          `responsavel_nome.ilike.%${term}%`,
          `responsavel_cpf_cnpj.ilike.%${term}%`,
        ].join(',')
        q = q.or(orConditions)
      }

      if (address) {
        q = q.ilike('endereco', `%${address}%`)
      }

      const { data, error } = await q.limit(200)

      if (error) throw error

      if (data && data.length > 0) {
        const grouped = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.uc]) acc[curr.uc] = []
          acc[curr.uc].push(curr)
          return acc
        }, {})

        const ucs = Object.keys(grouped)
        const { data: contactsData } = await supabase
          .from('contact_history')
          .select('uc, profiles(first_name, name)')
          .in('uc', ucs)
          .order('created_at', { ascending: false })

        const operatorsByUc: Record<string, string[]> = {}
        contactsData?.forEach((c: any) => {
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
          const name = profile?.first_name || profile?.name?.split(' ')[0] || 'OP'
          if (!operatorsByUc[c.uc]) operatorsByUc[c.uc] = []
          if (!operatorsByUc[c.uc].includes(name)) operatorsByUc[c.uc].push(name)
        })

        const parsedResults: (ParsedDebt & { address?: string; recentOperators?: string[] })[] =
          Object.values(grouped).map((group: any) => {
            const first = group[0]
            return {
              uc: first.uc,
              personCode: first.cod_pess_fat,
              name:
                first.pessoa_fatura_nome ||
                first.proprietario_nome ||
                first.responsavel_nome ||
                'Cliente não identificado',
              address: first.endereco,
              phones: [],
              totalDebt: group.reduce(
                (acc: number, curr: any) => acc + (Number(curr.valor_total) || 0),
                0,
              ),
              valorVencido: group.reduce(
                (acc: number, curr: any) => acc + (Number(curr.valor_vencido) || 0),
                0,
              ),
              valorAVencer: group.reduce(
                (acc: number, curr: any) => acc + (Number(curr.valor_a_vencer) || 0),
                0,
              ),
              invoices: group.map((d: any) => ({
                ref: d.refs || '',
                value: Number(d.valor_total) || 0,
                dueDate: '',
                status: d.situ_docto || '',
              })),
              isLoteVago: first.setor === '4036',
              recentOperators: operatorsByUc[first.uc]?.slice(0, 3) || [],
            }
          })
        setSearchResults(parsedResults)
      } else {
        setSearchResults([])
        toast({
          title: 'Nenhum resultado',
          description: 'Não encontramos nenhuma UC com os termos informados.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsSearchingUc(false)
    }
  }

  useEffect(() => {
    if (isSearchUcSheetOpen) {
      if (debouncedSearchTerm.length >= 3 || debouncedSearchAddress.length >= 3) {
        handleAdvancedSearch(debouncedSearchTerm, debouncedSearchAddress)
      } else if (debouncedSearchTerm.length === 0 && debouncedSearchAddress.length === 0) {
        setSearchResults(null)
      }
    }
  }, [debouncedSearchTerm, debouncedSearchAddress, isSearchUcSheetOpen])

  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'cadastral_quality_params')
        .single()
      if (data?.value) {
        if (data.value.required !== undefined && data.value.phones === undefined) {
          setCadastralRules({
            phones: !!data.value.required,
            talkedToOwner: !!data.value.required,
            unknownProperty: !!data.value.required,
            responsibleForOtherUc: !!data.value.required,
            generateUpdate: !!data.value.required,
          })
        } else {
          setCadastralRules({
            phones: !!data.value.phones,
            talkedToOwner: !!data.value.talkedToOwner,
            unknownProperty: !!data.value.unknownProperty,
            responsibleForOtherUc: !!data.value.responsibleForOtherUc,
            generateUpdate: !!data.value.generateUpdate,
          })
        }
      }
    }
    fetchRules()
  }, [])

  useEffect(() => {
    if (customer.phones && customer.phones.length > 0) {
      const initial: Record<string, 'a_verificar' | 'validado' | 'invalido'> = {}
      customer.phones.forEach((p) => {
        initial[p.number] = p.status
      })
      setPhoneStatuses(initial)
    }
  }, [customer])

  const isPhoneChannel = channel.includes('TEL') || channel.includes('WTK')
  const hasPhones = customer.phones && customer.phones.length > 0

  const handleSelectSearchedCustomer = async (res: any) => {
    setIsLoadingFullCustomer(true)
    setSearchedCustomer(res)
    try {
      const fullCustomer = await getDebtByUc(res.uc, res.personCode)
      if (fullCustomer) {
        setSearchedCustomer({ ...fullCustomer, address: res.address || fullCustomer.address })
      }
    } catch (error) {
      console.error('Error fetching full customer details:', error)
    } finally {
      setIsLoadingFullCustomer(false)
    }
  }

  const fieldErrors = {
    status: !status,
    notes: status === 'Outro' && !notes.trim(),
    phones:
      cadastralRules.phones &&
      isPhoneChannel &&
      hasPhones &&
      !Object.values(phoneStatuses).some((s) => s === 'validado' || s === 'invalido'),
    talkedToOwner: cadastralRules.talkedToOwner && talkedToOwner === null,
    unknownProperty: cadastralRules.unknownProperty && unknownProperty === null,
    responsibleForOtherUc: cadastralRules.responsibleForOtherUc && responsibleForOtherUc === null,
    generateUpdate: cadastralRules.generateUpdate && generateUpdate === null,
    updateNotes: generateUpdate === true && !updateNotes.trim(),
  }

  const isError = (field: keyof typeof fieldErrors) => {
    return (showErrors || touched[field]) && fieldErrors[field]
  }

  const handleTouch = (field: string) => {
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }))
    }
  }

  const handleSave = async () => {
    if (isConsultas) return

    const hasError = Object.values(fieldErrors).some((err) => err)

    if (hasError) {
      setShowErrors(true)
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios destacados em vermelho.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const contactData = {
        uc: customer.uc,
        cod_pess_fat: customer.personCode,
        operator_id: user?.id,
        contact_type: channel,
        status,
        quality_result: JSON.stringify({
          phoneStatuses,
          talkedToOwner,
          unknownProperty,
          responsibleForOtherUc,
        }),
        notes,
        snapshot_valor_total: customer.totalDebt,
        snapshot_valor_vencido: customer.valorVencido,
        snapshot_valor_a_vencer: customer.valorAVencer,
        snapshot_qt_fats: customer.invoices.length,
        snapshot_refs: customer.invoices.map((i) => i.ref).join(' '),
      }

      const taskData = date
        ? {
            uc: customer.uc,
            cod_pess_fat: customer.personCode,
            operator_id: user?.id,
            action: `Retorno de ${status}`,
            due_date: format(date, 'yyyy-MM-dd'),
          }
        : undefined

      await addContact(contactData, taskData)

      if (generateUpdate) {
        const { error: updateError } = await supabase.from('cadastral_updates').insert({
          uc: customer.uc,
          cod_pess_fat: customer.personCode,
          customer_name: customer.name,
          requester_id: user?.id,
          notes: updateNotes,
          status: 'pending',
        })
        if (updateError) {
          console.error('Error creating cadastral update', updateError)
        }
      }

      toast({
        title: 'Contato Registrado com Sucesso!',
        description: 'Esforço contabilizado (+1 ponto). Acompanhe o resultado.',
        className: 'bg-white border-slate-200',
        action: (
          <div className="flex items-center gap-1.5 text-[#ff8c00] font-bold bg-orange-50 px-3 py-1 rounded-full">
            <Sparkles className="h-4 w-4" /> +1 pt
          </div>
        ),
      })

      setStatus('')
      setNotes('')
      setDate(undefined)
      setTalkedToOwner(null)
      setUnknownProperty(null)
      setResponsibleForOtherUc(null)
      setGenerateUpdate(null)
      setUpdateNotes('')
      setShowErrors(false)
      setTouched({})

      setTimeout(() => {
        if (isSheet) {
          window.dispatchEvent(new CustomEvent('contact-added', { detail: { uc: customer.uc } }))
          if (onClose) onClose()
        } else {
          window.location.reload()
        }
      }, 500)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      className={cn(
        'border-slate-200 shadow-md rounded-2xl overflow-hidden',
        !isSheet && 'sticky top-24',
      )}
    >
      <CardHeader
        className={cn(
          'border-b pb-4',
          customer.isLoteVago ? 'bg-amber-50/60 border-amber-100' : 'bg-white border-slate-100',
        )}
      >
        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
          <div
            className={cn(
              'p-2 rounded-xl',
              customer.isLoteVago ? 'bg-amber-100/80' : 'bg-primary/10',
            )}
          >
            <CheckSquare
              className={cn('w-5 h-5', customer.isLoteVago ? 'text-amber-600' : 'text-primary')}
            />
          </div>
          Registrar Atendimento
        </CardTitle>
        {customer.isLoteVago && (
          <div className="mt-4 bg-amber-100 text-amber-800 p-3 rounded-xl flex items-start gap-2.5 text-sm font-medium border border-amber-200 shadow-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-relaxed">
              <strong>Atenção:</strong> Esta UC pertence a um{' '}
              <strong>Lote Vago (Setor 4036)</strong>. A cobrança está suspensa devido a litígio.
              Registre o atendimento apenas se estritamente necessário.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-6 bg-white">
        {isConsultas && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4 shrink-0" /> Seu perfil tem permissão apenas de leitura.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2.5">
            <Label className="font-bold text-slate-700">Canal de Contato</Label>
            <Select
              value={channel}
              onValueChange={setChannel}
              disabled={isSubmitting || isConsultas}
            >
              <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50 font-medium">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="TEL ATIVO">Telefone Ativo</SelectItem>
                <SelectItem value="TEL PASSIVO">Telefone Passivo</SelectItem>
                <SelectItem value="WTK ATIVO">WhatsApp Ativo</SelectItem>
                <SelectItem value="WTK PASSIVO">WhatsApp Passivo</SelectItem>
                <SelectItem value="E-MAIL">E-mail</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            className={cn(
              'space-y-2.5 rounded-xl transition-all',
              isError('status') && 'p-2 -m-2 border border-red-500 bg-red-50/50',
            )}
          >
            <Label
              className={cn(
                'font-bold flex items-center gap-1.5',
                isError('status') ? 'text-red-500' : 'text-slate-700',
              )}
            >
              Resultado <span className="text-red-500">*</span>
              {isError('status') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                handleTouch('status')
              }}
              onOpenChange={(open) => {
                if (!open) handleTouch('status')
              }}
              disabled={isSubmitting || isConsultas}
            >
              <SelectTrigger
                className={cn(
                  'rounded-xl border-slate-200 h-11 font-medium',
                  isError('status') ? 'bg-white border-red-500 ring-1 ring-red-500' : 'bg-slate-50',
                )}
              >
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Promessa de Pagamento">Promessa de Pagamento</SelectItem>
                <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                <SelectItem value="Já Pagou / Quitou">Já Pagou / Quitou</SelectItem>
                <SelectItem value="Recusa">Recusa/Sem Condições</SelectItem>
                <SelectItem value="Desconhece Dívida">Desconhece Dívida</SelectItem>
                <SelectItem value="Outro">Outro (Especificar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'Desconhece Dívida' && (
            <div className="pt-2 animate-fade-in-up transition-all w-full col-span-1 sm:col-span-2">
              <div className="bg-indigo-50/80 border border-indigo-100 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
                <Label className="font-bold text-indigo-900 flex items-center gap-2 text-base">
                  <MapPin className="w-5 h-5 text-indigo-600" /> É responsável por outra UC?
                </Label>
                <p className="text-sm text-indigo-700/80 font-medium leading-relaxed">
                  Se o contato informou que reside em outro endereço, busque a nova UC para
                  registrar a atualização cadastral e o histórico de atendimento.
                </p>
                <Button
                  type="button"
                  onClick={() => setIsSearchUcSheetOpen(true)}
                  className="w-full sm:w-auto self-start bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-1 rounded-xl h-11"
                >
                  <Search className="w-4 h-4 mr-2" /> Buscar Nova UC
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="space-y-2.5 w-full sm:w-1/2">
            <Label className="font-bold text-slate-700">Agendar Próxima Ação</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  disabled={isSubmitting || isConsultas}
                  className={`w-full justify-start text-left font-medium h-11 rounded-xl border-slate-200 bg-slate-50 ${!date && 'text-slate-400'}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date ? format(date, 'PPP', { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl border-slate-200 shadow-xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    setDate(newDate)
                    setIsCalendarOpen(false)
                  }}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div
            className={cn(
              'space-y-2.5 rounded-xl transition-all w-full flex flex-col',
              isError('notes') && 'p-2 -m-2 border border-red-500 bg-red-50/50',
            )}
          >
            <Label
              className={cn(
                'font-bold flex-shrink-0 flex items-center gap-1.5',
                isError('notes') ? 'text-red-500' : 'text-slate-700',
              )}
            >
              Observações {status === 'Outro' && <span className="text-red-500">*</span>}
              {isError('notes') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
              }}
              onBlur={() => handleTouch('notes')}
              disabled={isSubmitting || isConsultas}
              placeholder="Detalhe o acordo, objeções ou motivo de insucesso..."
              className={cn(
                'resize-none rounded-xl border-slate-200 font-medium placeholder:text-slate-400 flex-1',
                isError('notes')
                  ? 'bg-white border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500'
                  : 'bg-slate-50',
                !showErrors && !touched.notes ? 'min-h-[44px]' : '',
              )}
            />
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-5">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Qualidade Cadastral
            <div className="h-px flex-1 bg-slate-200"></div>
          </h4>

          <div
            className={cn(
              'space-y-3 rounded-xl transition-all',
              isError('phones') && 'p-3 -m-3 border border-red-500 bg-red-50/50',
            )}
          >
            <Label
              className={cn(
                'font-semibold text-sm flex items-center gap-1.5',
                isError('phones') ? 'text-red-500' : 'text-slate-700',
              )}
            >
              Status dos Telefones{' '}
              {cadastralRules.phones && isPhoneChannel && hasPhones && (
                <span className="text-red-500">*</span>
              )}
              {isError('phones') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            </Label>

            {hasPhones ? (
              <div className="space-y-3">
                {customer.phones.map((phone, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-sm"
                  >
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {phone.number}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isConsultas}
                        onClick={() => {
                          setPhoneStatuses({
                            ...phoneStatuses,
                            [phone.number]:
                              phoneStatuses[phone.number] === 'a_verificar'
                                ? undefined
                                : 'a_verificar',
                          })
                          handleTouch('phones')
                        }}
                        className={cn(
                          'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1',
                          phoneStatuses[phone.number] === 'a_verificar' &&
                            'bg-amber-50 border-amber-300 text-amber-800 shadow-sm ring-1 ring-amber-300',
                          isConsultas && 'cursor-not-allowed opacity-70',
                        )}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          A verificar
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={isConsultas}
                        onClick={() => {
                          setPhoneStatuses({
                            ...phoneStatuses,
                            [phone.number]:
                              phoneStatuses[phone.number] === 'validado' ? undefined : 'validado',
                          })
                          handleTouch('phones')
                        }}
                        className={cn(
                          'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1',
                          phoneStatuses[phone.number] === 'validado' &&
                            'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm ring-1 ring-emerald-300',
                          isConsultas && 'cursor-not-allowed opacity-70',
                        )}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-inner"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Validado
                        </span>
                      </button>
                      <button
                        type="button"
                        disabled={isConsultas}
                        onClick={() => {
                          setPhoneStatuses({
                            ...phoneStatuses,
                            [phone.number]:
                              phoneStatuses[phone.number] === 'invalido' ? undefined : 'invalido',
                          })
                          handleTouch('phones')
                        }}
                        className={cn(
                          'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1',
                          phoneStatuses[phone.number] === 'invalido' &&
                            'bg-rose-50 border-rose-300 text-rose-800 shadow-sm ring-1 ring-rose-300',
                          isConsultas && 'cursor-not-allowed opacity-70',
                        )}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-inner"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Inválido
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-2">Nenhum telefone registrado.</div>
            )}
          </div>

          <div
            className={cn(
              'flex flex-col gap-3 pt-4 border-t border-slate-200 rounded-xl transition-all',
              isError('talkedToOwner') && 'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1.5',
                  isError('talkedToOwner') ? 'text-red-500' : 'text-slate-700',
                )}
              >
                Falei com o Titular?{' '}
                {cadastralRules.talkedToOwner && <span className="text-red-500">*</span>}
                {isError('talkedToOwner') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={talkedToOwner === true ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    talkedToOwner === true &&
                      'bg-primary text-primary-foreground shadow-sm border-transparent',
                    isError('talkedToOwner') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setTalkedToOwner(talkedToOwner === true ? null : true)
                    handleTouch('talkedToOwner')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={talkedToOwner === false ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    talkedToOwner === false &&
                      'bg-rose-500 hover:bg-rose-600 text-white shadow-sm border-transparent',
                    isError('talkedToOwner') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setTalkedToOwner(talkedToOwner === false ? null : false)
                    handleTouch('talkedToOwner')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Não
                </Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'flex flex-col gap-3 pt-4 border-t border-slate-200 rounded-xl transition-all',
              isError('unknownProperty') &&
                'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1.5',
                  isError('unknownProperty') ? 'text-red-500' : 'text-slate-700',
                )}
              >
                A pessoa desconhece o imóvel?{' '}
                {cadastralRules.unknownProperty && <span className="text-red-500">*</span>}
                {isError('unknownProperty') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={unknownProperty === true ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    unknownProperty === true &&
                      'bg-rose-500 hover:bg-rose-600 text-white shadow-sm border-transparent',
                    isError('unknownProperty') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setUnknownProperty(unknownProperty === true ? null : true)
                    handleTouch('unknownProperty')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={unknownProperty === false ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    unknownProperty === false &&
                      'bg-primary text-primary-foreground shadow-sm border-transparent',
                    isError('unknownProperty') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setUnknownProperty(unknownProperty === false ? null : false)
                    handleTouch('unknownProperty')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Não
                </Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'flex flex-col gap-3 pt-4 border-t border-slate-200 rounded-xl transition-all',
              isError('responsibleForOtherUc') &&
                'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1.5',
                  isError('responsibleForOtherUc') ? 'text-red-500' : 'text-slate-700',
                )}
              >
                É responsável por outra UC?{' '}
                {cadastralRules.responsibleForOtherUc && <span className="text-red-500">*</span>}
                {isError('responsibleForOtherUc') && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={responsibleForOtherUc === true ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    responsibleForOtherUc === true &&
                      'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm border-transparent',
                    isError('responsibleForOtherUc') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setResponsibleForOtherUc(responsibleForOtherUc === true ? null : true)
                    handleTouch('responsibleForOtherUc')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={responsibleForOtherUc === false ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    responsibleForOtherUc === false &&
                      'bg-primary text-primary-foreground shadow-sm border-transparent',
                    isError('responsibleForOtherUc') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setResponsibleForOtherUc(responsibleForOtherUc === false ? null : false)
                    handleTouch('responsibleForOtherUc')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Não
                </Button>
              </div>
            </div>
            {responsibleForOtherUc === true && (
              <div className="pt-2 animate-fade-in-up transition-all w-full">
                <div className="bg-indigo-50/80 border border-indigo-100 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
                  <p className="text-sm text-indigo-700/80 font-medium leading-relaxed">
                    Busque a nova UC para registrar a atualização cadastral e o histórico de
                    atendimento.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsSearchUcSheetOpen(true)}
                    className="w-full sm:w-auto self-start bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-1 rounded-xl h-11"
                  >
                    <Search className="w-4 h-4 mr-2" /> Buscar Nova UC
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              'flex flex-col gap-3 pt-4 border-t border-slate-200 rounded-xl transition-all',
              isError('generateUpdate') &&
                'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1.5',
                  isError('generateUpdate') ? 'text-red-500' : 'text-slate-700',
                )}
              >
                Gerar registro para Atualizações Cadastrais?{' '}
                {cadastralRules.generateUpdate && <span className="text-red-500">*</span>}
                {isError('generateUpdate') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={generateUpdate === true ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    generateUpdate === true &&
                      'bg-primary text-primary-foreground shadow-sm border-transparent',
                    isError('generateUpdate') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setGenerateUpdate(generateUpdate === true ? null : true)
                    handleTouch('generateUpdate')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={generateUpdate === false ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 px-4 rounded-lg transition-all',
                    generateUpdate === false &&
                      'bg-slate-500 hover:bg-slate-600 text-white shadow-sm border-transparent',
                    isError('generateUpdate') && 'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setGenerateUpdate(generateUpdate === false ? null : false)
                    handleTouch('generateUpdate')
                  }}
                  disabled={isSubmitting || isConsultas}
                >
                  Não
                </Button>
              </div>
            </div>
          </div>

          {generateUpdate && (
            <div
              className={cn(
                'pt-4 border-t border-slate-200 space-y-2.5 animate-fade-in-up rounded-xl transition-all',
                isError('updateNotes') && 'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
              )}
            >
              <Label
                className={cn(
                  'font-bold flex items-center gap-1.5',
                  isError('updateNotes') ? 'text-red-500' : 'text-slate-700',
                )}
              >
                Observações para Cadastro <span className="text-red-500">*</span>
                {isError('updateNotes') && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              </Label>
              <Textarea
                value={updateNotes}
                onChange={(e) => {
                  setUpdateNotes(e.target.value)
                }}
                onBlur={() => handleTouch('updateNotes')}
                disabled={isSubmitting || isConsultas}
                placeholder="Dicas do que exatamente a equipe precisa fazer..."
                className={cn(
                  'resize-none min-h-[80px] rounded-xl border-slate-200 bg-white font-medium placeholder:text-slate-400',
                  isError('updateNotes') &&
                    'border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500',
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
      {isSearchUcSheetOpen && (
        <Sheet open={isSearchUcSheetOpen} onOpenChange={setIsSearchUcSheetOpen}>
          <SheetContent
            side="right"
            className={cn(
              'w-full overflow-y-auto p-0 flex flex-col bg-slate-50 border-l-0 shadow-2xl transition-all duration-300',
              searchedCustomer
                ? 'sm:max-w-none md:max-w-none lg:max-w-[85vw] xl:max-w-[1200px] sm:p-6'
                : 'sm:max-w-2xl',
            )}
          >
            {!searchedCustomer ? (
              <SheetHeader className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm">
                <SheetTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  Buscar Nova UC
                </SheetTitle>
                <SheetDescription className="text-slate-500 font-medium mt-1">
                  Localize a UC correta para transferir o atendimento e solicitar a atualização
                  cadastral.
                </SheetDescription>

                <div className="flex flex-col gap-3 mt-5">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      placeholder="UC, Nome ou CPF/C..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="h-11 rounded-xl bg-slate-50 focus:bg-white border-slate-200 text-base transition-colors"
                    />
                    <Input
                      placeholder="Filtre por Endereço..."
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="h-11 rounded-xl bg-slate-50 focus:bg-white border-slate-200 text-base transition-colors"
                    />
                    <Button
                      onClick={() => handleAdvancedSearch()}
                      disabled={
                        isSearchingUc || (searchTerm.length < 3 && searchAddress.length < 3)
                      }
                      className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold w-full sm:w-auto"
                    >
                      {isSearchingUc ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                  {searchTerm.length > 0 &&
                    searchTerm.length < 3 &&
                    (searchAddress.length === 0 || searchAddress.length < 3) && (
                      <span className="text-xs text-slate-500 font-medium">
                        Digite pelo menos 3 caracteres em algum campo para buscar.
                      </span>
                    )}
                </div>
              </SheetHeader>
            ) : (
              <div className="sr-only">
                <SheetTitle>Buscar Nova UC</SheetTitle>
                <SheetDescription>Detalhes da UC selecionada</SheetDescription>
              </div>
            )}
            <div className={cn('flex-1', searchedCustomer ? 'p-0 sm:p-0' : 'p-6 bg-slate-50/50')}>
              {searchedCustomer ? (
                <div className="space-y-6 pb-20 md:pb-0 px-4 sm:px-0 animate-in fade-in duration-300 py-6 sm:py-0">
                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setSearchedCustomer(null)}
                      className="h-9 rounded-lg text-slate-600 border-slate-200 hover:bg-slate-50 bg-white"
                    >
                      &larr; Voltar aos resultados
                    </Button>
                  </div>

                  {isLoadingFullCustomer ? (
                    <div className="p-10 text-center text-slate-500 font-medium animate-pulse mt-10">
                      Carregando dados da UC...
                    </div>
                  ) : (
                    <>
                      <CustomerHeader
                        customer={searchedCustomer}
                        isSheet={true}
                        onClose={() => setIsSearchUcSheetOpen(false)}
                        parentCustomer={customer}
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-3 space-y-6">
                          <CustomerInfo customer={searchedCustomer} />
                        </div>
                        <div className="lg:col-span-5 h-[calc(100vh-220px)] lg:sticky lg:top-0 overflow-y-auto pr-2 rounded-lg border bg-white shadow-sm">
                          <CustomerTimeline customer={searchedCustomer} />
                        </div>
                        <div className="lg:col-span-4 space-y-6 h-auto">
                          <CustomerActionForm
                            customer={searchedCustomer}
                            isSheet={true}
                            onClose={() => setIsSearchUcSheetOpen(false)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-3 animate-fade-in-up pb-10">
                  <h4 className="text-sm font-bold text-slate-500 mb-4">
                    {searchResults.length} resultado(s) encontrado(s)
                  </h4>
                  {searchResults.map((res) => (
                    <div
                      key={res.uc}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-colors group cursor-pointer"
                      onClick={() => handleSelectSearchedCustomer(res)}
                    >
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 flex items-center gap-1.5 text-base">
                            <MapPin className="w-4 h-4 text-indigo-500" /> UC {res.uc}
                          </span>
                          {res.isLoteVago && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Lote Vago
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-slate-600 truncate">
                          {res.name}
                        </span>
                        {res.address && (
                          <span className="text-xs font-medium text-slate-400 line-clamp-1">
                            {res.address}
                          </span>
                        )}
                        {res.recentOperators && res.recentOperators.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {res.recentOperators.map((op, idx) => (
                              <Badge
                                key={idx}
                                className={cn(
                                  'w-fit text-[9px] px-1.5 py-0 uppercase tracking-wider shadow-none hover:opacity-80 transition-opacity',
                                  idx === 0
                                    ? 'bg-slate-600 text-white'
                                    : idx === 1
                                      ? 'bg-slate-400 text-white'
                                      : 'bg-slate-300 text-slate-700',
                                )}
                                title={`Atendido por: ${op}`}
                              >
                                {typeof op === 'string' ? op.slice(0, 4) : ''}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectSearchedCustomer(res)
                        }}
                        className="shrink-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 py-16">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-500 text-center max-w-xs leading-relaxed">
                    {isSearchingUc
                      ? 'Buscando...'
                      : 'Busque por UC, Nome, CPF/C ou Endereço para localizar o imóvel correto.'}
                  </p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      <CardFooter className="bg-slate-50/80 border-t border-slate-100 p-6 flex flex-col gap-3">
        <Button
          onClick={handleSave}
          disabled={isSubmitting || isConsultas}
          className="w-full h-12 text-base font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
        >
          {isConsultas ? (
            <>
              <Eye className="mr-2 h-4 w-4" /> Apenas Leitura
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />{' '}
              {isSubmitting ? 'Salvando...' : 'Salvar Atendimento'}
            </>
          )}
        </Button>
        {isSheet && onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 font-semibold border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all rounded-xl"
          >
            Sair
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
