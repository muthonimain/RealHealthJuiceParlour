import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAuthHeaders } from '../lib/api'
import {
  clearPendingReceipt,
  loadPendingReceipt,
  PENDING_RECEIPT_ROUTE_ID,
  pendingToPreviewOrder,
  type PendingReceiptPayload,
} from '../lib/pendingReceipt'
import { Printer, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  SAFE_HANDLING_RECEIPT_LABEL,
  normalizeSafeHandlingCounts,
  safeHandlingActiveLines,
  activePaybills,
} from '../constants/orderFees'
import type { SafeHandlingCounts } from '../constants/orderFees'
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
  safeHandlingAmount?: number
  safeHandlingCounts?: SafeHandlingCounts
  deliveryAmount?: number
  packagingAmount?: number
  packaging30Count?: number
  packaging50Count?: number
  specialDeliveryAmount?: number
  boxAndTapesAmount?: number
  includePaybill854845?: boolean
  includePaybill247247?: boolean
  includePaybill?: boolean
  grandTotal: number
  createdAt: string
}

const RECEIPT_TIMEZONE = 'Africa/Nairobi'

function formatGeneratedAt(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: RECEIPT_TIMEZONE,
  })
  const parts = new Intl.DateTimeFormat('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: RECEIPT_TIMEZONE,
  }).formatToParts(d)
  const hour = parts.find((p) => p.type === 'hour')?.value ?? ''
  const minute = parts.find((p) => p.type === 'minute')?.value ?? ''
  const dayPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value ?? '').toLowerCase()
  const time = `${hour}:${minute}${dayPeriod}`
  return `${date} ${time}`
}

function formatReceiptAmount(amount: number): string {
  return amount === 0 ? 'On req.' : amount.toLocaleString()
}

function ReceiptLine({
  name,
  middle,
  amount,
}: {
  name: string
  middle?: string
  amount: string
}) {
  return (
    <div className="thermal-receipt__line">
      <span className="thermal-receipt__line-name">{name}</span>
      <span className="thermal-receipt__line-qty">{middle ?? ''}</span>
      <span className="thermal-receipt__line-amount">{amount}</span>
    </div>
  )
}

function ServiceFeeReceiptLines({ order }: { order: Order }) {
  const lines = safeHandlingActiveLines(normalizeSafeHandlingCounts(order.safeHandlingCounts))
  if (lines.length > 0) {
    const total = lines.reduce((sum, { amount, count }) => sum + amount * count, 0)
    return (
      <ReceiptLine
        name={SAFE_HANDLING_RECEIPT_LABEL}
        amount={formatReceiptAmount(total)}
      />
    )
  }

  const legacyFees: { label: string; amount: number }[] = []
  if ((order.deliveryAmount ?? 0) > 0) {
    legacyFees.push({ label: 'Delivery', amount: order.deliveryAmount! })
  }
  const count30 = order.packaging30Count ?? 0
  const count50 = order.packaging50Count ?? 0
  if (count30 > 0) legacyFees.push({ label: 'Packaging (Ksh 30)', amount: 30 * count30 })
  else if (count50 > 0) legacyFees.push({ label: 'Packaging (Ksh 50)', amount: 50 * count50 })
  else if ((order.packagingAmount ?? 0) > 0) {
    legacyFees.push({ label: 'Packaging', amount: order.packagingAmount! })
  }
  if ((order.specialDeliveryAmount ?? 0) > 0) {
    legacyFees.push({ label: 'Delivery & COT', amount: order.specialDeliveryAmount! })
  }
  if ((order.boxAndTapesAmount ?? 0) > 0) {
    legacyFees.push({ label: 'Box and Tapes', amount: order.boxAndTapesAmount! })
  }
  if ((order.safeHandlingAmount ?? 0) > 0 && legacyFees.length === 0) {
    legacyFees.push({ label: SAFE_HANDLING_RECEIPT_LABEL, amount: order.safeHandlingAmount! })
  }

  return (
    <>
      {legacyFees.map((fee) => (
        <ReceiptLine
          key={fee.label}
          name={fee.label}
          amount={formatReceiptAmount(fee.amount)}
        />
      ))}
    </>
  )
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
  const generatedAt = formatGeneratedAt(order.createdAt)

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
      <p className="thermal-receipt__meta">Generated: {generatedAt}</p>
      <p className="thermal-receipt__meta">Served by: {order.employeeName}</p>

      <hr className="thermal-receipt__rule" />

      <section className="thermal-receipt__lines">
        {order.items.map((item) => {
          const lineTotal = item.price * item.quantity
          const unitPrice = item.price === 0 ? 'On req.' : item.price.toLocaleString()

          return (
            <ReceiptLine
              key={item.id}
              name={item.name}
              middle={`${item.quantity} x ${unitPrice}`}
              amount={formatReceiptAmount(lineTotal)}
            />
          )
        })}
        <ServiceFeeReceiptLines order={order} />
      </section>

      <hr className="thermal-receipt__rule" />

      <section>
        <p className="thermal-receipt__grand-total">
          <span>TOTAL</span>
          <span>{order.grandTotal.toLocaleString()}</span>
        </p>
      </section>

      {activePaybills(order).length > 0 ? (
        <>
          <hr className="thermal-receipt__rule" />
          <section className="thermal-receipt__payment">
            <p className="thermal-receipt__payment-title">M-Pesa Payment</p>
            {activePaybills(order).map((option) => (
              <div key={option.paybill} className="thermal-receipt__payment-block">
                <p className="thermal-receipt__payment-row">
                  <span>Paybill</span>
                  <span>{option.paybill}</span>
                </p>
                <p className="thermal-receipt__payment-row">
                  <span>Account</span>
                  <span>{option.account}</span>
                </p>
              </div>
            ))}
          </section>
        </>
      ) : null}

      <hr className="thermal-receipt__rule" />

      <footer className="thermal-receipt__footer">
        <p className="thermal-receipt__footer-lead">Nutrition • Juice Therapy • Lifestyle</p>
        <p className="thermal-receipt__footer-lead">Medicine</p>

        <p className="thermal-receipt__footer-heading">Follow Us:</p>
        <p>Real Health Juice Parlour</p>

        <p className="thermal-receipt__footer-heading">Orders &amp; Wellness Support:</p>
        <p className="thermal-receipt__footer-phones">
          0729 125 413 | 0794 650 556 | 0724 228 947
        </p>

        <p className="thermal-receipt__footer-tagline">
          No Sugar • No Preservatives • 100% Natural
        </p>
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
  const backLabel = user?.role === 'owner' ? 'Staff Records' : 'New Order'
  const [order, setOrder] = useState<Order | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [printCopy, setPrintCopy] = useState<'customer' | 'kitchen' | null>(null)
  const [awaitingKitchen, setAwaitingKitchen] = useState(false)
  const printPendingRef = useRef(false)
  const printStepRef = useRef<'customer' | 'kitchen' | null>(null)
  const recordedRef = useRef(false)

  useEffect(() => {
    if (!orderId) return

    if (orderId === PENDING_RECEIPT_ROUTE_ID) {
      const payload = loadPendingReceipt()
      if (!payload) {
        setError('No order to preview. Start a new order from the menu.')
        return
      }
      setOrder(pendingToPreviewOrder(payload))
      setIsPending(true)
      return
    }

    setIsPending(false)
    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Order not found.')
        return r.json()
      })
      .then(setOrder)
      .catch(() => setError('Could not load receipt. The order may not exist.'))
  }, [orderId])

  const recordSale = async (payload: PendingReceiptPayload): Promise<Order> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        ...payload,
        generatedAt: new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error((data as { message?: string }).message || 'Failed to record sale.')
    }

    const saved = (await res.json()) as Order
    clearPendingReceipt()
    recordedRef.current = true
    setIsPending(false)
    navigate(`/receipt/${saved.id}`, { replace: true })
    return saved
  }

  const queuePrint = (copy: 'customer' | 'kitchen') => {
    printStepRef.current = copy
    printPendingRef.current = true
    flushSync(() => setPrintCopy(copy))
  }

  useLayoutEffect(() => {
    if (!printPendingRef.current || !printCopy) return
    printPendingRef.current = false
    window.print()
  }, [printCopy])

  useEffect(() => {
    const onAfterPrint = () => {
      if (printStepRef.current === 'customer') {
        printStepRef.current = null
        flushSync(() => setPrintCopy(null))
        setAwaitingKitchen(true)
        return
      }
      printStepRef.current = null
      setPrintCopy(null)
      setAwaitingKitchen(false)
    }

    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [])

  const handlePrint = async () => {
    if (printCopy || recording) return

    if (awaitingKitchen) {
      queuePrint('kitchen')
      return
    }

    if (isPending && !recordedRef.current) {
      const payload = loadPendingReceipt()
      if (!payload) {
        setError('No order to record. Start a new order from the menu.')
        return
      }

      setRecording(true)
      setError('')
      try {
        const saved = await recordSale(payload)
        flushSync(() => setOrder(saved))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not record sale. Try again.')
        setRecording(false)
        return
      }
      setRecording(false)
    }

    setAwaitingKitchen(false)
    queuePrint('customer')
  }

  const printing = printCopy !== null

  const screenHint = recording
    ? 'Saving this sale before printing…'
    : printing
      ? printCopy === 'kitchen'
        ? 'Printing kitchen copy…'
        : 'Printing customer copy…'
      : awaitingKitchen
        ? 'Customer copy done — tap the button above for kitchen copy'
        : isPending
          ? null
          : 'Prints 2 separate slips — customer, then kitchen'

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
              onClick={() => void handlePrint()}
              disabled={printing || recording}
              className={`flex items-center gap-2 text-white font-bold rounded-xl px-4 py-2.5 text-sm disabled:opacity-60 ${
                awaitingKitchen
                  ? 'bg-amber-500 hover:bg-amber-400 animate-pulse'
                  : 'bg-sky-500 hover:bg-sky-400'
              }`}
            >
              <Printer size={18} />
              {recording
                ? 'Recording sale…'
                : printing
                  ? 'Printing…'
                  : awaitingKitchen
                    ? 'Print kitchen copy'
                    : 'Print (80mm)'}
            </button>
          </div>

          {screenHint ? <p className="thermal-screen__hint">{screenHint}</p> : null}

          <p className="thermal-screen__copy-title">Customer copy</p>
          <ReceiptCopy order={order} copyLabel="Customer copy" preview />

          <div className="thermal-cut print:hidden my-6">— CUT HERE —</div>

          <p className="thermal-screen__copy-title mt-6">Kitchen / records copy</p>
          <ReceiptCopy order={order} copyLabel="Kitchen copy" preview />
        </motion.div>
      </div>

      {printCopy ? (
        <div className="thermal-print-root" aria-hidden>
          <ReceiptCopy
            order={order}
            copyLabel={printCopy === 'customer' ? 'Customer copy' : 'Kitchen copy'}
          />
        </div>
      ) : null}
    </>
  )
}
