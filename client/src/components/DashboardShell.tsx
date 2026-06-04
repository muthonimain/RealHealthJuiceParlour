import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { HeaderLogo } from './BrandLogo'
import { useAuth } from '../context/AuthContext'
import { useMinWidth } from '../hooks/useMinWidth'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle: string
  accentClass?: string
  headerBg?: string
  pageBg?: string
  children: ReactNode
}

export default function DashboardShell({ title, subtitle, children }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const showLogo = useMinWidth(768)

  return (
    <div className="rhjp-owner-layout">
      <header className="rhjp-owner-header">
        <div className="rhjp-owner-header-row">
          <div className="rhjp-owner-brand-mark" aria-hidden>
            RH
          </div>
          {showLogo ? (
            <div className="rhjp-owner-header-logo-wrap">
              <HeaderLogo />
            </div>
          ) : null}
          <div className="rhjp-owner-header-text">
            <h1>Real Health Juice Parlour</h1>
            <p>{title}</p>
          </div>
          {user ? (
            <span className="hidden md:block text-xs text-amber-200 shrink-0 text-right">
              {user.name}
            </span>
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
        <div className="rhjp-owner-welcome">
          <h2>{subtitle}</h2>
          <p>
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
