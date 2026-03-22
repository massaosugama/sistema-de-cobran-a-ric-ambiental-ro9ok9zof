import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRelatedDebts, getDebtByUc, type ParsedDebt } from '@/services/debts'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CustomerHeader } from './CustomerHeader'
import { CustomerInfo } from './CustomerInfo'
import { CustomerTimeline } from './CustomerTimeline'
import { CustomerActionForm } from './CustomerActionForm'
import { cn } from '@/lib/utils'

const safeSlice = (text: any, start: number, end?: number): string =>
  typeof text === 'string' ? text.slice(start, end) : ''

export function RelatedDebts({ customer }: { customer: ParsedDebt }) {
  const [relatedDebts, setRelatedDebts] = useState<ParsedDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [visitedUcs, setVisitedUcs] = useState<Set<string>>(new Set())

  const [selectedUc, setSelectedUc] = useState<string | null>(null)
  const [sheetCustomer, setSheetCustomer] = useState<ParsedDebt | null>(null)
  const [loadingSheet, setLoadingSheet] = useState(false)

  const fetchRelatedDebts = useCallback(
    async (isInitial = false) => {
      if (!customer) return
      if (isInitial) setLoading(true)
      try {
        const data = await getRelatedDebts(
          customer.uc,
          customer.personCode,
          customer.rawPessoaFaturaNome || null,
          customer.rawPessoaFaturaCpfCnpj || null,
        )
        setRelatedDebts(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (isInitial) setLoading(false)
      }
    },
    [customer],
  )

  useEffect(() => {
    let isMounted = true
    if (isMounted) fetchRelatedDebts(true)
    return () => {
      isMounted = false
    }
  }, [fetchRelatedDebts])

  useEffect(() => {
    const handleContactAdded = () => {
      fetchRelatedDebts(false)
    }
    window.addEventListener('contact-added', handleContactAdded)
    return () => window.removeEventListener('contact-added', handleContactAdded)
  }, [fetchRelatedDebts])

  const handleOpenSheet = async (uc: string) => {
    setVisitedUcs((prev) => new Set(prev).add(uc))
    setSelectedUc(uc)
    setLoadingSheet(true)
    try {
      const data = await getDebtByUc(uc)
      setSheetCustomer(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSheet(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-orange-100 bg-orange-50/20 shadow-sm mt-6 animate-pulse">
        <CardHeader className="pb-3 border-b border-orange-50 bg-orange-50/40">
          <div className="h-5 bg-orange-200/50 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="h-10 bg-orange-100/50 rounded-lg w-full"></div>
          <div className="h-10 bg-orange-100/50 rounded-lg w-full"></div>
        </CardContent>
      </Card>
    )
  }

  if (relatedDebts.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/50 shadow-sm mt-6">
        <CardHeader className="pb-3 border-b border-orange-100 bg-orange-50/80">
          <CardTitle className="text-base flex items-center justify-between text-orange-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Alerta de Vínculos
            </div>
            <span className="bg-orange-200 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              {relatedDebts.length} {relatedDebts.length === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-orange-800/80 font-medium pb-1 leading-relaxed">
            Foram encontradas outras UCs relacionadas a esta pessoa (mesmo titular, proprietário ou
            responsável).
          </p>
          <div className="space-y-2">
            {relatedDebts.map((debt) => {
              const isVisited = visitedUcs.has(debt.uc)
              return (
                <button
                  key={`${debt.uc}_${debt.personCode}`}
                  onClick={() => handleOpenSheet(debt.uc)}
                  className={cn(
                    'w-full text-left flex flex-col p-2.5 bg-white border rounded-lg transition-all group focus:outline-none focus:ring-2 focus:ring-offset-1',
                    isVisited
                      ? 'border-slate-200 bg-slate-50/70 focus:ring-slate-400 opacity-80'
                      : 'border-orange-100 hover:border-orange-300 hover:shadow-md focus:ring-orange-500',
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="overflow-hidden pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={cn(
                            'font-bold text-sm',
                            isVisited ? 'text-slate-600' : 'text-slate-800',
                          )}
                        >
                          UC {debt.uc}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{debt.name}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={cn(
                          'font-black',
                          isVisited ? 'text-slate-600' : 'text-orange-700',
                        )}
                      >
                        R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <div
                        className={cn(
                          'flex items-center text-[10px] font-semibold uppercase mt-0.5',
                          isVisited
                            ? 'text-slate-400 group-hover:text-slate-600'
                            : 'text-orange-500 group-hover:text-orange-600',
                        )}
                      >
                        Acessar <ExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </div>

                  {debt.recentOperators && debt.recentOperators.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100/50 w-full">
                      <span className="text-[9px] font-medium text-slate-400 uppercase mr-1">
                        Histórico:
                      </span>
                      {debt.recentOperators.map((op, idx) => (
                        <Badge
                          key={idx}
                          className={cn(
                            'w-fit text-[9px] px-1.5 py-0 uppercase tracking-wider shadow-none',
                            idx === 0
                              ? 'bg-slate-600 text-white'
                              : idx === 1
                                ? 'bg-slate-400 text-white'
                                : 'bg-slate-300 text-slate-700',
                          )}
                          title={`Atendido por: ${op}`}
                        >
                          {safeSlice(op, 0, 4)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedUc} onOpenChange={(open) => !open && setSelectedUc(null)}>
        <SheetContent
          className="w-full sm:max-w-none md:max-w-none lg:max-w-[85vw] xl:max-w-[1200px] overflow-y-auto bg-slate-50 p-0 sm:p-6 border-l shadow-2xl"
          side="right"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Atendimento de Vínculo: UC {sheetCustomer?.uc}</SheetTitle>
            <SheetDescription>
              Gerencie as pendências e o histórico da conta vinculada.
            </SheetDescription>
          </SheetHeader>

          {loadingSheet ? (
            <div className="p-10 text-center text-slate-500 font-medium animate-pulse mt-10">
              Carregando dados do vínculo...
            </div>
          ) : sheetCustomer ? (
            <div className="space-y-6 pb-20 md:pb-0 px-4 sm:px-0 animate-in fade-in duration-300 py-6 sm:py-0">
              <CustomerHeader
                customer={sheetCustomer}
                isSheet={true}
                onClose={() => setSelectedUc(null)}
              />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                  <CustomerInfo customer={sheetCustomer} />
                </div>
                <div className="lg:col-span-5 h-[calc(100vh-220px)] lg:sticky lg:top-0 overflow-y-auto pr-2 rounded-lg border bg-white shadow-sm">
                  <CustomerTimeline customer={sheetCustomer} />
                </div>
                <div className="lg:col-span-4 space-y-6 h-auto">
                  <CustomerActionForm
                    customer={sheetCustomer}
                    isSheet={true}
                    onClose={() => setSelectedUc(null)}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
