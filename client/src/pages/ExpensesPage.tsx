import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, Plus, Receipt } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authFetch, readApiJson } from '../lib/api'
import { HeaderLogo } from '../components/BrandLogo'
import OwnerPageShell from '../components/OwnerPageShell'
import { ownerTheme, employeeTheme } from '../theme/roles'
import type { Expense } from '../types/expense'

function todayDateInputValue(): string {
  return new Date().toLocaleDateString('en-CA')
}

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

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expenseDate, setExpenseDate] = useState(todayDateInputValue)
  const [description, setDescription] = useState('')
  const [moneyOut, setMoneyOut] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadExpenses = useCallback(async () => {
    try {
      const res = await authFetch('/api/expenses')
      const data = await readApiJson<{ items?: Expense[]; total?: number }>(res)
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || 'Failed to load expenses')
      }
      setExpenses(data.items ?? [])
      setTotal(data.total ?? 0)
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load expense records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await authFetch('/api/expenses')
        const data = await readApiJson<{ items?: Expense[]; total?: number }>(res)
        if (cancelled) return
        if (!res.ok) {
          throw new Error((data as { message?: string }).message || 'Failed to load expenses')
        }
        setExpenses(data.items ?? [])
        setTotal(data.total ?? 0)
        setError('')
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load expense records.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const parsed = Number(moneyOut)
    if (!expenseDate) {
      setError('Select a date.')
      return
    }
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
          date: expenseDate,
          description: description.trim(),
          amount: parsed,
        }),
      })
      const data = await readApiJson<{ message?: string; expense?: Expense }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not save expense')
      }
      await loadExpenses()
      setDescription('')
      setMoneyOut('')
      if (data.expense?.dateKey) setExpenseDate(data.expense.dateKey)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const btnClass = isOwner ? 'bg-amber-600 hover:bg-amber-700' : employeeTheme.cartBtn
  const ringClass = isOwner ? 'focus:ring-amber-400' : employeeTheme.signInInputFocus
  const tableHead = isOwner ? 'bg-amber-50 text-amber-800' : employeeTheme.tableHead

  const pageBody = (
    <>
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="text-sm text-gray-500 font-medium">Total money out (all records)</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">Ksh {total.toLocaleString()}</div>
          <p className="text-xs text-gray-400 mt-2">
            Daily expenses count toward Net Profit for that date.
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
            <h2 className="font-bold text-gray-800">Record expense</h2>
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="expense-date" className="block text-sm font-semibold text-gray-700 mb-1">
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 ${ringClass} outline-none`}
              />
            </div>
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
          Expense records
        </h3>

        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading…</p>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
            No expenses recorded yet. Use the form above to add one.
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {expenses.map((exp) => (
                <article
                  key={exp.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex justify-between gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{formatDateKey(exp.dateKey)}</span>
                    <span className="font-bold text-gray-900 tabular-nums">
                      Ksh {exp.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{exp.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {exp.recordedByName} · {formatTime(exp.createdAt)}
                  </p>
                </article>
              ))}
              <div
                className={`rounded-2xl px-4 py-3 flex justify-between font-bold text-gray-900 ${isOwner ? 'bg-amber-50' : 'bg-teal-50'}`}
              >
                <span>Total</span>
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
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
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
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={isOwner ? 'bg-amber-50/80' : 'bg-teal-50/80'}>
                    <td colSpan={2} className="px-4 py-3 font-bold text-gray-800">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                      {total.toLocaleString()}
                    </td>
                    <td colSpan={2} />
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
        subtitle={`Cost of goods · ${user?.name ?? 'Owner'}`}
        onBack={() => navigate(dashboardPath)}
        backTitle="Back to owner dashboard"
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
