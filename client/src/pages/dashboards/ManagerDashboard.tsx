import DashboardShell from '../../components/DashboardShell'
import { ShoppingBag, Users, Package, ClipboardList, RefreshCw, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

const stats = [
  { label: "Today's Orders", value: '0', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Staff On Shift', value: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Menu Items', value: '0', icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Low Stock Alerts', value: '0', icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' },
]

const modules = [
  { label: 'View Orders', icon: ClipboardList, color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { label: 'Manage Menu', icon: Tag, color: 'text-amber-700', bg: 'bg-amber-100' },
  { label: 'Staff Roster', icon: Users, color: 'text-blue-700', bg: 'bg-blue-100' },
  { label: 'Inventory', icon: Package, color: 'text-rose-700', bg: 'bg-rose-100' },
  { label: 'Shift Management', icon: RefreshCw, color: 'text-purple-700', bg: 'bg-purple-100' },
  { label: 'Order History', icon: ShoppingBag, color: 'text-gray-700', bg: 'bg-gray-100' },
]

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function ManagerDashboard() {
  return (
    <DashboardShell
      title="Manager Portal"
      subtitle="Welcome back, Manager"
      accentClass="text-emerald-300"
      headerBg="bg-emerald-900"
    >
      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
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
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {modules.map(({ label, icon: Icon, color, bg }) => (
          <motion.button
            key={label}
            variants={item}
            whileTap={{ scale: 0.96 }}
            className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-all cursor-pointer min-h-[130px]"
          >
            <div className={`${bg} rounded-xl p-4`}>
              <Icon size={28} className={color} />
            </div>
            <span className="text-sm font-semibold text-gray-700 text-center">{label}</span>
          </motion.button>
        ))}
      </motion.div>

      <p className="text-center text-gray-400 text-xs mt-10">
        More features coming soon — continue specifying your requirements.
      </p>
    </DashboardShell>
  )
}
