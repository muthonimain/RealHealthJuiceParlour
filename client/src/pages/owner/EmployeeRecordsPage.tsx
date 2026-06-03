import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Receipt,
  LogOut,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../../components/BrandLogo'
import { ownerTheme } from '../../theme/roles'
import { sumRevenueForWorkingMonth, workingMonthLabel } from '../../lib/workingMonth'

interface OrderItem {
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  employeeId?: string
  employeeName: string
  items: OrderItem[]
  subtotal: number
  deliveryIncluded: boolean
  deliveryAmount: number
  grandTotal: number
  createdAt: string
}

interface EmployeeSummary {
  employeeId: string
  employeeName: string
  dateKey: string
  totalOrders: number
  totalAmount: number
  status: 'pending' | 'cleared'
  clearedAt?: string
  clearedBy?: string
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
  }
}

function todayLabel() {
  return new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function EmployeeRecordsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [summaries, setSummaries] = useState<EmployeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [clearingId, setClearingId] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, summariesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/clearances/summaries'),
      ])
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (summariesRes.ok) setSummaries(await summariesRes.json())
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleClear = async (summary: EmployeeSummary) => {
    if (summary.status === 'cleared' || summary.totalOrders === 0) return
    setClearingId(summary.employeeId)
    try {
      const res = await fetch('/api/clearances/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: summary.employeeId,
          employeeName: summary.employeeName,
          clearedBy: user?.name ?? 'Owner',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.summaries) setSummaries(data.summaries)
        else fetchData()
      }
    } finally {
      setClearingId(null)
    }
  }

  const monthRevenue = sumRevenueForWorkingMonth(orders)
  const monthLabel = workingMonthLabel()
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.createdAt)
    return d.toDateString() === new Date().toDateString()
  })
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0)
  const pendingCount = summaries.filter((s) => s.status === 'pending' && s.totalOrders > 0).length

  return (
    <div className={`min-h-screen ${ownerTheme.shellPage} flex flex-col`}>
      <header className={`${ownerTheme.header} shadow-lg sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/owner')}
              title="Back to owner dashboard"
              className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <BrandLogo size="sm" />
            <div>
              <div className="text-white font-bold text-base">Employee Records</div>
              <div className={`${ownerTheme.headerAccent} text-xs`}>Employee records — owner view</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="Refresh records"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2 text-sm transition-all"
            >
              <RefreshCw size={15} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              title="Logout"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2 text-sm font-semibold transition-all"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">{todayLabel()} — daily employee totals</p>

        {/* Employee banners */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Today&apos;s Employee Summary</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
              No employees configured. Add staff in server .env.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summaries.map((summary) => {
                const isPending = summary.status === 'pending' && summary.totalOrders > 0
                const isCleared = summary.status === 'cleared' && summary.totalOrders > 0
                const noOrders = summary.totalOrders === 0

                return (
                  <motion.div
                    key={summary.employeeId}
                    layout
                    className={`
                      rounded-2xl p-5 shadow-sm border-2 flex flex-col gap-4
                      ${isPending ? 'bg-amber-50 border-amber-300' : ''}
                      ${isCleared ? 'bg-green-50 border-green-300' : ''}
                      ${noOrders ? 'bg-white border-gray-200' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-xl p-3 ${
                            isPending ? 'bg-amber-200' : isCleared ? 'bg-green-200' : 'bg-gray-100'
                          }`}
                        >
                          <User
                            size={28}
                            className={
                              isPending
                                ? 'text-amber-800'
                                : isCleared
                                  ? 'text-green-800'
                                  : 'text-gray-500'
                            }
                          />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-900">{summary.employeeName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">Employee</div>
                        </div>
                      </div>

                      {noOrders ? (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          No orders today
                        </span>
                      ) : isPending ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-200 px-3 py-1.5 rounded-full uppercase tracking-wide">
                          <Clock size={14} />
                          Pending clearance
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-800 bg-green-200 px-3 py-1.5 rounded-full uppercase tracking-wide">
                          <CheckCircle2 size={14} />
                          Cleared
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/80 rounded-xl px-4 py-3">
                        <div className="text-2xl font-bold text-gray-900">{summary.totalOrders}</div>
                        <div className="text-xs text-gray-500 font-medium">Total Orders</div>
                      </div>
                      <div className="bg-white/80 rounded-xl px-4 py-3">
                        <div className="text-2xl font-bold text-gray-900">
                          Ksh {summary.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Amount Collected</div>
                      </div>
                    </div>

                    {isCleared && summary.clearedAt && (
                      <p className="text-xs text-green-700">
                        Cleared {formatDateTime(summary.clearedAt).time}
                        {summary.clearedBy ? ` by ${summary.clearedBy}` : ''}
                      </p>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleClear(summary)}
                        disabled={clearingId === summary.employeeId}
                        title={`Clear ${summary.employeeName} for today`}
                        className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all flex items-center justify-center gap-2 min-h-[48px]"
                      >
                        {clearingId === summary.employeeId ? (
                          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            Clear Employee — Day Complete
                          </>
                        )}
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
          {pendingCount > 0 && (
            <p className="text-amber-700 text-sm mt-3 font-medium">
              {pendingCount} employee{pendingCount !== 1 ? 's' : ''} still pending clearance for today.
            </p>
          )}
        </section>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Today's Orders", value: todayOrders.length },
            { label: "Today's Revenue", value: `Ksh ${todayRevenue.toLocaleString()}` },
            {
              label: `${monthLabel} revenue`,
              value: `Ksh ${monthRevenue.toLocaleString()}`,
              hint: 'Adds each day · resets on the 1st of next month',
            },
          ].map(({ label, value, hint }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
              {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Receipt size={18} className="text-amber-600" />
            All Order Records
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live · Updated{' '}
            {lastRefresh.toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">Orders appear here when an employee generates a receipt.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">#</th>
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">Date & Time</th>
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">Employee</th>
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">Items</th>
                    <th className="text-right px-4 py-3 text-amber-800 font-semibold">Subtotal</th>
                    <th className="text-center px-4 py-3 text-amber-800 font-semibold">Delivery</th>
                    <th className="text-right px-4 py-3 text-amber-800 font-semibold">Total</th>
                    <th className="text-center px-4 py-3 text-amber-800 font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => {
                    const { date, time } = formatDateTime(order.createdAt)
                    const itemsSummary = order.items
                      .map((i) => `${i.name} x${i.quantity}`)
                      .join(', ')
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {orders.length - idx}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-800">{date}</div>
                          <div className="text-xs text-gray-400">{time}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-lg text-xs">
                            {order.employeeName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <div className="truncate text-xs">{itemsSummary}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          Ksh {order.subtotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {order.deliveryIncluded ? (
                            <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-lg">
                              +Ksh {order.deliveryAmount}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          Ksh {order.grandTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigate(`/receipt/${order.id}`)}
                            title="View receipt"
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {user && (
          <p className="text-center text-gray-400 text-xs mt-6">
            Logged in as <span className="font-semibold">{user.name}</span> (Owner) · Auto-refreshes every 5
            seconds
          </p>
        )}
      </main>
    </div>
  )
}
