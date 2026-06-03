import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, Users, ShoppingBag, DollarSign, Settings, BarChart2, Package, ClipboardList, Wallet, PieChart } from 'lucide-react'
import { ownerTheme } from '../../theme/roles'
import { sumRevenueForWorkingMonth, workingMonthLabel } from '../../lib/workingMonth'
import { dataUnchanged } from '../../lib/stableData'

interface Order { grandTotal: number; createdAt: string }

const modules: { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; path?: string }[] = [
  { label: 'Employee Records', icon: ClipboardList, color: 'text-amber-700', bg: 'bg-amber-100', path: '/dashboard/owner/employee-records' },
  { label: 'Expenses', icon: Wallet, color: 'text-orange-700', bg: 'bg-orange-100', path: '/dashboard/owner/expenses' },
  { label: 'Net Profit', icon: PieChart, color: 'text-emerald-700', bg: 'bg-emerald-100', path: '/dashboard/owner/net-profit' },
  { label: 'Menu & Products', icon: Package, color: 'text-green-700', bg: 'bg-green-100', path: '/dashboard/owner/menu' },
  { label: 'Sales Reports', icon: BarChart2, color: 'text-purple-700', bg: 'bg-purple-100' },
  { label: 'Staff Management', icon: Users, color: 'text-blue-700', bg: 'bg-blue-100' },
  { label: 'System Settings', icon: Settings, color: 'text-gray-700', bg: 'bg-gray-100' },
]

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const pull = () =>
      fetch('/api/orders')
        .then((r) => r.json())
        .then((next: Order[]) => {
          setOrders((prev) => (dataUnchanged(prev, next) ? prev : next))
        })
        .catch(() => {})
    pull()
    const id = setInterval(pull, 20000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + o.grandTotal, 0)

  const monthRevenue = sumRevenueForWorkingMonth(orders)
  const monthLabel = workingMonthLabel()

  const stats = [
    { label: "Today's Revenue", value: `Ksh ${todayRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "Today's Orders", value: todayOrders.length.toString(), icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: orders.length.toString(), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: `${monthLabel} revenue`, value: `Ksh ${monthRevenue.toLocaleString()}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <DashboardShell
      title="Owner Portal"
      subtitle={`Welcome back, ${user?.name ?? 'Owner'}`}
      accentClass={ownerTheme.headerAccent}
      headerBg={ownerTheme.header}
      pageBg={ownerTheme.shellPage}
    >
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="owner-dashboard-grid owner-dashboard-grid--stats">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={ownerTheme.statCard}>
              <div className={`${bg} rounded-lg sm:rounded-xl p-2 sm:p-3 w-fit mb-2 sm:mb-3`}>
                <Icon className={`${color} w-5 h-5 sm:w-6 sm:h-6`} />
              </div>
              <div className="text-base sm:text-2xl font-bold text-gray-900 leading-tight break-words">
                {value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 leading-snug">{label}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className={`text-base sm:text-lg font-semibold ${ownerTheme.pageTitle} mb-3 sm:mb-4`}>
            Management Modules
          </h2>
          <div className="owner-dashboard-grid owner-dashboard-grid--modules">
            {modules.map(({ label, icon: Icon, color, bg, path }) => (
              <button
                key={label}
                type="button"
                onClick={() => path && navigate(path)}
                className={`${ownerTheme.moduleCard} flex flex-col items-center justify-center gap-2 sm:gap-3 min-h-[108px] sm:min-h-[130px] active:opacity-90 ${path ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
              >
                <div className={`${bg} rounded-lg sm:rounded-xl p-2.5 sm:p-4`}>
                  <Icon size={24} className={color} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center leading-tight px-1">
                  {label}
                </span>
                {path && (
                  <span className={`text-[10px] sm:text-xs ${ownerTheme.openLink} font-semibold uppercase tracking-wide`}>
                    Open →
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
