import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

export function GlobalInactivityTracker() {
  const { user, signOut } = useAuth()
  const timeoutMinutesRef = useRef(120) // default 120
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTimeout = async () => {
      if (!user) return
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'security_params')
          .single()

        if (data?.value?.inactivity_timeout) {
          timeoutMinutesRef.current = data.value.inactivity_timeout
        }
      } catch (err) {
        // ignore
      }
    }
    fetchTimeout()
  }, [user])

  useEffect(() => {
    if (!user) return

    const LAST_ACTIVITY_KEY = 'ric_last_activity'

    const logout = async () => {
      localStorage.removeItem(LAST_ACTIVITY_KEY)
      toast({
        title: 'Sessão Expirada',
        description: 'Você foi desconectado por inatividade.',
      })
      await signOut()
      navigate('/login')
    }

    const checkInactivity = () => {
      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY)
      if (lastActivityStr && timeoutMinutesRef.current > 0) {
        const lastActivity = parseInt(lastActivityStr, 10)
        const elapsed = Date.now() - lastActivity
        if (elapsed > timeoutMinutesRef.current * 60 * 1000) {
          logout()
          return true
        }
      }
      return false
    }

    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }

    // Initialize activity on mount
    const existing = localStorage.getItem(LAST_ACTIVITY_KEY)
    if (!existing) {
      updateActivity()
    } else {
      // Check immediately on mount in case they left tab open
      const loggedOut = checkInactivity()
      if (loggedOut) return // Don't setup events if we just logged out
      updateActivity() // Refresh activity if still valid
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    let throttled = false

    const handleActivity = () => {
      if (!throttled) {
        updateActivity()
        throttled = true
        setTimeout(() => {
          throttled = false
        }, 2000) // throttle to max 1 reset every 2 seconds
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity()
      }
    }
    window.addEventListener('visibilitychange', visibilityHandler)

    const interval = setInterval(checkInactivity, 15000) // every 15 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      window.removeEventListener('visibilitychange', visibilityHandler)
      clearInterval(interval)
    }
  }, [user, signOut, navigate])

  return null
}
