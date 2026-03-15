import { Phone, MapPin, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Customer } from '@/lib/mock'

export function CustomerInfo({ customer }: { customer: Customer }) {
  const validPhones = customer.phones.filter((p) => p.isValid).length
  const totalPhones = customer.phones.length
  const phoneQuality = (validPhones / totalPhones) * 100

  return (
    <>
      <Card>
        <CardHeader className="pb-3 bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Dados de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm">
          <div className="space-y-3">
            {customer.phones.map((phone, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{phone.number}</span>
                </div>
                {phone.isValid ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-1.5 py-0 rounded-sm"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Válido
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-rose-50 text-rose-700 border-rose-200 gap-1 px-1.5 py-0 rounded-sm"
                  >
                    <XCircle className="h-3 w-3" /> Inválido
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Qualidade Cadastral</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${phoneQuality > 50 ? 'bg-emerald-500' : 'bg-warning'}`}
                style={{ width: `${phoneQuality}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Resumo da Dívida
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground block mb-1">Dias Atraso</span>
              <span className="text-xl font-bold text-destructive">{customer.overdueDays}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs text-muted-foreground block mb-1">Faturas Abertas</span>
              <span className="text-xl font-bold">{customer.invoices.length}</span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Referências em aberto
            </p>
            {customer.invoices.map((inv, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-sm p-2 bg-white border rounded-md shadow-subtle"
              >
                <span className="font-medium text-slate-700">{inv.ref}</span>
                <div className="flex flex-col text-right">
                  <span className="font-semibold text-primary">R$ {inv.value.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">{inv.days} dias</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
