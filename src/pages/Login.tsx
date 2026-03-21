import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Waves } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const { signIn, signUp, user, loading } = useAuth()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (mode === 'register') {
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
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <Waves className="h-8 w-8" strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
            Ric Recupera & Desenvolve
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Acesse a plataforma' : 'Crie sua conta de operador'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100 font-medium">
                {error === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error}
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <p>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-primary hover:underline font-medium"
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
                  className="text-primary hover:underline font-medium"
                >
                  Faça login
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
