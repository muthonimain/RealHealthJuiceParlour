import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Minus, Equal, Receipt, Wallet } from 'lucide-react'
import { authFetch } from '../../lib/api'
import OwnerPageShell from '../../components/OwnerPageShell'
import { dataUnchanged } from '../../lib/stableData'
import type { DailyProfitSummary } from '../../types/expense'

function todayHeading() {
  return new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatKsh(value: number) {
  return `Ksh ${value.toLocaleString()}`
}

function OperatorIcon({ kind }: { kind: 'start' | 'minus' | 'equals' }) {
  if (kind === 'start') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
        <Receipt size={18} strokeWidth={2.5} />
      </span>
    )
  }
  if (kind === 'minus') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Minus size={20} strokeWidth={3} />
      </span>
    )
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
      <Equal size={18} strokeWidth={2.5} />
    </span>
  )
}

function CalcRow({
  operator,
  label,
  hint,
  amount,
  tone = 'default',
}: {
  operator: 'start' | 'minus' | 'equals'
  label: string
  hint?: string
  amount: number
  tone?: 'default' | 'deduction' | 'subtotal' | 'final'
}) {
  const amountColor =
    tone === 'final'
      ? amount < 0
        ? 'text-red-800'
        : 'text-emerald-900'
      : tone === 'subtotal'
        ? amount < 0
          ? 'text-red-700'
          : 'text-emerald-800'
        : tone === 'deduction'
          ? 'text-red-700'
          : 'text-gray-900'

  const rowBg =
    tone === 'final'
      ? amount < 0
        ? 'bg-red-50 border-red-200'
        : 'bg-emerald-50 border-emerald-200'
      : tone === 'subtotal'
        ? 'bg-amber-50 border-amber-200'
        : 'bg-gray-50 border-gray-200'

  const labelWeight = tone === 'final' || tone === 'subtotal' ? 'font-extrabold' : 'font-bold'
  const amountSize = tone === 'final' ? 'text-2xl sm:text-3xl' : tone === 'subtotal' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'

  return (
    <div className={`rounded-2xl border px-4 py-4 sm:px-5 ${rowBg}`}>
      <div className="grid grid-cols-[2.25rem_1fr] sm:grid-cols-[2.5rem_1fr_auto] gap-x-3 gap-y-1 items-center">
        <OperatorIcon kind={operator} />
        <div className="min-w-0">
          <p className={`text-base sm:text-lg text-gray-900 ${labelWeight}`}>{label}</p>
          {hint ? <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-0.5">{hint}</p> : null}
        </div>
        <p
          className={`col-span-2 sm:col-span-1 sm:text-right font-extrabold tabular-nums ${amountColor} ${amountSize} mt-1 sm:mt-0`}
        >
          {formatKsh(amount)}
        </p>
      </div>
    </div>
  )
}

function FormulaStep({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center py-2">
      <p className="text-center text-sm sm:text-base font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 leading-snug">
        {children}
      </p>
    </div>
  )
}

export default function NetProfitPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DailyProfitSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/profit/daily')
      if (res.ok) {
        const next: DailyProfitSummary = await res.json()
        setSummary((prev) => (dataUnchanged(prev, next) ? prev : next))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [load])

  return (
    <OwnerPageShell
      title="Net Profit"
      subtitle="Daily profit breakdown"
      onBack={() => navigate('/dashboard/owner')}
      backTitle="Back to therapist dashboard"
    >
      <div className="max-w-3xl mx-auto w-full">
        <p className="text-base sm:text-lg font-bold text-gray-700 mb-6 text-center sm:text-left">
          {todayHeading()}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 text-center sm:text-left">
                <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Orders today
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">{summary.orderCount}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 text-center sm:text-left">
                <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Expenses logged
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">{summary.expenseCount}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-7 border-2 border-amber-200">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-6 pb-4 border-b-2 border-amber-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Today&apos;s calculation</h2>
                  <p className="text-sm font-semibold text-gray-500 mt-0.5">Follow each step below</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-sky-700 mb-1">
                  Step 1 — Revenue
                </p>
                <CalcRow
                  operator="start"
                  label="Today's revenue"
                  hint="Total sales recorded today"
                  amount={summary.todayRevenue}
                />

                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-700 pt-2 mb-1">
                  Step 2 — Subtract expenses
                </p>
                <CalcRow
                  operator="minus"
                  label="Cost of goods"
                  hint="Today's logged expenses"
                  amount={summary.costOfGoods}
                  tone="deduction"
                />

                <FormulaStep>Gross profit = Today&apos;s revenue − Cost of goods</FormulaStep>

                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-800 mb-1">
                  Step 3 — Gross profit
                </p>
                <CalcRow
                  operator="equals"
                  label="Gross profit"
                  hint="Revenue after expenses"
                  amount={summary.grossProfit}
                  tone="subtotal"
                />

                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-red-700 pt-2 mb-1">
                  Step 4 — Subtract fixed costs
                </p>
                <CalcRow
                  operator="minus"
                  label="Operational costs"
                  hint="Fixed daily running cost"
                  amount={summary.dailyOperationalCost}
                  tone="deduction"
                />

                <FormulaStep>
                  Net profit = Gross profit − Ksh {summary.dailyOperationalCost.toLocaleString()}
                </FormulaStep>

                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                  Step 5 — Net profit
                </p>
                <CalcRow
                  operator="equals"
                  label="Net profit"
                  hint="What remains after all deductions"
                  amount={summary.netProfit}
                  tone="final"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard/owner/expenses')}
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-extrabold rounded-2xl py-4 text-base transition-all flex items-center justify-center gap-2"
            >
              <Wallet size={20} />
              Manage today&apos;s expenses
            </button>

            <p className="text-sm font-semibold text-gray-400 text-center leading-relaxed">
              Updates automatically every few seconds.
              <br />
              Record all daily expenses on the Expenses page.
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-400 font-semibold">Could not load profit summary.</p>
        )}
      </div>
    </OwnerPageShell>
  )
}
