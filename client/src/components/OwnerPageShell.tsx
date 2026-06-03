import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import { HeaderLogo } from './BrandLogo'
import { useAuth } from '../context/AuthContext'
import { ownerTheme } from '../theme/roles'

interface OwnerPageShellProps {
  title: string
  subtitle?: string
  onBack: () => void
  backTitle?: string
  children: ReactNode
  actions?: ReactNode
  headerNote?: ReactNode
}

/** Shared owner sub-page chrome — mobile-safe layout (no sticky/clip/gradients). */
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

  return (
    <div className="rhjp-owner-layout">
      <header className="rhjp-owner-header">
        <div className="rhjp-owner-header-row">
          <button type="button" onClick={onBack} title={backTitle} className="rhjp-owner-icon-btn" aria-label={backTitle}>
            <ArrowLeft size={20} />
          </button>
          <HeaderLogo compact />
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-bold text-sm leading-tight m-0 truncate">{title}</h1>
            {subtitle ? (
              <p className={`${ownerTheme.headerAccent} text-xs leading-tight m-0 mt-0.5 truncate`}>{subtitle}</p>
            ) : null}
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
