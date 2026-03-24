import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: any
  mode: 'view' | 'edit'
  onSave: (data: any) => void
}

export function CustomerTimelineEditDialog({
  open,
  onOpenChange,
  contact,
  mode,
  onSave,
}: DialogProps) {
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const isView = mode === 'view'

  useEffect(() => {
    if (contact) {
      setChannel(contact.type || '')
      setStatus(contact.status || '')
      setNotes(contact.note || '')
    }
  }, [contact])

  const handleSave = () => {
    onSave({
      contact_type: channel,
      status,
      notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isView ? 'Consultar Atendimento' : 'Alterar Atendimento'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Canal de Contato</Label>
            <Select disabled={isView} value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEL ATIVO">Telefone Ativo</SelectItem>
                <SelectItem value="TEL PASSIVO">Telefone Passivo</SelectItem>
                <SelectItem value="WTK ATIVO">WhatsApp Ativo</SelectItem>
                <SelectItem value="WTK PASSIVO">WhatsApp Passivo</SelectItem>
                <SelectItem value="E-MAIL">E-mail</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select disabled={isView} value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Promessa de Pagamento">Promessa de Pagamento</SelectItem>
                <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                <SelectItem value="Já Pagou / Quitou">Já Pagou / Quitou</SelectItem>
                <SelectItem value="Recusa">Recusa/Sem Condições</SelectItem>
                <SelectItem value="Desconhece Dívida">Desconhece Dívida</SelectItem>
                <SelectItem value="Outro">Outro (Especificar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              disabled={isView}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="resize-none min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isView ? 'Fechar' : 'Cancelar'}
          </Button>
          {!isView && <Button onClick={handleSave}>Salvar Alterações</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
