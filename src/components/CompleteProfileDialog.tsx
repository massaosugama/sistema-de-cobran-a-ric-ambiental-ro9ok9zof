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

// Paleta de 30 cores bem distintas, incluindo branco (#FFFFFF) e preto (#000000)
export const PROFILE_COLORS = [
  '#FFFFFF', // Branco
  '#000000', // Preto
  '#EF4444', // Vermelho
  '#22C55E', // Verde
  '#3B82F6', // Azul
  '#EAB308', // Amarelo
  '#06B6D4', // Ciano
  '#D946EF', // Magenta
  '#64748B', // Cinza
  '#78310F', // Marrom Escuro
  '#84CC16', // Verde Limão
  '#14B8A6', // Verde Água
  '#8B5CF6', // Roxo
  '#F97316', // Laranja
  '#EC4899', // Rosa
  '#0369A1', // Azul Escuro
  '#166534', // Verde Escuro
  '#4C1D95', // Roxo Escuro
  '#991B1B', // Vermelho Escuro
  '#B45309', // Ouro Escuro
  '#FCA5A5', // Vermelho Claro
  '#86EFAC', // Verde Claro
  '#93C5FD', // Azul Claro
  '#FDE047', // Amarelo Claro
  '#67E8F9', // Ciano Claro
  '#F0ABFC', // Magenta Claro
  '#CBD5E1', // Cinza Claro
  '#FDBA74', // Laranja Claro
  '#F9A8D4', // Rosa Claro
  '#333333', // Cinza Escuro
]

// Lista de cores claras para mudar a cor do ícone de Check para escuro garantindo contraste
const LIGHT_COLORS = [
  '#FFFFFF',
  '#FCA5A5',
  '#86EFAC',
  '#93C5FD',
  '#FDE047',
  '#67E8F9',
  '#F0ABFC',
  '#CBD5E1',
  '#FDBA74',
  '#F9A8D4',
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
          setTakenColors(allProfiles.map((p) => p.color?.toUpperCase()).filter(Boolean) as string[])
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
                const isTaken = takenColors.includes(color.toUpperCase())
                const isSelected = formData.color.toUpperCase() === color.toUpperCase()
                if (isTaken && !isSelected) return null

                const isLight = LIGHT_COLORS.includes(color.toUpperCase())

                return (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                      color.toUpperCase() === '#FFFFFF' ? 'border border-slate-300' : '',
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : '',
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && (
                      <Check
                        className={cn('w-4 h-4', isLight ? 'text-slate-900' : 'text-white')}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                )
              })}
            </div>
            {PROFILE_COLORS.every(
              (c) =>
                takenColors.includes(c.toUpperCase()) &&
                formData.color.toUpperCase() !== c.toUpperCase(),
            ) && (
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
