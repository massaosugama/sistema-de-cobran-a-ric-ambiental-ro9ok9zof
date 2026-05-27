import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function MatchedDebtsDrawer({
  cpfCnpj,
  isOpen,
  onOpenChange,
}: {
  cpfCnpj: string | null
  isOpen: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && cpfCnpj) {
      setLoading(true)
      const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')

      const orQuery = `pessoa_fatura_cpf_cnpj.eq."${cpfCnpj}",proprietario_cpf_cnpj.eq."${cpfCnpj}",responsavel_cpf_cnpj.eq."${cpfCnpj}",pessoa_fatura_cpf_cnpj.eq."${cleanCpfCnpj}",proprietario_cpf_cnpj.eq."${cleanCpfCnpj}",responsavel_cpf_cnpj.eq."${cleanCpfCnpj}",cod_pess_fat.eq."${cpfCnpj}",cod_pess_fat.eq."${cleanCpfCnpj}"`

      supabase
        .from('pending_debts')
        .select(
          'uc, cod_pess_fat, pessoa_fatura_nome, pessoa_fatura_cpf_cnpj, valor_total, valor_vencido, qt_fats, situ_docto',
        )
        .eq('is_active', true)
        .or(orQuery)
        .then(({ data }) => {
          setDebts(data || [])
          setLoading(false)
        })
    } else {
      setDebts([])
    }
  }, [isOpen, cpfCnpj])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Vínculos na Base</SheetTitle>
          <SheetDescription>
            Dívidas pendentes associadas ao documento: <span className="font-bold">{cpfCnpj}</span>
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
          </div>
        ) : debts.length === 0 ? (
          <div className="text-center text-slate-500 py-12 border rounded-md border-dashed bg-slate-50">
            Nenhum vínculo pendente encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map((debt, i) => (
              <Card key={i} className="shadow-sm border-slate-200">
                <CardHeader className="py-3 px-4 bg-slate-50 border-b">
                  <CardTitle className="text-sm font-bold flex justify-between items-center">
                    <span>UC: {debt.uc}</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">
                      R${' '}
                      {Number(debt.valor_total).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4 text-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-medium mb-1">
                        Pessoa Fatura
                      </span>
                      <span
                        className="font-medium truncate block"
                        title={debt.pessoa_fatura_nome || 'N/I'}
                      >
                        {debt.pessoa_fatura_nome || 'N/I'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-medium mb-1">
                        Cód. Pessoa
                      </span>
                      <span className="font-medium">{debt.cod_pess_fat || 'N/I'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-medium mb-1">
                        CPF/CNPJ
                      </span>
                      <span className="font-medium">{debt.pessoa_fatura_cpf_cnpj || 'N/I'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] uppercase tracking-wider font-medium mb-1">
                        Faturas / Doc
                      </span>
                      <span className="font-medium">
                        {debt.qt_fats || 0} faturas <span className="text-slate-400 mx-1">•</span>{' '}
                        {debt.situ_docto || 'N/I'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
