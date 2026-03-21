import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

const parseCSV = async (file: File) => {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) return []
  const separator = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((l) => {
    const values = l.split(separator).map((v) => v.trim().replace(/^"|"$/g, ''))
    return headers.reduce((acc, h, i) => ({ ...acc, [h]: values[i] || null }), {})
  })
}

interface ImportCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onProcess: (file: File, setProgress: (p: number) => void) => Promise<void>
}

function ImportCard({ title, description, icon, onProcess }: ImportCardProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProcess = async () => {
    if (!file) return
    setStatus('uploading')
    setProgress(5)
    try {
      await onProcess(file, setProgress)
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
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-primary transition-all cursor-pointer group"
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
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
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
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Processando dados...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            {status === 'success' && (
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" /> Base atualizada com sucesso!
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-start gap-2 text-sm font-medium text-destructive bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />{' '}
                <span>{errorMsg || 'Erro desconhecido.'}</span>
              </div>
            )}
            {status === 'idle' && (
              <Button onClick={handleProcess} className="w-full font-bold">
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
                className="w-full"
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
  const processPendencies = async (file: File, setProgress: (p: number) => void) => {
    setProgress(15)
    const data = await parseCSV(file)
    if (data.length === 0) throw new Error('O arquivo está vazio.')
    setProgress(30)

    const { error: truncErr } = await supabase.rpc('truncate_pending_debts')
    if (truncErr) throw new Error('Erro ao limpar a base: ' + truncErr.message)
    setProgress(45)

    const chunkSize = 200
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const { error: insErr } = await supabase.from('pending_debts').insert(chunk)
      if (insErr)
        throw new Error(
          `Erro de Mapeamento: verifique se os nomes das colunas do CSV coincidem com o banco de dados. (Linha ${i + 1}) - Detalhe: ${insErr.message}`,
        )
      setProgress(45 + Math.floor((i / data.length) * 50))
    }
  }

  const processSettlements = async (file: File, setProgress: (p: number) => void) => {
    setProgress(20)
    const data = await parseCSV(file)
    if (data.length === 0) throw new Error('O arquivo está vazio.')
    setProgress(40)

    const chunkSize = 200
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const { error: insErr } = await supabase.from('settlements').insert(chunk)
      if (insErr)
        throw new Error(
          `Erro de Mapeamento: verifique as colunas do CSV. (Linha ${i + 1}) - Detalhe: ${insErr.message}`,
        )
      setProgress(40 + Math.floor((i / data.length) * 55))
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImportCard
          title="Base de Pendências"
          description="Substituição total. Limpa as pendências atuais e carrega os novos registros."
          icon={<RefreshCw className="h-5 w-5 text-primary" />}
          onProcess={processPendencies}
        />
        <ImportCard
          title="Base de Baixas"
          description="Carga incremental. Adiciona novas baixas ao histórico sem apagar registros antigos."
          icon={<Database className="h-5 w-5 text-emerald-500" />}
          onProcess={processSettlements}
        />
      </div>
    </div>
  )
}
