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
  /** Extra header actions (e.g. refresh) — shown before logout */
  actions?: ReactNode
  /** Optional line under the header bar */
  headerNote?: ReactNode
}

/** Shared owner sub-page chrome — stable scroll on mobile, compact header. */
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
    <div className={`owner-page min-h-dvh ${ownerTheme.shellPage}`}>
      <header className={`${ownerTheme.header} owner-page-header`}>
        <div className="owner-page-header-inner">
          <button
            type="button"
            onClick={onBack}
            title={backTitle}
            className="owner-page-back shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <HeaderLogo compact className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-white font-bold text-sm sm:text-base leading-tight truncate">{title}</h1>
            {subtitle ? (
              <p className={`${ownerTheme.headerAccent} text-xs leading-tight truncate`}>{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {actions}
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/')
              }}
              title="Logout"
              className="owner-page-logout"
            >
              <LogOut size={16} />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>
        {headerNote}
      </header>

      <main className="owner-page-main">{children}</main>
    </div>
  )
}
