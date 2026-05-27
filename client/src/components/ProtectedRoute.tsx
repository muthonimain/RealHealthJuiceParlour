import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../App'
import type { ReactNode } from 'react'

interface Props {
  role: UserRole
  children: ReactNode
}

export default function ProtectedRoute({ role, children }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-950">
        <div className="w-12 h-12 rounded-full border-4 border-green-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user || user.role !== role) {
    return <Navigate to={`/login/${role}`} replace />
  }

  return <>{children}</>
}
