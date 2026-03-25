import { Phone, MapPin, CheckCircle2, XCircle, FileText, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ParsedDebt } from '@/services/debts'

export function CustomerInfo({ customer }: { customer: ParsedDebt }) {
  const totalPhones = customer.phones.length
  let score = 0
  customer.phones.forEach((p) => {
    if (p.status === 'validado') score += 100
    else if (p.status === 'a_verificar') score += 50
  })
  const phoneQuality = totalPhones > 0 ? score / totalPhones : 0

  const invoices = customer.invoices || []
  const validInvoices = invoices.filter((i) => i.months !== null)
  const minMonths =
    validInvoices.length > 0 ? Math.min(...validInvoices.map((i) => i.months as number)) : null
  const maxMonths =
    validInvoices.length > 0 ? Math.max(...validInvoices.map((i) => i.months as number)) : null
  const avgValue = invoices.length > 0 ? customer.totalDebt / invoices.length : 0

  const displayMonths = (months: number | null) => {
    if (months === null) return '-'
    const val = Math.max(0, months)
    return val
  }

  const getMonthLabel = (months: number | null) => {
    if (months === null) return ''
    const val = Math.max(0, months)
    return val === 1 ? 'mês' : 'meses'
  }

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
            {customer.phones.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-2">
                Nenhum telefone registrado.
              </p>
            ) : (
              customer.phones.map((phone, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{phone.number}</span>
                  </div>
                  {phone.status === 'validado' && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-1.5 py-0 rounded-sm"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Validado
                    </Badge>
                  )}
                  {phone.status === 'invalido' && (
                    <Badge
                      variant="outline"
                      className="bg-rose-50 text-rose-700 border-rose-200 gap-1 px-1.5 py-0 rounded-sm"
                    >
                      <XCircle className="h-3 w-3" /> Inválido
                    </Badge>
                  )}
                  {phone.status === 'a_verificar' && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 gap-1 px-1.5 py-0 rounded-sm"
                    >
                      <HelpCircle className="h-3 w-3" /> A verificar
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Qualidade Cadastral</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${phoneQuality >= 100 ? 'bg-emerald-500' : phoneQuality > 0 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(phoneQuality, 5)}%` }}
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
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 p-2.5 rounded-lg border flex flex-col justify-center shadow-subtle">
                <div className="grid grid-cols-2 gap-1 divide-x divide-slate-200">
                  <div className="text-center px-1">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter leading-tight block mb-1">
                      Dívida Mais Recente
                    </span>
                    <span className="text-xl font-bold text-[#ff8c00] leading-none">
                      {displayMonths(minMonths)}
                    </span>
                    {minMonths !== null && (
                      <span className="text-[9px] text-muted-foreground block mt-0.5">
                        {getMonthLabel(minMonths)}
                      </span>
                    )}
                  </div>
                  <div className="text-center px-1">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter leading-tight block mb-1">
                      Dívida Mais Antiga
                    </span>
                    <span className="text-xl font-bold text-rose-600 leading-none">
                      {displayMonths(maxMonths)}
                    </span>
                    {maxMonths !== null && (
                      <span className="text-[9px] text-muted-foreground block mt-0.5">
                        {getMonthLabel(maxMonths)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border text-center flex-1 flex flex-col items-center justify-center shadow-subtle">
                <span className="text-[10px] text-muted-foreground block mb-1 font-bold uppercase tracking-wider">
                  Valor Médio das Faturas
                </span>
                <span className="text-xl font-black text-blue-600">
                  R${' '}
                  {avgValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-center shrink-0 shadow-subtle">
                <span className="text-[10px] text-muted-foreground block mb-1 font-bold uppercase tracking-wider">
                  Faturas Abertas
                </span>
                <span className="text-2xl font-black text-slate-800 leading-none">
                  {invoices.length}
                </span>
              </div>

              <div className="bg-white rounded-lg border shadow-subtle flex-1 flex flex-col overflow-hidden max-h-[160px]">
                <div className="bg-slate-50 py-1.5 border-b text-center shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Referências
                  </span>
                </div>
                <div className="overflow-y-auto p-2 space-y-1.5 flex-1">
                  {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-[10px] text-center py-2">
                      Sem faturas.
                    </p>
                  ) : (
                    invoices.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded py-1 px-1"
                      >
                        <span className="font-bold text-slate-700 text-sm leading-tight text-center">
                          {inv.ref === 'NEG' ? 'Outras Negociações' : inv.ref}
                        </span>
                        {inv.months !== null && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {displayMonths(inv.months)} {getMonthLabel(inv.months)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
