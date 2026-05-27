import { useState, useRef } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Crown, Leaf, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../App'

const roleConfig: Record<
  UserRole,
  {
    label: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    accent: string
    accentLight: string
    accentDark: string
    bg: string
    ring: string
  }
> = {
  owner: {
    label: 'Owner',
    icon: Crown,
    accent: 'bg-amber-500',
    accentLight: 'bg-amber-50',
    accentDark: 'text-amber-700',
    bg: 'from-amber-900 to-amber-800',
    ring: 'focus:ring-amber-400',
  },
  employee: {
    label: 'Employee',
    icon: Crown,
    accent: 'bg-sky-500',
    accentLight: 'bg-sky-50',
    accentDark: 'text-sky-700',
    bg: 'from-sky-900 to-blue-900',
    ring: 'focus:ring-sky-400',
  },
}

export default function LoginPage() {
  const { role } = useParams<{ role: string }>()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const passwordRef = useRef<HTMLInputElement>(null)

  const validRole: UserRole | null =
    role === 'owner' ? 'owner' : role === 'employee' ? 'employee' : null

  if (!validRole) return <Navigate to="/" replace />

  const config = roleConfig[validRole]
  const Icon = config.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await login(validRole, username.trim(), password)
      navigate(`/dashboard/${validRole}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.bg} flex flex-col items-center justify-center px-6 py-12`}
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors py-3 px-4 rounded-xl hover:bg-white/10 active:bg-white/20"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`${config.accent} px-8 py-8 flex flex-col items-center gap-3`}>
            <div className="bg-white/20 rounded-2xl p-4">
              <Icon size={40} className="text-white" />
            </div>
            <div className="text-center">
              <div className="text-white/70 text-sm font-medium uppercase tracking-widest">
                Real Health Juice Parlour
              </div>
              <div className="text-white text-2xl font-bold mt-1">{config.label} Login</div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 flex flex-col gap-5">
            {/* Brand mark */}
            <div className="flex items-center gap-2 mb-1">
              <Leaf size={16} className="text-green-500" />
              <span className="text-xs text-gray-400 font-medium tracking-wide">POS System</span>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
                placeholder="Enter your username"
                autoComplete="username"
                className={`
                  w-full px-5 py-4 rounded-2xl border-2 border-gray-200
                  text-gray-900 text-lg placeholder:text-gray-400
                  focus:outline-none focus:border-transparent focus:ring-2 ${config.ring}
                  transition-all duration-150
                `}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`
                    w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-200
                    text-gray-900 text-lg placeholder:text-gray-400
                    focus:outline-none focus:border-transparent focus:ring-2 ${config.ring}
                    transition-all duration-150
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
              className={`
                ${config.accent} text-white font-bold text-lg rounded-2xl py-5 mt-2
                hover:opacity-90 active:opacity-80 transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-3
                min-h-[64px]
              `}
            >
              {isLoading ? (
                <div className="w-6 h-6 rounded-full border-3 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Icon size={22} />
                  Sign In as {config.label}
                </>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Real Health Juice Parlour &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  )
}
