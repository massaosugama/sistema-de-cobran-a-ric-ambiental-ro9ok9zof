import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { Lightbulb, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppState } from '@/hooks/use-app-state'

export function SidebarQuote() {
  const { user } = useAuth()
  const { isImporting } = useAppState()
  const [quotes, setQuotes] = useState<any[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [timerKey, setTimerKey] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchContext = async () => {
      const { data: qData } = await (supabase as any)
        .from('quotes')
        .select('*')
        .order('order_index', { ascending: true })
      if (qData) setQuotes(qData)

      const { data: pData } = await (supabase as any)
        .from('profiles')
        .select('last_quote_index')
        .eq('id', user.id)
        .single()
      if (pData?.last_quote_index) setQuoteIndex(pData.last_quote_index)
    }
    fetchContext()
  }, [user])

  useEffect(() => {
    if (!quotes || quotes.length === 0) return
    const interval = setInterval(() => {
      setQuoteIndex((prev) => {
        const next = (prev + 1) % quotes.length
        if (user) {
          ;(supabase as any)
            .from('profiles')
            .update({ last_quote_index: next })
            .eq('id', user.id)
            .then()
        }
        return next
      })
    }, 20000) // Rotate every 20 seconds
    return () => clearInterval(interval)
  }, [quotes, user, timerKey])

  const handleLinkClick = async (
    quoteId: string,
    link: string | null | undefined,
    theory: string | null | undefined,
  ) => {
    if (user) {
      await (supabase as any)
        .from('quote_clicks')
        .insert({ user_id: user.id, quote_id: quoteId })
        .then()
    }

    if (link && link.trim() !== '') {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else if (theory && theory.trim() !== '') {
      const query = `explique para mim os conceitos de ${theory} num contexto de Setor de Cobrança?`
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
      window.open(searchUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handlePrev = () => {
    setQuoteIndex((prev) => {
      const next = prev === 0 ? quotes.length - 1 : prev - 1
      if (user) {
        ;(supabase as any)
          .from('profiles')
          .update({ last_quote_index: next })
          .eq('id', user.id)
          .then()
      }
      return next
    })
    setTimerKey((k) => k + 1)
  }

  const handleNext = () => {
    setQuoteIndex((prev) => {
      const next = (prev + 1) % quotes.length
      if (user) {
        ;(supabase as any)
          .from('profiles')
          .update({ last_quote_index: next })
          .eq('id', user.id)
          .then()
      }
      return next
    })
    setTimerKey((k) => k + 1)
  }

  const quote = quotes[quoteIndex]
  if (!quote) return null

  return (
    <div
      className={`relative group mx-4 mb-4 mt-2 p-4 rounded-xl transition-all duration-500 border shadow-sm animate-fade-in ${isImporting ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100/50' : 'bg-slate-50/80 border-slate-200'}`}
    >
      {isImporting && (
        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 text-center leading-tight animate-pulse">
          Enquanto processamos, aproveite para estudar
        </div>
      )}

      <Lightbulb
        className={`h-6 w-6 mx-auto mb-3 ${isImporting ? 'text-indigo-400' : 'text-primary/60'}`}
      />

      <div className="relative">
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 p-1.5 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white rounded-full shadow-sm z-10"
          aria-label="Frase anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold text-slate-700 text-center italic leading-relaxed px-4 min-h-[48px] flex items-center justify-center">
          "{quote.text}"
        </p>

        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 p-1.5 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white rounded-full shadow-sm z-10"
          aria-label="Próxima frase"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2.5 mt-4">
        {quote.theory && (
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider text-center ${isImporting ? 'bg-indigo-100/50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {quote.theory}
          </span>
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
  )
}
