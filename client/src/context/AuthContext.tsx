import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from '../App'
import { authFetch, readApiJson } from '../lib/api'

interface User {
  id: string
  name: string
  role: UserRole
  token: string
  sessionId?: string
}

interface SelectEmployeeOptions {
  sharedDevice?: boolean
}

interface AuthContextType {
  user: User | null
  login: (role: UserRole, username: string, password: string) => Promise<void>
  selectEmployee: (employeeId: string, options?: SelectEmployeeOptions) => Promise<void>
  logout: () => Promise<void>
  handleSessionInactive: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const HEARTBEAT_MS = 30_000

function persistUser(user: User | null) {
  if (user) localStorage.setItem('rhjp_user', JSON.stringify(user))
  else localStorage.removeItem('rhjp_user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const userRef = useRef(user)
  userRef.current = user

  const handleSessionInactive = useCallback(() => {
    setUser(null)
    persistUser(null)
  }, [])

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('rhjp_user')
      if (!stored) {
        setIsLoading(false)
        return
      }

      try {
        const parsed = JSON.parse(stored) as User
        if (parsed.role === 'employee' && parsed.sessionId && parsed.id) {
          const res = await fetch('/api/auth/employee-select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: parsed.id,
              resumeSessionId: parsed.sessionId,
            }),
          })
          if (res.ok) {
            const data = await readApiJson<{
              token: string
              user: { id: string; name: string; role: UserRole }
              sessionId: string
            }>(res)
            const userData: User = {
              ...data.user,
              token: data.token,
              sessionId: data.sessionId,
            }
            setUser(userData)
            persistUser(userData)
          } else {
            persistUser(null)
            setUser(null)
          }
        } else if (parsed.role === 'owner') {
          setUser(parsed)
        } else {
          persistUser(null)
          setUser(null)
        }
      } catch {
        persistUser(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [])

  useEffect(() => {
    const current = userRef.current
    if (!current || current.role !== 'employee' || !current.sessionId) return

    const heartbeat = async () => {
      try {
        const res = await authFetch('/api/auth/employee-heartbeat', { method: 'POST' })
        if (res.status === 409 || res.status === 401) {
          const data = await res.json().catch(() => ({}))
          if (data.code === 'SESSION_INACTIVE') handleSessionInactive()
        }
      } catch {
        /* ignore transient network errors */
      }
    }

    void heartbeat()
    const id = setInterval(() => void heartbeat(), HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [user?.id, user?.sessionId, user?.role, handleSessionInactive])

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
    persistUser(userData)
  }

  const selectEmployee = async (employeeId: string, options?: SelectEmployeeOptions) => {
    const res = await fetch('/api/auth/employee-select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId,
        sharedDevice: options?.sharedDevice === true,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Could not select employee')
    }

    const data = await readApiJson<{
      token: string
      user: { id: string; name: string; role: UserRole }
      sessionId: string
    }>(res)
    const userData: User = {
      ...data.user,
      token: data.token,
      sessionId: data.sessionId,
    }
    setUser(userData)
    persistUser(userData)
  }

  const logout = async () => {
    const current = userRef.current
    if (current?.role === 'employee' && current.sessionId) {
      try {
        await authFetch('/api/auth/employee-release', { method: 'POST' })
      } catch {
        /* ignore */
      }
    }
    setUser(null)
    persistUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, login, selectEmployee, logout, handleSessionInactive, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
