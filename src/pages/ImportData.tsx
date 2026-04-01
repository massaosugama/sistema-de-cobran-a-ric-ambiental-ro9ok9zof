import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  X,
  Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppState } from '@/hooks/use-app-state'

const pendingDebtsColumns = [
  'cod_pess_fat',
  'endereco',
  'pessoa_fatura_celular',
  'pessoa_fatura_cpf_cnpj',
  'pessoa_fatura_nome',
  'proprietario_celular',
  'proprietario_cpf_cnpj',
  'proprietario_nome',
  'qt_fats',
  'refs',
  'responsavel_celular',
  'responsavel_cpf_cnpj',
  'responsavel_nome',
  'setor',
  'situ_docto',
  'ta_nome_de_quem',
  'uc',
  'uc_repete',
  'valor_total',
  'valor_vencido',
  'valor_a_vencer',
  'valor_retidas_em_aberto',
]

const settlementsColumns = [
  'id',
  'cod_pess_fat',
  'databaixa_final',
  'databaixa_inicial',
  'datacredito_final',
  'datacredito_inicial',
  'neg_data',
  'neg_desconto',
  'neg_parcelas',
  'neg_valor_acordo',
  'pessoa_fatura_celular',
  'pessoa_fatura_cpf_cnpj',
  'pessoa_fatura_nome',
  'qt_fats',
  'refs',
  'tipo_baixa',
  'uc',
  'valor_total',
  'datacriacao',
]

const parseCSV = async (file: File) => {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return { headers: [], data: [] }
  const separator = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ''))
  const data = lines.slice(1).map((l) => {
    const values = l.split(separator).map((v) => v.trim().replace(/^"|"$/g, ''))
    return headers.reduce(
      (acc, h, i) => {
        let val: any = values[i] !== undefined && values[i] !== '' ? values[i] : null

        if (typeof val === 'string' && val.trim().toUpperCase() === 'NULL') {
          val = null
        }

        if (
          typeof val === 'string' &&
          ['valor_total', 'valor_vencido', 'valor_a_vencer', 'valor_retidas_em_aberto'].includes(h)
        ) {
          if (val.includes(',') && !val.includes('.')) {
            val = parseFloat(val.replace(',', '.'))
          } else if (val.includes(',') && val.includes('.')) {
            val = parseFloat(val.replace(/\./g, '').replace(',', '.'))
          } else {
            val = parseFloat(val)
          }
          if (isNaN(val)) val = null
        }

        acc[h] = val
        return acc
      },
      {} as Record<string, any>,
    )
  })
  return { headers, data }
}

interface ImportResult {
  total: number
  inserted: number
  redundant: number
}

interface ImportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  tableName: 'pending_debts' | 'settlements'
  allowedColumns: string[]
  onProcess: (data: any[], setProgress: (p: number) => void) => Promise<ImportResult | void>
  enqueueTask: (id: string, run: () => Promise<void>) => void
}

function ImportCard({
  title,
  description,
  icon,
  tableName,
  allowedColumns,
  onProcess,
  enqueueTask,
}: ImportCardProps) {
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<
    'idle' | 'mapping' | 'queued' | 'uploading' | 'success' | 'error'
  >('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [csvData, setCsvData] = useState<any[]>([])
  const [extraColumns, setExtraColumns] = useState<string[]>([])
  const [rememberedColumns, setRememberedColumns] = useState<string[]>([])
  const [ignoredColumns, setIgnoredColumns] = useState<Record<string, boolean>>({})
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStart = async () => {
    if (!file) return
    try {
      const { headers, data } = await parseCSV(file)
      if (data.length === 0) throw new Error('O arquivo está vazio ou formato inválido.')
      setCsvData(data)

      const extra = headers.filter((h) => !allowedColumns.includes(h))
      if (extra.length > 0) {
        setExtraColumns(extra)
        const rememberedStr = localStorage.getItem(`ignored_columns_${tableName}`)
        const remembered = rememberedStr ? JSON.parse(rememberedStr) : []
        setRememberedColumns(remembered)
        const initialIgnored: Record<string, boolean> = {}
        extra.forEach((col) => (initialIgnored[col] = remembered.includes(col)))
        setIgnoredColumns(initialIgnored)
        setStatus('mapping')
      } else {
        proceedWithImport(data, {})
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
      toast({ title: 'Erro na leitura', description: err.message, variant: 'destructive' })
    }
  }

  const proceedWithImport = (data: any[], ignoredConfig: Record<string, boolean>) => {
    const toIgnore = Object.entries(ignoredConfig)
      .filter(([_, isIgnored]) => isIgnored)
      .map(([col]) => col)
    const allRemembered = Array.from(new Set([...rememberedColumns, ...toIgnore]))
    localStorage.setItem(`ignored_columns_${tableName}`, JSON.stringify(allRemembered))

    const cleanedData = data.map((row) => {
      const newRow = { ...row }
      toIgnore.forEach((col) => delete newRow[col])
      return newRow
    })

    setStatus('queued')
    setProgress(0)

    enqueueTask(tableName, async () => {
      setStatus('uploading')
      setProgress(5)
      setImportResult(null)

      try {
        const result = await onProcess(cleanedData, setProgress)
        if (result) {
          setImportResult(result)
        }
        setStatus('success')
        setProgress(100)
        toast({ title: 'Sucesso!', description: 'Arquivo processado.', variant: 'default' })
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(err.message)
        toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' })
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4 flex-1 flex flex-col">
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-primary transition-all cursor-pointer group flex-1 flex flex-col justify-center"
          >
            <UploadCloud className="h-10 w-10 text-slate-400 mx-auto mb-3 group-hover:text-primary transition-colors" />
            <h3 className="font-medium text-slate-900 mb-1">Selecione o arquivo CSV</h3>
            <p className="text-sm text-slate-500">Arraste e solte ou clique para buscar</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0])
              }}
            />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-900 line-clamp-1">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {status !== 'uploading' && status !== 'success' && status !== 'queued' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null)
                    setStatus('idle')
                  }}
                  className="text-slate-400 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {status === 'mapping' && (
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-4 animate-fade-in flex-1">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Colunas não reconhecidas</h4>
                    <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                      Selecione as colunas para ignorar.
                    </p>
                  </div>
                </div>
                <div className="space-y-1 bg-white rounded-lg p-2 border border-amber-100 max-h-48 overflow-y-auto">
                  {extraColumns.map((col) => (
                    <div
                      key={col}
                      className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`col-${col}-${tableName}`}
                          checked={ignoredColumns[col]}
                          onCheckedChange={(c) => setIgnoredColumns((p) => ({ ...p, [col]: !!c }))}
                        />
                        <label
                          htmlFor={`col-${col}-${tableName}`}
                          className="text-sm font-medium text-slate-700 cursor-pointer"
                        >
                          {col}
                        </label>
                      </div>
                      {!rememberedColumns.includes(col) && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider"
                        >
                          Nova
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => proceedWithImport(csvData, ignoredColumns)}
                  className="w-full"
                >
                  Confirmar e Importar
                </Button>
              </div>
            )}

            {status === 'queued' && (
              <div className="space-y-4 mt-auto pt-4 flex-1 flex flex-col justify-center animate-fade-in">
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
                  <Clock className="h-6 w-6 text-blue-500 animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      Na fila de processamento
                    </h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Aguardando a conclusão da importação anterior para iniciar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === 'uploading' && (
              <div className="space-y-4 mt-auto pt-4 flex-1 flex flex-col justify-center animate-fade-in">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-700">
                    <span>Processando dados...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2.5" />
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col gap-3 mt-auto animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5 shrink-0" /> Base atualizada com sucesso!
                </div>
                {importResult && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Resumo da Importação
                    </h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Total de registros no arquivo:</span>
                      <span className="font-medium text-slate-900">{importResult.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Novos registros inseridos:</span>
                      <span className="font-medium text-emerald-600">{importResult.inserted}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Registros redundantes (ignorados):</span>
                      <span className="font-medium text-amber-600">{importResult.redundant}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-start gap-2 text-sm font-medium text-destructive bg-red-50 p-3 rounded-lg border border-red-100 mt-auto animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />{' '}
                <span className="break-all">{errorMsg}</span>
              </div>
            )}

            {status === 'idle' && (
              <Button onClick={handleStart} className="w-full font-bold mt-auto">
                Iniciar Processamento
              </Button>
            )}

            {(status === 'success' || status === 'error') && (
              <Button
                onClick={() => {
                  setFile(null)
                  setStatus('idle')
                }}
                variant="outline"
                className="w-full mt-2"
              >
                Carregar Novo Arquivo
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ImportData() {
  const { setIsImporting } = useAppState()

  // Fila de processamento inteligente (Orquestrador)
  const [queue, setQueue] = useState<Array<{ id: string; run: () => Promise<void> }>>([])
  const [activeTask, setActiveTask] = useState<string | null>(null)

  useEffect(() => {
    return () => setIsImporting(false)
  }, [setIsImporting])

  // Processamento sequencial da fila
  useEffect(() => {
    if (queue.length > 0 && !activeTask) {
      const nextTask = queue[0]
      setQueue((q) => q.slice(1)) // Remove imediatamente para não contabilizar como "em espera"
      setActiveTask(nextTask.id)
      setIsImporting(true)

      nextTask.run().finally(() => {
        setActiveTask(null)
      })
    } else if (queue.length === 0 && !activeTask) {
      setIsImporting(false)
    }
  }, [queue, activeTask, setIsImporting])

  const enqueueTask = useCallback((id: string, run: () => Promise<void>) => {
    setQueue((q) => [...q, { id, run }])
  }, [])

  const processPendencies = async (data: any[], setProgress: (p: number) => void) => {
    setProgress(5)
    const { error: truncErr } = await supabase.rpc('truncate_pending_debts')
    if (truncErr) throw new Error('Erro ao limpar a base: ' + truncErr.message)
    setProgress(10)

    // Chunk reduzido drasticamente para evitar statement timeout no Supabase
    const chunkSize = 100

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)

      let attempt = 0
      let success = false
      let lastError: any = null

      // Lógica de retry com exponential backoff para suportar oscilações de conexão
      while (attempt < 3 && !success) {
        attempt++
        const { error: insErr } = await supabase.from('pending_debts').insert(chunk)
        if (insErr) {
          lastError = insErr
          console.warn(
            `Tentativa ${attempt} falhou na inserção de pendências (linhas ${i}-${i + chunk.length}):`,
            insErr,
          )
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1500)) // Espera antes de tentar de novo
          }
        } else {
          success = true
        }
      }

      if (!success) {
        throw new Error(
          `Erro na inserção (Linha ${i + 1}) - Detalhe: ${lastError?.message || 'Erro desconhecido'}`,
        )
      }

      setProgress(10 + Math.floor((i / data.length) * 80))
      await new Promise((r) => setTimeout(r, 25)) // Yield um pouco maior para dar respiro ao banco
    }

    try {
      // Atualizar snapshot da carteira após finalizar a inserção para não estourar timeout do DB
      await supabase.rpc('record_portfolio_snapshot')
    } catch (err) {
      console.error('Falha não-crítica ao registrar snapshot da carteira:', err)
    }

    setProgress(100)

    return {
      total: data.length,
      inserted: data.length,
      redundant: 0,
    }
  }

  const processSettlements = async (data: any[], setProgress: (p: number) => void) => {
    setProgress(5)
    const chunkSize = 100
    let insertedCount = 0
    let redundantCount = 0

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)

      const ids = chunk.map((c: any) => c.id).filter(Boolean)
      let existingIds = new Set<string>()

      if (ids.length > 0) {
        const { data: existing } = await supabase.from('settlements').select('id').in('id', ids)
        if (existing) {
          existing.forEach((e: any) => existingIds.add(e.id))
        }
      }

      const newRecords = chunk.filter((c: any) => !c.id || !existingIds.has(c.id))
      redundantCount += chunk.length - newRecords.length

      if (newRecords.length > 0) {
        let attempt = 0
        let success = false
        let lastError: any = null

        while (attempt < 3 && !success) {
          attempt++
          const { error: insErr } = await supabase.from('settlements').insert(newRecords)
          if (insErr) {
            lastError = insErr
            console.warn(
              `Tentativa ${attempt} falhou na inserção de baixas (linhas ${i}-${i + chunk.length}):`,
              insErr,
            )
            if (attempt < 3) {
              await new Promise((r) => setTimeout(r, attempt * 1500))
            }
          } else {
            success = true
            insertedCount += newRecords.length
          }
        }

        if (!success) {
          throw new Error(
            `Erro na inserção (Linha ${i + 1}) - Detalhe: ${lastError?.message || 'Erro desconhecido'}`,
          )
        }
      }

      setProgress(5 + Math.floor((i / data.length) * 80))
      await new Promise((r) => setTimeout(r, 25))
    }

    try {
      // Disparar cruzamento de conversões
      await (supabase as any).rpc('process_conversions')

      // Limpar registros de baixas antigas com base na regra de retenção
      await (supabase as any).rpc('cleanup_old_settlements')
    } catch (err) {
      console.error('Falha não-crítica ao processar conversões ou limpar base:', err)
    }

    setProgress(100)

    return {
      total: data.length,
      inserted: insertedCount,
      redundant: redundantCount,
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Importação de Dados</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Módulo central para carga rápida de arquivos CSV do sistema.
          </p>
        </div>

        {/* Indicador Global de Fila */}
        {(activeTask || queue.length > 0) && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm animate-fade-in shrink-0">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-slate-900">Processando</span>
              {queue.length > 0 && (
                <span className="text-slate-500 ml-2 border-l border-slate-200 pl-2">
                  + {queue.length} na fila
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <ImportCard
          title="Base de Pendências"
          description="Substituição total. Limpa as pendências atuais e carrega os novos registros."
          icon={<RefreshCw className="h-5 w-5 text-primary" />}
          tableName="pending_debts"
          allowedColumns={pendingDebtsColumns}
          onProcess={processPendencies}
          enqueueTask={enqueueTask}
        />
        <ImportCard
          title="Base de Baixas"
          description="Carga incremental. Adiciona novas baixas ao histórico sem apagar antigos."
          icon={<Database className="h-5 w-5 text-emerald-500" />}
          tableName="settlements"
          allowedColumns={settlementsColumns}
          onProcess={processSettlements}
          enqueueTask={enqueueTask}
        />
      </div>
    </div>
  )
}
