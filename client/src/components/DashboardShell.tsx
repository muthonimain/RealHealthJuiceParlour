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
  children,
}: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="rhjp-owner-layout">
      <header className="rhjp-owner-header">
        <div className="rhjp-owner-header-row">
          <HeaderLogo compact />
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm leading-tight m-0 truncate">
              Real Health Juice Parlour
            </p>
            <p className={`text-xs font-semibold uppercase m-0 mt-0.5 truncate ${accentClass}`}>
              {title}
            </p>
          </div>
          {user ? (
            <p className="hidden md:block text-right text-xs text-amber-200 shrink-0 m-0">
              <span className="block text-white font-semibold">{user.name}</span>
              <span className="capitalize">{user.role}</span>
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            title="Logout"
            className="rhjp-owner-icon-btn"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="rhjp-owner-main">
        <div className="mb-4 min-w-0">
          <h1 className="text-xl font-bold text-red-950 m-0">{subtitle}</h1>
          <p className="text-orange-900/80 text-sm mt-1 m-0">
            {new Date().toLocaleDateString('en-KE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}
