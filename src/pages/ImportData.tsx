import React, { useState, useRef } from 'react'
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
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
        acc[h] = values[i] !== undefined && values[i] !== '' ? values[i] : null
        return acc
      },
      {} as Record<string, any>,
    )
  })
  return { headers, data }
}

interface ImportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  tableName: 'pending_debts' | 'settlements'
  allowedColumns: string[]
  onProcess: (data: any[], setProgress: (p: number) => void) => Promise<void>
}

function ImportCard({
  title,
  description,
  icon,
  tableName,
  allowedColumns,
  onProcess,
}: ImportCardProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'mapping' | 'uploading' | 'success' | 'error'>(
    'idle',
  )
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [csvData, setCsvData] = useState<any[]>([])
  const [extraColumns, setExtraColumns] = useState<string[]>([])
  const [rememberedColumns, setRememberedColumns] = useState<string[]>([])
  const [ignoredColumns, setIgnoredColumns] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStart = async () => {
    if (!file) return
    try {
      const { headers, data } = await parseCSV(file)
      if (data.length === 0) throw new Error('O arquivo está vazio ou o formato é inválido.')
      setCsvData(data)

      const extra = headers.filter((h) => !allowedColumns.includes(h))

      if (extra.length > 0) {
        setExtraColumns(extra)
        const rememberedStr = localStorage.getItem(`ignored_columns_${tableName}`)
        const remembered = rememberedStr ? JSON.parse(rememberedStr) : []
        setRememberedColumns(remembered)

        const initialIgnored: Record<string, boolean> = {}
        extra.forEach((col) => {
          initialIgnored[col] = remembered.includes(col)
        })
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

  const proceedWithImport = async (data: any[], ignoredConfig: Record<string, boolean>) => {
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

    setStatus('uploading')
    setProgress(5)
    try {
      await onProcess(cleanedData, setProgress)
      setStatus('success')
      setProgress(100)
      toast({ title: 'Sucesso!', description: 'Arquivo processado.', variant: 'default' })
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' })
    }
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
              {status !== 'uploading' && status !== 'success' && (
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
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Colunas não reconhecidas</h4>
                    <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                      Detectamos colunas no arquivo que não existem no banco de dados. Selecione
                      quais deseja ignorar.
                    </p>
                  </div>
                </div>

                <div className="space-y-1 bg-white rounded-lg p-2 border border-amber-100 max-h-48 overflow-y-auto">
                  {extraColumns.map((col) => {
                    const isRemembered = rememberedColumns.includes(col)
                    return (
                      <div
                        key={col}
                        className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-md transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`col-${col}-${tableName}`}
                            checked={ignoredColumns[col]}
                            onCheckedChange={(c) =>
                              setIgnoredColumns((prev) => ({ ...prev, [col]: !!c }))
                            }
                          />
                          <label
                            htmlFor={`col-${col}-${tableName}`}
                            className="text-sm font-medium text-slate-700 cursor-pointer select-none"
                          >
                            {col}
                          </label>
                        </div>
                        {!isRemembered && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider"
                          >
                            Nova
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button
                  onClick={() => proceedWithImport(csvData, ignoredColumns)}
                  className="w-full"
                >
                  Confirmar e Importar
                </Button>
              </div>
            )}

            {status === 'uploading' && (
              <div className="space-y-2 mt-auto pt-4">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Processando dados...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-auto">
                <CheckCircle2 className="h-5 w-5" /> Base atualizada com sucesso!
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-start gap-2 text-sm font-medium text-destructive bg-red-50 p-3 rounded-lg border border-red-100 mt-auto">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="break-all">{errorMsg || 'Erro desconhecido.'}</span>
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
  const processPendencies = async (data: any[], setProgress: (p: number) => void) => {
    setProgress(15)
    const { error: truncErr } = await supabase.rpc('truncate_pending_debts')
    if (truncErr) throw new Error('Erro ao limpar a base: ' + truncErr.message)
    setProgress(30)

    const chunkSize = 200
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const { error: insErr } = await supabase.from('pending_debts').insert(chunk)
      if (insErr)
        throw new Error(
          `Erro de Mapeamento na inserção (Linha ${i + 1}) - Detalhe: ${insErr.message}`,
        )
      setProgress(30 + Math.floor((i / data.length) * 70))
    }
  }

  const processSettlements = async (data: any[], setProgress: (p: number) => void) => {
    setProgress(20)
    const chunkSize = 200
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const { error: insErr } = await supabase.from('settlements').insert(chunk)
      if (insErr)
        throw new Error(
          `Erro de Mapeamento na inserção (Linha ${i + 1}) - Detalhe: ${insErr.message}`,
        )
      setProgress(20 + Math.floor((i / data.length) * 80))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Importação de Dados</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Módulo central para carga rápida de arquivos CSV do sistema legado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <ImportCard
          title="Base de Pendências"
          description="Substituição total. Limpa as pendências atuais e carrega os novos registros."
          icon={<RefreshCw className="h-5 w-5 text-primary" />}
          tableName="pending_debts"
          allowedColumns={pendingDebtsColumns}
          onProcess={processPendencies}
        />
        <ImportCard
          title="Base de Baixas"
          description="Carga incremental. Adiciona novas baixas ao histórico sem apagar registros antigos."
          icon={<Database className="h-5 w-5 text-emerald-500" />}
          tableName="settlements"
          allowedColumns={settlementsColumns}
          onProcess={processSettlements}
        />
      </div>
    </div>
  )
}
