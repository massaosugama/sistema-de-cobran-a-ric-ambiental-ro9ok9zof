import { Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function CustomerHeader({
  customer,
  isSheet,
  onClose,
}: {
  customer: any
  isSheet?: boolean
  onClose?: () => void
}) {
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
            Voltar para UC Principal
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">UC {customer.uc} (Vínculo)</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>

        <div className="pl-2">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {customer.name || 'Cliente Sem Nome'}
            </h1>
            {customer.personCode && (
              <Badge
                variant="outline"
                className="bg-slate-50 border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]"
              >
                CÓD: {customer.personCode}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
            {customer.document && (
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">{customer.document}</span>
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 hidden sm:block" />
            <span className="truncate max-w-[400px]">
              {customer.address || 'Endereço não cadastrado'}
            </span>
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
            <span className="text-3xl font-black text-slate-900 leading-none">
              R$ {customer.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
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
