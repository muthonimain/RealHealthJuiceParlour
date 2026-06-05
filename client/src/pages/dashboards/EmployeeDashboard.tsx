import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, Wallet, ArrowLeft, AlertCircle, User } from 'lucide-react'
import BrandLogo, { HeaderLogo } from '../../components/BrandLogo'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import type { MenuCategory } from '../../types/menu'
import CartDrawer from '../../components/CartDrawer'
import { employeeTheme } from '../../theme/roles'

interface EmployeeInfo {
  id: string
  name: string
  username: string
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function EmployeeDashboard() {
  const { user, selectEmployee, logout } = useAuth()
  const { totalItems, totalPrice } = useCart()
  const navigate = useNavigate()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuData, setMenuData] = useState<MenuCategory[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeInfo[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectError, setSelectError] = useState('')
  const [isSelecting, setIsSelecting] = useState(false)

  const isEmployee = user?.role === 'employee'

  useEffect(() => {
    if (!isEmployee) {
      setMenuLoading(false)
      return
    }

    fetch('/api/menu/categories')
      .then((r) => r.json())
      .then(setMenuData)
      .catch(() => {})
      .finally(() => setMenuLoading(false))
  }, [isEmployee])

  useEffect(() => {
    if (isEmployee) {
      setEmployeesLoading(false)
      return
    }

    fetch('/api/employees')
      .then((r) => r.json())
      .then((data: EmployeeInfo[]) => setEmployees(data))
      .catch(() => setLoadError('Could not load employee list. Is the server running?'))
      .finally(() => setEmployeesLoading(false))
  }, [isEmployee])

  const handleSelectEmployee = async (emp: EmployeeInfo) => {
    setIsSelecting(true)
    setSelectError('')
    try {
      await selectEmployee(emp.id)
    } catch (err: unknown) {
      setSelectError(err instanceof Error ? err.message : 'Could not select employee. Try again.')
    } finally {
      setIsSelecting(false)
    }
  }

  const handleSwitchEmployee = () => {
    logout()
  }

  if (!isEmployee) {
    return (
      <div className={`min-h-screen ${employeeTheme.page} flex flex-col items-center justify-center px-6 py-10`}>
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className={`absolute top-6 left-6 flex items-center gap-2 transition-colors py-3 px-4 rounded-xl ${employeeTheme.back}`}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-2xl mx-auto mb-10 flex flex-col items-center"
        >
          <div className="w-full flex justify-center mb-5 px-2">
            <BrandLogo size="hero" className="drop-shadow-md" />
          </div>
          <p className={`${employeeTheme.subtitle} text-lg font-semibold tracking-wide`}>Employee dashboard</p>
          <p className={`${employeeTheme.hint} text-sm mt-2`}>Tap your name to continue</p>
        </motion.div>

        {loadError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {loadError}
          </div>
        )}

        {selectError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {selectError}
          </div>
        )}

        {employeesLoading ? (
          <p className={`${employeeTheme.hint} text-sm`}>Loading staff…</p>
        ) : employees.length === 0 ? (
          <p className={`${employeeTheme.hint} text-sm text-center`}>No employees set up yet. Ask the owner to add staff.</p>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-4 w-full max-w-2xl"
          >
            {employees.map((emp) => (
              <motion.button
                key={emp.id}
                type="button"
                variants={item}
                whileTap={{ scale: 0.95 }}
                disabled={isSelecting}
                onClick={() => handleSelectEmployee(emp)}
                className={`${employeeTheme.signInCard} p-6 flex flex-col items-center gap-3 min-h-[140px] transition-all disabled:opacity-60`}
              >
                <div className={`${employeeTheme.signInCardIconBg} rounded-2xl p-4`}>
                  <User size={36} className={employeeTheme.signInCardIcon} />
                </div>
                <span className={`${employeeTheme.signInCardName} font-bold text-base text-center leading-tight`}>
                  {emp.name}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}

        <p className={`mt-10 ${employeeTheme.footer} text-xs text-center`}>
          Real Health Juice Parlour &copy; {new Date().getFullYear()}
        </p>
      </div>
    )
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
              {user.name}
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
              onClick={handleSwitchEmployee}
              title="Switch employee"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
            >
              <LogOut size={16} />
              <span>Switch</span>
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

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} employeeName={user.name} />
    </div>
  )
}
