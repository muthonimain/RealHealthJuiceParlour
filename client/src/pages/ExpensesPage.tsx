import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Plus, Receipt, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authFetch, readApiJson } from '../lib/api'
import { HeaderLogo } from '../components/BrandLogo'
import OwnerPageShell from '../components/OwnerPageShell'
import RecordsDatePicker from '../components/RecordsDatePicker'
import { dayLabelFromKey, isTodayDateKey, todayDateKey } from '../lib/dateKey'
import { ownerTheme, employeeTheme } from '../theme/roles'
import type { Expense } from '../types/expense'

function formatDateKey(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00`)
  return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
}

export default function ExpensesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isOwner = user?.role === 'owner'
  const theme = isOwner ? ownerTheme : employeeTheme

  const dashboardPath = isOwner ? '/dashboard/owner' : '/dashboard/employee'

  const [viewDate, setViewDate] = useState(() => todayDateKey())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [moneyOut, setMoneyOut] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const expensesUrl = useCallback(
    (path = '') =>
      `/api/expenses${path}?date=${encodeURIComponent(viewDate)}`,
    [viewDate]
  )

  const applyExpensePayload = (data: { items?: Expense[]; total?: number }) => {
    setExpenses(data.items ?? [])
    setTotal(data.total ?? 0)
  }

  const loadExpenses = useCallback(async () => {
    try {
      const res = await authFetch(expensesUrl())
      const data = await readApiJson<{ items?: Expense[]; total?: number; message?: string }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load expenses')
      }
      applyExpensePayload(data)
      setError('')
    } catch (err: unknown) {
      setExpenses([])
      setTotal(0)
      setError(err instanceof Error ? err.message : 'Could not load expense records.')
    } finally {
      setLoading(false)
    }
  }, [expensesUrl])

  useEffect(() => {
    setLoading(true)
    void loadExpenses()
  }, [loadExpenses])

  useEffect(() => {
    if (!isTodayDateKey(viewDate)) return
    const interval = setInterval(() => {
      const today = todayDateKey()
      if (viewDate !== today) {
        setViewDate(today)
        return
      }
      void loadExpenses()
    }, 15000)
    return () => clearInterval(interval)
  }, [loadExpenses, viewDate])

  const startEdit = (exp: Expense) => {
    setEditingId(exp.id)
    setEditDate(exp.dateKey)
    setEditDescription(exp.description)
    setEditAmount(String(exp.amount))
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setError('')
    const parsed = Number(editAmount)
    if (!editDate) {
      setError('Select a date.')
      return
    }
    if (!editDescription.trim()) {
      setError('Enter a description.')
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter money out greater than 0.')
      return
    }

    setActionBusy(true)
    try {
      const res = await authFetch(expensesUrl(`/${editingId}`), {
        method: 'PATCH',
        body: JSON.stringify({
          date: editDate,
          description: editDescription.trim(),
          amount: parsed,
        }),
      })
      const data = await readApiJson<{ message?: string; items?: Expense[]; total?: number }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not update expense')
      }
      applyExpensePayload(data)
      cancelEdit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update expense')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record? This cannot be undone.')) return
    setError('')
    setActionBusy(true)
    try {
      const res = await authFetch(expensesUrl(`/${id}`), { method: 'DELETE' })
      const data = await readApiJson<{ message?: string; items?: Expense[]; total?: number }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not delete expense')
      }
      if (editingId === id) cancelEdit()
      applyExpensePayload(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
    } finally {
      setActionBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const parsed = Number(moneyOut)
    if (!description.trim()) {
      setError('Enter a description.')
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter money out greater than 0.')
      return
    }

    setSaving(true)
    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          date: viewDate,
          description: description.trim(),
          amount: parsed,
        }),
      })
      const data = await readApiJson<{
        message?: string
        expense?: Expense
        items?: Expense[]
        total?: number
        dateKey?: string
      }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not save expense')
      }
      setDescription('')
      setMoneyOut('')
      if (data.dateKey && data.dateKey !== viewDate) {
        setViewDate(data.dateKey)
      } else {
        applyExpensePayload(data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const btnClass = isOwner ? 'bg-amber-600 hover:bg-amber-700' : employeeTheme.cartBtn
  const ringClass = isOwner ? 'focus:ring-amber-400' : employeeTheme.signInInputFocus
  const tableHead = isOwner ? 'bg-amber-50 text-amber-800' : employeeTheme.tableHead
  const viewingToday = isTodayDateKey(viewDate)
  const dayLabel = viewingToday ? 'today' : dayLabelFromKey(viewDate)

  const editFormFields = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          required
          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 ${ringClass} outline-none`}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <input
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          required
          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 ${ringClass} outline-none`}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Money out (Ksh)</label>
        <input
          type="number"
          min="1"
          step="1"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          required
          className={`w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 ${ringClass} outline-none`}
        />
      </div>
    </div>
  )

  const actionButtons = (exp: Expense) => (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => startEdit(exp)}
        disabled={actionBusy}
        title="Edit expense"
        className={`p-2 rounded-lg transition-colors ${isOwner ? 'text-amber-700 hover:bg-amber-50' : 'text-teal-700 hover:bg-teal-50'} disabled:opacity-50`}
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(exp.id)}
        disabled={actionBusy}
        title="Delete expense"
        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )

  const pageBody = (
    <>
      <RecordsDatePicker value={viewDate} onChange={setViewDate} className="mb-6" />

      <p className="text-sm text-gray-500 mb-4">{dayLabelFromKey(viewDate)} — daily expenses</p>

      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
        <div className="text-sm text-gray-500 font-medium">
          Total money out {viewingToday ? 'today' : `on ${formatDateKey(viewDate)}`}
        </div>
        <div className="text-3xl font-bold text-gray-900 mt-1 tabular-nums">
          Ksh {total.toLocaleString()}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Resets each day. Only expenses for the selected date are shown below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-2xl shadow-sm p-5 mb-8 border-2 ${isOwner ? 'border-amber-200' : 'border-teal-200'}`}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className={`rounded-full p-2 ${isOwner ? 'bg-amber-100' : 'bg-teal-100'}`}>
            <Plus size={22} className={isOwner ? 'text-amber-700' : 'text-teal-700'} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Record expense</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Saved for {viewingToday ? 'today' : formatDateKey(viewDate)} (use calendar above to change date)
            </p>
          </div>
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="expense-description" className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <input
              id="expense-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fruits, milk, packaging"
              required
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 ${ringClass} outline-none`}
            />
          </div>
          <div>
            <label htmlFor="expense-money-out" className="block text-sm font-semibold text-gray-700 mb-1">
              Money out (Ksh)
            </label>
            <input
              id="expense-money-out"
              type="number"
              min="1"
              step="1"
              value={moneyOut}
              onChange={(e) => setMoneyOut(e.target.value)}
              placeholder="0"
              required
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 ${ringClass} outline-none`}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={`mt-5 w-full sm:w-auto sm:min-w-[200px] ${btnClass} text-white font-bold py-3.5 px-8 rounded-xl disabled:opacity-60`}
        >
          {saving ? 'Saving…' : 'Save expense'}
        </button>
      </form>

      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Receipt size={18} className={isOwner ? 'text-amber-600' : 'text-teal-600'} />
        Expense records {viewingToday ? 'today' : `· ${formatDateKey(viewDate)}`}
      </h3>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Loading…</p>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          <p className="font-medium">
            {viewingToday ? 'No expenses recorded today' : `No expenses on ${formatDateKey(viewDate)}`}
          </p>
          <p className="text-sm mt-1">Total for {dayLabel} is Ksh 0.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {expenses.map((exp) => (
              <article
                key={exp.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              >
                {editingId === exp.id ? (
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">Edit expense</span>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {editFormFields}
                    <button
                      type="submit"
                      disabled={actionBusy}
                      className={`w-full ${btnClass} text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60`}
                    >
                      {actionBusy ? 'Saving…' : 'Save changes'}
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{formatDateKey(exp.dateKey)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 tabular-nums">
                          Ksh {exp.amount.toLocaleString()}
                        </span>
                        {actionButtons(exp)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{exp.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {exp.recordedByName} · {formatTime(exp.createdAt)}
                    </p>
                  </>
                )}
              </article>
            ))}
            <div
              className={`rounded-2xl px-4 py-3 flex justify-between font-bold text-gray-900 ${isOwner ? 'bg-amber-50' : 'bg-teal-50'}`}
            >
              <span>Total for {dayLabel}</span>
              <span className="tabular-nums">Ksh {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isOwner ? 'border-amber-100' : 'border-teal-100'}`}>
                  <th className={`text-left px-4 py-3 font-semibold ${tableHead}`}>Date</th>
                  <th className={`text-left px-4 py-3 font-semibold ${tableHead}`}>Description</th>
                  <th className={`text-right px-4 py-3 font-semibold ${tableHead}`}>Money out (Ksh)</th>
                  <th className={`text-left px-4 py-3 font-semibold ${tableHead}`}>Recorded by</th>
                  <th className={`text-left px-4 py-3 font-semibold ${tableHead}`}>Time</th>
                  <th className={`text-center px-4 py-3 font-semibold ${tableHead}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) =>
                  editingId === exp.id ? (
                    <tr key={exp.id} className="border-b border-gray-100 bg-gray-50/80">
                      <td colSpan={6} className="px-4 py-4">
                        <form onSubmit={handleUpdate} className="space-y-3 max-w-3xl">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-800">Edit expense</span>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          {editFormFields}
                          <button
                            type="submit"
                            disabled={actionBusy}
                            className={`${btnClass} text-white font-semibold py-2 px-6 rounded-xl text-sm disabled:opacity-60`}
                          >
                            {actionBusy ? 'Saving…' : 'Save changes'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={exp.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800">
                        {formatDateKey(exp.dateKey)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">{exp.description}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                        {exp.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{exp.recordedByName}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatTime(exp.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">{actionButtons(exp)}</div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
              <tfoot>
                <tr className={isOwner ? 'bg-amber-50/80' : 'bg-teal-50/80'}>
                  <td colSpan={2} className="px-4 py-3 font-bold text-gray-800">
                    Total for {dayLabel}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                    {total.toLocaleString()}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  )

  if (isOwner) {
    return (
      <OwnerPageShell
        title="Expenses"
        subtitle={`Cost of goods · ${user?.name ?? 'Therapist'}`}
        onBack={() => navigate(dashboardPath)}
        backTitle="Back to therapist dashboard"
      >
        {pageBody}
      </OwnerPageShell>
    )
  }

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-sky-50">
      <header className="w-full bg-sky-800 text-white border-b border-sky-900">
        <div className="flex items-center gap-2 max-w-7xl mx-auto p-3 min-w-0 w-full box-border">
          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            title="Back to dashboard"
            className="rhjp-owner-icon-btn shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <HeaderLogo className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm m-0 truncate">Expenses</p>
            <p className={`${theme.headerAccent} text-xs m-0 mt-0.5 truncate`}>
              Cost of goods · {user?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            title="Logout"
            className="rhjp-owner-icon-btn"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="w-full max-w-7xl mx-auto px-3 py-4 pb-8 box-border">{pageBody}</main>
    </div>
  )
}
