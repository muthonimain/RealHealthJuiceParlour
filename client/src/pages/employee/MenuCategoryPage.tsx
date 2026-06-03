import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Plus, Minus, Pencil, Trash2, X, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import CartDrawer from '../../components/CartDrawer'
import type { MenuItem, MenuCategory } from '../../types/menu'
import { employeeTheme } from '../../theme/roles'
import { formatItemPrice, hasDisplayPrice, normalizePrice } from '../../lib/menuPrice'
import { authFetch } from '../../lib/api'
import { resolveCategorySections } from '../../lib/categorySectionPresets'
import { categoryUsesSections, getMenuSectionGroups } from '../../lib/menuSections'

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const cardVariant: Variants = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }

function ItemCard({
  item,
  categoryName,
  onEdit,
  onDelete,
}: {
  item: MenuItem
  categoryName: string
  onEdit: () => void
  onDelete: () => void
}) {
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
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 relative"
    >
      <div className="absolute top-2 right-2 flex gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          title="Edit item"
          className="p-2 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete item"
          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="font-bold text-gray-900 text-sm leading-tight pr-16">{item.name}</div>
      {item.note && <div className="text-xs text-gray-400 italic">{item.note}</div>}
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
  const [itemSection, setItemSection] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [itemError, setItemError] = useState('')

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editSection, setEditSection] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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
      if (sections?.[0]) setItemSection(sections[0])
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
          section: itemSection || undefined,
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

  const startEditItem = (item: MenuItem) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditPrice(hasDisplayPrice(item.price) ? String(normalizePrice(item.price)) : '')
    setEditNote(item.note ?? '')
    setEditSection(item.section ?? category?.sections?.[0] ?? '')
    setItemError('')
    setShowAddItems(false)
  }

  const cancelEditItem = () => {
    setEditingItemId(null)
    setItemError('')
  }

  const saveEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !editingItemId || !editName.trim()) return
    const price = normalizePrice(editPrice)
    if (editPrice.trim() !== '' && price <= 0) {
      setItemError('Enter a valid price greater than 0, or leave price empty for “on request” items.')
      return
    }
    setItemError('')
    setSavingEdit(true)
    try {
      const body: { name: string; note?: string; price?: number; section?: string } = {
        name: editName.trim(),
        note: editNote.trim() || undefined,
      }
      if (editPrice.trim() !== '') body.price = price
      else body.price = 0
      if (categoryUsesSections(category!)) body.section = editSection || undefined

      const res = await authFetch(
        `/api/menu/categories/${categoryId}/items/${editingItemId}`,
        { method: 'PATCH', body: JSON.stringify(body) }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not save changes')
      }
      setEditingItemId(null)
      await loadCategory()
    } catch (err: unknown) {
      setItemError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setSavingEdit(false)
    }
  }

  const removeCategory = async () => {
    if (!categoryId || !category) return
    const msg =
      category.items.length > 0
        ? `Delete "${category.name}" and all ${category.items.length} items? This cannot be undone.`
        : `Delete menu category "${category.name}"? This cannot be undone.`
    if (!confirm(msg)) return
    setItemError('')
    try {
      const res = await authFetch(`/api/menu/categories/${categoryId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not delete category')
      }
      navigate('/dashboard/employee')
    } catch (err: unknown) {
      setItemError(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  const removeItem = async (itemId: string) => {
    if (!categoryId || !confirm('Remove this item from the menu?')) return
    setItemError('')
    try {
      const res = await authFetch(`/api/menu/categories/${categoryId}/items/${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not remove item')
      }
      if (editingItemId === itemId) setEditingItemId(null)
      await loadCategory()
    } catch (err: unknown) {
      setItemError(err instanceof Error ? err.message : 'Failed to remove item')
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

  const sectionGroups = getMenuSectionGroups(category)
  const usesSections = categoryUsesSections(category)

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={removeCategory}
              title="Delete this menu category"
              className="p-2 rounded-xl text-red-200 hover:text-white hover:bg-red-600/30 transition-colors"
            >
              <Trash2 size={20} />
            </button>
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
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-8">
        {sectionGroups.length === 0 && !usesSections && category.items.length === 0 ? (
          <p className={`text-center ${employeeTheme.pageHint} py-8`}>No items yet. Add your first item below.</p>
        ) : sectionGroups.length === 0 ? null : (
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
                  {group.items.map((item) =>
                    editingItemId === item.id ? (
                      <motion.form
                        key={item.id}
                        variants={cardVariant}
                        initial="hidden"
                        animate="show"
                        onSubmit={saveEditItem}
                        className={`${employeeTheme.panel} p-4 flex flex-col gap-3 col-span-2 md:col-span-2 lg:col-span-2`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 text-sm">Edit item</h3>
                          <button
                            type="button"
                            onClick={cancelEditItem}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        {itemError && (
                          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{itemError}</p>
                        )}
                        {usesSections && category.sections && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600">Section</label>
                            <select
                              value={editSection}
                              onChange={(e) => setEditSection(e.target.value)}
                              className={`mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                            >
                              {category.sections.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Item name"
                          required
                          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="Price (Ksh) — leave empty if on request"
                          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                        />
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Note (optional)"
                          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className={`flex-1 flex items-center justify-center gap-1 ${employeeTheme.cartBtn} text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60`}
                          >
                            <Save size={16} />
                            {savingEdit ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.form>
                    ) : (
                      <ItemCard
                        key={item.id}
                        item={item}
                        categoryName={category.name}
                        onEdit={() => startEditItem(item)}
                        onDelete={() => removeItem(item.id)}
                      />
                    )
                  )}
                </motion.div>
              )}
            </section>
          ))
        )}

        {itemError && !showAddItems && !editingItemId && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 text-center max-w-xl mx-auto">
            {itemError}
          </p>
        )}

        <div className="max-w-xl mx-auto w-full">
          {!showAddItems && !editingItemId ? (
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
              className={`${employeeTheme.panel} p-5`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`${employeeTheme.addCategoryIconBg} rounded-full p-2`}>
                    <Plus size={22} className={employeeTheme.addCategoryIcon} />
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
                {usesSections && category.sections && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Section</label>
                    <select
                      value={itemSection}
                      onChange={(e) => setItemSection(e.target.value)}
                      className={`mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                      required
                    >
                      {category.sections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Item name"
                  required
                  className={`sm:col-span-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="Price (Ksh)"
                  required
                  className={`px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
                />
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="Note (optional)"
                  className={`px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 outline-none ${employeeTheme.signInInputFocus}`}
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
