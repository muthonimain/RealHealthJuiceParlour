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
      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={ownerTheme.statCard}>
            <div className={`${bg} rounded-xl p-3 w-fit mb-3`}>
              <Icon size={24} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <h2 className={`text-lg font-semibold ${ownerTheme.pageTitle} mb-4`}>Management Modules</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {modules.map(({ label, icon: Icon, color, bg, path }) => (
          <button
            key={label}
            type="button"
            onClick={() => path && navigate(path)}
            className={`${ownerTheme.moduleCard} flex flex-col items-center gap-3 min-h-[120px] sm:min-h-[130px] active:scale-[0.98] transition-transform ${path ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
          >
            <div className={`${bg} rounded-xl p-4`}>
              <Icon size={28} className={color} />
            </div>
            <span className="text-sm font-semibold text-gray-700 text-center">{label}</span>
            {path && <span className={`text-xs ${ownerTheme.openLink} font-semibold uppercase tracking-wider`}>Open →</span>}
          </button>
        ))}
      </div>
    </DashboardShell>
  )
}
