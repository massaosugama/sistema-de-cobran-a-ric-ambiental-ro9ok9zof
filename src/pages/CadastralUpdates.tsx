import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit3, Check, Search, UserCog } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getPendingUpdates, resolveUpdate } from '@/services/cadastral-updates'
import { useAuth } from '@/hooks/use-auth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

export default function CadastralUpdates() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const loadUpdates = async () => {
    try {
      setLoading(true)
      const data = await getPendingUpdates()
      setUpdates(data)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro', description: 'Falha ao carregar fila.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUpdates()
  }, [])

  const handleResolve = async () => {
    if (!user) return
    try {
      setIsSubmitting(true)
      await resolveUpdate(selectedUpdate.id, user.id, resolutionNotes)
      toast({ title: 'Sucesso', description: 'Atualização cadastral concluída.' })
      setSelectedUpdate(null)
      loadUpdates()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao concluir atualização.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Atualizações Cadastrais
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Fila de pendências geradas pelos operadores durante os atendimentos.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="px-5 py-4 border-b bg-white flex flex-row items-center justify-between shrink-0">
          <CardTitle className="text-base text-slate-800">Pendências de Atualização</CardTitle>
          <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm">
            {updates.length} {updates.length === 1 ? 'registro' : 'registros'}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100">
                <TableHead className="font-semibold text-slate-600">Data / Solicitante</TableHead>
                <TableHead className="font-semibold text-slate-600">Devedor / UC</TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Observações para Cadastro
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : updates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhuma pendência na fila.
                  </TableCell>
                </TableRow>
              ) : (
                updates.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 group">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <UserCog className="w-3 h-3" /> {item.requester_name || 'Desconhecido'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                          {item.customer_name}
                        </span>
                        <span className="text-xs font-medium text-slate-500">UC: {item.uc}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600 max-w-md truncate" title={item.notes}>
                        {item.notes || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full"
                        >
                          <Link
                            to={`/customer/${item.uc}?personCode=${item.cod_pess_fat}`}
                            title="Ver Cadastro Original"
                          >
                            <Search className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUpdate(item)
                            setResolutionNotes(item.resolution_notes || '')
                          }}
                          className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
                          title="Tratar Pendência"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedUpdate} onOpenChange={(open) => !open && setSelectedUpdate(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle className="text-xl font-black text-slate-900">
              Atualização Cadastral
            </SheetTitle>
            <SheetDescription>
              Tratativa da pendência solicitada por {selectedUpdate?.requester_name}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-6 overflow-y-auto px-1 py-2">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs font-semibold uppercase">UC</span>
                  <span className="font-bold text-slate-900">{selectedUpdate?.uc}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs font-semibold uppercase">
                    Data da Solicitação
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
                <span className="text-slate-500 block text-xs font-semibold uppercase">
                  Devedor
                </span>
                <span className="font-bold text-slate-900">{selectedUpdate?.customer_name}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block text-xs font-semibold uppercase mb-1">
                  Observações para o Cadastro
                </span>
                <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 text-sm font-medium">
                  {selectedUpdate?.notes || 'Nenhuma observação informada.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-slate-700 text-base">
                Ações / Retorno da Tratativa
              </Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Descreva o que foi atualizado no sistema GIS..."
                className="min-h-[180px] resize-none rounded-xl border-slate-200 shadow-sm bg-slate-50 focus-visible:bg-white text-base leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3 pb-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11 border-slate-200 font-semibold"
              onClick={() => setSelectedUpdate(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl h-11 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Salvando...' : 'Concluir Atualização'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
