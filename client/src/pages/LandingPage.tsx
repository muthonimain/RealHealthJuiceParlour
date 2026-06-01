import { useNavigate } from 'react-router-dom'
import { Crown, Users, Leaf, Droplets } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

const roles: {
  key: string
  label: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  bg: string
  border: string
  iconBg: string
  iconColor: string
  textColor: string
  path: string
}[] = [
  {
    key: 'owner',
    label: 'Owner',
    description: 'Full system access, reports & settings',
    icon: Crown,
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-800',
    path: '/login/owner',
  },
  {
    key: 'employee',
    label: 'Employee',
    description: 'Process orders, handle transactions',
    icon: Users,
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    textColor: 'text-sky-800',
    path: '/employee-select',
  },
]

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800 flex flex-col items-center justify-center px-6 py-12 select-none">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <Leaf size={32} className="text-green-300" />
            <Droplets size={28} className="text-emerald-300" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
          Real Health
        </h1>
        <h2 className="text-3xl md:text-4xl font-semibold text-green-300 tracking-tight mb-3">
          Juice Parlour
        </h2>
        <div className="h-px w-24 bg-green-500 mx-auto mb-4" />
        <p className="text-green-300 text-lg font-medium">Point of Sale System</p>
        <p className="text-green-400 text-sm mt-1">Select your role to continue</p>
      </motion.div>

      {/* Role Cards — two roles, centred */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 w-full max-w-3xl mx-auto"
      >
        {roles.map(({ key, label, description, icon: Icon, bg, border, iconBg, iconColor, textColor, path }) => (
          <motion.button
            key={key}
            variants={item}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.97 }}
            className={`
              ${bg} ${border} border-2 rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5
              w-full sm:w-72 md:w-80
              cursor-pointer transition-all duration-200
              hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30
              active:scale-[0.98]
              touch-btn min-h-[240px]
            `}
          >
            <div className={`${iconBg} rounded-2xl p-5`}>
              <Icon size={44} className={iconColor} />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${textColor} mb-1`}>{label}</div>
              <div className="text-sm text-gray-500 leading-snug">{description}</div>
            </div>
            <div className={`mt-auto text-xs font-semibold ${iconColor} uppercase tracking-widest`}>
              Tap to Continue
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-green-600 text-xs text-center"
      >
        Real Health Juice Parlour &copy; {new Date().getFullYear()} &mdash; POS v1.0
      </motion.p>
    </div>
  )
}
