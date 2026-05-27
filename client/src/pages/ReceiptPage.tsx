import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, Leaf } from 'lucide-react'
import { motion } from 'framer-motion'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  categoryName: string
}

interface Order {
  id: string
  employeeId: string
  employeeName: string
  items: OrderItem[]
  subtotal: number
  deliveryIncluded: boolean
  deliveryAmount: number
  grandTotal: number
  createdAt: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
  }
}

function ReceiptCopy({ order }: { order: Order }) {
  const { date, time } = formatDate(order.createdAt)
  const receiptNo = order.id

  return (
    <div className="bg-white rounded-2xl p-6 font-mono text-sm max-w-xs mx-auto border border-gray-200">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Leaf size={14} className="text-green-600" />
        </div>
        <div className="font-bold text-base uppercase tracking-wide">Real Health Juice Parlour</div>
        <div className="text-xs text-gray-500 italic">Food is Medicine. Juice is Therapy.</div>
        <div className="border-t border-dashed border-gray-300 my-2" />
        <div className="text-xs text-gray-500">Receipt No: {receiptNo}</div>
        <div className="text-xs text-gray-500">{date} &nbsp; {time}</div>
        <div className="text-xs text-gray-500">Served by: <span className="font-semibold text-gray-700">{order.employeeName}</span></div>
      </div>

      <div className="border-t border-dashed border-gray-300 my-3" />

      {/* Items */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1">
          <span>ITEM</span>
          <span>QTY &nbsp; AMOUNT</span>
        </div>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs">
            <span className="flex-1 pr-2 leading-tight">{item.name}</span>
            <span className="text-right whitespace-nowrap">
              x{item.quantity} &nbsp;
              {item.price === 0 ? 'On req.' : `Ksh ${(item.price * item.quantity).toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 my-3" />

      {/* Totals */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span>Ksh {order.subtotal.toLocaleString()}</span>
        </div>
        {order.deliveryIncluded && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span>Ksh 50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Packaging</span>
              <span>Ksh 30</span>
            </div>
          </>
        )}
        <div className="border-t border-dashed border-gray-300 pt-1 mt-1" />
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL</span>
          <span>Ksh {order.grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300 my-3" />

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 space-y-0.5">
        <div>Thank you for dining with us!</div>
        <div>Healing Through Nature</div>
        <div className="mt-1">Tel: 0729 125 413</div>
      </div>
    </div>
  )
}

export default function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Order not found.')
        return r.json()
      })
      .then(setOrder)
      .catch(() => setError('Could not load receipt. The order may not exist.'))
  }, [orderId])

  const handlePrint = () => window.print()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-semibold">{error}</p>
        <button onClick={() => navigate('/dashboard/employee')}
          className="bg-sky-600 text-white rounded-xl px-6 py-3 font-semibold">
          Back to Menu
        </button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Screen view */}
      <div className="min-h-screen bg-gradient-to-br from-sky-950 to-blue-900 flex flex-col items-center py-8 px-4 print:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard/employee')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/10"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">New Order</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl px-5 py-2.5 transition-all"
            >
              <Printer size={18} />
              Print
            </button>
          </div>

          <p className="text-sky-300 text-center text-sm mb-5 font-medium uppercase tracking-widest">
            Receipt Preview — 2 Copies
          </p>

          {/* Copy 1 */}
          <div className="mb-4">
            <p className="text-xs text-sky-400 text-center mb-2 uppercase tracking-widest">Customer Copy</p>
            <ReceiptCopy order={order} />
          </div>

          {/* Cut line */}
          <div className="flex items-center gap-2 my-4 px-4">
            <div className="flex-1 border-t-2 border-dashed border-sky-700" />
            <span className="text-sky-600 text-xs font-mono">✂ CUT HERE ✂</span>
            <div className="flex-1 border-t-2 border-dashed border-sky-700" />
          </div>

          {/* Copy 2 */}
          <div>
            <p className="text-xs text-sky-400 text-center mb-2 uppercase tracking-widest">Kitchen / Records Copy</p>
            <ReceiptCopy order={order} />
          </div>
        </motion.div>
      </div>

      {/* Print-only layout — 2 receipts on paper */}
      <div className="hidden print:block">
        <div style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', width: '280px', margin: '0 auto', padding: '8px' }}>
          <ReceiptCopy order={order} />
          <div style={{ borderTop: '2px dashed #999', margin: '16px 0', textAlign: 'center', fontSize: '10px', color: '#999', paddingTop: '4px' }}>
            ✂ CUT HERE ✂
          </div>
          <ReceiptCopy order={order} />
        </div>
      </div>
    </>
  )
}
