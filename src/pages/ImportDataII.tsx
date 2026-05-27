import { useState, useEffect } from 'react'
import {
  Upload,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Ban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface ImportJob {
  id: string
  import_type: string
  file_name: string
  status: string
  total_records: number
  processed_records: number
  error_details: string | null
  created_at: string
}

export default function ImportDataII() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [importType, setImportType] = useState<string>('pending_debts')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const [discardedLogs, setDiscardedLogs] = useState<any[]>([])
  const [showDiscardedModal, setShowDiscardedModal] = useState(false)

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchJobs = async () => {
    const { data, error } = await (supabase as any)
      .from('import_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data && !error) {
      setJobs(data)
    }
  }

  const handleCancelJob = async (jobId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('import_jobs')
        .update({
          status: 'cancelled',
          error_details: 'Cancelado pelo usuário.',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      toast({
        title: 'Cancelado',
        description: 'O processamento foi interrompido.',
      })
      fetchJobs()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar: ' + error.message,
        variant: 'destructive',
      })
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Atenção',
        description: 'Selecione um arquivo primeiro.',
        variant: 'destructive',
      })
      return
    }

    if (!user) return

    try {
      setIsUploading(true)

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('imports').upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: job, error: jobError } = await (supabase as any)
        .from('import_jobs')
        .insert([
          {
            user_id: user.id,
            import_type: importType,
            file_name: file.name,
            file_path: filePath,
            status: 'pending',
          },
        ])
        .select()
        .single()

      if (jobError || !job) throw jobError

      const { error: invokeError } = await supabase.functions.invoke('process-import-ii', {
        body: { jobId: job.id },
      })

      if (invokeError) throw invokeError

      toast({
        title: 'Sucesso',
        description:
          'Arquivo enviado. O processamento continuará no servidor mesmo se você sair desta página.',
      })

      setFile(null)
      fetchJobs()
    } catch (error: any) {
      console.error('Upload Error:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao enviar arquivo',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <Ban className="h-5 w-5 text-slate-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-slate-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pending_debts':
        return 'Pendências (Substituição)'
      case 'settlements':
        return 'Baixas (Incremento)'
      case 'daily_readings':
        return 'Leituras Diárias'
      default:
        return type
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Importação II (Nuvem)</h2>
        <p className="text-muted-foreground">
          Processamento atômico em segundo plano via Supabase Edge Functions. Independente do
          navegador.
        </p>
      </div>

      <Dialog open={showDiscardedModal} onOpenChange={setShowDiscardedModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registros Descartados (REFS Inválido)</DialogTitle>
            <DialogDescription>
              Os seguintes registros foram rejeitados pela validação da coluna REFS.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UC</TableHead>
                  <TableHead>Cód. Pessoa</TableHead>
                  <TableHead>REFS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discardedLogs.slice(0, 100).map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{r.uc}</TableCell>
                    <TableCell>{r.cod_pess_fat}</TableCell>
                    <TableCell className="text-red-600 font-mono text-xs">{r.refs}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {discardedLogs.length > 100 && (
            <p className="text-sm text-slate-500 mt-2">
              Mostrando apenas os 100 primeiros registros salvos no log deste Job.
            </p>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDiscardedModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nova Carga de Dados</CardTitle>
            <CardDescription>
              Faça o upload do seu CSV ou Excel. O servidor assumirá o processamento até a
              conclusão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tabela de Destino</Label>
              <Select value={importType} onValueChange={setImportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_debts">Pendências (Substituição Total)</SelectItem>
                  <SelectItem value="settlements">Baixas (Incremento)</SelectItem>
                  <SelectItem value="daily_readings">Leituras Diárias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100',
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragging(false)
                    if (e.dataTransfer.files?.[0]) {
                      setFile(e.dataTransfer.files[0])
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 pointer-events-none">
                    <Upload
                      className={cn(
                        'w-8 h-8 mb-2 transition-colors',
                        isDragging ? 'text-primary' : 'text-slate-400',
                      )}
                    />
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold">Clique para buscar</span> ou arraste
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[250px] truncate">
                      {file ? file.name : 'Somente .csv ou .xlsx'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <Button
              className="w-full font-semibold"
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferindo para a Nuvem...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Processar no Servidor
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Acompanhamento</CardTitle>
            <CardDescription>
              Status atual das importações sendo executadas no servidor.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Clock className="h-8 w-8 mb-2 opacity-50" />
                <p>Nenhuma tarefa recente enviada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col space-y-2 p-4 border rounded-lg bg-slate-50/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="text-sm font-semibold">{getTypeLabel(job.import_type)}</p>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
                            {job.file_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded">
                          {new Date(job.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {(job.status === 'processing' || job.status === 'pending') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelJob(job.id)}
                            title="Cancelar Importação"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {job.status === 'processing' && (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>{job.processed_records} registros processados</span>
                          {job.total_records > 0 ? (
                            <span>{job.total_records} total</span>
                          ) : (
                            <span className="italic animate-pulse text-blue-500">Streaming...</span>
                          )}
                        </div>
                        <Progress
                          value={
                            job.total_records > 0
                              ? (job.processed_records / job.total_records) * 100
                              : 100
                          }
                          className={cn(
                            'h-2 transition-all',
                            job.total_records === 0 && 'animate-pulse bg-blue-100 dark:bg-blue-900',
                          )}
                        />
                      </div>
                    )}

                    {job.status === 'error' &&
                      !job.error_details?.startsWith('{"type":"DISCARDS"') && (
                        <div className="mt-2 flex items-start space-x-1 text-xs text-red-700 bg-red-50/50 border border-red-100 p-2 rounded">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span className="break-all">{job.error_details}</span>
                        </div>
                      )}

                    {job.status === 'cancelled' && (
                      <div className="mt-2 flex items-start space-x-1 text-xs text-slate-700 bg-slate-100 border border-slate-200 p-2 rounded">
                        <Ban className="h-4 w-4 shrink-0" />
                        <span className="break-all">
                          {job.error_details || 'Operação cancelada.'}
                        </span>
                      </div>
                    )}

                    {job.status === 'completed' && (
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                            {job.processed_records} inseridos/atualizados
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {job.total_records > job.processed_records
                              ? job.total_records - job.processed_records
                              : 0}{' '}
                            ignorados/falhas
                          </span>
                        </div>
                        {job.error_details &&
                          job.error_details.startsWith('{"type":"DISCARDS"') && (
                            <div className="flex flex-col space-y-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
                              <div className="flex items-center space-x-1 font-semibold">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{JSON.parse(job.error_details).message}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-fit h-6 text-[10px] mt-1 bg-white"
                                onClick={() => {
                                  setDiscardedLogs(JSON.parse(job.error_details!).records)
                                  setShowDiscardedModal(true)
                                }}
                              >
                                Ver Detalhes
                              </Button>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
