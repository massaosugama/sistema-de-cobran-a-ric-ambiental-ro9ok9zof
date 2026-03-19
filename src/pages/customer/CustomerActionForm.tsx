import { useState } from 'react'
import { CalendarIcon, Send, Sparkles, CheckSquare } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { addContact } from '@/services/data'
import type { ParsedDebt } from '@/services/debts'

export function CustomerActionForm({ customer }: { customer: ParsedDebt }) {
  const [date, setDate] = useState<Date>()
  const [channel, setChannel] = useState('TEL ATIVO')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [validatePhone, setValidatePhone] = useState(false)
  const [talkedToOwner, setTalkedToOwner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSave = async () => {
    if (!status) {
      toast({
        title: 'Atenção',
        description: 'Selecione o resultado do contato.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const contactData = {
        uc: customer.uc,
        operator_id: user?.id,
        contact_type: channel,
        status,
        quality_result: JSON.stringify({ validatePhone, talkedToOwner }),
        notes,
      }

      const taskData = date
        ? {
            uc: customer.uc,
            operator_id: user?.id,
            action: `Retorno de ${status}`,
            due_date: format(date, 'yyyy-MM-dd'),
          }
        : undefined

      await addContact(contactData, taskData)

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

      // Reset form
      setStatus('')
      setNotes('')
      setDate(undefined)
      setValidatePhone(false)
      setTalkedToOwner(false)

      // Trigger a window reload or context refresh if desired
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-md sticky top-24 rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100 pb-4">
        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <CheckSquare className="w-5 h-5 text-primary" />
          </div>
          Registrar Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2.5">
            <Label className="font-bold text-slate-700">Canal de Contato</Label>
            <Select value={channel} onValueChange={setChannel}>
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
          <div className="space-y-2.5">
            <Label className="font-bold text-slate-700">Resultado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50 font-medium">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Promessa de Pagamento">Promessa de Pagamento</SelectItem>
                <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                <SelectItem value="Recusa">Recusa/Sem Condições</SelectItem>
                <SelectItem value="Desconhece Dívida">Desconhece Dívida</SelectItem>
                <SelectItem value="Outro">Outro (Especificar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-5">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Qualidade Cadastral
            <div className="h-px flex-1 bg-slate-200"></div>
          </h4>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="achei-telefone"
              className="cursor-pointer font-semibold text-sm text-slate-700"
            >
              Validar número atual?
            </Label>
            <Switch
              id="achei-telefone"
              checked={validatePhone}
              onCheckedChange={setValidatePhone}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="achei-pessoa"
              className="cursor-pointer font-semibold text-sm text-slate-700"
            >
              Falei com o Titular?
            </Label>
            <Switch
              id="achei-pessoa"
              checked={talkedToOwner}
              onCheckedChange={setTalkedToOwner}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="font-bold text-slate-700">Agendar Próxima Ação</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={`w-full justify-start text-left font-medium h-11 rounded-xl border-slate-200 bg-slate-50 ${!date && 'text-slate-400'}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? (
                  format(date, 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione uma data no calendário</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-xl border-slate-200 shadow-xl"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2.5">
          <Label className="font-bold text-slate-700">Observações (Obrigatório para 'Outro')</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalhe o acordo, objeções ou motivo de insucesso..."
            className="resize-none min-h-[110px] rounded-xl border-slate-200 bg-slate-50 font-medium placeholder:text-slate-400"
          />
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/80 border-t border-slate-100 p-6">
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full h-12 text-base font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Salvar Atendimento'}
        </Button>
      </CardFooter>
    </Card>
  )
}
