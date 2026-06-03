import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { authFetch } from '../../lib/api'
import type { MenuCategory, MenuItem } from '../../types/menu'
import { ownerTheme } from '../../theme/roles'
import { formatItemPrice, hasDisplayPrice, normalizePrice } from '../../lib/menuPrice'

export default function OwnerMenuCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<MenuCategory | null>(null)
  const [loading, setLoading] = useState(true)

  const [editingName, setEditingName] = useState(false)
  const [categoryName, setCategoryName] = useState('')

  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemNote, setItemNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editNote, setEditNote] = useState('')

  const load = useCallback(async () => {
    if (!categoryId) return
    try {
      const res = await fetch(`/api/menu/categories/${categoryId}`)
      if (res.ok) {
        const data: MenuCategory = await res.json()
        const normalized = {
          ...data,
          items: data.items.map((i) => ({ ...i, price: normalizePrice(i.price) })),
        }
        setCategory(normalized)
        setCategoryName(normalized.name)
      } else {
        navigate('/dashboard/owner/menu')
      }
    } finally {
      setLoading(false)
    }
  }, [categoryId, navigate])

  useEffect(() => {
    load()
  }, [load])

  const saveCategoryName = async () => {
    if (!categoryId || !categoryName.trim()) return
    const res = await authFetch(`/api/menu/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: categoryName.trim() }),
    })
    if (res.ok) {
      setEditingName(false)
      load()
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !itemName.trim()) return
    const price = normalizePrice(itemPrice)
    if (price <= 0) {
      setFormError('Enter a price greater than 0 (use “On request” only for add-ons with no fixed price).')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const res = await authFetch(`/api/menu/categories/${categoryId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          name: itemName.trim(),
          price,
          note: itemNote.trim() || undefined,
        }),
      })
      if (res.ok) {
        setItemName('')
        setItemPrice('')
        setItemNote('')
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  const startEditItem = (item: MenuItem) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditPrice(String(normalizePrice(item.price) || ''))
    setEditNote(item.note ?? '')
  }

  const saveEditItem = async () => {
    if (!categoryId || !editingItemId) return
    const price = normalizePrice(editPrice)
    if (editPrice.trim() !== '' && price <= 0) {
      setFormError('Enter a valid price greater than 0.')
      return
    }
    setFormError('')
    const body: { name: string; note?: string; price?: number } = {
      name: editName.trim(),
      note: editNote.trim() || undefined,
    }
    if (editPrice.trim() !== '') body.price = price
    const res = await authFetch(`/api/menu/categories/${categoryId}/items/${editingItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setEditingItemId(null)
      load()
    }
  }

  const removeItem = async (itemId: string) => {
    if (!categoryId || !confirm('Remove this item from the menu?')) return
    await authFetch(`/api/menu/categories/${categoryId}/items/${itemId}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${ownerTheme.shellPage} text-gray-400`}>
        Loading…
      </div>
    )
  }

  if (!category) return null

  return (
    <div className={`min-h-screen ${ownerTheme.shellPage} flex flex-col`}>
      <header className={`${ownerTheme.header} shadow-lg sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/owner/menu')}
            className={`${ownerTheme.headerAccent} hover:text-white p-2 rounded-xl hover:bg-white/10`}
            title="Back to categories"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm font-bold"
                />
                <button
                  type="button"
                  onClick={saveCategoryName}
                  className="p-2 bg-green-600 rounded-lg text-white"
                  title="Save title"
                >
                  <Save size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false)
                    setCategoryName(category.name)
                  }}
                  className="p-2 bg-white/20 rounded-lg text-white"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.emoji}</span>
                <h1 className="text-white font-bold text-lg truncate">{category.name}</h1>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="p-1.5 text-amber-200 hover:text-white"
                  title="Edit category title"
                >
                  <Pencil size={18} />
                </button>
              </div>
            )}
            <p className={`${ownerTheme.headerAccent} text-xs`}>{category.items.length} items</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="space-y-3">
          {category.items.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No items yet. Add your first item below.</p>
          ) : (
            category.items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
                {editingItemId === item.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900"
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900"
                      placeholder="Price (Ksh)"
                    />
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900"
                      placeholder="Note (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEditItem}
                        className="flex-1 bg-amber-700 text-white font-semibold py-2 rounded-xl"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="px-4 py-2 text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900">{item.name}</div>
                      {item.note && <div className="text-xs text-gray-400 italic mt-0.5">{item.note}</div>}
                      <div
                        className={`font-semibold mt-1 text-lg ${
                          hasDisplayPrice(item.price) ? 'text-red-800' : 'text-gray-400'
                        }`}
                      >
                        {formatItemPrice(item.price)}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditItem(item)}
                        className="p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                        title="Edit item"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddItem}
          className="bg-white rounded-2xl shadow-sm border-2 border-amber-200 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 rounded-full p-2">
              <Plus size={22} className="text-amber-700" />
            </div>
            <h2 className="font-bold text-gray-800">Add item to this menu</h2>
          </div>
          {formError && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{formError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item name"
              required
              className="sm:col-span-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <input
              type="number"
              min="1"
              step="1"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="Price (Ksh) *"
              required
              className="px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <input
              type="text"
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="Note (optional)"
              className="px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add item'}
          </button>
        </motion.form>
      </main>
    </div>
  )
}
