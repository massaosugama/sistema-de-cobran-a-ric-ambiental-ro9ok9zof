import { useEffect, useState } from 'react'
import { Phone, UserCheck } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: any
  customer: any
  mode: 'view' | 'edit'
  onSave: (data: any) => void
}

export function CustomerTimelineEditDialog({
  open,
  onOpenChange,
  contact,
  customer,
  mode,
  onSave,
}: DialogProps) {
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [phoneStatuses, setPhoneStatuses] = useState<
    Record<string, 'a_verificar' | 'validado' | 'invalido'>
  >({})
  const [talkedToOwner, setTalkedToOwner] = useState(false)

  const isView = mode === 'view'

  useEffect(() => {
    if (contact) {
      setChannel(contact.type || '')
      setStatus(contact.status || '')
      setNotes(contact.note || '')
      setTalkedToOwner(!!contact.talkedToOwner)

      const initialPhones: Record<string, any> = {}
      if (customer?.phones && customer.phones.length > 0) {
        customer.phones.forEach((p: any) => {
          initialPhones[p.number] =
            contact.qualityResult?.phoneStatuses?.[p.number] || 'a_verificar'
        })
      } else if (contact.qualityResult?.phoneStatuses) {
        Object.entries(contact.qualityResult.phoneStatuses).forEach(([num, st]) => {
          initialPhones[num] = st
        })
      }
      setPhoneStatuses(initialPhones)
    }
  }, [contact, customer])

  const handleSave = () => {
    onSave({
      contact_type: channel,
      status,
      notes,
      quality_result: JSON.stringify({ phoneStatuses, talkedToOwner }),
    })
  }

  const phonesList =
    customer?.phones && customer.phones.length > 0
      ? customer.phones.map((p: any) => p.number)
      : Object.keys(phoneStatuses)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto bg-slate-50 border-l shadow-2xl p-0 flex flex-col h-full">
        <div className="p-6 bg-white border-b border-slate-100 flex-shrink-0">
          <SheetHeader>
            <SheetTitle className="text-xl font-black text-slate-900">
              {isView ? 'Consultar Atendimento' : 'Alterar Atendimento'}
            </SheetTitle>
            <SheetDescription>
              {isView
                ? 'Visualize os detalhes do atendimento registrado.'
                : 'Edite os campos abaixo para atualizar o registro de atendimento.'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2.5">
              <Label className="font-bold text-slate-700">Canal de Contato</Label>
              <Select disabled={isView} value={channel} onValueChange={setChannel}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-medium">
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

            <div className="space-y-2.5">
              <Label className="font-bold text-slate-700">Resultado</Label>
              <Select disabled={isView} value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white font-medium">
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

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                Qualidade Cadastral
                <div className="h-px flex-1 bg-slate-100"></div>
              </h4>

              <div className="space-y-3">
                <Label className="font-semibold text-sm text-slate-700">Status dos Telefones</Label>
                {phonesList.length > 0 ? (
                  <div className="space-y-3">
                    {phonesList.map((phoneNumber: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                      >
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {phoneNumber}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isView}
                            onClick={() =>
                              setPhoneStatuses({ ...phoneStatuses, [phoneNumber]: 'a_verificar' })
                            }
                            className={cn(
                              'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1 disabled:opacity-50 disabled:cursor-not-allowed',
                              phoneStatuses[phoneNumber] === 'a_verificar' &&
                                'bg-amber-50 border-amber-300 text-amber-800 shadow-sm ring-1 ring-amber-300',
                            )}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              A verificar
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={isView}
                            onClick={() =>
                              setPhoneStatuses({ ...phoneStatuses, [phoneNumber]: 'validado' })
                            }
                            className={cn(
                              'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1 disabled:opacity-50 disabled:cursor-not-allowed',
                              phoneStatuses[phoneNumber] === 'validado' &&
                                'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm ring-1 ring-emerald-300',
                            )}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-inner"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Validado
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={isView}
                            onClick={() =>
                              setPhoneStatuses({ ...phoneStatuses, [phoneNumber]: 'invalido' })
                            }
                            className={cn(
                              'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1 disabled:opacity-50 disabled:cursor-not-allowed',
                              phoneStatuses[phoneNumber] === 'invalido' &&
                                'bg-rose-50 border-rose-300 text-rose-800 shadow-sm ring-1 ring-rose-300',
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
                  <div className="text-xs text-slate-500 italic p-2">
                    Nenhum telefone registrado para classificação.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-1.5 rounded-md">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <Label
                    htmlFor="achei-pessoa-edit"
                    className="cursor-pointer font-semibold text-sm text-slate-700"
                  >
                    Falei com o Titular?
                  </Label>
                </div>
                <Switch
                  id="achei-pessoa-edit"
                  disabled={isView}
                  checked={talkedToOwner}
                  onCheckedChange={setTalkedToOwner}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="font-bold text-slate-700">Observações</Label>
              <Textarea
                disabled={isView}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais..."
                className="resize-none min-h-[120px] rounded-xl border-slate-200 bg-white font-medium placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex-shrink-0 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 font-semibold rounded-xl"
          >
            {isView ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isView && (
            <Button
              onClick={handleSave}
              className="flex-1 h-11 font-semibold rounded-xl shadow-md shadow-primary/20"
            >
              Salvar Alterações
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
