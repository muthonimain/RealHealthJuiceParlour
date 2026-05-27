import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, Leaf, Droplets } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { menuData } from '../../data/menu'
import CartDrawer from '../../components/CartDrawer'

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function EmployeeDashboard() {
  const { user, logout } = useAuth()
  const { totalItems, totalPrice } = useCart()
  const navigate = useNavigate()
  const [cartOpen, setCartOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Nav */}
      <header className="bg-sky-900 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Leaf size={20} className="text-green-300" />
              <Droplets size={16} className="text-emerald-300" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">Real Health Juice Parlour</div>
              <div className="text-sky-300 text-xs font-semibold uppercase tracking-widest">
                {user?.name} &mdash; Employee
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Diner's Order</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Menu Categories</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {menuData.map((category) => (
            <motion.button
              key={category.id}
              variants={item}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/dashboard/employee/menu/${category.id}`)}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md active:shadow-sm transition-all flex flex-col items-center justify-center gap-3 p-6 min-h-[140px] cursor-pointer"
            >
              <span className="text-4xl">{category.emoji}</span>
              <span className="text-sm font-bold text-gray-800 text-center leading-tight">
                {category.name}
              </span>
              <span className="text-xs text-gray-400">{category.items.length} items</span>
            </motion.button>
          ))}
        </motion.div>
      </main>

      {/* Sticky Cart Bar (when items in cart) */}
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="sticky bottom-0 bg-sky-700 border-t border-sky-600 px-4 py-3 z-20"
        >
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between text-white"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl px-3 py-1 text-sm font-bold">
                {totalItems} items
              </div>
              <span className="font-semibold text-sm">View Current Order</span>
            </div>
            <span className="font-bold text-lg">Ksh {totalPrice.toLocaleString()}</span>
          </button>
        </motion.div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} employeeName={user?.name} />
    </div>
  )
}
