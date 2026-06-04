import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, TrendingDown, TrendingUp } from 'lucide-react'
import { authFetch, readApiJson } from '../../lib/api'
import OwnerPageShell from '../../components/OwnerPageShell'
import { toMonthKey } from '../../lib/workingMonth'
import type { ProductSalesReport, ProductSalesRow } from '../../types/salesReport'

function ProductTable({
  title,
  icon: Icon,
  accent,
  rows,
  emptyMessage,
}: {
  title: string
  icon: typeof TrendingUp
  accent: 'emerald' | 'rose'
  rows: ProductSalesRow[]
  emptyMessage: string
}) {
  const head = accent === 'emerald' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
  const badge = accent === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'

  if (rows.length === 0) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
          <Icon size={20} className={accent === 'emerald' ? 'text-emerald-600' : 'text-rose-600'} />
          {title}
        </h2>
        <p className="text-sm text-gray-400 text-center py-6">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon size={20} className={accent === 'emerald' ? 'text-emerald-600' : 'text-rose-600'} />
          {title}
        </h2>
      </div>

      <div className="md:hidden divide-y divide-gray-50">
        {rows.map((row, idx) => (
          <article key={row.productId} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>#{idx + 1}</span>
              <span className="text-xs text-gray-400">{row.categoryName}</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{row.name}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-bold text-gray-900">{row.quantitySold}</p>
                <p className="text-gray-500">Qty sold</p>
              </div>
              <div>
                <p className="font-bold text-gray-900">Ksh {row.revenue.toLocaleString()}</p>
                <p className="text-gray-500">Revenue</p>
              </div>
              <div>
                <p className="font-bold text-gray-900">{row.orderCount}</p>
                <p className="text-gray-500">Orders</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${accent === 'emerald' ? 'border-emerald-100' : 'border-rose-100'}`}>
              <th className={`text-left px-4 py-3 font-semibold ${head}`}>#</th>
              <th className={`text-left px-4 py-3 font-semibold ${head}`}>Product</th>
              <th className={`text-left px-4 py-3 font-semibold ${head}`}>Category</th>
              <th className={`text-right px-4 py-3 font-semibold ${head}`}>Qty sold</th>
              <th className={`text-right px-4 py-3 font-semibold ${head}`}>Revenue</th>
              <th className={`text-right px-4 py-3 font-semibold ${head}`}>Orders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.productId} className="border-b border-gray-50">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-600">{row.categoryName}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                  {row.quantitySold}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                  Ksh {row.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{row.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function SalesReportsPage() {
  const navigate = useNavigate()
  const [monthKey, setMonthKey] = useState(toMonthKey())
  const [report, setReport] = useState<ProductSalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (month: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/api/orders/reports/product-sales?month=${encodeURIComponent(month)}`)
      const data = await readApiJson<ProductSalesReport & { message?: string }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not load sales report.')
      }
      setReport(data)
    } catch (err: unknown) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Could not load sales report.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(monthKey)
  }, [monthKey, load])

  return (
    <OwnerPageShell
      title="Sales Reports"
      subtitle="Monthly product performance"
      onBack={() => navigate('/dashboard/owner')}
      backTitle="Back to owner dashboard"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <label htmlFor="sales-month" className="block text-sm font-semibold text-gray-700 mb-1">
            Analysis month
          </label>
          <input
            id="sales-month"
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
          />
        </div>
        {report ? (
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{report.monthLabel}</span>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Orders', value: String(report.orderCount) },
              { label: 'Units sold', value: String(report.totalUnitsSold) },
              { label: 'Products sold', value: String(report.uniqueProductsSold) },
              {
                label: 'Top seller qty',
                value: report.topProducts[0] ? String(report.topProducts[0].quantitySold) : '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100/80">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 flex items-center gap-2">
            <BarChart2 size={16} className="text-purple-600 shrink-0" />
            Rankings use quantity sold in {report.monthLabel}. Least sold lists products with the
            lowest sales that month (among items that were sold at least once).
          </p>

          <ProductTable
            title="Most sold products"
            icon={TrendingUp}
            accent="emerald"
            rows={report.topProducts}
            emptyMessage="No product sales recorded for this month."
          />

          <ProductTable
            title="Least sold products"
            icon={TrendingDown}
            accent="rose"
            rows={report.leastProducts}
            emptyMessage="No product sales recorded for this month."
          />
        </div>
      ) : null}
    </OwnerPageShell>
  )
}
