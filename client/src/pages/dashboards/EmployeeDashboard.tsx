import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, Wallet } from 'lucide-react'
import { HeaderLogo } from '../../components/BrandLogo'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import type { MenuCategory } from '../../types/menu'
import CartDrawer from '../../components/CartDrawer'
import { employeeTheme } from '../../theme/roles'

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function EmployeeDashboard() {
  const { user, logout } = useAuth()
  const { totalItems, totalPrice } = useCart()
  const navigate = useNavigate()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuData, setMenuData] = useState<MenuCategory[]>([])
  const [menuLoading, setMenuLoading] = useState(true)

  useEffect(() => {
    fetch('/api/menu/categories')
      .then((r) => r.json())
      .then(setMenuData)
      .catch(() => {})
      .finally(() => setMenuLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-sky-50">
      <header className="w-full bg-sky-800 text-white border-b border-sky-900">
        <div className="flex items-center gap-2 max-w-7xl mx-auto p-3 min-w-0 w-full box-border">
          <HeaderLogo className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm leading-tight m-0 truncate">
              Real Health Juice Parlour
            </p>
            <p className={`${employeeTheme.headerAccent} text-xs font-semibold m-0 mt-0.5 truncate`}>
              {user?.name ?? 'Staff'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={`relative flex items-center gap-2 ${employeeTheme.cartBtn} text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all`}
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Print Order</span>
              {totalItems > 0 ? (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-3 py-4 pb-8 box-border">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className={`text-xl font-bold ${employeeTheme.pageTitle}`}>Menu Categories</h1>
            <p className={`${employeeTheme.pageHint} text-sm mt-0.5`}>
              {new Date().toLocaleDateString('en-KE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/employee/expenses')}
            className={`flex items-center justify-center gap-2 ${employeeTheme.cartBtn} text-white font-semibold rounded-xl px-4 py-2.5 text-sm shadow-sm`}
          >
            <Wallet size={18} />
            Expenses
          </button>
        </div>

        {menuLoading ? (
          <p className={`text-center ${employeeTheme.pageHint} py-12`}>Loading menu…</p>
        ) : menuData.length === 0 ? (
          <p className={`text-center ${employeeTheme.pageHint} py-12`}>No menu categories yet. Ask the owner to set up the menu.</p>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {menuData.map((category) => (
              <motion.button
                key={category.id}
                type="button"
                variants={item}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/dashboard/employee/menu/${category.id}`)}
                className={`rounded-2xl min-h-[140px] flex flex-col items-center justify-center gap-3 p-6 ${employeeTheme.categoryCard}`}
              >
                <span className="text-4xl">{category.emoji}</span>
                <span className={`text-sm font-bold text-center leading-tight ${employeeTheme.categoryName}`}>
                  {category.name}
                </span>
                <span className={`text-xs ${employeeTheme.categoryMeta}`}>
                  {category.items.length} items
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </main>

      {totalItems > 0 ? (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className={`sticky bottom-0 ${employeeTheme.cartBar} border-t px-4 py-3 z-20`}
        >
          <button
            type="button"
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
      ) : null}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} employeeName={user?.name} />
    </div>
  )
}
