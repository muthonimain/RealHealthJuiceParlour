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
import { authFetch } from '../../lib/api'

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
    <motion.div
      variants={cardVariant}
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3"
    >
      <div className="font-bold text-gray-900 text-sm leading-tight">{item.name}</div>
      {item.note && <div className="text-xs text-gray-400 italic">{item.note}</div>}
      <div
        className={`font-bold text-lg shrink-0 ${
          hasDisplayPrice(price) ? 'text-teal-800' : 'text-gray-400'
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
          title="Add to Diner's Order"
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
  const [showAddItems, setShowAddItems] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [itemError, setItemError] = useState('')

  const loadCategory = useCallback(async () => {
    if (!categoryId) return
    try {
      const res = await fetch(`/api/menu/categories/${categoryId}`)
      if (!res.ok) throw new Error('not found')
      const data: MenuCategory = await res.json()
      setCategory({
        ...data,
        items: data.items.map((i) => ({ ...i, price: normalizePrice(i.price) })),
      })
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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !itemName.trim()) return
    const price = normalizePrice(itemPrice)
    if (price <= 0) {
      setItemError('Enter a price greater than 0.')
      return
    }
    setItemError('')
    setSavingItem(true)
    try {
      const res = await authFetch(`/api/menu/categories/${categoryId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          name: itemName.trim(),
          price,
          note: itemNote.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not add item')
      }
      setItemName('')
      setItemPrice('')
      setItemNote('')
      setShowAddItems(false)
      await loadCategory()
    } catch (err: unknown) {
      setItemError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setSavingItem(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${employeeTheme.shellPage} text-gray-400`}>
        Loading menu…
      </div>
    )
  }

  if (!category) return null

  return (
    <div className={`min-h-screen ${employeeTheme.shellPage} flex flex-col`}>
      <header className={`${employeeTheme.header} shadow-lg sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
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
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {category.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              categoryName={category.name}
            />
          ))}
        </motion.div>

        <div className="max-w-xl mx-auto w-full">
          {!showAddItems ? (
            <button
              type="button"
              onClick={() => {
                setShowAddItems(true)
                setItemError('')
              }}
              className={`w-full flex items-center justify-center gap-2 ${employeeTheme.cartBtn} text-white font-bold py-4 rounded-2xl shadow-sm`}
            >
              <Plus size={22} />
              Add Items
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddItem}
              className="bg-white rounded-2xl shadow-sm border-2 border-teal-200 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-teal-100 rounded-full p-2">
                    <Plus size={22} className="text-teal-700" />
                  </div>
                  <h2 className="font-bold text-gray-800">Add Items</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddItems(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              {itemError && (
                <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{itemError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Item name"
                  required
                  className="sm:col-span-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-400 outline-none"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="Price (Ksh)"
                  required
                  className="px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-400 outline-none"
                />
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-teal-400 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingItem}
                className={`mt-4 w-full ${employeeTheme.cartBtn} text-white font-bold py-3 rounded-xl disabled:opacity-60`}
              >
                {savingItem ? 'Adding…' : 'Save item'}
              </button>
            </motion.form>
          )}
        </div>
      </main>

      {/* Sticky Cart Bar */}
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
