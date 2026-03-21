import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings as SettingsIcon, BookOpen, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { toast } = useToast()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<any>(null)

  const [text, setText] = useState('')
  const [theory, setTheory] = useState('')
  const [link, setLink] = useState('')

  const fetchQuotes = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('quotes')
      .select('*')
      .order('order_index', { ascending: true })
    if (data) setQuotes(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const handleSave = async () => {
    if (!text.trim())
      return toast({ title: 'Erro', description: 'A frase é obrigatória.', variant: 'destructive' })

    if (editingQuote) {
      const { error } = await (supabase as any)
        .from('quotes')
        .update({ text, theory, link })
        .eq('id', editingQuote.id)
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Frase atualizada.' })
    } else {
      const { error } = await (supabase as any).from('quotes').insert({ text, theory, link })
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
      else toast({ title: 'Sucesso', description: 'Frase criada.' })
    }

    setIsModalOpen(false)
    fetchQuotes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta frase?')) return
    const { error } = await (supabase as any).from('quotes').delete().eq('id', id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Sucesso', description: 'Frase excluída.' })
      fetchQuotes()
    }
  }

  const openNew = () => {
    setEditingQuote(null)
    setText('')
    setTheory('')
    setLink('')
    setIsModalOpen(true)
  }

  const openEdit = (q: any) => {
    setEditingQuote(q)
    setText(q.text)
    setTheory(q.theory || '')
    setLink(q.link || '')
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1 font-medium">Parâmetros e preferências do sistema.</p>
      </div>

      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Frases de Treinamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-slate-700" /> Opções do Sistema
              </CardTitle>
              <CardDescription>Página em construção.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                As configurações de equipe, regras de negócio e integrações ficarão disponíveis aqui
                em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Base de Conhecimento
                </CardTitle>
                <CardDescription className="mt-1">
                  Gerencie as frases que aparecem para os operadores durante o processamento de
                  arquivos.
                </CardDescription>
              </div>
              <Button onClick={openNew} size="sm" className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Nova Frase
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[50%]">Frase</TableHead>
                      <TableHead>Teoria</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : quotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          Nenhuma frase cadastrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotes.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium text-sm text-slate-800 line-clamp-2">
                            "{q.text}"
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {q.theory ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                                {q.theory}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {q.link ? (
                              <a
                                href={q.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
                              >
                                Acessar <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(q)}
                                className="h-8 w-8 text-slate-500 hover:text-primary"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(q.id)}
                                className="h-8 w-8 text-slate-500 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingQuote ? 'Editar Frase' : 'Nova Frase'}</DialogTitle>
            <DialogDescription>
              Adicione uma nova pílula de conhecimento para a equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="text">Frase / Dica (obrigatório)</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex: O combinado não sai caro..."
                className="resize-none h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theory">Teoria Relacionada (opcional)</Label>
              <Input
                id="theory"
                value={theory}
                onChange={(e) => setTheory(e.target.value)}
                placeholder="Ex: Rastreabilidade Operacional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link de Aprofundamento (opcional)</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Ex: https://blog.exemplo.com/artigo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Frase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
