import { useState, useEffect } from 'react'
import { CalendarIcon, Send, Sparkles, CheckSquare, Phone, Eye, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { addContact } from '@/services/data'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { ParsedDebt } from '@/services/debts'

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
    Record<string, 'a_verificar' | 'validado' | 'invalido'>
  >({})
  const [talkedToOwner, setTalkedToOwner] = useState<boolean | null>(null)
  const [unknownProperty, setUnknownProperty] = useState<boolean | null>(null)
  const [generateUpdate, setGenerateUpdate] = useState<boolean | null>(null)
  const [updateNotes, setUpdateNotes] = useState('')

  const [showErrors, setShowErrors] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requireCadastral, setRequireCadastral] = useState(false)
  const { toast } = useToast()
  const { user, profile } = useAuth()

  const isConsultas = profile?.role === 'consultas'

  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'cadastral_quality_params')
        .single()
      if (data?.value) {
        setRequireCadastral(data.value.required === true)
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

  const handleSave = async () => {
    if (isConsultas) return

    let hasError = false

    if (!status) hasError = true
    if (status === 'Outro' && !notes.trim()) hasError = true

    if (requireCadastral) {
      if (isPhoneChannel && hasPhones) {
        const hasValidOrInvalid = Object.values(phoneStatuses).some(
          (s) => s === 'validado' || s === 'invalido',
        )
        if (!hasValidOrInvalid) hasError = true
      }

      if (talkedToOwner === null) hasError = true
      if (unknownProperty === null) hasError = true
      if (generateUpdate === null) hasError = true
    }

    if (generateUpdate === true && !updateNotes.trim()) hasError = true

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
        quality_result: JSON.stringify({ phoneStatuses, talkedToOwner, unknownProperty }),
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
      setGenerateUpdate(null)
      setUpdateNotes('')
      setShowErrors(false)

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
    <Card className="border-slate-200 shadow-md sticky top-24 rounded-2xl overflow-hidden">
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
              showErrors && !status && 'p-2 -m-2 border border-red-500 bg-red-50/50',
            )}
          >
            <Label
              className={cn('font-bold', showErrors && !status ? 'text-red-500' : 'text-slate-700')}
            >
              Resultado <span className="text-red-500">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                setShowErrors(false)
              }}
              disabled={isSubmitting || isConsultas}
            >
              <SelectTrigger
                className={cn(
                  'rounded-xl border-slate-200 h-11 font-medium',
                  showErrors && !status
                    ? 'bg-white border-red-500 ring-1 ring-red-500'
                    : 'bg-slate-50',
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
              showErrors &&
                status === 'Outro' &&
                !notes.trim() &&
                'p-2 -m-2 border border-red-500 bg-red-50/50',
            )}
          >
            <Label
              className={cn(
                'font-bold flex-shrink-0',
                showErrors && status === 'Outro' && !notes.trim()
                  ? 'text-red-500'
                  : 'text-slate-700',
              )}
            >
              Observações {status === 'Outro' && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setShowErrors(false)
              }}
              disabled={isSubmitting || isConsultas}
              placeholder="Detalhe o acordo, objeções ou motivo de insucesso..."
              className={cn(
                'resize-none rounded-xl border-slate-200 font-medium placeholder:text-slate-400 flex-1',
                showErrors && status === 'Outro' && !notes.trim()
                  ? 'bg-white border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500'
                  : 'bg-slate-50',
                !showErrors ? 'min-h-[44px]' : '',
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
              showErrors &&
                requireCadastral &&
                isPhoneChannel &&
                hasPhones &&
                !Object.values(phoneStatuses).some((s) => s === 'validado' || s === 'invalido') &&
                'p-3 -m-3 border border-red-500 bg-red-50/50',
            )}
          >
            <Label
              className={cn(
                'font-semibold text-sm flex items-center gap-1',
                showErrors &&
                  requireCadastral &&
                  isPhoneChannel &&
                  hasPhones &&
                  !Object.values(phoneStatuses).some((s) => s === 'validado' || s === 'invalido')
                  ? 'text-red-500'
                  : 'text-slate-700',
              )}
            >
              Status dos Telefones{' '}
              {requireCadastral && isPhoneChannel && hasPhones && (
                <span className="text-red-500">*</span>
              )}
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
                          setPhoneStatuses({ ...phoneStatuses, [phone.number]: 'a_verificar' })
                          setShowErrors(false)
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
                          setPhoneStatuses({ ...phoneStatuses, [phone.number]: 'validado' })
                          setShowErrors(false)
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
                          setPhoneStatuses({ ...phoneStatuses, [phone.number]: 'invalido' })
                          setShowErrors(false)
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
              showErrors &&
                requireCadastral &&
                talkedToOwner === null &&
                'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1',
                  showErrors && requireCadastral && talkedToOwner === null
                    ? 'text-red-500'
                    : 'text-slate-700',
                )}
              >
                Falei com o Titular? {requireCadastral && <span className="text-red-500">*</span>}
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
                    showErrors &&
                      requireCadastral &&
                      talkedToOwner === null &&
                      'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setTalkedToOwner(true)
                    setShowErrors(false)
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
                    showErrors &&
                      requireCadastral &&
                      talkedToOwner === null &&
                      'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setTalkedToOwner(false)
                    setShowErrors(false)
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
              showErrors &&
                requireCadastral &&
                unknownProperty === null &&
                'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1',
                  showErrors && requireCadastral && unknownProperty === null
                    ? 'text-red-500'
                    : 'text-slate-700',
                )}
              >
                A pessoa desconhece o imóvel?{' '}
                {requireCadastral && <span className="text-red-500">*</span>}
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
                    showErrors &&
                      requireCadastral &&
                      unknownProperty === null &&
                      'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setUnknownProperty(true)
                    setShowErrors(false)
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
                    showErrors &&
                      requireCadastral &&
                      unknownProperty === null &&
                      'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setUnknownProperty(false)
                    setShowErrors(false)
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
              showErrors &&
                requireCadastral &&
                generateUpdate === null &&
                'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
            )}
          >
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  'font-semibold text-sm flex items-center gap-1',
                  showErrors && requireCadastral && generateUpdate === null
                    ? 'text-red-500'
                    : 'text-slate-700',
                )}
              >
                Gerar registro para Atualizações Cadastrais?{' '}
                {requireCadastral && <span className="text-red-500">*</span>}
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
                    showErrors &&
                      requireCadastral &&
                      generateUpdate === null &&
                      'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setGenerateUpdate(true)
                    setShowErrors(false)
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
                    showErrors &&
                      requireCadastral &&
                      generateUpdate === null &&
                      'border-red-500 bg-white',
                  )}
                  onClick={() => {
                    setGenerateUpdate(false)
                    setShowErrors(false)
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
                showErrors &&
                  generateUpdate &&
                  !updateNotes.trim() &&
                  'p-3 -mx-3 border-t-0 border border-red-500 bg-red-50/50',
              )}
            >
              <Label
                className={cn(
                  'font-bold',
                  showErrors && generateUpdate && !updateNotes.trim()
                    ? 'text-red-500'
                    : 'text-slate-700',
                )}
              >
                Observações para Cadastro <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={updateNotes}
                onChange={(e) => {
                  setUpdateNotes(e.target.value)
                  setShowErrors(false)
                }}
                disabled={isSubmitting || isConsultas}
                placeholder="Dicas do que exatamente a equipe precisa fazer..."
                className={cn(
                  'resize-none min-h-[80px] rounded-xl border-slate-200 bg-white font-medium placeholder:text-slate-400',
                  showErrors &&
                    generateUpdate &&
                    !updateNotes.trim() &&
                    'border-red-500 focus-visible:ring-red-500 ring-1 ring-red-500',
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
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
