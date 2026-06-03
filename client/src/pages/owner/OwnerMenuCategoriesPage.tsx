import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, LogOut, X } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { authFetch } from '../../lib/api'
import type { MenuCategory } from '../../types/menu'
import { ownerTheme } from '../../theme/roles'

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const card: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function OwnerMenuCategoriesPage() {
  const { user, logout } = useAuth()
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

  return (
    <div className={`min-h-screen ${ownerTheme.shellPage} flex flex-col`}>
      <header className={`${ownerTheme.header} shadow-lg sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard/owner')}
            className="flex items-center gap-2 text-amber-200 hover:text-white transition-colors"
            title="Back to owner portal"
          >
            <ArrowLeft size={22} />
            <span className="hidden sm:inline text-sm font-medium">Owner Portal</span>
          </button>
          <div className="flex items-center gap-2 text-white">
            <BrandLogo size="sm" />
            <span className="font-bold">Menu Categories</span>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="p-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
        <p className={`text-center ${ownerTheme.headerAccent} text-xs pb-2`}>{user?.name} — tap + to add a menu</p>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <p className="text-gray-500 text-sm mb-4">
          Open a category to add or edit items. Changes appear on employee screens right away.
        </p>

        {loading ? (
          <p className="text-center text-gray-400 py-16">Loading menu…</p>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {categories.map((category) => (
              <motion.button
                key={category.id}
                variants={card}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => navigate(`/dashboard/owner/menu/${category.id}`)}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 p-6 min-h-[140px]"
              >
                <span className="text-4xl">{category.emoji}</span>
                <span className="text-sm font-bold text-gray-800 text-center leading-tight">
                  {category.name}
                </span>
                <span className="text-xs text-gray-400">{category.items.length} items</span>
              </motion.button>
            ))}

            <motion.button
              variants={card}
              whileTap={{ scale: 0.95 }}
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
            </motion.button>
          </motion.div>
        )}
      </main>

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
    </div>
  )
}
