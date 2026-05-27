import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Leaf, Droplets, AlertCircle, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

interface EmployeeInfo {
  id: string
  name: string
  username: string
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const card: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function EmployeeSelectPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [employees, setEmployees] = useState<EmployeeInfo[]>([])
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<EmployeeInfo | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data: EmployeeInfo[]) => setEmployees(data))
      .catch(() => setLoadError('Could not load employee list. Is the server running?'))
  }, [])

  const handleSelect = (emp: EmployeeInfo) => {
    setSelected(emp)
    setPassword('')
    setLoginError('')
    setShowPassword(false)
    setTimeout(() => passwordRef.current?.focus(), 150)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !password.trim()) {
      setLoginError('Please enter your password.')
      return
    }
    setIsLogging(true)
    setLoginError('')
    try {
      await login('employee', selected.username, password)
      navigate('/dashboard/employee')
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid password. Try again.')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-sky-900 to-blue-900 flex flex-col items-center justify-center px-6 py-10">
      {/* Back */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors py-3 px-4 rounded-xl hover:bg-white/10"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Leaf size={24} className="text-green-300" />
          <Droplets size={20} className="text-emerald-300" />
        </div>
        <h1 className="text-3xl font-bold text-white">Real Health Juice Parlour</h1>
        <p className="text-sky-300 font-semibold mt-1">Who's working today?</p>
        <p className="text-sky-400 text-sm mt-0.5">Tap your name to sign in</p>
      </motion.div>

      {/* Load error */}
      {loadError && (
        <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {loadError}
        </div>
      )}

      {/* Employee Cards */}
      {!selected && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl"
        >
          {employees.map((emp) => (
            <motion.button
              key={emp.id}
              variants={card}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(emp)}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-3xl p-6 flex flex-col items-center gap-3 min-h-[140px] transition-all"
            >
              <div className="bg-sky-500/30 rounded-2xl p-4">
                <User size={36} className="text-sky-200" />
              </div>
              <span className="text-white font-bold text-base text-center leading-tight">
                {emp.name}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Password Form */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Card Header */}
              <div className="bg-sky-600 px-8 py-6 flex flex-col items-center gap-2">
                <div className="bg-white/20 rounded-2xl p-4">
                  <User size={36} className="text-white" />
                </div>
                <div className="text-white font-bold text-xl">{selected.name}</div>
                <div className="text-sky-200 text-xs">Enter your password to continue</div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="px-8 py-6 flex flex-col gap-4">
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                  >
                    <AlertCircle size={15} className="shrink-0" />
                    {loginError}
                  </motion.div>
                )}

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
                      className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-200 text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400 transition-all"
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

                <motion.button
                  type="submit"
                  disabled={isLogging}
                  whileTap={{ scale: 0.97 }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg rounded-2xl py-5 flex items-center justify-center gap-2 disabled:opacity-60 transition-all min-h-[64px]"
                >
                  {isLogging
                    ? <div className="w-6 h-6 rounded-full border-4 border-white border-t-transparent animate-spin" />
                    : 'Sign In'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  ← Choose a different name
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-10 text-sky-700 text-xs text-center">
        Real Health Juice Parlour &copy; {new Date().getFullYear()}
      </p>
    </div>
  )
}
