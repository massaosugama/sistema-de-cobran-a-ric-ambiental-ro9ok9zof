import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, TrendingUp, RefreshCcw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

export default function Reversions() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('contact_results')
      .select('*, contact_history(*, profiles(name)), settlements(*)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (data) setResults(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Reversões & Resultados
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Acompanhamento de conversões de acordos e pagamentos efetuados.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 shadow-sm">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-amber-900">Aviso de Dados Históricos</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Os valores, faturas e indicadores apresentados nesta tela são dados estáticos (
            <strong>snapshots</strong>) registrados no exato momento da abertura do atendimento.
            Eles servem exclusivamente para o monitoramento de resultados históricos e mensuração de
            reversão de dívidas, não devendo ser confundidos com os saldos atualizados exibidos nas
            telas de atendimento.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCcw className="w-5 h-5 text-emerald-600" /> Histórico de Conversões
          </CardTitle>
          <CardDescription>
            Cruzamento entre os atendimentos e as baixas detectadas no sistema dentro do prazo de
            conversão.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead>Devedor / UC</TableHead>
                <TableHead>Snapshot do Atendimento</TableHead>
                <TableHead>Baixa Detectada</TableHead>
                <TableHead className="text-center">Tempo</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Carregando resultados...
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p>Nenhuma conversão registrada ainda.</p>
                    <p className="text-xs mt-1">As conversões aparecerão após a carga de baixas.</p>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium text-slate-800">
                      {res.contact_history?.profiles?.name || 'Desconhecido'}
                      <div className="text-xs text-slate-500 font-normal mt-0.5">
                        {res.contact_history?.contact_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold block">UC {res.uc}</span>
                      <span className="text-xs text-slate-500">Cod: {res.cod_pess_fat}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Valor Dívida:</span>
                          <span className="font-semibold">
                            R${' '}
                            {(res.contact_history?.snapshot_valor_total || 0).toLocaleString(
                              'pt-BR',
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {res.contact_history?.created_at
                            ? format(parseISO(res.contact_history.created_at), 'dd/MM/yyyy')
                            : '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Valor Baixado:</span>
                          <span className="font-bold text-emerald-600">
                            R${' '}
                            {(res.valor_recuperado || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          {res.data_baixa ? format(parseISO(res.data_baixa), 'dd/MM/yyyy') : '-'}
                          <span className="mx-1">•</span>
                          <span className="uppercase">{res.settlements?.tipo_baixa || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                        {res.dias_para_reversao} {res.dias_para_reversao === 1 ? 'dia' : 'dias'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-600 text-sm font-bold">
                        +{res.pontos_reversao}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
