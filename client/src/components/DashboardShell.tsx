import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import BrandLogo from './BrandLogo'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle: string
  accentClass: string
  headerBg: string
  pageBg?: string
  children: ReactNode
}

export default function DashboardShell({
  title,
  subtitle,
  accentClass,
  headerBg,
  pageBg = 'bg-gray-100',
  children,
}: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={`min-h-screen flex flex-col ${pageBg}`}>
      {/* Top Nav */}
      <header className={`${headerBg} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <div className="text-white font-bold text-lg leading-tight">Real Health Juice Parlour</div>
              <div className={`text-xs font-semibold uppercase tracking-widest ${accentClass}`}>{title}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-white font-semibold text-sm">{user?.name}</div>
              <div className={`text-xs ${accentClass} capitalize`}>{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-all"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-950">{subtitle}</h1>
          <p className="text-orange-800/70 text-sm mt-1">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}
