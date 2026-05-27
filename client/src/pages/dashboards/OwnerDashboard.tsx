import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { TrendingUp, Users, ShoppingBag, DollarSign, Settings, BarChart2, FileText, Package, ClipboardList } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

interface Order { grandTotal: number; createdAt: string }

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const modules: { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; path?: string }[] = [
  { label: 'Employee Records', icon: ClipboardList, color: 'text-amber-700', bg: 'bg-amber-100', path: '/dashboard/owner/employee-records' },
  { label: 'Sales Reports', icon: BarChart2, color: 'text-purple-700', bg: 'bg-purple-100' },
  { label: 'Staff Management', icon: Users, color: 'text-blue-700', bg: 'bg-blue-100' },
  { label: 'Menu & Products', icon: Package, color: 'text-green-700', bg: 'bg-green-100' },
  { label: 'Financial Summary', icon: FileText, color: 'text-rose-700', bg: 'bg-rose-100' },
  { label: 'System Settings', icon: Settings, color: 'text-gray-700', bg: 'bg-gray-100' },
]

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json()).then(setOrders).catch(() => {})
    const id = setInterval(() => {
      fetch('/api/orders').then((r) => r.json()).then(setOrders).catch(() => {})
    }, 10000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toDateString()
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + o.grandTotal, 0)

  const stats = [
    { label: "Today's Revenue", value: `Ksh ${todayRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "Today's Orders", value: todayOrders.length.toString(), icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: orders.length.toString(), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'All-time Revenue', value: `Ksh ${orders.reduce((s, o) => s + o.grandTotal, 0).toLocaleString()}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <DashboardShell
      title="Owner Portal"
      subtitle={`Welcome back, ${user?.name ?? 'Owner'}`}
      accentClass="text-amber-300"
      headerBg="bg-amber-900"
    >
      {/* Live Stats */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} variants={item} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className={`${bg} rounded-xl p-3 w-fit mb-3`}>
              <Icon size={24} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Modules */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Management Modules</h2>
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {modules.map(({ label, icon: Icon, color, bg, path }) => (
          <motion.button
            key={label}
            variants={item}
            whileTap={{ scale: 0.96 }}
            onClick={() => path && navigate(path)}
            className={`bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-all min-h-[130px] ${path ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
          >
            <div className={`${bg} rounded-xl p-4`}>
              <Icon size={28} className={color} />
            </div>
            <span className="text-sm font-semibold text-gray-700 text-center">{label}</span>
            {path && <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Open →</span>}
          </motion.button>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
