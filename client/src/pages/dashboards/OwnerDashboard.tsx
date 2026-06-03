import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Settings,
  BarChart2,
  Package,
  ClipboardList,
  Wallet,
  PieChart,
} from 'lucide-react'
import { ownerTheme } from '../../theme/roles'
import { sumRevenueForWorkingMonth, workingMonthLabel } from '../../lib/workingMonth'
import { dataUnchanged } from '../../lib/stableData'

interface Order {
  grandTotal: number
  createdAt: string
}

const modules: {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  bg: string
  path?: string
}[] = [
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
    { label: "Today's Orders", value: String(todayOrders.length), icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: String(orders.length), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
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
      <section className="grid grid-cols-2 gap-2 w-full mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <article key={label} className={ownerTheme.statCard}>
            <div className={`${bg} inline-flex rounded-lg p-2 mb-2`}>
              <Icon size={20} className={color} aria-hidden />
            </div>
            <p className="text-base font-bold text-gray-900 leading-tight m-0">{value}</p>
            <p className="text-xs text-gray-600 mt-1 m-0 leading-snug">{label}</p>
          </article>
        ))}
      </section>

      <section>
        <h2 className={`text-base font-semibold ${ownerTheme.pageTitle} m-0 mb-3`}>Management Modules</h2>
        <div className="grid grid-cols-2 gap-2 w-full">
          {modules.map(({ label, icon: Icon, color, bg, path }) => (
            <button
              key={label}
              type="button"
              disabled={!path}
              onClick={() => path && navigate(path)}
              className={`${ownerTheme.moduleCard} flex flex-col items-center justify-center text-center gap-2 min-h-[7.5rem] disabled:opacity-60 ${path ? '' : 'opacity-70'}`}
            >
              <span className={`${bg} inline-flex rounded-lg p-2.5`}>
                <Icon size={22} className={color} aria-hidden />
              </span>
              <span className="text-xs font-semibold text-gray-800 leading-tight px-1">{label}</span>
              {path ? (
                <span className={`text-[10px] ${ownerTheme.openLink} font-bold uppercase`}>Open →</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>
    </DashboardShell>
  )
}
