import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { HeaderLogo } from './BrandLogo'
import { useAuth } from '../context/AuthContext'
import { useMinWidth } from '../hooks/useMinWidth'

interface OwnerPageShellProps {
  title: string
  subtitle?: string
  onBack: () => void
  backTitle?: string
  children: ReactNode
  actions?: ReactNode
  headerNote?: ReactNode
}

/** Shared owner sub-page chrome — mobile-safe layout (no logo image on small screens). */
export default function OwnerPageShell({
  title,
  subtitle,
  onBack,
  backTitle = 'Back',
  children,
  actions,
  headerNote,
}: OwnerPageShellProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const showLogo = useMinWidth(768)

  return (
    <div className="rhjp-owner-layout">
      <header className="rhjp-owner-header">
        <div className="rhjp-owner-header-row">
          <button type="button" onClick={onBack} title={backTitle} className="rhjp-owner-icon-btn" aria-label={backTitle}>
            <ArrowLeft size={20} />
          </button>
          {!showLogo ? (
            <div className="rhjp-owner-brand-mark" aria-hidden>
              RH
            </div>
          ) : (
            <div className="rhjp-owner-header-logo-wrap">
              <HeaderLogo />
            </div>
          )}
          <div className="rhjp-owner-header-text">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {actions}
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
        </div>
        {headerNote}
      </header>

      <main className="rhjp-owner-main">{children}</main>
    </div>
  )
}
