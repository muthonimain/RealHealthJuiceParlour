import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import OwnerPageShell from '../../components/OwnerPageShell'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../lib/api'
import type { MenuCategory } from '../../types/menu'
import { ownerTheme } from '../../theme/roles'

export default function OwnerMenuCategoriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/menu/categories')
      if (res.ok) setCategories(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await authFetch('/api/menu/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newTitle.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not create category')
      }
      const created: MenuCategory = await res.json()
      setShowAdd(false)
      setNewTitle('')
      navigate(`/dashboard/owner/menu/${created.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (cat: MenuCategory) => {
    const msg =
      cat.items.length > 0
        ? `Delete "${cat.name}" and all ${cat.items.length} items? This cannot be undone.`
        : `Delete menu category "${cat.name}"? This cannot be undone.`
    if (!confirm(msg)) return
    setError('')
    try {
      const res = await authFetch(`/api/menu/categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Could not delete category')
      }
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    }
  }

  return (
    <OwnerPageShell
      title="Menu Categories"
      subtitle="Owner portal"
      onBack={() => navigate('/dashboard/owner')}
      backTitle="Back to owner portal"
      headerNote={
        <p className={`text-center ${ownerTheme.headerAccent} text-xs pb-2 px-3`}>
          {user?.name} — tap + to add a menu
        </p>
      }
    >
        <p className="text-gray-500 text-sm mb-4">
          Open a category to add or edit items. Use the trash icon to delete a category or its items inside.
        </p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading menu…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative bg-white rounded-2xl shadow-sm hover:shadow-md min-h-[130px] sm:min-h-[140px]"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/owner/menu/${category.id}`)}
                  className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl"
                >
                  <span className="text-4xl">{category.emoji}</span>
                  <span className="text-sm font-bold text-gray-800 text-center leading-tight">
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-400">{category.items.length} items</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category)}
                  title={`Delete ${category.name}`}
                  className="absolute top-2 right-2 p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setShowAdd(true)
                setError('')
              }}
              className="bg-white rounded-2xl border-2 border-dashed border-amber-400 hover:border-amber-600 hover:bg-amber-50 transition-all flex flex-col items-center justify-center gap-2 p-6 min-h-[140px]"
              title="Add new menu category"
            >
              <div className="bg-amber-100 rounded-full p-4">
                <Plus size={32} className="text-amber-700" />
              </div>
              <span className="text-sm font-bold text-amber-800">New Menu</span>
            </button>
          </div>
        )}

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">New menu category</h2>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700">Category title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Seasonal Specials"
                    autoFocus
                    className="mt-1 w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-amber-400 outline-none text-gray-900"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-4 rounded-xl disabled:opacity-60"
                >
                  {saving ? 'Creating…' : 'Create & add items'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </OwnerPageShell>
  )
}
