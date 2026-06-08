import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Receipt, CheckCircle2, Clock, User, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authFetch, readApiJson } from '../../lib/api'
import OwnerPageShell from '../../components/OwnerPageShell'
import { dataUnchanged } from '../../lib/stableData'
import { sumRevenueForWorkingMonth, workingMonthLabel } from '../../lib/workingMonth'
import { orderServiceFeeTotal } from '../../constants/orderFees'

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
  safeHandlingAmount?: number
  deliveryAmount: number
  packagingAmount?: number
  specialDeliveryAmount?: number
  boxAndTapesAmount?: number
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

function splitDateTime(iso: string) {
  const d = new Date(iso)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

function toCreatedAtIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}

export default function EmployeeRecordsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [summaries, setSummaries] = useState<EmployeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [clearingId, setClearingId] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editEmployeeName, setEditEmployeeName] = useState('')
  const [editSubtotal, setEditSubtotal] = useState('')
  const [editDeliveryIncluded, setEditDeliveryIncluded] = useState(false)
  const [editDeliveryAmount, setEditDeliveryAmount] = useState('')
  const [editGrandTotal, setEditGrandTotal] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, summariesRes] = await Promise.all([
        authFetch('/api/orders'),
        authFetch('/api/clearances/summaries'),
      ])
      if (ordersRes.ok) {
        const nextOrders: Order[] = await ordersRes.json()
        setOrders((prev) => (dataUnchanged(prev, nextOrders) ? prev : nextOrders))
      }
      if (summariesRes.ok) {
        const nextSummaries: EmployeeSummary[] = await summariesRes.json()
        setSummaries((prev) => (dataUnchanged(prev, nextSummaries) ? prev : nextSummaries))
      }
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const startEdit = (order: Order) => {
    const { date, time } = splitDateTime(order.createdAt)
    setEditingId(order.id)
    setEditDate(date)
    setEditTime(time)
    setEditEmployeeName(order.employeeName)
    setEditSubtotal(String(order.subtotal))
    setEditDeliveryIncluded(order.deliveryIncluded)
    setEditDeliveryAmount(String(order.deliveryAmount))
    setEditGrandTotal(String(order.grandTotal))
    setActionError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setActionError('')
  }

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setActionError('')

    const subtotal = Number(editSubtotal)
    const grandTotal = Number(editGrandTotal)
    const deliveryAmount = Number(editDeliveryAmount)

    if (!editDate || !editTime) {
      setActionError('Date and time are required.')
      return
    }
    if (!editEmployeeName.trim()) {
      setActionError('Employee name is required.')
      return
    }
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      setActionError('Enter a valid subtotal.')
      return
    }
    if (!Number.isFinite(grandTotal) || grandTotal < 0) {
      setActionError('Enter a valid grand total.')
      return
    }
    if (editDeliveryIncluded && (!Number.isFinite(deliveryAmount) || deliveryAmount < 0)) {
      setActionError('Enter a valid delivery amount.')
      return
    }

    setActionBusy(true)
    try {
      const order = orders.find((o) => o.id === editingId)
      if (!order) throw new Error('Order not found.')

      const res = await authFetch(`/api/orders/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          employeeId: order.employeeId,
          employeeName: editEmployeeName.trim(),
          items: order.items,
          subtotal: Math.round(subtotal),
          deliveryIncluded: editDeliveryIncluded,
          deliveryAmount: editDeliveryIncluded ? Math.round(deliveryAmount) : 0,
          grandTotal: Math.round(grandTotal),
          createdAt: toCreatedAtIso(editDate, editTime),
        }),
      })
      const data = await readApiJson<{ message?: string; orders?: Order[] }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not update order')
      }
      if (data.orders) setOrders(data.orders)
      cancelEdit()
      const summariesRes = await authFetch('/api/clearances/summaries')
      if (summariesRes.ok) {
        setSummaries(await summariesRes.json())
      }
      setLastRefresh(new Date())
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDeleteOrder = async (order: Order) => {
    if (
      !confirm(
        `Delete order ${order.id}?\n\nThis removes Ksh ${order.grandTotal.toLocaleString()} from today's totals, employee summaries, and monthly revenue.`
      )
    ) {
      return
    }
    setActionError('')
    setActionBusy(true)
    try {
      const res = await authFetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      const data = await readApiJson<{ message?: string; orders?: Order[] }>(res)
      if (!res.ok) {
        throw new Error(data.message || 'Could not delete order')
      }
      if (data.orders) setOrders(data.orders)
      if (editingId === order.id) cancelEdit()
      const summariesRes = await authFetch('/api/clearances/summaries')
      if (summariesRes.ok) {
        setSummaries(await summariesRes.json())
      }
      setLastRefresh(new Date())
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete order')
    } finally {
      setActionBusy(false)
    }
  }

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

  const editingOrder = editingId ? orders.find((o) => o.id === editingId) : undefined

  const orderActionButtons = (order: Order) => (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => startEdit(order)}
        disabled={actionBusy}
        title="Edit order"
        className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 disabled:opacity-50"
      >
        <Pencil size={16} />
      </button>
      <button
        type="button"
        onClick={() => handleDeleteOrder(order)}
        disabled={actionBusy}
        title="Delete order"
        className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )

  const orderEditForm = editingOrder ? (
    <form onSubmit={handleUpdateOrder} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">Edit order {editingOrder.id}</span>
        <button type="button" onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600" title="Cancel">
          <X size={18} />
        </button>
      </div>
      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
      )}
      <p className="text-xs text-gray-500">
        Items: {editingOrder.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Staff</label>
          <input
            type="text"
            value={editEmployeeName}
            onChange={(e) => setEditEmployeeName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Subtotal (Ksh)</label>
          <input
            type="number"
            min="0"
            value={editSubtotal}
            onChange={(e) => setEditSubtotal(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery (Ksh)</label>
          <input
            type="number"
            min="0"
            value={editDeliveryAmount}
            onChange={(e) => setEditDeliveryAmount(e.target.value)}
            disabled={!editDeliveryIncluded}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Grand total (Ksh)</label>
          <input
            type="number"
            min="0"
            value={editGrandTotal}
            onChange={(e) => setEditGrandTotal(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={editDeliveryIncluded}
          onChange={(e) => setEditDeliveryIncluded(e.target.checked)}
        />
        Delivery included
      </label>
      <button
        type="submit"
        disabled={actionBusy}
        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm disabled:opacity-60"
      >
        {actionBusy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  ) : null

  return (
    <OwnerPageShell
      title="Staff Records"
      subtitle="Daily totals & orders"
      onBack={() => navigate('/dashboard/owner')}
      backTitle="Back to therapist dashboard"
      actions={
        <button
          type="button"
          onClick={fetchData}
          title="Refresh records"
          className="rhjp-owner-icon-btn"
        >
          <RefreshCw size={15} />
          <span className="hidden sm:inline text-sm">Refresh</span>
        </button>
      }
    >
        <p className="text-sm text-gray-500 mb-4">{todayLabel()} — daily staff totals</p>

        {/* Staff banners */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Today&apos;s Staff Summary</h2>
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
                  <div
                    key={summary.employeeId}
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
                          <div className="text-xs text-gray-500 mt-0.5">Staff</div>
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
                            Clear Staff — Day Complete
                          </>
                        )}
                      </button>
                    )}
                  </div>
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

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Receipt size={18} className="text-amber-600 shrink-0" />
            All Order Records
          </h2>
          <p className="text-xs text-gray-400">
            Live · Updated{' '}
            {lastRefresh.toLocaleTimeString('en-KE', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
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
          <>
            {actionError && !editingId && (
              <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{actionError}</p>
            )}
            <div className="md:hidden space-y-3">
              {orders.map((order) => {
                const { date, time } = formatDateTime(order.createdAt)
                const itemsSummary = order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')
                return (
                  <article
                    key={order.id}
                    className="bg-white rounded-2xl shadow-sm border border-amber-100/80 p-4 space-y-3"
                  >
                    {editingId === order.id ? (
                      orderEditForm
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-gray-400 font-mono">{order.id}</p>
                            <p className="font-semibold text-gray-900">{date}</p>
                            <p className="text-xs text-gray-500">{time}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0">
                              {order.employeeName}
                            </span>
                            {orderActionButtons(order)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">{itemsSummary}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total</span>
                          <span className="font-bold text-gray-900">
                            Ksh {order.grandTotal.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/receipt/${order.id}`)}
                          className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-xl py-2.5 text-sm"
                        >
                          View receipt
                        </button>
                      </>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="hidden md:block rhjp-order-records-wrap">
              <table className="rhjp-order-records-table text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">Order No.</th>
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">Date & Time</th>
                    <th className="text-left px-4 py-3 text-amber-800 font-semibold">Staff</th>
                    <th className="rhjp-order-records-items text-left px-4 py-3 text-amber-800 font-semibold">
                      Items
                    </th>
                    <th className="text-right px-4 py-3 text-amber-800 font-semibold">Subtotal</th>
                    <th className="text-center px-4 py-3 text-amber-800 font-semibold">Service fees</th>
                    <th className="text-right px-4 py-3 text-amber-800 font-semibold">Total</th>
                    <th className="text-center px-4 py-3 text-amber-800 font-semibold">Receipt</th>
                    <th className="text-center px-4 py-3 text-amber-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const { date, time } = formatDateTime(order.createdAt)
                    const itemsSummary = order.items
                      .map((i) => `${i.name} x${i.quantity}`)
                      .join(', ')

                    if (editingId === order.id) {
                      return (
                        <tr key={order.id} className="border-b border-gray-100 bg-amber-50/40">
                          <td colSpan={9} className="px-4 py-4">
                            {orderEditForm}
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                          {order.id}
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
                        <td className="rhjp-order-records-items px-4 py-3 text-gray-600">
                          <div className="truncate text-xs">{itemsSummary}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          Ksh {order.subtotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {orderServiceFeeTotal(order) > 0 ? (
                            <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-lg">
                              +Ksh {orderServiceFeeTotal(order).toLocaleString()}
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
                            type="button"
                            onClick={() => navigate(`/receipt/${order.id}`)}
                            title="View receipt"
                            className="bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                          >
                            View
                          </button>
                        </td>
                        <td className="px-4 py-3">{orderActionButtons(order)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {user && (
          <p className="text-center text-gray-400 text-xs mt-6">
            Logged in as <span className="font-semibold">{user.name}</span> (Therapist) · Refreshes every 15 seconds
          </p>
        )}
    </OwnerPageShell>
  )
}
