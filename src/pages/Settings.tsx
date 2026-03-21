import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Settings as SettingsIcon,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Activity,
  User,
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  const [clicks, setClicks] = useState<any[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Quotes state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<any>(null)
  const [text, setText] = useState('')
  const [theory, setTheory] = useState('')
  const [link, setLink] = useState('')

  // Operators state
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<any>(null)
  const [opFirstName, setOpFirstName] = useState('')
  const [opLastName, setOpLastName] = useState('')
  const [opIsAdmin, setOpIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchQuotes = async () => {
    const { data } = await (supabase as any).from('quotes').select('*').order('order_index')
    if (data) setQuotes(data)
  }

  const fetchOperators = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOperators(data)
  }

  const fetchClicks = async () => {
    const { data } = await (supabase as any)
      .from('quote_clicks')
      .select('id, created_at, profiles(first_name, last_name, name, email), quotes(text)')
      .order('created_at', { ascending: false })
    if (data) setClicks(data)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchQuotes(), fetchOperators(), fetchClicks()]).finally(() => setLoading(false))
  }, [])

  const handleSaveQuote = async () => {
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

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta frase?')) return
    const { error } = await (supabase as any).from('quotes').delete().eq('id', id)
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else {
      toast({ title: 'Sucesso', description: 'Frase excluída.' })
      fetchQuotes()
    }
  }

  const openNewQuote = () => {
    setEditingQuote(null)
    setText('')
    setTheory('')
    setLink('')
    setIsModalOpen(true)
  }

  const openEditQuote = (q: any) => {
    setEditingQuote(q)
    setText(q.text)
    setTheory(q.theory || '')
    setLink(q.link || '')
    setIsModalOpen(true)
  }

  const openEditOperator = (op: any) => {
    setEditingOperator(op)
    setOpFirstName(op.first_name || '')
    setOpLastName(op.last_name || '')
    setOpIsAdmin(!!op.is_admin)
    setIsOperatorModalOpen(true)
  }

  const handleSaveOperator = async () => {
    if (!editingOperator) return
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        first_name: opFirstName,
        last_name: opLastName,
        name: `${opFirstName} ${opLastName}`.trim(),
        is_admin: opIsAdmin,
      })
      .eq('id', editingOperator.id)

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Operador atualizado com sucesso.' })
      setIsOperatorModalOpen(false)
      fetchOperators()
    }
  }

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Deseja enviar um link de redefinição de senha para ${email}?`)) return
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    else toast({ title: 'Sucesso', description: 'E-mail de redefinição enviado com sucesso.' })
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/login`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Link Copiado',
      description: 'O link de cadastro foi copiado para sua área de transferência.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1 font-medium">Parâmetros e preferências do sistema.</p>
      </div>

      <Tabs defaultValue="operators" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="operators" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Operadores
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Conhecimento
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Engajamento
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
                As configurações de regras de negócio e integrações ficarão disponíveis aqui em
                breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operators" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Gestão de Operadores
                </CardTitle>
                <CardDescription className="mt-1">
                  Gerencie os acessos, edite perfis e convide novos membros para a equipe.
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                size="sm"
                className="flex items-center gap-1.5"
              >
                <UserPlus className="h-4 w-4" /> Convidar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
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
                    ) : operators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          Nenhum operador encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      operators.map((op) => (
                        <TableRow key={op.id}>
                          <TableCell className="font-medium text-sm text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="bg-slate-100 p-1.5 rounded-full">
                                <User className="h-3 w-3 text-slate-500" />
                              </div>
                              {op.first_name} {op.last_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{op.email}</TableCell>
                          <TableCell>
                            {op.is_admin ? (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide">
                                <Shield className="h-3 w-3" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide">
                                Operador
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Resetar Senha"
                                onClick={() => handleResetPassword(op.email)}
                                className="h-8 w-8 text-slate-500 hover:text-amber-600"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar Operador"
                                onClick={() => openEditOperator(op)}
                                className="h-8 w-8 text-slate-500 hover:text-primary"
                              >
                                <Edit2 className="h-4 w-4" />
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

        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Base de Conhecimento
                </CardTitle>
                <CardDescription className="mt-1">
                  Gerencie as frases que aparecem para os operadores.
                </CardDescription>
              </div>
              <Button onClick={openNewQuote} size="sm" className="flex items-center gap-1.5">
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
                                onClick={() => openEditQuote(q)}
                                className="h-8 w-8 text-slate-500 hover:text-primary"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteQuote(q.id)}
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

        <TabsContent value="engagement" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Relatório de Engajamento
              </CardTitle>
              <CardDescription>
                Acompanhe quais operadores estão interagindo com os links das pílulas de
                conhecimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>Frase Acessada</TableHead>
                      <TableHead className="text-right">Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : clicks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                          Nenhum clique registrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      clicks.map((c) => {
                        const operatorName = c.profiles?.first_name
                          ? `${c.profiles.first_name} ${c.profiles.last_name || ''}`
                          : c.profiles?.name || c.profiles?.email || 'Desconhecido'
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium text-sm text-slate-800">
                              <div className="flex items-center gap-2">
                                <div className="bg-slate-100 p-1.5 rounded-full">
                                  <User className="h-3 w-3 text-slate-500" />
                                </div>
                                {operatorName}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              <span className="line-clamp-1 max-w-[400px]">"{c.quotes?.text}"</span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-500 font-medium">
                              {new Date(c.created_at).toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        )
                      })
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
            <Button onClick={handleSaveQuote}>Salvar Frase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOperatorModalOpen} onOpenChange={setIsOperatorModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Operador</DialogTitle>
            <DialogDescription>Atualize os dados e permissões do operador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opFirstName">Nome</Label>
                <Input
                  id="opFirstName"
                  value={opFirstName}
                  onChange={(e) => setOpFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opLastName">Sobrenome</Label>
                <Input
                  id="opLastName"
                  value={opLastName}
                  onChange={(e) => setOpLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Administrador</Label>
                <p className="text-sm text-slate-500">
                  Concede acesso total às configurações do sistema.
                </p>
              </div>
              <Switch checked={opIsAdmin} onCheckedChange={setOpIsAdmin} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOperatorModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOperator}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convidar Operador</DialogTitle>
            <DialogDescription>
              Envie o link abaixo para que o novo membro da equipe crie sua conta e defina sua
              própria senha.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={`${window.location.origin}/login`}
                className="bg-slate-50 text-slate-500"
              />
              <Button size="icon" onClick={copyInviteLink} className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Após a criação da conta, você poderá editar o perfil dele e conceder permissões de
              administrador nesta mesma tela.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
