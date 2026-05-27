import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ParsedDebt } from '@/services/debts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, Trash2, Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ResearchedPhone {
  number: string
  isValidated?: boolean
  isInvalid?: boolean
  [key: string]: any
}

export function CustomerResearchedPhones({
  customer,
}: {
  customer: ParsedDebt & { cod_pess_fat?: string }
}) {
  const [recordId, setRecordId] = useState<string | null>(null)
  const [phones, setPhones] = useState<ResearchedPhone[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const { toast } = useToast()

  const personCode = customer.personCode || customer.cod_pess_fat

  const fetchPhones = async () => {
    if (!customer.uc || !personCode) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('researched_phones')
        .select('*')
        .eq('uc', customer.uc)
        .eq('cod_pess_fat', personCode)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setRecordId(data.id)
        const rawPhones = data.phones as any[]
        const normalized = Array.isArray(rawPhones)
          ? rawPhones.map((p) => {
              if (typeof p === 'string') return { number: p }
              return p
            })
          : []
        setPhones(normalized)
      } else {
        setPhones([])
      }
    } catch (error: any) {
      console.error('Error fetching phones:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhones()
  }, [customer.uc, personCode])

  const savePhones = async (updatedPhones: ResearchedPhone[]) => {
    try {
      if (recordId) {
        const { error } = await supabase
          .from('researched_phones')
          .update({ phones: updatedPhones, updated_at: new Date().toISOString() })
          .eq('id', recordId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('researched_phones')
          .insert({
            uc: customer.uc,
            cod_pess_fat: personCode,
            phones: updatedPhones,
          })
          .select()
          .single()
        if (error) throw error
        if (data) setRecordId(data.id)
      }
      setPhones(updatedPhones)
      toast({
        title: 'Telefones atualizados',
        description: 'Os telefones da pesquisa foram atualizados com sucesso.',
      })
    } catch (error: any) {
      console.error('Error saving phones:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar telefones',
        variant: 'destructive',
      })
    }
  }

  const toggleValidate = (index: number) => {
    const updated = [...phones]
    updated[index] = {
      ...updated[index],
      isValidated: !updated[index].isValidated,
      isInvalid: false,
    }
    savePhones(updated)
  }

  const removePhone = (index: number) => {
    const updated = phones.filter((_, i) => i !== index)
    savePhones(updated)
  }

  const addPhone = () => {
    if (!newPhone.trim()) return
    const updated = [...phones, { number: newPhone.trim() }]
    savePhones(updated)
    setNewPhone('')
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="space-y-3 pt-4 border-t border-slate-200 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded"></div>
        <div className="h-10 w-full bg-slate-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-4 border-t border-slate-200 transition-all">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-sm flex items-center gap-1.5 text-slate-700">
          Telefones Alternativos (Ap.Info)
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 mb-2 animate-fade-in">
          <Input
            placeholder="Novo telefone..."
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="h-9 text-sm rounded-lg bg-white border-slate-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addPhone()
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={addPhone}
            className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Adicionar
          </Button>
        </div>
      )}

      {phones.length === 0 && !isEditing ? (
        <div className="text-xs text-slate-500 italic p-2">
          Nenhum telefone alternativo localizado.
        </div>
      ) : (
        <div className="space-y-3">
          {phones.map((phone, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 p-2.5 bg-indigo-50/30 rounded-lg border border-indigo-100 shadow-sm transition-colors"
            >
              <span className="text-xs font-bold text-slate-700 flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" /> {phone.number}
                </span>
                {phone.isValidated && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                    VALIDADO
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleValidate(i)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white text-slate-600 transition-all flex-1',
                    phone.isValidated &&
                      'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm ring-1 ring-emerald-300',
                  )}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-inner"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {phone.isValidated ? 'Validado' : 'Marcar Válido'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removePhone(i)}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800 transition-all flex-none"
                  title="Remover telefone inválido"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
