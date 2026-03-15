import { Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Customer } from '@/lib/mock'

export function CustomerHeader({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to="/queue">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Link to="/queue" className="hover:underline">
          Fila
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">UC {customer.uc}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm border-l-4 border-l-primary">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-primary">{customer.name}</h1>
            <Badge variant="outline" className="bg-slate-100">
              {customer.personCode}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>{customer.document}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
            <span className="truncate max-w-[300px]">{customer.address}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="text-sm px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">
            {customer.status.toUpperCase().replace('_', ' ')}
          </Badge>
          <span className="text-2xl font-bold text-destructive">
            R$ {customer.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {customer.redundancyAlert && (
        <Alert
          variant="destructive"
          className="bg-amber-50 border-amber-200 text-amber-800 animate-in slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4 !text-amber-800" />
          <AlertTitle>Alerta de Redundância</AlertTitle>
          <AlertDescription>
            Este cliente foi contatado por <strong>{customer.redundancyAlert.operator}</strong> há{' '}
            {customer.redundancyAlert.daysAgo} dias. Verifique o histórico antes de realizar uma
            nova abordagem.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
