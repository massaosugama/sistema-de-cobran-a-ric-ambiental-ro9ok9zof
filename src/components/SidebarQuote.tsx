import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Lightbulb, ExternalLink, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { useAppState } from '@/hooks/use-app-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getProfiles } from '@/services/data'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function SidebarQuote() {
  const { user } = useAuth()
  const { isImporting } = useAppState()
  const [quotes, setQuotes] = useState<any[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profiles, setProfiles] = useState<any[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<string>('none')
  const [selectedDate, setSelectedDate] = useState<string>('')

  useEffect(() => {
    if (!user) return
    const fetchContext = async () => {
      const { data: qData } = await supabase
        .from('quotes')
        .select('*, profiles:analyzed_by(id, name, first_name, color)')
        .order('order_index', { ascending: true })
      if (qData) setQuotes(qData)

      const { data: pData } = await supabase
        .from('profiles')
        .select('last_quote_index, is_admin, role')
        .eq('id', user.id)
        .single()
      if (pData) {
        if (pData.last_quote_index) setQuoteIndex(pData.last_quote_index)
        if (pData.is_admin || pData.role === 'admin') {
          setIsAdmin(true)
          getProfiles().then(setProfiles)
        }
      }
    }
    fetchContext()
  }, [user])

  useEffect(() => {
    if (!quotes?.length || isEditDialogOpen) return
    const interval = setInterval(() => {
      setQuoteIndex((prev) => {
        const next = (prev + 1) % quotes.length
        if (user) {
          supabase.from('profiles').update({ last_quote_index: next }).eq('id', user.id).then()
        }
        return next
      })
    }, 20000)
    return () => clearInterval(interval)
  }, [quotes, user, timerKey, isEditDialogOpen])

  const handleLinkClick = async (
    quoteId: string,
    link: string | null | undefined,
    theory: string | null | undefined,
  ) => {
    if (user) {
      await supabase.from('quote_clicks').insert({ user_id: user.id, quote_id: quoteId }).then()
    }
    if (link?.trim()) {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else if (theory?.trim()) {
      const query = `explique para mim os conceitos de ${theory} num contexto de Setor de Cobrança?`
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  const navigate = (dir: 1 | -1) => {
    setQuoteIndex((prev) => {
      const next =
        dir === 1 ? (prev + 1) % quotes.length : prev === 0 ? quotes.length - 1 : prev - 1
      if (user) {
        supabase.from('profiles').update({ last_quote_index: next }).eq('id', user.id).then()
      }
      return next
    })
    setTimerKey((k) => k + 1)
  }

  const handleEditClick = (q: any) => {
    setEditingQuote(q)
    setSelectedUser(q.analyzed_by || 'none')
    setSelectedDate(q.analyzed_at || '')
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingQuote) return
    const updates = {
      analyzed_by: selectedUser && selectedUser !== 'none' ? selectedUser : null,
      analyzed_at: selectedDate || null,
    }

    await supabase.from('quotes').update(updates).eq('id', editingQuote.id)

    const { data: updatedProfile } = updates.analyzed_by
      ? await supabase
          .from('profiles')
          .select('id, name, first_name, color')
          .eq('id', updates.analyzed_by)
          .single()
      : { data: null }

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === editingQuote.id ? { ...q, ...updates, profiles: updatedProfile } : q,
      ),
    )
    setIsEditDialogOpen(false)
  }

  const quote = quotes[quoteIndex]
  if (!quote) return null

  const getFirstName = (p: any) => (p ? p.first_name || (p.name ? p.name.split(' ')[0] : '') : '')
  const hasAnalysis = !isImporting && !!quote.analyzed_at && !!quote.profiles?.color
  const mainColor = quote.profiles?.color

  return (
    <>
      <div
        className={`relative group mx-4 mb-4 mt-2 p-4 rounded-xl transition-all duration-500 border shadow-sm animate-fade-in overflow-hidden ${isImporting ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100/50' : 'bg-slate-50/80 border-slate-200'}`}
        style={{
          backgroundColor: hasAnalysis ? mainColor : undefined,
          borderColor: hasAnalysis ? mainColor : undefined,
        }}
      >
        {hasAnalysis && <div className="absolute inset-0 bg-white/90 pointer-events-none" />}
        <div className="relative z-10">
          {isAdmin && (
            <button
              onClick={() => handleEditClick(quote)}
              className="absolute -top-2 -right-2 p-1.5 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-slate-100/50 z-20"
              title="Editar Análise"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}

          {isImporting && (
            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 text-center leading-tight animate-pulse">
              Enquanto processamos, aproveite para estudar
            </div>
          )}
          <Lightbulb
            className={`h-6 w-6 mx-auto mb-3 ${isImporting ? 'text-indigo-400' : 'text-primary/60'}`}
            style={{ color: hasAnalysis ? mainColor : undefined }}
          />

          <div className="relative">
            <button
              onClick={() => navigate(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 p-1.5 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white rounded-full shadow-sm z-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs font-semibold text-slate-700 text-center italic leading-relaxed px-4 min-h-[48px] flex items-center justify-center">
              "{quote.text}"
            </p>
            <button
              onClick={() => navigate(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 p-1.5 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white rounded-full shadow-sm z-10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2.5 mt-4">
            {quote.theory && (
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider text-center ${isImporting ? 'bg-indigo-100/50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                style={
                  hasAnalysis
                    ? {
                        borderColor: mainColor,
                        color: mainColor,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                      }
                    : undefined
                }
              >
                {quote.theory}
              </span>
            )}

            {quote.profiles && quote.analyzed_at && (
              <div className="text-[10px] text-slate-500 mt-1 font-medium tracking-wide">
                Analisado por{' '}
                <span className="font-bold" style={{ color: mainColor }}>
                  {getFirstName(quote.profiles)}
                </span>{' '}
                em{' '}
                <span className="font-bold" style={{ color: mainColor }}>
                  {format(parseISO(quote.analyzed_at), 'd/MMM', { locale: ptBR }).toLowerCase()}
                </span>
              </div>
            )}

            {(quote.link || quote.theory) && (
              <button
                onClick={() => handleLinkClick(quote.id, quote.link, quote.theory)}
                className="text-[11px] font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 mt-1 transition-colors group/btn"
              >
                Saiba mais{' '}
                <ExternalLink className="h-3 w-3 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Análise da Frase</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Analisado por</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Data da análise</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-100 transition-colors"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
              onClick={handleSaveEdit}
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
