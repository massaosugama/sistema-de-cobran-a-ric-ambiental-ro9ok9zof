import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { CloudRain, Sun } from 'lucide-react'

export function DayDetailsModal({
  date,
  onClose,
  onSaved,
  settings,
}: {
  date: Date | null
  onClose: () => void
  onSaved: () => void
  settings: any
}) {
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [weatherCondition, setWeatherCondition] = useState('normal')
  const [notes, setNotes] = useState('')
  const [vencimentoPadrao, setVencimentoPadrao] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (date) {
      setIsWorkingDay(settings?.is_working_day ?? true)
      setWeatherCondition(settings?.weather_condition || 'normal')
      setNotes(settings?.notes || '')
      setVencimentoPadrao(settings?.vencimento_padrao?.toString() || '')
    }
  }, [date, settings])

  const handleSave = async () => {
    if (!date) return
    setLoading(true)
    const dateStr = format(date, 'yyyy-MM-dd')

    const payload = {
      date: dateStr,
      is_working_day: isWorkingDay,
      weather_condition: weatherCondition,
      notes: notes,
      vencimento_padrao: vencimentoPadrao ? parseInt(vencimentoPadrao, 10) : null,
      updated_at: new Date().toISOString(),
      ...(settings
        ? {
            ignored_readers: settings.ignored_readers,
            added_readers: settings.added_readers,
            reader_statuses: settings.reader_statuses,
          }
        : {}),
    }

    const { error } = await supabase
      .from('calendar_settings')
      .upsert(payload, { onConflict: 'date' })

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Salvo com sucesso',
        description: 'As configurações do dia foram atualizadas.',
      })
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Detalhes do Dia - {date ? format(date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between border p-4 rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Dia Útil de Leitura</Label>
              <p className="text-sm text-muted-foreground">
                Considerar este dia para cálculo de metas do ritmo.
              </p>
            </div>
            <Switch checked={isWorkingDay} onCheckedChange={setIsWorkingDay} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Vencimento Padrão</Label>
            <Input
              type="number"
              placeholder="Ex: 5"
              value={vencimentoPadrao}
              onChange={(e) => setVencimentoPadrao(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Condição do Tempo</Label>
            <RadioGroup
              value={weatherCondition}
              onValueChange={setWeatherCondition}
              className="flex gap-4"
            >
              <Label
                htmlFor="normal"
                className={`flex items-center gap-3 border rounded-md p-4 flex-1 cursor-pointer transition-colors hover:bg-muted ${weatherCondition === 'normal' ? 'ring-2 ring-primary border-transparent bg-primary/5' : ''}`}
              >
                <RadioGroupItem value="normal" id="normal" className="sr-only" />
                <Sun
                  className={`w-5 h-5 ${weatherCondition === 'normal' ? 'text-amber-500' : 'text-muted-foreground'}`}
                />
                <span className="font-medium">Normal</span>
              </Label>
              <Label
                htmlFor="chuvoso"
                className={`flex items-center gap-3 border rounded-md p-4 flex-1 cursor-pointer transition-colors hover:bg-muted ${weatherCondition === 'chuvoso' ? 'ring-2 ring-primary border-transparent bg-blue-500/10' : ''}`}
              >
                <RadioGroupItem value="chuvoso" id="chuvoso" className="sr-only" />
                <CloudRain
                  className={`w-5 h-5 ${weatherCondition === 'chuvoso' ? 'text-blue-500' : 'text-muted-foreground'}`}
                />
                <span className="font-medium">Chuvoso</span>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Observações</Label>
            <Textarea
              placeholder="Adicione notas ou justificativas sobre o dia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
