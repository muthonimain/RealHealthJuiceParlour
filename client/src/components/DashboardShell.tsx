import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { HeaderLogo } from './BrandLogo'
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
    <div className={`owner-page min-h-dvh ${pageBg}`}>
      <header className={`${headerBg} owner-page-header`}>
        <div className="owner-page-header-inner max-w-7xl">
          <HeaderLogo className="self-center shrink-0" />
          <div className="min-w-0 flex-1 py-0.5">
            <div className="text-white font-bold text-sm sm:text-lg leading-snug truncate">
              Real Health Juice Parlour
            </div>
            <div className={`text-xs font-semibold uppercase tracking-wide sm:tracking-widest leading-snug truncate ${accentClass}`}>
              {title}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-white font-semibold text-sm">{user?.name}</div>
              <div className={`text-xs ${accentClass} capitalize`}>{user?.role}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="owner-page-logout bg-white/10 hover:bg-white/20"
            >
              <LogOut size={18} />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="owner-page-main max-w-7xl">
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
