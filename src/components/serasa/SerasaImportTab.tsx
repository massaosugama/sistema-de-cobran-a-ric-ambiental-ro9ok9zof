import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { CheckCircle2, Upload as UploadIcon, Info, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function SerasaImportTab({ onImportSuccess }: { onImportSuccess: () => void }) {
  const [text, setText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(true)
  const [result, setResult] = useState<{ total: number; inserted: number; ignored: number } | null>(
    null,
  )
  const { toast } = useToast()

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', user.id)
          .single()
        if (profile) {
          setIsReadOnly(profile.role === 'consultas' && !profile.is_admin)
        } else {
          setIsReadOnly(true)
        }
      }
    }
    checkRole()
  }, [])

  const handleProcess = async () => {
    if (isReadOnly) {
      toast({
        title: 'Acesso Negado',
        description: 'Seu perfil não tem permissão para realizar importações.',
        variant: 'destructive',
      })
      return
    }
    if (!text.trim()) {
      toast({
        title: 'Aviso',
        description: 'Cole o conteúdo antes de processar.',
        variant: 'destructive',
      })
      return
    }
    setIsProcessing(true)
    setResult(null)

    try {
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '')
      const isCpfCnpj = (str: string) =>
        /^(\d{2,3}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(str)
      const parseCurrency = (val: string) => {
        const parsed = parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
        return Number.isNaN(parsed) ? 0 : parsed
      }
      const parseDate = (val: string) => {
        const parts = val.split('/')
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : null
      }

      const records = []
      let i = 0
      while (i < lines.length) {
        if (isCpfCnpj(lines[i])) {
          if (i + 5 < lines.length) {
            records.push({
              cpf_cnpj: lines[i],
              nome: lines[i + 1],
              num_contrato: lines[i + 2],
              valor: parseCurrency(lines[i + 3]),
              data_envio: parseDate(lines[i + 4]),
              situacao: lines[i + 5],
            })
            i += 6
          } else {
            break
          }
        } else {
          i++
        }
      }

      if (records.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum registro válido encontrado.',
          variant: 'destructive',
        })
        setIsProcessing(false)
        return
      }

      const cpfCnpjs = [...new Set(records.map((r) => r.cpf_cnpj))]
      const existingKeys = new Set<string>()
      for (let j = 0; j < cpfCnpjs.length; j += 100) {
        const chunk = cpfCnpjs.slice(j, j + 100)
        const { data, error } = await supabase
          .from('serasa_negativations' as any)
          .select('cpf_cnpj, num_contrato')
          .in('cpf_cnpj', chunk)
        if (error) throw error
        data?.forEach((row: any) => existingKeys.add(`${row.cpf_cnpj}|${row.num_contrato}`))
      }

      const toInsert = []
      let ignoredCount = 0
      for (const rec of records) {
        const key = `${rec.cpf_cnpj}|${rec.num_contrato}`
        if (existingKeys.has(key)) ignoredCount++
        else {
          toInsert.push(rec)
          existingKeys.add(key)
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('serasa_negativations' as any).insert(toInsert)
        if (error) throw error
      }

      if (records.length > 0) {
        await supabase.from('import_history').insert({
          table_name: 'serasa_negativations',
          total_records: records.length,
          inserted_records: toInsert.length,
          ignored_records: ignoredCount,
        })
      }

      setResult({ total: records.length, inserted: toInsert.length, ignored: ignoredCount })
      toast({ title: 'Sucesso', description: 'Processamento concluído.' })
      setText('')
      onImportSuccess()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar dados.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2 md:col-span-1 shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <UploadIcon className="h-5 w-5 text-blue-600" /> Colar Dados do Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isReadOnly ? (
            <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
              <Info className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800 font-semibold">Acesso Restrito</AlertTitle>
              <AlertDescription className="text-red-700 text-sm">
                Seu perfil de acesso (CONSULTAS) não possui permissão para executar importações de
                dados no sistema.
              </AlertDescription>
            </Alert>
          ) : null}
          <Textarea
            placeholder="Exemplo:&#10;00.446.191/0001-10&#10;FLAMINGO IMOVEIS LTDA&#10;112024&#10;..."
            className="min-h-[300px] font-mono text-sm resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing || isReadOnly}
          />
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-slate-50/50 p-4">
          <Button
            variant="outline"
            onClick={() => setText('')}
            disabled={isProcessing || !text || isReadOnly}
          >
            Limpar
          </Button>
          <Button
            onClick={handleProcess}
            disabled={isProcessing || !text.trim() || isReadOnly}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Dados
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 font-semibold">Como funciona?</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-blue-700 text-sm">
            <p>
              O sistema processa o texto colado buscando o padrão de CPF/CNPJ e capturando as 5
              linhas subsequentes para formar um registro completo.
            </p>
            <p className="font-medium mt-2">
              Registros duplicados serão ignorados automaticamente.
            </p>
          </AlertDescription>
        </Alert>

        {result && (
          <Card className="bg-green-50 border-green-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-800 flex gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5" />
                Resumo da Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b border-green-200 pb-2">
                <span className="text-green-700">Total Identificado:</span>
                <span className="font-bold text-green-900">{result.total}</span>
              </div>
              <div className="flex justify-between border-b border-green-200 pb-2">
                <span className="text-green-700">Novos Inseridos:</span>
                <span className="font-bold text-green-900">{result.inserted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Duplicados Ignorados:</span>
                <span className="font-bold text-amber-900">{result.ignored}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
