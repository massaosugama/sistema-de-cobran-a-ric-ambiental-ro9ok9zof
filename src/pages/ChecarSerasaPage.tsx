import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Loader2,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { SerasaWorkflow } from '@/components/serasa/SerasaWorkflow'
import { SerasaBlacklist } from '@/components/serasa/SerasaBlacklist'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SerasaRecord {
  id: string
  cpf_cnpj: string
  nome: string
  num_contrato: string
  valor: number
  data_envio: string | null
  situacao: string
  possui_debitos: boolean | null
  ultima_verificacao: string | null
  baixado_aqui: boolean
  data_baixa_aqui?: string | null
  is_blacklisted?: boolean
}

export default function ChecarSerasaPage() {
  const [data, setData] = useState<SerasaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyPendencies, setOnlyPendencies] = useState(false)
  const [showBaixados, setShowBaixados] = useState(false)
  const [workflowRefresh, setWorkflowRefresh] = useState(0)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const { profile } = useAuth()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase.rpc('get_serasa_cross_reference', {
        p_cpf_cnpj: search || null,
        p_possui_debitos: onlyPendencies ? false : null,
        p_baixado_aqui: showBaixados,
        p_limit: 200,
        p_offset: 0,
      })

      if (error) throw error
      setData(result || [])
    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [onlyPendencies, showBaixados])

  const handleSincronizar = async () => {
    setUpdating(true)
    try {
      const { error } = await supabase.rpc('update_serasa_debts_status')
      if (error) throw error
      toast({
        title: 'Checagem Concluída',
        description: 'Os registros foram cruzados com a base de pendências.',
      })
      await fetchData()
    } catch (error: any) {
      toast({ title: 'Erro na checagem', description: error.message, variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadSerasa = (id: string) => {
    toast({ title: 'Aviso', description: 'Ação em desenvolvimento.' })
  }

  const handleDownloadAqui = async (id: string, currentBaixado: boolean) => {
    if (profile?.role === 'consultas') {
      toast({
        title: 'Acesso Negado',
        description: 'Seu perfil não tem permissão para esta ação.',
        variant: 'destructive',
      })
      return
    }
    try {
      const newDataBaixa = !currentBaixado ? new Date().toISOString() : null

      const { error } = await supabase
        .from('serasa_negativations')
        .update({
          baixado_aqui: !currentBaixado,
          data_baixa_aqui: newDataBaixa,
        })
        .eq('id', id)

      if (error) throw error

      setData((prev) =>
        prev
          .filter((item) => {
            // Remove from list if toggled and filter doesn't match anymore
            if (item.id === id) {
              if (!showBaixados && !currentBaixado) return false
            }
            return true
          })
          .map((item) =>
            item.id === id
              ? { ...item, baixado_aqui: !currentBaixado, data_baixa_aqui: newDataBaixa }
              : item,
          ),
      )

      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' })
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4 md:p-6 overflow-hidden">
      <header className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Checar Serasa</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status das negativações e cruze informações com nossos registros.
        </p>
      </header>

      <Tabs defaultValue="consulta" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 self-start">
          <TabsTrigger value="consulta">Consulta Principal</TabsTrigger>
          <TabsTrigger value="workflow">Workflow de Negativações</TabsTrigger>
          <TabsTrigger value="blacklist">Black-list</TabsTrigger>
        </TabsList>

        <TabsContent
          value="consulta"
          className="flex-1 flex-col gap-4 mt-4 data-[state=active]:flex data-[state=inactive]:hidden min-h-0"
        >
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm shrink-0">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CPF/CNPJ ou Nome..."
                className="pl-8 max-w-md bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pendencies"
                  checked={onlyPendencies}
                  onCheckedChange={(c) => setOnlyPendencies(!!c)}
                />
                <label
                  htmlFor="pendencies"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  S/ déb.vencidos (p/ Baixar!)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="baixados"
                  checked={showBaixados}
                  onCheckedChange={(c) => setShowBaixados(!!c)}
                />
                <label
                  htmlFor="baixados"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Mostrar já baixados
                </label>
              </div>

              {profile && profile.role !== 'consultas' && (
                <Button
                  onClick={handleSincronizar}
                  disabled={updating || loading}
                  variant="secondary"
                  className="w-full sm:w-auto bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Checar Pendências
                </Button>
              )}

              <Button
                onClick={fetchData}
                disabled={loading || updating}
                className="w-full sm:w-auto"
              >
                {loading && !updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Atualizar Lista
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden min-h-0">
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-2 w-[130px]">CPF/CNPJ</TableHead>
                    <TableHead className="px-2 min-w-[150px] max-w-[200px]">Nome</TableHead>
                    <TableHead className="whitespace-nowrap px-2 w-[110px]">
                      Contrato (ref.)
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-2 text-right w-[100px]">
                      Valor
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-2 text-center w-[90px]">
                      Enviado em
                    </TableHead>
                    <TableHead className="whitespace-nowrap px-2 text-center w-[110px]">
                      C/ déb.
                      <br />
                      vencidos?
                    </TableHead>
                    {showBaixados ? (
                      <TableHead className="whitespace-nowrap px-2 text-center w-[120px]">
                        Data da Baixa
                      </TableHead>
                    ) : (
                      <TableHead className="whitespace-nowrap px-2 text-center w-[80px]">
                        Ações
                      </TableHead>
                    )}
                    <TableHead className="whitespace-nowrap px-2 text-right w-[120px]">
                      {' '}
                      Última Checagem
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'text-sm group transition-colors',
                          item.is_blacklisted
                            ? 'bg-red-100/60 hover:bg-red-100'
                            : item.possui_debitos === false
                              ? 'bg-green-100/60 hover:bg-green-100'
                              : 'hover:bg-muted/50',
                        )}
                      >
                        <TableCell className="px-2 font-medium whitespace-nowrap">
                          {item.cpf_cnpj}
                        </TableCell>
                        <TableCell className="px-2 truncate max-w-[200px]" title={item.nome}>
                          {item.nome}
                        </TableCell>
                        <TableCell className="px-2 whitespace-nowrap">
                          {item.num_contrato}
                        </TableCell>
                        <TableCell className="px-2 text-right font-medium whitespace-nowrap">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.valor)}
                        </TableCell>
                        <TableCell className="px-2 text-center whitespace-nowrap text-foreground font-medium">
                          {item.data_envio ? format(new Date(item.data_envio), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="px-2 text-center whitespace-nowrap">
                          {item.is_blacklisted ? (
                            <span className="inline-flex items-center bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" /> Black!
                            </span>
                          ) : item.possui_debitos === true ? (
                            <span className="inline-flex items-center bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" /> Sim
                            </span>
                          ) : item.possui_debitos === false ? (
                            <span className="inline-flex items-center bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Não
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        {showBaixados ? (
                          <TableCell className="px-2 text-center whitespace-nowrap font-medium text-slate-700">
                            {item.data_baixa_aqui
                              ? format(new Date(item.data_baixa_aqui), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                        ) : (
                          <TableCell className="px-2 text-center whitespace-nowrap">
                            {profile && profile.role !== 'consultas' && (
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7 rounded-full bg-white hover:bg-slate-100"
                                      onClick={() => handleDownloadSerasa(item.id)}
                                    >
                                      <Download className="w-3.5 h-3.5 text-slate-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>Baixar Serasa</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={item.baixado_aqui ? 'default' : 'outline'}
                                      size="icon"
                                      className={cn(
                                        'h-7 w-7 rounded-full',
                                        item.baixado_aqui
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                          : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200',
                                      )}
                                      onClick={() => handleDownloadAqui(item.id, item.baixado_aqui)}
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>{item.baixado_aqui ? 'Baixado Aqui' : 'Baixar Aqui'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="px-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {' '}
                          {item.ultima_verificacao
                            ? format(new Date(item.ultima_verificacao), 'dd/MM/yyyy HH:mm')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent
          value="workflow"
          className="flex-1 flex-col mt-4 data-[state=active]:flex data-[state=inactive]:hidden min-h-0"
        >
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <SerasaWorkflow
              refreshTrigger={workflowRefresh}
              onDataChanged={() => setWorkflowRefresh((prev) => prev + 1)}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="blacklist"
          className="flex-1 flex-col mt-4 data-[state=active]:flex data-[state=inactive]:hidden min-h-0"
        >
          <SerasaBlacklist />
        </TabsContent>
      </Tabs>
    </div>
  )
}
