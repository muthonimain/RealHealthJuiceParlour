import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import CartDrawer from '../../components/CartDrawer'
import type { MenuItem, MenuCategory } from '../../types/menu'
import { employeeTheme } from '../../theme/roles'
import { formatItemPrice, hasDisplayPrice, normalizePrice } from '../../lib/menuPrice'
import { resolveCategorySections } from '../../lib/categorySectionPresets'
import { getMenuSectionGroups } from '../../lib/menuSections'

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const cardVariant: Variants = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }

function ItemCard({ item, categoryName }: { item: MenuItem; categoryName: string }) {
  const { addItem, increment, decrement, getQuantity } = useCart()
  const qty = getQuantity(item.id)

  const handleIncrement = () => {
    if (qty === 0) addItem(item, categoryName)
    else increment(item.id)
  }

  const price = normalizePrice(item.price)

  return (
    <motion.div variants={cardVariant} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="font-bold text-gray-900 text-sm leading-tight">{item.name}</div>
      {item.note ? <div className="text-xs text-gray-400 italic">{item.note}</div> : null}
      <div
        className={`font-bold text-lg shrink-0 ${
          hasDisplayPrice(price) ? 'text-sky-800' : 'text-gray-400'
        }`}
      >
        {formatItemPrice(price)}
      </div>

      <div className="flex items-center justify-between gap-2 mt-auto shrink-0">
        <button
          type="button"
          onClick={() => qty > 0 && decrement(item.id)}
          disabled={qty === 0}
          title="Remove one from order"
          className={`flex-1 rounded-xl py-3 flex items-center justify-center transition-all min-h-[48px] ${
            qty === 0 ? employeeTheme.orderStepperBtnDisabled : employeeTheme.orderStepperBtn
          }`}
        >
          <Minus size={22} strokeWidth={2.5} className="text-current" />
        </button>
        <span
          className={`min-w-[2.5rem] text-center text-xl font-bold tabular-nums ${
            qty > 0 ? employeeTheme.orderStepperQty : employeeTheme.orderStepperQtyEmpty
          }`}
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          title="Add to order"
          className={`flex-1 rounded-xl py-3 flex items-center justify-center transition-all min-h-[48px] ${employeeTheme.orderStepperBtn}`}
        >
          <Plus size={22} strokeWidth={2.5} className="text-current" />
        </button>
      </div>
    </motion.div>
  )
}

export default function MenuCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { totalItems, totalPrice } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const { user } = useAuth()

  const [category, setCategory] = useState<MenuCategory | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCategory = useCallback(async () => {
    if (!categoryId) return
    try {
      const res = await fetch(`/api/menu/categories/${categoryId}`)
      if (!res.ok) throw new Error('not found')
      const data: MenuCategory = await res.json()
      const normalized: MenuCategory = {
        ...data,
        items: data.items.map((i) => ({ ...i, price: normalizePrice(i.price) })),
      }
      const sections = resolveCategorySections(
        normalized.id,
        normalized.name,
        normalized.sections
      )
      setCategory({ ...normalized, sections: sections ?? normalized.sections })
    } catch {
      navigate('/dashboard/employee')
    } finally {
      setLoading(false)
    }
  }, [categoryId, navigate])

  useEffect(() => {
    setLoading(true)
    loadCategory()
  }, [loadCategory])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${employeeTheme.shellPage} text-gray-400`}>
        Loading menu…
      </div>
    )
  }

  if (!category) return null

  const sectionGroups = getMenuSectionGroups(category)

  return (
    <div className={`min-h-screen ${employeeTheme.shellPage} flex flex-col`}>
      <header className={`${employeeTheme.header} shadow-lg sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/employee')}
              title="Back to menu categories"
              className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="text-white font-bold text-base flex items-center gap-2">
                <span>{category.emoji}</span>
                {category.name}
              </div>
              <div className={`${employeeTheme.headerAccent} text-xs`}>{category.items.length} items</div>
            </div>
          </div>

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
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-8">
        {sectionGroups.length === 0 && category.items.length === 0 ? (
          <p className={`text-center ${employeeTheme.pageHint} py-8`}>No items in this category yet.</p>
        ) : (
          sectionGroups.map((group) => (
            <section key={group.title || 'all'} className="space-y-4">
              {group.title ? (
                <h2
                  className={`text-lg font-bold ${employeeTheme.pageTitle} border-b-2 border-sky-300/80 pb-2 flex items-center gap-2`}
                >
                  <span className="text-sky-500">▸</span>
                  {group.title}
                </h2>
              ) : null}
              {group.items.length === 0 && group.title ? (
                <p className={`text-sm ${employeeTheme.pageHint} text-center py-6`}>
                  No items in {group.title} yet.
                </p>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {group.items.map((item) => (
                    <ItemCard key={item.id} item={item} categoryName={category.name} />
                  ))}
                </motion.div>
              )}
            </section>
          ))
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
