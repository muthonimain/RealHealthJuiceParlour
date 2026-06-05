import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Settings,
  BarChart2,
  Package,
  ClipboardList,
  Wallet,
  PieChart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { sumRevenueForWorkingMonth, workingMonthLabel } from '../../lib/workingMonth'
import { dataUnchanged } from '../../lib/stableData'

interface Order {
  grandTotal: number
  createdAt: string
}

type StatCard = {
  label: string
  value: string
  color: string
  bg: string
  icon?: LucideIcon
  kshIcon?: boolean
}

const modules: {
  label: string
  icon: LucideIcon
  color: string
  bg: string
  path?: string
}[] = [
  { label: 'Staff Records', icon: ClipboardList, color: '#b45309', bg: '#fef3c7', path: '/dashboard/owner/employee-records' },
  { label: 'Expenses', icon: Wallet, color: '#c2410c', bg: '#ffedd5', path: '/dashboard/owner/expenses' },
  { label: 'Net Profit', icon: PieChart, color: '#047857', bg: '#d1fae5', path: '/dashboard/owner/net-profit' },
  { label: 'Menu & Products', icon: Package, color: '#15803d', bg: '#dcfce7', path: '/dashboard/owner/menu' },
  { label: 'Sales Reports', icon: BarChart2, color: '#7e22ce', bg: '#f3e8ff', path: '/dashboard/owner/sales-reports' },
  { label: 'Staff Management', icon: Users, color: '#1d4ed8', bg: '#dbeafe', path: '/dashboard/owner/staff' },
  { label: 'System Settings', icon: Settings, color: '#374151', bg: '#f3f4f6' },
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

  const stats: StatCard[] = [
    {
      label: "Today's Revenue",
      value: `Ksh ${todayRevenue.toLocaleString()}`,
      kshIcon: true,
      color: '#d97706',
      bg: '#fffbeb',
    },
    { label: "Today's Orders", value: String(todayOrders.length), icon: ShoppingBag, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Total Orders', value: String(orders.length), icon: TrendingUp, color: '#9333ea', bg: '#faf5ff' },
    { label: `${monthLabel} revenue`, value: `Ksh ${monthRevenue.toLocaleString()}`, icon: Users, color: '#2563eb', bg: '#eff6ff' },
  ]

  return (
    <DashboardShell title="Therapist Portal" subtitle={`Welcome back, ${user?.name ?? 'Therapist'}`}>
      <ul className="rhjp-dash-stats">
        {stats.map(({ label, value, icon: Icon, kshIcon, color, bg }) => (
          <li key={label} className="rhjp-dash-stat">
            <span className="rhjp-dash-stat-icon" style={{ backgroundColor: bg, color }}>
              {kshIcon ? (
                <span className="text-[11px] font-extrabold leading-none tracking-tight" aria-hidden>
                  Ksh
                </span>
              ) : Icon ? (
                <Icon size={20} aria-hidden />
              ) : null}
            </span>
            <p className="rhjp-dash-stat-value">{value}</p>
            <p className="rhjp-dash-stat-label">{label}</p>
          </li>
        ))}
      </ul>

      <h2 className="rhjp-dash-modules-title">Management Modules</h2>
      <ul className="rhjp-dash-modules">
        {modules.map(({ label, icon: Icon, color, bg, path }) => (
          <li key={label}>
            <button
              type="button"
              disabled={!path}
              onClick={() => path && navigate(path)}
              className="rhjp-dash-module-btn"
            >
              <span className="rhjp-dash-module-icon" style={{ backgroundColor: bg, color }}>
                <Icon size={22} aria-hidden />
              </span>
              <span className="rhjp-dash-module-label">{label}</span>
              {path ? <span className="rhjp-dash-module-link">Open →</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </DashboardShell>
  )
}
