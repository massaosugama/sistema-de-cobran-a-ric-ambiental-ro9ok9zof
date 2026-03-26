import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (
    email: string,
    password: string,
    first_name?: string,
    last_name?: string,
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isLoggingOutRef = useRef(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Heartbeat to update last_login and maintain online status
  useEffect(() => {
    let interval: NodeJS.Timeout
    let timeout: NodeJS.Timeout

    if (user && !isLoggingOutRef.current) {
      const ping = async () => {
        if (isLoggingOutRef.current) return
        try {
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)
        } catch (err) {
          // Falha silenciosa para evitar erros de runtime caso o banco tenha timeout
          console.debug('Heartbeat ping failed:', err)
        }
      }

      // Atraso no primeiro ping para não bloquear o carregamento da página
      timeout = setTimeout(ping, 5000)
      interval = setInterval(ping, 2 * 60 * 1000) // Ping a cada 2 minutos
    }

    return () => {
      if (timeout) clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [user])

  const signUp = async (
    email: string,
    password: string,
    first_name?: string,
    last_name?: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    isLoggingOutRef.current = false
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    isLoggingOutRef.current = true
    if (user) {
      try {
        // Instant offline update for other users viewing the dashboard
        await supabase.from('profiles').update({ last_login: null }).eq('id', user.id)
      } catch (err) {
        console.error('Error updating last_login on logout', err)
      }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings?tab=profile`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, signUp, signIn, signOut, resetPassword, updatePassword, loading }}
    >
      {children}
    </AuthContext.Provider>
  )
}
