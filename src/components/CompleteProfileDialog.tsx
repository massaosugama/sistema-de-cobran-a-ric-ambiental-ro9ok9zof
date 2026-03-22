import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export const PROFILE_COLORS = [
  '#22c55e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#ca8a04',
  '#65a30d',
  '#16a34a',
  '#059669',
  '#0d9488',
  '#0891b2',
  '#0284c7',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
]

export function CompleteProfileDialog() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [takenColors, setTakenColors] = useState<string[]>([])
  const [formData, setFormData] = useState({ first_name: '', last_name: '', color: '' })

  useEffect(() => {
    if (!user) return
    const checkProfile = async () => {
      // Do not show if user already clicked ignore in this session
      if (sessionStorage.getItem('ignoredProfile')) return

      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, color')
        .eq('id', user.id)
        .single()

      if (data && (!data.first_name || !data.last_name || !data.color)) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          color: data.color || '',
        })

        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('color')
          .neq('id', user.id)
        if (allProfiles) {
          setTakenColors(allProfiles.map((p) => p.color).filter(Boolean) as string[])
        }

        setIsOpen(true)
      }
    }
    checkProfile()
  }, [user])

  const handleSave = async () => {
    if (!formData.first_name || !formData.color) {
      toast({
        title: 'Atenção',
        description: 'Nome e Cor são obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        color: formData.color,
      })
      .eq('id', user!.id)

    setLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Perfil atualizado!' })
      sessionStorage.setItem('ignoredProfile', 'true')
      setIsOpen(false)
    }
  }

  const handleIgnore = () => {
    sessionStorage.setItem('ignoredProfile', 'true')
    setIsOpen(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleIgnore()
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Complete seu Perfil</DialogTitle>
          <DialogDescription>
            Para uma melhor experiência, preencha seus dados e escolha sua cor exclusiva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label>Sobrenome</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label>Escolha sua cor (exclusiva)</Label>
            <div className="flex flex-wrap gap-2">
              {PROFILE_COLORS.map((color) => {
                const isTaken = takenColors.includes(color)
                const isSelected = formData.color === color
                if (isTaken && !isSelected) return null

                return (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : '',
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
            {PROFILE_COLORS.every((c) => takenColors.includes(c) && formData.color !== c) && (
              <p className="text-sm text-amber-600 font-medium">
                Todas as cores foram escolhidas! Fale com o administrador.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleIgnore}>
            Ignorar por enquanto
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
