import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Printer, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import '../styles/thermal-receipt.css'

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

function ReceiptCopy({
  order,
  copyLabel,
  preview = false,
}: {
  order: Order
  copyLabel?: string
  preview?: boolean
}) {
  const { date, time } = formatDate(order.createdAt)

  return (
    <article
      className={`thermal-receipt${preview ? ' thermal-receipt--preview' : ''}`}
      aria-label={copyLabel ?? 'Receipt'}
    >
      {copyLabel ? <p className="thermal-receipt__copy-label">{copyLabel}</p> : null}

      <header>
        <h1 className="thermal-receipt__title">Real Health Juice Parlour</h1>
        <p className="thermal-receipt__tagline">Food is Medicine. Juice is Therapy.</p>
      </header>

      <hr className="thermal-receipt__rule" />

      <p className="thermal-receipt__meta">Order Number: {order.id}</p>
      <p className="thermal-receipt__meta">
        {date} {time}
      </p>
      <p className="thermal-receipt__meta">Served by: {order.employeeName}</p>

      <hr className="thermal-receipt__rule" />

      <section>
        {order.items.map((item) => {
          const lineTotal = item.price * item.quantity
          const unitLabel = item.price === 0 ? 'On req.' : `Ksh ${item.price.toLocaleString()}`
          const totalLabel = item.price === 0 ? 'On req.' : `Ksh ${lineTotal.toLocaleString()}`

          return (
            <div key={item.id} className="thermal-receipt__item">
              <p className="thermal-receipt__item-name">{item.name}</p>
              <p className="thermal-receipt__item-unit">
                {unitLabel} ×{item.quantity}
              </p>
              <p className="thermal-receipt__item-total">Total {totalLabel}</p>
            </div>
          )
        })}
      </section>

      <hr className="thermal-receipt__rule" />

      <section>
        <p className="thermal-receipt__total-row">
          <span>Subtotal</span>
          <span>Ksh {order.subtotal.toLocaleString()}</span>
        </p>
        {order.deliveryIncluded ? (
          <>
            <p className="thermal-receipt__total-row">
              <span>Delivery</span>
              <span>Ksh 50</span>
            </p>
            <p className="thermal-receipt__total-row">
              <span>Packaging</span>
              <span>Ksh 30</span>
            </p>
          </>
        ) : null}
        <p className="thermal-receipt__grand-total">
          <span>TOTAL</span>
          <span>Ksh {order.grandTotal.toLocaleString()}</span>
        </p>
      </section>

      <hr className="thermal-receipt__rule" />

      <footer className="thermal-receipt__footer">
        <p>Nutrition • Juice Therapy • Lifestyle</p>
        <p>Medicine</p>
        <p className="thermal-receipt__footer-spacer" aria-hidden="true">
          &nbsp;
        </p>
        <p>Follow us:</p>
        <p>Real Health Juice Parlour</p>
        <p className="thermal-receipt__footer-spacer" aria-hidden="true">
          &nbsp;
        </p>
        <p>Orders &amp; Wellness Support:</p>
        <p>Juice Parlour: 0729 125 413</p>
        <p>Delivery Team: 0794 650 556</p>
        <p>Chief Juice Therapist: 0724 228 947</p>
        <p className="thermal-receipt__footer-spacer" aria-hidden="true">
          &nbsp;
        </p>
        <p className="thermal-receipt__footer-tagline">No Sugar . No Preservatives</p>
        <p className="thermal-receipt__footer-tagline">100% Natural</p>
      </footer>
    </article>
  )
}

export default function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const backPath =
    user?.role === 'owner' ? '/dashboard/owner/employee-records' : '/dashboard/employee'
  const backLabel = user?.role === 'owner' ? 'Employee Records' : 'New Order'
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
        <button
          onClick={() => navigate(backPath)}
          className="bg-sky-600 text-white rounded-xl px-6 py-3 font-semibold"
        >
          Back to {backLabel}
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
      <div className="thermal-screen print:hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="thermal-screen__preview-wrap"
        >
          <div className="thermal-screen__toolbar">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="flex items-center gap-2 text-white/80 hover:text-white py-2 px-3 rounded-lg"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">{backLabel}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl px-4 py-2.5 text-sm"
            >
              <Printer size={18} />
              Print (80mm)
            </button>
          </div>

          <p className="thermal-screen__hint">Thermal preview — 80 mm roll, 2 copies</p>

          <p className="thermal-screen__copy-title">Customer copy</p>
          <ReceiptCopy order={order} copyLabel="Customer copy" preview />

          <div className="thermal-cut print:hidden my-6">— CUT HERE —</div>

          <p className="thermal-screen__copy-title mt-6">Kitchen / records copy</p>
          <ReceiptCopy order={order} copyLabel="Kitchen copy" preview />
        </motion.div>
      </div>

      <div className="thermal-print-root" aria-hidden>
        <ReceiptCopy order={order} copyLabel="Customer copy" />
        <div className="thermal-cut">— CUT HERE —</div>
        <ReceiptCopy order={order} copyLabel="Kitchen copy" />
      </div>
    </>
  )
}
