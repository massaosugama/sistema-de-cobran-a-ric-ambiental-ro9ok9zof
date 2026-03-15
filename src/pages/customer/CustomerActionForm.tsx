import { useState } from 'react'
import { CalendarIcon, Send, Sparkles } from 'lucide-react'
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
import type { Customer } from '@/lib/mock'

export function CustomerActionForm({ customer }: { customer: Customer }) {
  const [date, setDate] = useState<Date>()
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: 'Contato Registrado!',
      description: 'Esforço contabilizado (+1 ponto). Acompanhe o resultado.',
      action: (
        <div className="flex items-center gap-1 text-emerald-500">
          <Sparkles className="h-4 w-4" /> +1 pt
        </div>
      ),
    })
  }

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/5 sticky top-20">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-lg">Novo Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Contato</Label>
            <Select defaultValue="telefone_ativo">
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="telefone_ativo">Telefone Ativo</SelectItem>
                <SelectItem value="telefone_passivo">Telefone Passivo</SelectItem>
                <SelectItem value="whatsapp_wtk">WhatsApp (WTK)</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status do Atendimento</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="promessa">Promessa de Pagamento</SelectItem>
                <SelectItem value="negociando">Em Negociação</SelectItem>
                <SelectItem value="recusa">Recusa/Sem Condições</SelectItem>
                <SelectItem value="desconhece">Desconhece Dívida</SelectItem>
                <SelectItem value="outro">Outro (Especificar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Atualização Cadastral (Qualidade)
          </h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="achei-telefone" className="cursor-pointer font-normal text-sm">
              Validar número atual?
            </Label>
            <Switch id="achei-telefone" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="achei-pessoa" className="cursor-pointer font-normal text-sm">
              Falei com o Titular?
            </Label>
            <Switch id="achei-pessoa" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Próxima Ação (Agendamento)</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={`w-full justify-start text-left font-normal ${!date && 'text-muted-foreground'}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: ptBR }) : <span>Escolha a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observações (Obrigatório para 'Outro')</Label>
          <Textarea
            placeholder="Detalhe o acordo, objeções ou motivo de insucesso..."
            className="resize-none min-h-[100px]"
          />
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 rounded-b-lg border-t pt-4 pb-4">
        <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-md h-12">
          <Send className="mr-2 h-4 w-4" />
          Registrar e Salvar
        </Button>
      </CardFooter>
    </Card>
  )
}
