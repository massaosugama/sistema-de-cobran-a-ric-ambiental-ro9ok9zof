import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  PhoneCall,
  MessageSquare,
  Mail,
  HelpCircle,
  CheckCircle2,
  User,
  MoreVertical,
  Edit2,
  Eye,
  Ban,
} from 'lucide-react'
import { getContactHistory, updateContact } from '@/services/data'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CustomerTimelineEditDialog } from './CustomerTimelineEditDialog'
import { cn } from '@/lib/utils'
import type { ParsedDebt } from '@/services/debts'

export function CustomerTimeline({ customer }: { customer?: ParsedDebt }) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'edit' | 'view'>('view')
  const [selectedContact, setSelectedContact] = useState<any>(null)

  const fetchData = useCallback(async () => {
    const targetUc = customer?.uc || id
    if (!targetUc) return
    setLoading(true)
    try {
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(!!profile?.is_admin)
      }

      const contacts = await getContactHistory(targetUc, customer?.personCode, user?.id)

      const formattedContacts = contacts.map((c: any) => ({
        id: c.id,
        date: c.created_at,
        type: c.contact_type,
        operator: c.profiles?.name || 'Operador não identificado',
        operatorId: c.operator_id,
        status: c.status,
        qualityResult: c.quality_result,
        note: c.notes,
        isActive: c.is_active !== false,
      }))

      setEvents(formattedContacts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, customer?.uc, customer?.personCode, user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getIcon = (type: string) => {
    if (type?.includes('WTK')) return <MessageSquare className="h-4 w-4" />
    if (type?.includes('E-MAIL')) return <Mail className="h-4 w-4" />
    if (type?.includes('TEL')) return <PhoneCall className="h-4 w-4" />
    return <HelpCircle className="h-4 w-4" />
  }

  const getColor = (type: string, isInactive: boolean) => {
    if (isInactive) return 'bg-slate-100 text-slate-400 border-slate-200'
    if (type?.includes('WTK')) return 'bg-emerald-100 text-emerald-600 border-emerald-200'
    if (type?.includes('E-MAIL')) return 'bg-slate-100 text-slate-600 border-slate-200'
    return 'bg-blue-100 text-blue-600 border-blue-200'
  }

  const handleAction = (interaction: any, mode: 'view' | 'edit') => {
    setSelectedContact(interaction)
    setDialogMode(mode)
    setDialogOpen(true)
  }

  const handleInactivate = async (interactionId: string) => {
    if (!confirm('Deseja realmente inativar este registro de atendimento?')) return
    try {
      await updateContact(interactionId, { is_active: false })
      toast({ title: 'Sucesso', description: 'Registro inativado.' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleReactivate = async (interactionId: string) => {
    if (!confirm('Deseja realmente reativar este registro de atendimento?')) return
    try {
      await updateContact(interactionId, { is_active: true })
      toast({ title: 'Sucesso', description: 'Registro reativado com sucesso.' })
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleSaveEdit = async (updatedData: any) => {
    try {
      await updateContact(selectedContact.id, updatedData)
      toast({ title: 'Sucesso', description: 'Registro alterado com sucesso.' })
      setDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6">
      <h3 className="font-semibold text-lg mb-6 sticky top-0 bg-card z-10 py-2 border-b">
        Histórico 360°
      </h3>
      {loading ? (
        <div className="text-center py-10 text-slate-500 font-medium">Carregando histórico...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-slate-500 font-medium">
          Nenhum registro de atendimento encontrado para esta UC.
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {events.map((interaction, idx) => {
            const isInactive = !interaction.isActive
            const canEdit = isAdmin || user?.id === interaction.operatorId
            const canInactivate = isAdmin && interaction.isActive
            const canReactivate = isAdmin && isInactive

            return (
              <div
                key={interaction.id || idx}
                className={cn(
                  'relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group',
                  isInactive && 'opacity-75 grayscale',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10',
                    getColor(interaction.type, isInactive),
                  )}
                >
                  {getIcon(interaction.type)}
                </div>

                <div
                  className={cn(
                    'w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border shadow-subtle relative',
                    isInactive
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white hover:shadow-md transition-shadow',
                  )}
                >
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction(interaction, 'view')}>
                          <Eye className="w-4 h-4 mr-2" /> Consultar
                        </DropdownMenuItem>
                        {canEdit && interaction.isActive && (
                          <DropdownMenuItem onClick={() => handleAction(interaction, 'edit')}>
                            <Edit2 className="w-4 h-4 mr-2" /> Alterar
                          </DropdownMenuItem>
                        )}
                        {canInactivate && (
                          <DropdownMenuItem
                            onClick={() => handleInactivate(interaction.id)}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            <Ban className="w-4 h-4 mr-2" /> Inativar
                          </DropdownMenuItem>
                        )}
                        {canReactivate && (
                          <DropdownMenuItem
                            onClick={() => handleReactivate(interaction.id)}
                            className="text-emerald-600 focus:text-emerald-600"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pr-8">
                    <span
                      className={cn(
                        'font-semibold text-sm',
                        isInactive ? 'text-slate-400' : 'text-primary',
                      )}
                    >
                      {interaction.type} {isInactive && '(Inativo)'}
                    </span>
                    <time
                      className={cn(
                        'text-xs font-medium',
                        isInactive ? 'text-slate-400' : 'text-muted-foreground',
                      )}
                    >
                      {new Date(interaction.date).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(interaction.date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <div className="mb-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-slate-500/10',
                        isInactive ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-600',
                      )}
                    >
                      {interaction.status}
                    </span>
                  </div>

                  {interaction.note && (
                    <p
                      className={cn(
                        'text-sm leading-relaxed mb-3',
                        isInactive ? 'text-slate-400' : 'text-slate-600',
                      )}
                    >
                      {interaction.note}
                    </p>
                  )}

                  <div
                    className={cn(
                      'mt-3 text-[11px] flex items-center gap-1 border-t pt-2',
                      isInactive ? 'text-slate-400' : 'text-muted-foreground',
                    )}
                  >
                    <User className="h-3 w-3" />
                    <span>Operador:</span>
                    <span
                      className={cn(
                        'font-medium',
                        isInactive ? 'text-slate-400' : 'text-slate-700',
                      )}
                    >
                      {interaction.operator}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dialogOpen && selectedContact && (
        <CustomerTimelineEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contact={selectedContact}
          mode={dialogMode}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
