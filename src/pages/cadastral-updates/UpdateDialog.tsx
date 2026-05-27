import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, Check, Ban, Save, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { updateStatus, updateNotes } from '@/services/cadastral-updates'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export function UpdateDialog({
  selectedUpdate,
  onClose,
  dialogMode,
  onSuccess,
  onViewCustomer,
}: {
  selectedUpdate: any
  onClose: () => void
  dialogMode: 'view' | 'edit'
  onSuccess: () => void
  onViewCustomer: (uc: string, cod: string) => void
}) {
  const [notes, setNotes] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const [isConsulta, setIsConsulta] = useState(false)

  useEffect(() => {
    if (selectedUpdate) {
      setNotes(selectedUpdate.notes || '')
      setResolutionNotes(selectedUpdate.resolution_notes || '')
    }
  }, [selectedUpdate])

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === 'consultas') {
            setIsConsulta(true)
          }
        })
    }
  }, [user])

  const handleAction = async (action: 'completed' | 'cancelled') => {
    if (!user || !selectedUpdate || isConsulta) return
    setIsSubmitting(true)
    try {
      await updateStatus(selectedUpdate.id, action, user.id, resolutionNotes, notes)
      toast({
        title: 'Sucesso',
        description: `Registro ${action === 'completed' ? 'concluído' : 'cancelado'}.`,
      })
      onSuccess()
      onClose()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao processar.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedUpdate || isConsulta) return
    setIsSubmitting(true)
    try {
      await updateNotes(selectedUpdate.id, notes)
      toast({ title: 'Sucesso', description: 'Observações atualizadas.' })
      onSuccess()
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={!!selectedUpdate} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-6">
        <SheetHeader>
          <SheetTitle className="text-xl font-black text-slate-900">
            {dialogMode === 'view' ? 'Detalhes da Atualização' : 'Tratativa de Atualização'}
          </SheetTitle>
          <SheetDescription>Solicitada por {selectedUpdate?.requester_name}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-1 py-2">
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block text-xs font-semibold uppercase">UC</span>
                <span className="font-bold text-slate-900">{selectedUpdate?.uc}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-semibold uppercase">
                  Data Solicitação
                </span>
                <span className="font-bold text-slate-900">
                  {selectedUpdate?.created_at &&
                    format(new Date(selectedUpdate.created_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-semibold uppercase">Devedor</span>
              <span className="font-bold text-slate-900">{selectedUpdate?.customer_name}</span>
            </div>
            {dialogMode === 'view' && (
              <div className="pt-2">
                <span className="text-slate-500 block text-xs font-semibold uppercase mb-1">
                  Observações para o Cadastro
                </span>
                <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap">
                  {selectedUpdate?.notes || 'Nenhuma.'}
                </p>
              </div>
            )}
          </div>

          {selectedUpdate?.status !== 'pending' && dialogMode === 'view' && (
            <div className="bg-white p-4 rounded-xl space-y-3 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {selectedUpdate?.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Ban className="w-4 h-4 text-red-600" />
                )}
                Detalhes da Tratativa
              </h4>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm whitespace-pre-wrap">
                {selectedUpdate?.resolution_notes || 'Sem detalhes.'}
              </p>
            </div>
          )}

          {dialogMode === 'edit' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700">Observações do Operador</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSubmitting || notes === selectedUpdate?.notes || isConsulta}
                    className="h-8 text-xs"
                  >
                    <Save className="w-3 h-3 mr-1" /> Salvar Edição
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isConsulta}
                  className="min-h-[100px] resize-none bg-slate-50 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-slate-700">Ações / Retorno da Tratativa</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  disabled={isConsulta}
                  placeholder="Descreva o que foi feito..."
                  className="min-h-[140px] resize-none bg-slate-50 text-base rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
        <div
          className={cn(
            'pt-4 border-t flex gap-2 pb-2',
            dialogMode === 'view' ? 'flex-col sm:flex-row' : 'flex-col',
          )}
        >
          {dialogMode === 'view' ? (
            <>
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>
                Fechar
              </Button>
              <Button
                className="flex-1 h-11 bg-primary text-white rounded-xl shadow-md hover:bg-primary/90"
                onClick={() => onViewCustomer(selectedUpdate?.uc, selectedUpdate?.cod_pess_fat)}
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Visualizar Atendimento
              </Button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row w-full gap-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-11 rounded-xl"
                onClick={() => handleAction('cancelled')}
                disabled={isSubmitting || isConsulta}
              >
                <Ban className="w-4 h-4 mr-2" /> Descartar
              </Button>
              <Button
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                onClick={() => handleAction('completed')}
                disabled={isSubmitting || isConsulta}
              >
                <Check className="w-4 h-4 mr-2" /> Concluir
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
