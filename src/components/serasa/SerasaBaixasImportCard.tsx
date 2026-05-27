import { useState, useEffect } from 'react'
import { UploadCloud, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SerasaBaixasImportCardProps {
  onHistoryUpdate?: () => void
}

export function SerasaBaixasImportCard({ onHistoryUpdate }: SerasaBaixasImportCardProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const { user } = useAuth()
  const [isConsulta, setIsConsulta] = useState(false)

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role === 'consultas') {
            setIsConsulta(true)
          }
        })
    }
  }, [user])

  const handleImport = async () => {
    if (!text.trim() || isConsulta) return
    setLoading(true)
    try {
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l !== '')
      const records = []

      // Identify records dynamically
      const isCpfCnpj = (str: string) =>
        /^(\d{2,3}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(str)

      let i = 0
      while (i < lines.length) {
        if (isCpfCnpj(lines[i])) {
          if (i + 6 < lines.length) {
            const cpf = lines[i]
            const numContrato = lines[i + 2]
            const dataBaixaStr = lines[i + 5]

            const parts = dataBaixaStr.split('/')
            let isoDate = null
            if (parts.length === 3) {
              isoDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString()
            }

            if (isoDate) {
              records.push({ cpf, numContrato, dataBaixa: isoDate })
            }
            i += 7
          } else {
            break
          }
        } else {
          i++
        }
      }

      if (records.length === 0) {
        throw new Error('Nenhum registro válido encontrado. Verifique o formato copiado.')
      }

      let updatedCount = 0
      let ignoredCount = 0

      for (const rec of records) {
        const { data: existing, error: fetchErr } = await supabase
          .from('serasa_negativations')
          .select('id, cpf_cnpj, baixado_aqui')
          .eq('num_contrato', rec.numContrato)

        if (!fetchErr && existing && existing.length > 0) {
          const cleanRecCpf = rec.cpf.replace(/[^0-9]/g, '')
          const matched = existing.find((e) => e.cpf_cnpj.replace(/[^0-9]/g, '') === cleanRecCpf)

          if (matched) {
            // Segurança Cirúrgica: Apenas atualiza se o registro já estiver baixado (baixado_aqui = true)
            if (matched.baixado_aqui) {
              const { error: updErr } = await supabase
                .from('serasa_negativations')
                .update({
                  data_baixa_aqui: rec.dataBaixa,
                })
                .eq('id', matched.id)

              if (!updErr) updatedCount++
              else ignoredCount++
            } else {
              ignoredCount++
            }
          } else {
            ignoredCount++
          }
        } else {
          ignoredCount++
        }
      }

      if (records.length > 0) {
        await supabase.from('import_history').insert({
          table_name: 'Datas de Baixa (Serasa)',
          total_records: records.length,
          inserted_records: updatedCount,
          ignored_records: ignoredCount,
          latest_record_date: null,
        })
        if (onHistoryUpdate) onHistoryUpdate()
      }

      toast({
        title: 'Importação Concluída',
        description: `${updatedCount} datas atualizadas cirurgicamente. ${ignoredCount} ignorados (não encontrados ou ativos).`,
      })
      setOpen(false)
      setText('')
    } catch (error: any) {
      toast({ title: 'Erro na importação', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Colar Dados de Baixa do Serasa</DialogTitle>
            <DialogDescription>
              Cole abaixo o texto copiado diretamente do portal do Serasa. O sistema buscará pelo
              CPF/CNPJ e Contrato para registrar a data de baixa.
              <br />
              <br />
              <strong>Atenção (Ação Cirúrgica):</strong> O sistema atualizará{' '}
              <strong>apenas</strong> os registros que já existem e que já estão marcados como{' '}
              <em>Baixados</em> no sistema. Ele não baixará casos ativos.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              placeholder="001.838.468-42&#10;APARECIDO RAMOS DA SILVA&#10;022025&#10;R$ 444,60&#10;02/10/2025&#10;07/05/2026&#10;Baixada"
              className="min-h-[300px] font-mono text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || isConsulta}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={loading || !text.trim() || isConsulta}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Processar Importação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card
        className="border-slate-200 shadow-sm overflow-hidden flex flex-col h-full bg-slate-50/50 cursor-pointer hover:border-emerald-400 transition-colors"
        onClick={() => setOpen(true)}
      >
        <CardHeader className="px-5 py-4 border-b bg-white shrink-0">
          <CardTitle className="text-base flex items-center gap-2 text-slate-800">
            <UploadCloud className="h-5 w-5 text-emerald-500" /> Datas de Baixa (Serasa)
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Importe o texto do Serasa para carimbar a data exata da baixa nos casos já finalizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 flex-1 flex flex-col items-center justify-center bg-slate-50/50">
          <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl p-8 text-center transition-all w-full flex flex-col justify-center items-center group">
            <FileText className="h-10 w-10 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-medium text-slate-900 mb-1">Colar Dados de Baixa</h3>
            <p className="text-sm text-slate-500">Atualização cirúrgica de registros</p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
