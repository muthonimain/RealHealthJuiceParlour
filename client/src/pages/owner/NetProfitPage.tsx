import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Minus, Equal } from 'lucide-react'
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

function Line({
  label,
  value,
  highlight,
  negative,
}: {
  label: string
  value: number
  highlight?: boolean
  negative?: boolean
}) {
  const color = negative && value < 0 ? 'text-red-700' : highlight ? 'text-emerald-800' : 'text-gray-900'
  return (
    <div className={`flex items-center justify-between py-3 ${highlight ? 'border-t-2 border-gray-200 pt-4' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-800' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-lg font-bold tabular-nums ${color}`}>Ksh {value.toLocaleString()}</span>
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
      backTitle="Back to owner dashboard"
    >
      <div className="max-w-2xl mx-auto w-full">
        <p className="text-sm text-gray-500 mb-6">{todayHeading()}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-gray-500">Orders today</div>
                <div className="text-2xl font-bold text-gray-900">{summary.orderCount}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-gray-500">Expenses logged</div>
                <div className="text-2xl font-bold text-gray-900">{summary.expenseCount}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-amber-600" size={22} />
                <h2 className="font-bold text-gray-800">Today&apos;s calculation</h2>
              </div>

              <Line label="Today's revenue" value={summary.todayRevenue} />
              <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                <Minus size={14} />
                <span>Cost of goods (expenses)</span>
              </div>
              <Line label="Cost of goods" value={summary.costOfGoods} negative />

              <div className="flex items-center gap-2 text-emerald-700 text-xs py-1 font-semibold">
                <Equal size={14} />
                <span>Gross profit = revenue − expenses</span>
              </div>
              <Line label="Gross profit" value={summary.grossProfit} highlight negative />

              <div className="flex items-center gap-2 text-gray-400 text-xs py-1 mt-2">
                <Minus size={14} />
                <span>Daily operational costs (fixed)</span>
              </div>
              <Line label="Operational costs" value={summary.dailyOperationalCost} />

              <div className="flex items-center gap-2 text-emerald-700 text-xs py-1 font-semibold">
                <Equal size={14} />
                <span>Net profit = gross profit − Ksh 5,550</span>
              </div>
              <Line label="Net profit" value={summary.netProfit} highlight negative />
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard/owner/expenses')}
              className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-2xl py-4 text-sm transition-all"
            >
              Manage today&apos;s expenses →
            </button>

            <p className="text-xs text-gray-400 text-center">
              Updates automatically every few seconds. Record all daily expenses on the Expenses page.
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-400">Could not load profit summary.</p>
        )}
      </div>
    </OwnerPageShell>
  )
}
