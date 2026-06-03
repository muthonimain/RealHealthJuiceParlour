import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, AlertCircle, Crown } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { ownerTheme } from '../theme/roles'

interface OwnerInfo {
  id: string
  name: string
  username: string
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const card: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function OwnerSelectPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [owners, setOwners] = useState<OwnerInfo[]>([])
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<OwnerInfo | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/owners')
      .then((r) => r.json())
      .then((data: OwnerInfo[]) => setOwners(data))
      .catch(() => setLoadError('Could not load owner list. Is the server running?'))
  }, [])

  const handleSelect = (owner: OwnerInfo) => {
    setSelected(owner)
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
      await login('owner', selected.username, password.trim())
      navigate('/dashboard/owner')
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Invalid password. Try again.')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div className={`min-h-screen ${ownerTheme.page} flex flex-col items-center justify-center px-6 py-10`}>
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className={`absolute top-6 left-6 flex items-center gap-2 transition-colors py-3 px-4 rounded-xl ${ownerTheme.back}`}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-2xl mx-auto mb-10 flex flex-col items-center"
      >
        <div className="w-full flex justify-center mb-5 px-2">
          <BrandLogo size="hero" className="drop-shadow-md" />
        </div>
        <p className={`${ownerTheme.subtitle} text-lg font-semibold tracking-wide`}>Owner sign in</p>
        <p className={`${ownerTheme.hint} text-sm mt-2`}>Select your account to continue</p>
      </motion.div>

      {loadError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {loadError}
        </div>
      )}

      {!selected && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-xl"
        >
          {owners.map((owner) => (
            <motion.button
              key={owner.id}
              variants={card}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(owner)}
              className="bg-amber-50 border-2 border-amber-300 hover:shadow-xl hover:shadow-emerald-900/10 rounded-3xl p-8 flex flex-col items-center gap-4 w-full sm:w-56 min-h-[160px] transition-all shadow-sm"
            >
              <div className="bg-amber-100 rounded-2xl p-4">
                <Crown size={40} className="text-amber-600" />
              </div>
              <span className="text-amber-800 font-bold text-xl text-center leading-tight">
                {owner.name}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-sm"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-amber-600 px-8 py-6 flex flex-col items-center gap-2">
                <div className="bg-white/20 rounded-2xl p-4">
                  <Crown size={36} className="text-white" />
                </div>
                <div className="text-white font-bold text-xl">{selected.name}</div>
                <div className="text-amber-100 text-xs">Enter your password to continue</div>
              </div>

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
                      className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-200 text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400 transition-all"
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
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg rounded-2xl py-5 flex items-center justify-center gap-2 disabled:opacity-60 transition-all min-h-[64px]"
                >
                  {isLogging ? (
                    <div className="w-6 h-6 rounded-full border-4 border-white border-t-transparent animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  ← Choose a different owner
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={`mt-10 ${ownerTheme.footer} text-xs text-center`}>
        Real Health Juice Parlour &copy; {new Date().getFullYear()}
      </p>
    </div>
  )
}
