import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, TrendingUp, RefreshCcw, Search, MapPin } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

export default function Reversions() {
  const { user } = useAuth()
  const [rawResults, setRawResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<'meus' | 'todos'>('meus')
  const [search, setSearch] = useState('')
  const [searchAddress, setSearchAddress] = useState('')

  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('contact_results')
      .select('*, contact_history(*, profiles(name)), settlements(*)')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const ucs = [...new Set(data.map((d) => d.uc).filter(Boolean))]
          const { data: debts } = await supabase
            .from('pending_debts')
            .select('uc, cod_pess_fat, endereco, pessoa_fatura_nome')
            .in('uc', ucs)

          const enriched = data.map((r) => {
            const debt = debts?.find((d) => d.uc === r.uc && d.cod_pess_fat === r.cod_pess_fat)
            return {
              ...r,
              endereco: debt?.endereco || '',
              nome_cliente:
                debt?.pessoa_fatura_nome || r.settlements?.pessoa_fatura_nome || 'Não identificado',
            }
          })
          setRawResults(enriched)
        } else {
          setRawResults([])
        }
        setLoading(false)
      })
  }, [])

  const results = useMemo(() => {
    let res = rawResults

    if (view === 'meus') {
      res = res.filter((r) => r.contact_history?.operator_id === user?.id)
    }

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase()
      res = res.filter(
        (r) =>
          r.uc.toLowerCase().includes(lowerSearch) ||
          (r.nome_cliente && r.nome_cliente.toLowerCase().includes(lowerSearch)),
      )
    }

    if (debouncedSearchAddress) {
      const lowerAddr = debouncedSearchAddress.toLowerCase()
      res = res.filter((r) => r.endereco && r.endereco.toLowerCase().includes(lowerAddr))
    }

    return res
  }, [rawResults, view, user?.id, debouncedSearch, debouncedSearchAddress])

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Reversões & Resultados
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Acompanhamento de conversões de acordos e pagamentos efetuados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre UC, Nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
              />
            </div>
            <div className="relative w-full sm:w-[220px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filtre Endereço"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="bg-slate-200/50 p-1 rounded-lg inline-flex w-full sm:w-auto">
              <button
                onClick={() => setView('meus')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-semibold transition-all flex-1 sm:flex-none',
                  view === 'meus'
                    ? 'bg-white shadow text-primary'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Meus
              </button>
              <button
                onClick={() => setView('todos')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-semibold transition-all flex-1 sm:flex-none',
                  view === 'todos'
                    ? 'bg-white shadow text-primary'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Todos
              </button>
            </div>
          </div>
        </div>
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
            telas de atendimento. Apenas baixas identificadas como CONV.ARREC ou DEB.AUTO geram
            reversões automáticas.
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
                    <p>Nenhuma conversão registrada ou encontrada nos filtros.</p>
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
                      <span
                        className="font-bold text-slate-800 line-clamp-1"
                        title={res.nome_cliente}
                      >
                        {res.nome_cliente}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-sm text-slate-600">UC {res.uc}</span>
                        <span className="text-[10px] text-slate-400">Cod: {res.cod_pess_fat}</span>
                      </div>
                      {res.endereco && (
                        <span
                          className="text-xs text-slate-500 line-clamp-1 mt-0.5"
                          title={res.endereco}
                        >
                          {res.endereco}
                        </span>
                      )}
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
                          <span className="uppercase font-semibold">
                            {res.settlements?.tipo_baixa || 'N/A'}
                          </span>
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
