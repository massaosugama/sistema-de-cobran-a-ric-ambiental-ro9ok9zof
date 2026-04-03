import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, MapPin, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPersonCode, cn } from '@/lib/utils'
import type { ParsedDebt } from '@/services/debts'
import { supabase } from '@/lib/supabase/client'

export function CustomerHeader({
  customer,
  isSheet,
  onClose,
  parentCustomer,
}: {
  customer: ParsedDebt
  isSheet?: boolean
  onClose?: () => void
  parentCustomer?: ParsedDebt
}) {
  const [valorRetido, setValorRetido] = useState<number>(0)

  useEffect(() => {
    if (customer?.uc) {
      supabase
        .from('pending_debts')
        .select('valor_retidas_em_aberto')
        .eq('uc', customer.uc)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const sum = data.reduce(
              (acc, curr) => acc + Number(curr.valor_retidas_em_aberto || 0),
              0,
            )
            setValorRetido(sum)
          }
        })
    }
  }, [customer?.uc])

  return (
    <div className="space-y-4">
      {!isSheet ? (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-slate-200"
            asChild
          >
            <Link to="/queue">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Link to="/queue" className="hover:text-primary transition-colors">
            Fila de Atendimento
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">UC {customer.uc}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-slate-200"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={onClose}>
            Voltar para {parentCustomer ? `UC ${parentCustomer.uc}` : 'UC Anterior'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">UC {customer.uc} (Vínculo)</span>
        </div>
      )}

      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border shadow-sm relative overflow-hidden',
          valorRetido > 0
            ? 'bg-orange-50/40 border-orange-200'
            : customer.isLoteVago
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-slate-200',
        )}
      >
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-2',
            valorRetido > 0 ? 'bg-orange-500' : customer.isLoteVago ? 'bg-amber-500' : 'bg-primary',
          )}
        ></div>

        <div className="pl-2">
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {customer.name || 'Cliente Sem Nome'}
            </h1>
            {customer.personCode && (
              <Badge
                variant="outline"
                className="bg-slate-50/80 border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] py-0.5"
              >
                CÓD: {formatPersonCode(customer.personCode)}
              </Badge>
            )}
            <span className="text-2xl font-black tracking-tight text-slate-900 border-l-2 border-slate-300 pl-3 flex items-center">
              UC {customer.uc}
              {customer.isLoteVago && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider text-[10px] py-0.5 ml-3 flex items-center shadow-sm">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Lote Vago
                </Badge>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500 mt-2">
            {customer.document && (
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">{customer.document}</span>
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block" />
            <span className="truncate max-w-[400px]">
              {customer.address || 'Endereço não cadastrado'}
            </span>
            {customer.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[11px] text-primary hover:text-primary/80 hover:bg-primary/20 bg-primary/10 px-2 py-1 rounded-full font-bold transition-colors"
              >
                <MapPin className="w-3 h-3 mr-1" /> Ver no Mapa
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pl-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
          <Badge className="text-xs px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold uppercase tracking-wide">
            {customer.status.replace('_', ' ')}
          </Badge>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Dívida Total
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-3xl font-black leading-none',
                  valorRetido > 0 ? 'text-orange-600' : 'text-slate-900',
                )}
              >
                R$ {customer.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              {valorRetido > 0 && (
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-none text-[10px] px-2 py-0.5 uppercase tracking-wider ml-1 shadow-sm">
                  Retido
                </Badge>
              )}
              {(customer.valorVencido > 0 || customer.valorAVencer > 0 || valorRetido > 0) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      className={cn(
                        'h-5 w-5 transition-colors cursor-help',
                        valorRetido > 0
                          ? 'text-orange-400 hover:text-orange-600'
                          : 'text-slate-400 hover:text-primary',
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="p-3 bg-white border border-slate-200 shadow-xl rounded-xl">
                    <div className="space-y-2 text-sm">
                      {customer.valorVencido > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500 font-medium">Vencido:</span>
                          <span className="font-bold text-rose-600">
                            R${' '}
                            {customer.valorVencido.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      {customer.valorAVencer > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500 font-medium">A Vencer:</span>
                          <span className="font-bold text-emerald-600">
                            R${' '}
                            {customer.valorAVencer.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      {valorRetido > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500 font-medium">Retido:</span>
                          <span className="font-bold text-orange-600">
                            R${' '}
                            {valorRetido.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {customer.redundancyAlert && (
        <Alert className="bg-orange-50 border-orange-200 text-orange-900 rounded-xl animate-in slide-in-from-top-2 shadow-sm">
          <AlertCircle className="h-5 w-5 !text-[#ff8c00]" />
          <AlertTitle className="font-bold text-orange-900 flex items-center gap-2">
            Alerta de Redundância
          </AlertTitle>
          <AlertDescription className="font-medium mt-1">
            Este cliente foi contatado por{' '}
            <strong className="font-black">{customer.redundancyAlert.operator}</strong> há{' '}
            {customer.redundancyAlert.daysAgo} dias. Verifique o histórico.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
