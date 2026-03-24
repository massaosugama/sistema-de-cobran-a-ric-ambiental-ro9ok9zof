import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  UserCircle,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  UserCheck,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { cn, generateQuoteUrl } from '@/lib/utils'

const PROFILE_COLORS = [
  { label: 'Slate', value: '#64748b' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Fuchsia', value: '#d946ef' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Rose', value: '#f43f5e' },
]

export default function Settings() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'profile'

  const { user, updatePassword } = useAuth()
  const [quotes, setQuotes] = useState<any[]>([])
  const [clicks, setClicks] = useState<any[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Profile state
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showPasswordProfile, setShowPasswordProfile] = useState(false)

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
  const [opEmail, setOpEmail] = useState('')
  const [opColor, setOpColor] = useState('')
  const [opIsAdmin, setOpIsAdmin] = useState(false)
  const [opIsActive, setOpIsActive] = useState(true)
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      return toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
    }
    setIsUpdatingPassword(true)
    const { error } = await updatePassword(newPassword)
    setIsUpdatingPassword(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso.' })
      setNewPassword('')
    }
  }

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
    setOpEmail(op.email || '')
    setOpColor(op.color || '#64748b')
    setOpIsAdmin(!!op.is_admin)
    setOpIsActive(op.is_active !== false)
    setIsOperatorModalOpen(true)
  }

  const handleSaveOperator = async () => {
    if (!editingOperator) return
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        first_name: opFirstName,
        last_name: opLastName,
        email: opEmail,
        color: opColor,
        name: `${opFirstName} ${opLastName}`.trim(),
        is_admin: opIsAdmin,
        is_active: opIsActive,
        updated_at: new Date().toISOString(),
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
      redirectTo: `${window.location.origin}/settings?tab=profile`,
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-5xl grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" /> Meu Perfil
          </TabsTrigger>
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

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" /> Meu Perfil
              </CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais e credenciais de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-w-sm">
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">
                    E-mail de acesso
                  </Label>
                  <p className="font-medium text-slate-900">{user?.email}</p>
                </div>

                <form
                  onSubmit={handleUpdatePassword}
                  className="space-y-4 pt-4 border-t border-slate-100"
                >
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswordProfile ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordProfile(!showPasswordProfile)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        tabIndex={-1}
                        title={showPasswordProfile ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showPasswordProfile ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Mínimo de 6 caracteres.</p>
                  </div>
                  <Button type="submit" disabled={isUpdatingPassword || newPassword.length < 6}>
                    {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                      <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : operators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          Nenhum operador encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      operators.map((op) => (
                        <TableRow key={op.id}>
                          <TableCell className="font-medium text-sm text-slate-800">
                            <div className="flex items-center gap-3">
                              <Avatar
                                className="h-8 w-8 shadow-sm"
                                style={{ backgroundColor: op.color || '#cbd5e1' }}
                              >
                                <AvatarFallback className="text-xs text-white bg-transparent font-medium uppercase">
                                  {op.first_name?.[0] || ''}
                                  {op.last_name?.[0] || ''}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span>
                                  {op.first_name} {op.last_name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-normal lg:hidden">
                                  {op.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 hidden lg:table-cell">
                            {op.email}
                          </TableCell>
                          <TableCell>
                            {op.is_admin ? (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border border-purple-100 uppercase">
                                <Shield className="h-3 w-3" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border border-slate-200 uppercase">
                                Operador
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {op.is_active !== false ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                                <CheckCircle className="h-3.5 w-3.5" /> Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                                <XCircle className="h-3.5 w-3.5" /> Inativo
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
                                className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar Operador"
                                onClick={() => openEditOperator(op)}
                                className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
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
                            {generateQuoteUrl(q.link, q.theory) ? (
                              <a
                                href={generateQuoteUrl(q.link, q.theory)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
                              >
                                Saiba mais <ExternalLink className="h-3 w-3" />
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
              <p className="text-xs text-slate-500 mt-1">
                Se vazio, o botão "Saiba mais" fará uma busca inteligente no Google usando a Teoria.
              </p>
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
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white gap-0">
          <div className="flex flex-col sm:flex-row h-full max-h-[90vh]">
            {/* Sidebar */}
            <div className="bg-slate-50 w-full sm:w-[280px] p-6 flex flex-col items-center border-r border-slate-100 shrink-0">
              <Avatar
                className="w-24 h-24 mb-4 border-4 border-white shadow-md"
                style={{ backgroundColor: opColor || '#cbd5e1' }}
              >
                <AvatarFallback className="text-3xl text-white bg-transparent font-medium uppercase">
                  {opFirstName?.[0] || ''}
                  {opLastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg text-center text-slate-800 line-clamp-1 w-full">
                {opFirstName} {opLastName}
              </h3>
              <p
                className="text-sm text-slate-500 mb-6 truncate w-full text-center"
                title={opEmail}
              >
                {opEmail}
              </p>

              <div className="w-full space-y-4 text-sm mt-auto mb-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Status
                  </span>
                  {opIsActive ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Inativo
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Perfil
                  </span>
                  <span className="font-medium text-slate-700">
                    {opIsAdmin ? 'Administrador' : 'Operador'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Últ. Acesso
                  </span>
                  <span className="font-medium text-slate-700">
                    {editingOperator?.last_login
                      ? new Date(editingOperator.last_login).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Criado em
                  </span>
                  <span className="font-medium text-slate-700">
                    {editingOperator?.created_at
                      ? new Date(editingOperator.created_at).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
                onClick={() => handleResetPassword(opEmail)}
              >
                <KeyRound className="w-4 h-4" />
                Forçar Senha
              </Button>
            </div>

            {/* Content */}
            <div className="w-full p-6 overflow-y-auto">
              <DialogHeader className="mb-6 text-left">
                <DialogTitle className="text-2xl">Editar Operador</DialogTitle>
                <DialogDescription>
                  Ajuste as informações pessoais, preferências e permissões de acesso deste usuário.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="opEmail">E-mail de Acesso</Label>
                  <Input
                    id="opEmail"
                    type="email"
                    value={opEmail}
                    onChange={(e) => setOpEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Cor de Identificação</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {PROFILE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setOpColor(color.value)}
                        className={cn(
                          'w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 shadow-sm border-2',
                          opColor === color.value
                            ? 'border-primary scale-110 ring-2 ring-primary ring-offset-1'
                            : 'border-transparent opacity-80 hover:opacity-100',
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900">Segurança e Acesso</h4>

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <Label
                        className="text-sm font-semibold flex items-center gap-2 text-purple-700 cursor-pointer"
                        onClick={() => setOpIsAdmin(!opIsAdmin)}
                      >
                        <Shield className="w-4 h-4" /> Privilégios de Administrador
                      </Label>
                      <p className="text-xs text-slate-500">
                        Concede acesso total às configurações e gestão de usuários.
                      </p>
                    </div>
                    <Switch checked={opIsAdmin} onCheckedChange={setOpIsAdmin} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <Label
                        className="text-sm font-semibold flex items-center gap-2 text-emerald-700 cursor-pointer"
                        onClick={() => setOpIsActive(!opIsActive)}
                      >
                        <UserCheck className="w-4 h-4" /> Conta Ativa
                      </Label>
                      <p className="text-xs text-slate-500">
                        Permite que o operador faça login e acesse o sistema.
                      </p>
                    </div>
                    <Switch checked={opIsActive} onCheckedChange={setOpIsActive} />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-8 pt-4 sm:justify-end flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsOperatorModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveOperator}>Salvar Alterações</Button>
              </DialogFooter>
            </div>
          </div>
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
