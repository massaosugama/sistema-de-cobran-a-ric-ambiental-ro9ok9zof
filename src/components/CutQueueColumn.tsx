import { useState } from 'react'
import { Undo2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CutQueueCard } from './CutQueueCard'
import { Tables } from '@/lib/supabase/types'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type Assignment = Tables<'strategic_assignments'>

interface CutQueueColumnProps {
  title: string
  status: string
  items: Assignment[]
  onStatusChange: (id: string, newStatus: string) => void
  onUndo: (ids: string[]) => void
  nextStatus: string | null
  prevStatus: string | null
  loading: boolean
}

export function CutQueueColumn({
  title,
  status,
  items,
  onStatusChange,
  onUndo,
  nextStatus,
  prevStatus,
  loading,
}: CutQueueColumnProps) {
  const { profile } = useAuth()
  const isConsultas = profile?.role === 'consultas'
  const columnItems = items.filter((item) => item.status === status)
  const [selected, setSelected] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(columnItems.map((i) => i.id))
    else setSelected([])
  }

  const handleUndoBatch = () => {
    if (isConsultas) {
      toast.error('Acesso restrito.')
      return
    }
    if (selected.length > 0) {
      onUndo(selected)
      setSelected([])
    }
  }

  return (
    <div className="flex flex-col bg-muted/30 rounded-xl border h-full overflow-hidden">
      <div className="p-4 border-b bg-muted/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center">
            {title}
            <span className="ml-2 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs">
              {columnItems.length}
            </span>
          </h3>
        </div>

        {columnItems.length > 0 && (
          <div className="flex items-center justify-between bg-background p-2 rounded-md border text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selected.length === columnItems.length && columnItems.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-xs text-muted-foreground">Selecionar todos</span>
            </div>
            {selected.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={handleUndoBatch}
                disabled={isConsultas}
              >
                <Undo2 className="w-3 h-3 mr-1" /> Desfazer ({selected.length})
              </Button>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {loading && columnItems.length === 0 ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : columnItems.length > 0 ? (
            columnItems.map((item) => (
              <CutQueueCard
                key={item.id}
                item={item}
                isSelected={selected.includes(item.id)}
                onSelect={(c) =>
                  setSelected((p) => (c ? [...p, item.id] : p.filter((id) => id !== item.id)))
                }
                onStatusChange={onStatusChange}
                onUndo={() => onUndo([item.id])}
                nextStatus={nextStatus}
                prevStatus={prevStatus}
              />
            ))
          ) : (
            <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              Nenhum item nesta coluna
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
