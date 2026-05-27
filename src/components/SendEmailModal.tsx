import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Send, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { generateEmailHtml } from '@/utils/generate-email-html'

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: any
  address: string
  parecer: string
  parecerConsumo: string
  parecerImovel: string
  parecerInLoco: string
  telefonesLocalizados: string
  imagesGeral: any[]
  imagesImovel: any[]
  imagesConsumo: any[]
  imagesInLoco: any[]
  imagesTelefones: any[]
  queueType: string
  printedName: string
}

export function SendEmailModal({
  open,
  onOpenChange,
  assignment,
  address,
  parecer,
  parecerConsumo,
  parecerImovel,
  parecerInLoco,
  telefonesLocalizados,
  imagesGeral,
  imagesImovel,
  imagesConsumo,
  imagesInLoco,
  imagesTelefones,
  queueType,
  printedName,
}: SendEmailModalProps) {
  const [emailTo, setEmailTo] = useState('')
  const [loading, setLoading] = useState(false)

  if (!assignment) return null

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const queueName = queueType === 'strategic' ? 'Estratégias' : 'Jurídico'
  const subject = `Fila ${queueName} UC ${assignment.uc} ${formatCurrency(assignment.snapshot_valor_vencido)} (${assignment.snapshot_qt_fats} faturas)`

  const handleSend = async () => {
    if (!emailTo) {
      toast.error('Informe o e-mail de destino')
      return
    }

    setLoading(true)

    try {
      const printData = {
        ...assignment,
        endereco: address,
        parecer,
        parecer_consumo: parecerConsumo,
        parecer_imovel: parecerImovel,
        parecer_inloco: parecerInLoco,
        telefones_localizados: telefonesLocalizados,
      }

      const combinedImages = [
        ...imagesGeral.map((img) => ({ ...img, section: 'geral' })),
        ...imagesImovel.map((img) => ({ ...img, section: 'imovel' })),
        ...imagesConsumo.map((img) => ({ ...img, section: 'consumo' })),
        ...imagesInLoco.map((img) => ({ ...img, section: 'inloco' })),
        ...imagesTelefones.map((img) => ({ ...img, section: 'telefones' })),
      ]

      const reportTitle =
        queueType === 'strategic'
          ? 'RELATÓRIO DE ANÁLISE ESTRATÉGICA'
          : 'RELATÓRIO DE ANÁLISE JURÍDICA'

      const htmlContent = generateEmailHtml(printData, combinedImages, printedName, reportTitle)

      const { error } = await supabase.functions.invoke('send-analysis-email', {
        body: {
          to: emailTo,
          subject,
          html: htmlContent,
        },
      })

      if (error) throw error

      toast.success('E-mail enviado com sucesso!')
      onOpenChange(false)
      setEmailTo('')
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao enviar e-mail. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Enviar Análise por E-mail
          </DialogTitle>
          <DialogDescription>
            Envie o relatório detalhado desta análise para o e-mail desejado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase">Assunto do E-mail</Label>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-800 font-medium">
              {subject}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-to" className="text-xs font-bold text-slate-500 uppercase">
              E-mail de Destino
            </Label>
            <Input
              id="email-to"
              type="email"
              placeholder="exemplo@email.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !emailTo}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Enviando...' : 'Enviar E-mail'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
