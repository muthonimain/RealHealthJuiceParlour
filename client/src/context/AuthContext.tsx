import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from '../App'

interface User {
  id: string
  name: string
  role: UserRole
  token: string
}

interface AuthContextType {
  user: User | null
  login: (role: UserRole, username: string, password: string) => Promise<void>
  selectEmployee: (employeeId: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('rhjp_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('rhjp_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (role: UserRole, username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, username, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Login failed')
    }

    const data = await res.json()
    const userData: User = { ...data.user, token: data.token }
    setUser(userData)
    localStorage.setItem('rhjp_user', JSON.stringify(userData))
  }

  const selectEmployee = async (employeeId: string) => {
    const res = await fetch('/api/auth/employee-select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Could not select employee')
    }

    const data = await res.json()
    const userData: User = { ...data.user, token: data.token }
    setUser(userData)
    localStorage.setItem('rhjp_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rhjp_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, selectEmployee, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
