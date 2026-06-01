import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Leaf,
  Droplets,
  LogOut,
  Plus,
  Trash2,
  Package,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

interface InventoryEntry {
  id: string
  dateKey: string
  description: string
  moneyIn: number
  moneyOut: number
  notes?: string
  createdAt: string
}

interface InventoryTotals {
  moneyIn: number
  moneyOut: number
  balance: number
  count: number
}

function formatKsh(n: number) {
  return `Ksh ${n.toLocaleString('en-KE')}`
}

function balance(entry: Pick<InventoryEntry, 'moneyIn' | 'moneyOut'>) {
  return entry.moneyIn - entry.moneyOut
}

export default function FaithInventoryPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<InventoryEntry[]>([])
  const [totals, setTotals] = useState<InventoryTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [description, setDescription] = useState('')
  const [moneyIn, setMoneyIn] = useState('')
  const [moneyOut, setMoneyOut] = useState('')
  const [notes, setNotes] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) return
      const data = await res.json()
      setEntries(data.entries ?? [])
      setTotals(data.totals ?? null)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [fetchData])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          moneyIn: parseFloat(moneyIn) || 0,
          moneyOut: parseFloat(moneyOut) || 0,
          notes: notes.trim() || undefined,
        }),
      })
      if (res.ok) {
        setDescription('')
        setMoneyIn('')
        setMoneyOut('')
        setNotes('')
        await fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this inventory entry?')) return
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    fetchData()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-100">
      <header className="bg-amber-900 text-white px-4 py-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/owner')}
            className="flex items-center gap-2 text-amber-200 hover:text-white transition-colors"
            title="Back to owner dashboard"
          >
            <ArrowLeft size={22} />
            <span className="hidden sm:inline text-sm font-medium">Owner Portal</span>
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="text-green-300" size={22} />
            <Droplets className="text-amber-300" size={18} />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Faith Inventory</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchData()}
              className="p-2 rounded-lg bg-amber-800 hover:bg-amber-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="p-2 rounded-lg bg-amber-800 hover:bg-amber-700 transition-colors"
              title="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        <p className="text-center text-amber-200 text-xs mt-1">
          {user?.name} · Last updated {lastRefresh.toLocaleTimeString('en-KE')}
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {totals && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
              <div className="text-sm text-gray-500">Total Money In</div>
              <div className="text-2xl font-bold text-green-700">{formatKsh(totals.moneyIn)}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100">
              <div className="text-sm text-gray-500">Total Money Out</div>
              <div className="text-2xl font-bold text-rose-700">{formatKsh(totals.moneyOut)}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200">
              <div className="text-sm text-gray-500">Total Balance</div>
              <div
                className={`text-2xl font-bold ${
                  totals.balance >= 0 ? 'text-amber-800' : 'text-red-600'
                }`}
              >
                {formatKsh(totals.balance)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Money in − money out</div>
            </div>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
          className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-amber-700" size={22} />
            <h2 className="font-semibold text-gray-800">Add entry</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Description (e.g. oranges, cups)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sm:col-span-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Money in (Ksh)"
              value={moneyIn}
              onChange={(e) => setMoneyIn(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-green-400 outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Money out (Ksh)"
              value={moneyOut}
              onChange={(e) => setMoneyOut(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-rose-400 outline-none"
            />
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              <Plus size={20} />
              {saving ? 'Saving…' : 'Add row'}
            </button>
          </div>
        </motion.form>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-900 text-white text-left">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Money In</th>
                  <th className="px-4 py-3 font-semibold text-right">Money Out</th>
                  <th className="px-4 py-3 font-semibold text-right">Balance</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      Loading inventory…
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No entries yet. Add your first row above.
                    </td>
                  </tr>
                ) : (
                  entries.map((row) => {
                    const rowBalance = balance(row)
                    return (
                      <tr key={row.id} className="border-t border-gray-100 hover:bg-amber-50/50">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.dateKey}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.description}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-medium">
                          {formatKsh(row.moneyIn)}
                        </td>
                        <td className="px-4 py-3 text-right text-rose-700 font-medium">
                          {formatKsh(row.moneyOut)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            rowBalance >= 0 ? 'text-amber-800' : 'text-red-600'
                          }`}
                        >
                          {formatKsh(rowBalance)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                          {row.notes || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete entry"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
