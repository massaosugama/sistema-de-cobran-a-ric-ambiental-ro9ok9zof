import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { signIn, signUp, resetPassword, user, loading } = useAuth()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (mode === 'forgot_password') {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        toast({
          title: 'E-mail enviado',
          description: 'Verifique sua caixa de entrada para redefinir a senha.',
        })
        setMode('login')
      }
    } else if (mode === 'register') {
      const { error } = await signUp(email, password, firstName, lastName)
      if (error) {
        setError(error.message)
      } else {
        toast({ title: 'Sucesso', description: 'Conta criada. Você já pode fazer login.' })
        setMode('login')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center space-y-2 pb-6 relative">
          {mode === 'forgot_password' && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 text-slate-500 hover:text-slate-700"
              onClick={() => setMode('login')}
              title="Voltar para Login"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Ric Ambiental" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
            Ric Recupera & Desenvolve
          </CardTitle>
          <CardDescription>
            {mode === 'login' && 'Acesse a plataforma'}
            {mode === 'register' && 'Crie sua conta de operador'}
            {mode === 'forgot_password' && 'Recuperação de Senha'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100 font-medium">
                {error === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error}
              </div>
            )}

            {mode === 'forgot_password' && (
              <p className="text-sm text-slate-600 mb-4 text-center">
                Digite seu e-mail abaixo e enviaremos um link para você redefinir sua senha.
              </p>
            )}

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="João"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Silva"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="operador@ricambiental.com.br"
              />
            </div>

            {mode !== 'forgot_password' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-xs text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
              {isSubmitting
                ? 'Aguarde...'
                : mode === 'login'
                  ? 'Entrar'
                  : mode === 'register'
                    ? 'Cadastrar'
                    : 'Enviar Link'}
            </Button>
          </form>

          {mode !== 'forgot_password' && (
            <div className="mt-6 text-center text-sm text-slate-500">
              {mode === 'login' ? (
                <p>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-primary hover:underline font-medium focus:outline-none"
                  >
                    Cadastre-se
                  </button>
                </p>
              ) : (
                <p>
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium focus:outline-none"
                  >
                    Faça login
                  </button>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
