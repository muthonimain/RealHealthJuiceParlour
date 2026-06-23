import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListOrdered, RefreshCw } from 'lucide-react'
import { authFetch, readApiJson } from '../../lib/api'
import OwnerPageShell from '../../components/OwnerPageShell'
import RecordsDatePicker from '../../components/RecordsDatePicker'
import { isTodayDateKey, todayDateKey } from '../../lib/dateKey'
import type { DailyProductSalesReport, ProductSalesRow } from '../../types/salesReport'

function ProductList({ rows, emptyLabel }: { rows: ProductSalesRow[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
        <ListOrdered size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">{emptyLabel}</p>
        <p className="text-sm mt-1">Products appear here when staff print customer receipts.</p>
      </div>
    )
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="md:hidden divide-y divide-gray-50">
        {rows.map((row, idx) => (
          <article key={row.productId} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                #{idx + 1}
              </span>
              <span className="text-xs text-gray-400">{row.categoryName}</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{row.name}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <p className="font-bold text-gray-900 text-lg">{row.quantitySold}</p>
                <p className="text-gray-500">Units sold</p>
              </div>
              <div>
                <p className="font-bold text-gray-900">Ksh {row.revenue.toLocaleString()}</p>
                <p className="text-gray-500">Revenue</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block rhjp-order-records-wrap">
        <table className="rhjp-order-records-table text-sm">
          <thead>
            <tr className="bg-sky-50 border-b border-sky-100">
              <th className="text-left px-4 py-3 text-sky-900 font-semibold">#</th>
              <th className="text-left px-4 py-3 text-sky-900 font-semibold">Product</th>
              <th className="text-left px-4 py-3 text-sky-900 font-semibold">Category</th>
              <th className="text-right px-4 py-3 text-sky-900 font-semibold">Units sold</th>
              <th className="text-right px-4 py-3 text-sky-900 font-semibold">Revenue</th>
              <th className="text-right px-4 py-3 text-sky-900 font-semibold">Orders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.productId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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

export default function ItemsSoldTodayPage() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(todayDateKey)
  const [report, setReport] = useState<DailyProductSalesReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/orders/reports/items-sold-today?date=${encodeURIComponent(selectedDate)}`
      )
      const data = await readApiJson<DailyProductSalesReport & { message?: string }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not load items sold.')
      }
      setReport(data)
      setError('')
      setLastRefresh(new Date())
    } catch (err: unknown) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Could not load items sold.')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!isTodayDateKey(selectedDate)) return
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load, selectedDate])

  const dateHeading = isTodayDateKey(selectedDate) ? 'today' : 'on this day'
  const emptyLabel = isTodayDateKey(selectedDate)
    ? 'No items sold today yet'
    : 'No items sold on this date'

  return (
    <OwnerPageShell
      title="Items Sold Today"
      subtitle="Daily product totals"
      onBack={() => navigate('/dashboard/owner')}
      backTitle="Back to therapist dashboard"
      actions={
        <button type="button" onClick={load} title="Refresh" className="rhjp-owner-icon-btn">
          <RefreshCw size={15} />
          <span className="hidden sm:inline text-sm">Refresh</span>
        </button>
      }
    >
      <RecordsDatePicker value={selectedDate} onChange={setSelectedDate} className="mb-4" />

      {report ? (
        <p className="text-sm text-gray-500 mb-4">
          {report.dateLabel} — ranked from most sold to least sold
        </p>
      ) : null}

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
              { label: `Orders ${dateHeading}`, value: String(report.orderCount) },
              { label: 'Units sold', value: String(report.totalUnitsSold) },
              { label: 'Products sold', value: String(report.uniqueProductsSold) },
              {
                label: 'Top seller',
                value: report.products[0]?.name ?? '—',
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100/80">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 mt-1 leading-tight break-words">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ListOrdered size={18} className="text-sky-600 shrink-0" />
              Items sold {dateHeading}
            </h2>
            <p className="text-xs text-gray-400 shrink-0">
              Updated{' '}
              {lastRefresh.toLocaleTimeString('en-KE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <ProductList rows={report.products} emptyLabel={emptyLabel} />
        </div>
      ) : null}
    </OwnerPageShell>
  )
}
