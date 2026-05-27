import { Undo2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Tables } from '@/lib/supabase/types'
import { useAuth } from '@/hooks/use-auth'

type Assignment = Tables<'strategic_assignments'>

interface CutQueueCardProps {
  item: Assignment
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onStatusChange: (id: string, status: string) => void
  onUndo: () => void
  nextStatus: string | null
  prevStatus: string | null
}

export function CutQueueCard({
  item,
  isSelected,
  onSelect,
  onStatusChange,
  onUndo,
  nextStatus,
  prevStatus,
}: CutQueueCardProps) {
  const { profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <Card
      className={cn(
        'p-3 transition-all duration-200',
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30',
      )}
    >
      <div className="flex gap-3">
        <div className="pt-1">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium leading-none mb-1.5">
              {item.snapshot_nome_cliente || 'Cliente não informado'}
            </p>
            <div className="flex items-center text-xs text-muted-foreground space-x-2">
              <span className="font-mono">UC: {item.uc}</span>
              <span>•</span>
              <span>{item.snapshot_qt_fats || 0} faturas</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-sm font-bold text-destructive">
              {formatter.format(item.snapshot_valor_vencido || 0)}
            </span>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onUndo}
                title="Desfazer Atribuição"
                disabled={isConsultas}
              >
                <Undo2 className="h-4 w-4" />
              </Button>

              {prevStatus && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onStatusChange(item.id, prevStatus)}
                  title="Voltar status"
                  disabled={isConsultas}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              {nextStatus && (
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onStatusChange(item.id, nextStatus)}
                  title="Avançar status"
                  disabled={isConsultas}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
