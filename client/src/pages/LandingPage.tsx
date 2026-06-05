import { useNavigate } from 'react-router-dom'
import { Crown, Users } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import { landingTheme } from '../theme/roles'
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
    path: '/owner-select',
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
    path: '/dashboard/employee',
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
    <div className={`min-h-screen ${landingTheme.page} flex flex-col items-center justify-center px-6 py-8 select-none`}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center w-full max-w-2xl mx-auto mb-10 flex flex-col items-center"
      >
        <div className="w-full flex justify-center mb-6 px-2">
          <BrandLogo size="hero" className="drop-shadow-md" />
        </div>
        <p className={`${landingTheme.subtitle} text-lg md:text-xl font-semibold tracking-wide`}>
          Point of Sale System
        </p>
        <p className={`${landingTheme.hint} text-sm mt-2`}>Select your role to continue</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row items-stretch justify-center gap-6 sm:gap-10 w-full max-w-2xl"
      >
        {roles.map(({ key, label, description, icon: Icon, bg, border, iconBg, iconColor, textColor, path }) => (
          <motion.button
            key={key}
            variants={item}
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.97 }}
            className={`
              ${bg} ${border} border-2 rounded-3xl p-8 flex flex-col items-center gap-5
              w-full sm:w-72 md:w-80
              cursor-pointer transition-all duration-200
              hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-900/10
              active:scale-[0.98]
              touch-btn min-h-[220px] shadow-sm
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

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`mt-10 ${landingTheme.footer} text-xs text-center`}
      >
        Real Health Juice Parlour &copy; {new Date().getFullYear()} &mdash; POS v1.0
      </motion.p>
    </div>
  )
}
