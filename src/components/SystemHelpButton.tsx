import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  HelpCircle,
  Edit2,
  Save,
  Info,
  BookOpen,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import logoImg from '@/assets/ricambiental_logo-01-500-porcento-fbb5f.png'
import { cn } from '@/lib/utils'

export function SystemHelpButton() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [doc, setDoc] = useState<{ id?: string; title: string; content: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      const href = target.getAttribute('href')
      if (href && href.startsWith('/')) {
        e.preventDefault()
        navigate(href)
        setIsOpen(false)
      }
    }
  }

  const renderMarkdown = (text: string) => {
    if (!text) return { __html: '' }
    let html = text

    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-slate-800 text-slate-50 p-4 rounded-md overflow-x-auto my-4 text-sm font-mono">$1</pre>',
    )
    html = html.replace(
      /`([^`\n]+)`/g,
      '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>',
    )
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="my-4 rounded-md shadow-sm border border-slate-200 max-w-full h-auto" />',
    )
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const isInternal = url.startsWith('/')
      const target = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"'
      return `<a href="${url}" class="text-primary hover:underline font-medium"${target}>${label}</a>`
    })
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-bold text-slate-800 mt-6 mb-2">$1</h3>',
    )
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-bold text-slate-800 mt-6 mb-2 border-b pb-2">$1</h2>',
    )
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-black text-slate-900 mt-6 mb-4">$1</h1>',
    )
    html = html.replace(
      /^\s*\d+\.\s+(.*)/gim,
      '<li class="ml-4 list-decimal marker:text-slate-400">$1</li>',
    )
    html = html.replace(
      /^\s*[*-]\s+(.*)/gim,
      '<li class="ml-4 list-disc marker:text-slate-400">$1</li>',
    )
    html = html.replace(
      /(<li class="[^"]*list-disc[^"]*".*?<\/li>\n?)+/g,
      '<ul class="my-3 space-y-1">$&</ul>',
    )
    html = html.replace(
      /(<li class="[^"]*list-decimal[^"]*".*?<\/li>\n?)+/g,
      '<ol class="my-3 space-y-1">$&</ol>',
    )

    const blocks = html.split(/\n\n+/)
    const processedBlocks = blocks.map((block) => {
      const trimmed = block.trim()
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<img') ||
        trimmed.startsWith('<pre')
      )
        return block
      return `<p class="mb-3">${block.replace(/\n/g, '<br/>')}</p>`
    })

    return { __html: processedBlocks.join('\n') }
  }

  const getNormalizedRoute = (path: string) => {
    if (path.match(/\/customer\/[a-zA-Z0-9-]+/)) {
      return '/customer/:id'
    }
    return path
  }

  const normalizedRoute = getNormalizedRoute(pathname)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()
      if (data && (data.is_admin || data.role === 'admin')) {
        setIsAdmin(true)
      }
    }
    checkAdmin()
  }, [user])

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('system_documentation' as any)
          .select('*')
          .eq('route', normalizedRoute)
          .maybeSingle()

        if (data) {
          setDoc(data)
        } else {
          setDoc(null)
        }
      } catch (e) {
        console.error('Failed to fetch doc', e)
      } finally {
        setLoading(false)
      }
    }
    if (isOpen) {
      fetchDoc()
      setIsEditing(false)
    }
  }, [normalizedRoute, isOpen])

  const handleEdit = () => {
    setEditTitle(doc?.title || 'Ajuda desta tela')
    setEditContent(doc?.content || '')
    setIsEditing(true)
    setActiveTab('edit')
  }

  const handleSave = async () => {
    try {
      const payload = {
        route: normalizedRoute,
        title: editTitle,
        content: editContent,
        updated_at: new Date().toISOString(),
      }

      if (doc?.id) {
        const { error } = await supabase
          .from('system_documentation' as any)
          .update(payload)
          .eq('id', doc.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('system_documentation' as any).insert([payload])
        if (error) throw error
      }

      setDoc({ ...doc, title: editTitle, content: editContent })
      setIsEditing(false)
      toast({ title: 'Documentação salva com sucesso.' })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar documentação',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Apenas imagens são permitidas', variant: 'destructive' })
      return null
    }

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('system_documentation_images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('system_documentation_images').getPublicUrl(filePath)

      return data.publicUrl
    } catch (err: any) {
      toast({
        title: 'Erro ao fazer upload da imagem',
        description: err.message,
        variant: 'destructive',
      })
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = editContent.substring(0, start) + text + editContent.substring(end)

    setEditContent(newValue)

    setTimeout(() => {
      textarea.selectionStart = start + text.length
      textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadImage(file)
    if (url) {
      insertTextAtCursor(`![Imagem](${url})\n`)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          const url = await uploadImage(file)
          if (url) {
            insertTextAtCursor(`![Imagem colada](${url})\n`)
          }
        }
        break
      }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-slate-200 bg-white hover:bg-slate-50 z-[100] transition-all duration-300 animate-fade-in-up"
          title="Central de Ajuda"
        >
          <Info className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px] sm:max-w-none flex flex-col z-[110]">
        <SheetHeader className="mb-6 flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <img src={logoImg} alt="RIC Ambiental" className="h-7 object-contain" />
            </span>
            {isAdmin && !isEditing && (
              <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8">
                <Edit2 className="h-4 w-4 mr-2" /> Editar Guia
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Documentação contextual para a tela:{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
              {normalizedRoute}
            </code>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 relative">
          {isGuideOpen && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[50] flex flex-col p-4 animate-in fade-in duration-200 rounded-md border border-slate-200 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Guia de Referência Markdown
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsGuideOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 font-medium text-slate-700 border-b">Elemento</th>
                      <th className="px-4 py-2 font-medium text-slate-700 border-b">
                        Como digitar
                      </th>
                      <th className="px-4 py-2 font-medium text-slate-700 border-b">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3 font-medium">Cabeçalho 1</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">
                        # Título Principal
                      </td>
                      <td className="px-4 py-3 font-bold text-lg">Título Principal</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Cabeçalho 2</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">
                        ## Subtítulo
                      </td>
                      <td className="px-4 py-3 font-bold text-base">Subtítulo</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Cabeçalho 3</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">### Seção</td>
                      <td className="px-4 py-3 font-bold">Seção</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Negrito</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">**Texto**</td>
                      <td className="px-4 py-3 font-bold">Texto</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Itálico</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">*Texto*</td>
                      <td className="px-4 py-3 italic">Texto</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Listas</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">
                        - Item 1<br />- Item 2
                      </td>
                      <td className="px-4 py-3">
                        <ul className="list-disc ml-4">
                          <li>Item 1</li>
                          <li>Item 2</li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Links</td>
                      <td className="px-4 py-3 font-mono text-xs bg-slate-50 rounded">
                        [Google](https://google.com)
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-primary underline">Google</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && !isEditing ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isEditing ? (
            <div className="space-y-4 animate-fade-in flex flex-col h-full min-h-[400px]">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-700">
                  Título do Guia
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex: Visão Geral da Dívida"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Conteúdo (suporta Markdown)
                  </label>
                  <div className="flex items-center gap-2">
                    {activeTab === 'edit' && (
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-0.5 rounded-md">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2.5 text-slate-600 hover:text-slate-900"
                          onClick={() => setIsGuideOpen(true)}
                        >
                          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                          Guia Markdown
                        </Button>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2.5 text-slate-600 hover:text-slate-900"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Inserir Imagem
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                    )}
                    <div className="flex bg-slate-100 p-0.5 rounded-md">
                      <button
                        onClick={() => setActiveTab('edit')}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                          activeTab === 'edit'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700',
                        )}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setActiveTab('preview')}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-sm transition-colors',
                          activeTab === 'preview'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700',
                        )}
                      >
                        Visualizar
                      </button>
                    </div>
                  </div>
                </div>

                {activeTab === 'edit' ? (
                  <Textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onPaste={handlePaste}
                    className="flex-1 min-h-[300px] resize-none font-mono text-sm leading-relaxed"
                    placeholder="Escreva a documentação aqui usando Markdown...&#10;&#10;Dica: Você pode colar imagens diretamente aqui usando Ctrl+V!"
                  />
                ) : (
                  <div
                    className="flex-1 min-h-[300px] border rounded-md p-4 bg-slate-50 prose prose-sm prose-slate max-w-none text-slate-600 overflow-y-auto"
                    dangerouslySetInnerHTML={renderMarkdown(editContent)}
                    onClick={handleContentClick}
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4 flex-shrink-0">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" /> Salvar Conteúdo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in flex flex-col h-full">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                {doc?.title || 'Informações da Tela'}
              </h3>
              {doc?.content ? (
                <div
                  className="prose prose-sm prose-slate max-w-none leading-relaxed text-slate-600 pb-6"
                  dangerouslySetInnerHTML={renderMarkdown(doc.content)}
                  onClick={handleContentClick}
                />
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                  <div className="bg-slate-100 p-3 rounded-full mb-4">
                    <HelpCircle className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">Guia não encontrado</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Ainda não há documentação cadastrada para esta tela.
                  </p>
                  {isAdmin && (
                    <Button onClick={handleEdit} size="sm">
                      <Edit2 className="h-4 w-4 mr-2" /> Criar Primeira Documentação
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
