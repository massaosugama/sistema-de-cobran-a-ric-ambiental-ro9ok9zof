import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ExternalLink, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRelatedDebts, type ParsedDebt } from '@/services/debts'

export function RelatedDebts({ customer }: { customer: ParsedDebt }) {
  const [relatedDebts, setRelatedDebts] = useState<ParsedDebt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (customer) {
      setLoading(true)
      getRelatedDebts(
        customer.uc,
        customer.personCode,
        customer.rawPessoaFaturaNome || null,
        customer.rawPessoaFaturaCpfCnpj || null,
      )
        .then((data) => {
          if (isMounted) {
            setRelatedDebts(data)
            setLoading(false)
          }
        })
        .catch((err) => {
          console.error(err)
          if (isMounted) setLoading(false)
        })
    }

    return () => {
      isMounted = false
    }
  }, [customer.uc, customer.personCode])

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
          {relatedDebts.map((debt) => (
            <Link
              key={`${debt.uc}_${debt.personCode}`}
              to={`/customer/${debt.uc}`}
              className="flex items-center justify-between p-2.5 bg-white border border-orange-100 rounded-lg hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className="overflow-hidden pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-slate-800 text-sm">UC {debt.uc}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{debt.name}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-black text-orange-700">
                  R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <div className="flex items-center text-[10px] text-orange-500 font-semibold uppercase mt-0.5 group-hover:text-orange-600">
                  Acessar <ExternalLink className="h-3 w-3 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
