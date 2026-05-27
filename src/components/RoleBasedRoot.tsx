import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function RoleBasedRoot() {
  const { profile, loading } = useAuth()

  if (loading) return null

  if (!profile) return null

  const isAdminOrConsultas =
    profile.role === 'admin' || profile.role === 'consultas' || profile.is_admin

  if (!isAdminOrConsultas) {
    return <Navigate to="/queue" replace />
  }

  return <Navigate to="/dashboard" replace />
}
