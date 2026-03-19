import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Waves } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, user, loading } = useAuth()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
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
            Ric Ambiental
          </CardTitle>
          <CardDescription>Acesse o sistema de gestão de cobranças</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100 font-medium">
                {error === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error}
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
                placeholder="admin@ricambiental.com.br"
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 font-bold text-base mt-2 shadow-md"
            >
              {isSubmitting ? 'Autenticando...' : 'Entrar no Sistema'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Dica de acesso: admin@ricambiental.com.br / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
