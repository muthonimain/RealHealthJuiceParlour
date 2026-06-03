import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, Plus, X, Wallet } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { authFetch } from '../../lib/api'
import BrandLogo from '../../components/BrandLogo'
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
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  const loadMenu = () => {
    fetch('/api/menu/categories')
      .then((r) => r.json())
      .then(setMenuData)
      .catch(() => {})
      .finally(() => setMenuLoading(false))
  }

  useEffect(() => {
    loadMenu()
  }, [])

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryTitle.trim()) return
    setSavingCategory(true)
    setCategoryError('')
    try {
      const res = await authFetch('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryTitle.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not create category')
      }
      const created: MenuCategory = await res.json()
      setShowAddCategory(false)
      setNewCategoryTitle('')
      navigate(`/dashboard/employee/menu/${created.id}`)
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={`min-h-screen ${employeeTheme.shellPage} flex flex-col`}>
      <header className={`${employeeTheme.header} shadow-lg sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <div className="text-white font-bold text-base leading-tight">Real Health Juice Parlour</div>
              <div className={`${employeeTheme.headerAccent} text-xs font-semibold tracking-wide`}>
                {user?.name ?? 'Staff'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className={`relative flex items-center gap-2 ${employeeTheme.cartBtn} text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all`}
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
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className={`text-xl font-bold ${employeeTheme.pageTitle}`}>Menu Categories</h1>
            <p className={`${employeeTheme.pageHint} text-sm mt-0.5`}>
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
              variants={item}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/dashboard/employee/menu/${category.id}`)}
              className={`rounded-2xl transition-all flex flex-col items-center justify-center gap-3 p-6 min-h-[140px] cursor-pointer ${employeeTheme.categoryCard}`}
            >
              <span className="text-4xl">{category.emoji}</span>
              <span className={`text-sm font-bold text-center leading-tight ${employeeTheme.categoryName}`}>
                {category.name}
              </span>
              <span className={`text-xs ${employeeTheme.categoryMeta}`}>{category.items.length} items</span>
            </motion.button>
          ))}

          <motion.button
            type="button"
            variants={item}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowAddCategory(true)
              setCategoryError('')
            }}
            className={`rounded-2xl transition-all flex flex-col items-center justify-center gap-2 p-6 min-h-[140px] ${employeeTheme.addCategoryCard}`}
            title="Add Menu Category"
          >
            <div className={`${employeeTheme.addCategoryIconBg} rounded-full p-4`}>
              <Plus size={32} className={employeeTheme.addCategoryIcon} />
            </div>
            <span className={`text-sm font-bold text-center ${employeeTheme.addCategoryLabel}`}>Add Menu Category</span>
          </motion.button>
        </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showAddCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddCategory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Add Menu Category</h2>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                {categoryError && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{categoryError}</p>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700">Category title</label>
                  <input
                    type="text"
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    placeholder="e.g. Seasonal Specials"
                    autoFocus
                    className={`mt-1 w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className={`${employeeTheme.cartBtn} w-full text-white font-bold py-4 rounded-xl disabled:opacity-60`}
                >
                  {savingCategory ? 'Creating…' : 'Create & add items'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Cart Bar (when items in cart) */}
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className={`sticky bottom-0 ${employeeTheme.cartBar} border-t px-4 py-3 z-20`}
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
