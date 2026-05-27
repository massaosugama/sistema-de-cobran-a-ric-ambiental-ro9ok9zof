import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Trash2, Loader2, Plus } from 'lucide-react'

export function SerasaBlacklist() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [nome, setNome] = useState('')
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    const { data: res, error } = await supabase
      .from('serasa_blacklist')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      setData(res || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async () => {
    if (!cpfCnpj) {
      toast({ title: 'Erro', description: 'Informe o CPF ou CNPJ.', variant: 'destructive' })
      return
    }
    const cleanCpf = cpfCnpj.replace(/[^0-9]/g, '')
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      toast({ title: 'Erro', description: 'CPF ou CNPJ inválido.', variant: 'destructive' })
      return
    }

    try {
      const { error } = await supabase.from('serasa_blacklist').insert({
        cpf_cnpj: cleanCpf,
        nome: nome || null,
      })
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Registro adicionado à Black-list.' })
      setCpfCnpj('')
      setNome('')
      loadData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('serasa_blacklist').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Registro removido da Black-list.' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 bg-card rounded-lg border shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="CPF / CNPJ"
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value)}
          className="max-w-[200px]"
        />
        <Input
          placeholder="Nome (Opcional)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="rounded-md border overflow-y-auto flex-1 min-h-0">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50 z-10">
            <TableRow>
              <TableHead>CPF / CNPJ</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[180px]">Data de Inclusão</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum registro na Black-list.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.cpf_cnpj}</TableCell>
                  <TableCell>{item.nome || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
