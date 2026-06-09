import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Minus, ShoppingCart, Trash2, Printer, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import {
  savePendingReceipt,
  reserveOrderId,
  PENDING_RECEIPT_ROUTE_ID,
} from '../lib/pendingReceipt'
import {
  SAFE_HANDLING_OPTIONS,
  SAFE_HANDLING_SECTION_LABEL,
  MPESA_PAYBILL_OPTIONS,
  MPESA_AGENT_NO,
  MPESA_STORE_NO,
  type SafeHandlingOption,
  type SafeHandlingCounts,
  emptySafeHandlingCounts,
  safeHandlingTotal,
} from '../constants/orderFees'

interface Props {
  open: boolean
  onClose: () => void
  employeeName?: string
}

const drawer: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '100%', transition: { duration: 0.2 } },
}

function SafeHandlingSection({
  counts,
  onChange,
}: {
  counts: SafeHandlingCounts
  onChange: (amount: SafeHandlingOption, next: number) => void
}) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-teal-600 shrink-0" />
        <span className="text-sm font-bold text-gray-900">{SAFE_HANDLING_SECTION_LABEL}</span>
      </div>
      <p className="text-xs text-gray-500 -mt-1">
        Tap + for each packaging or delivery fee — same price can be added more than once
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SAFE_HANDLING_OPTIONS.map((amount) => {
          const count = counts[amount] ?? 0
          const active = count > 0
          return (
            <div
              key={amount}
              className={`rounded-xl border px-2.5 py-2 ${
                active ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-teal-200 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-800'}`}>
                  Ksh {amount}
                </span>
                {active ? (
                  <span className="text-[10px] font-bold bg-white/20 rounded px-1.5 py-0.5">×{count}</span>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onChange(amount, Math.max(0, count - 1))}
                  disabled={count === 0}
                  title={`Remove Ksh ${amount}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 ${
                    active ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Minus size={14} />
                </button>
                <span className={`w-6 text-center text-sm font-bold tabular-nums ${active ? 'text-white' : 'text-gray-900'}`}>
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(amount, count + 1)}
                  title={`Add Ksh ${amount}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    active ? 'bg-white/20 hover:bg-white/30' : 'bg-teal-100 hover:bg-teal-200 text-teal-800'
                  }`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CartDrawer({ open, onClose, employeeName = 'Staff' }: Props) {
  const { items, totalItems, totalPrice, increment, decrement, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [safeHandlingCounts, setSafeHandlingCounts] = useState<SafeHandlingCounts>(emptySafeHandlingCounts())
  const [includePaybill854845, setIncludePaybill854845] = useState(false)
  const [includePaybill247247, setIncludePaybill247247] = useState(false)
  const [includeMpesaAgentStore, setIncludeMpesaAgentStore] = useState(false)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  const safeHandlingAmount = safeHandlingTotal(safeHandlingCounts)
  const hasExtras = safeHandlingAmount > 0
  const grandTotal = totalPrice + safeHandlingAmount

  const setSafeHandlingCount = (amount: SafeHandlingOption, next: number) => {
    setSafeHandlingCounts((prev) => {
      const updated = { ...prev }
      if (next <= 0) delete updated[amount]
      else updated[amount] = next
      return updated
    })
  }

  const resetFees = () => {
    setSafeHandlingCounts(emptySafeHandlingCounts())
    setIncludePaybill854845(false)
    setIncludePaybill247247(false)
    setIncludeMpesaAgentStore(false)
  }

  const handleGenerateReceipt = async () => {
    setError('')
    setGenerating(true)
    try {
      const reservedOrderId = await reserveOrderId()
      savePendingReceipt({
        employeeId: user?.id ?? '',
        employeeName: user?.name ?? employeeName,
        items,
        subtotal: totalPrice,
        deliveryIncluded: hasExtras,
        safeHandlingAmount,
        safeHandlingCounts,
        includePaybill854845,
        includePaybill247247,
        includeMpesaAgentStore,
        grandTotal,
        reservedOrderId,
      })
      clearCart()
      resetFees()
      onClose()
      navigate(`/receipt/${PENDING_RECEIPT_ROUTE_ID}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not generate receipt. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          <motion.div
            variants={drawer}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 flex flex-col min-h-0 max-h-dvh shadow-2xl"
          >
            <div className="shrink-0 bg-sky-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ShoppingCart size={22} />
                Print Order ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </div>
              <button
                onClick={onClose}
                title="Close order"
                className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[12rem] text-gray-400 gap-3">
                    <ShoppingCart size={48} className="opacity-30" />
                    <p className="text-sm">No items added yet</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const lineTotal = item.price * item.quantity
                    const unitLabel = item.price === 0 ? 'On req.' : item.price.toLocaleString()
                    const amountLabel =
                      item.price === 0 ? 'On req.' : lineTotal.toLocaleString()

                    return (
                      <div key={item.id} className="bg-gray-50 rounded-2xl p-3 space-y-2">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 items-baseline text-sm">
                          <span className="font-semibold text-gray-900 leading-tight">{item.name}</span>
                          <span className="text-gray-600 tabular-nums whitespace-nowrap text-xs">
                            {item.quantity} x {unitLabel}
                          </span>
                          <span className="font-bold text-gray-900 tabular-nums whitespace-nowrap text-right">
                            {amountLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => decrement(item.id)}
                            title="Decrease quantity"
                            className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-6 text-center font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => increment(item.id)}
                            title="Increase quantity"
                            className="w-9 h-9 rounded-xl bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            title="Remove item"
                            className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-gray-100 p-4 pb-6 space-y-3">
                  <SafeHandlingSection counts={safeHandlingCounts} onChange={setSafeHandlingCount} />

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 space-y-2">
                    <p className="text-sm font-semibold text-gray-800">M-Pesa Paybill on receipt (optional)</p>
                    {MPESA_PAYBILL_OPTIONS.map((option, index) => {
                      const checked = index === 0 ? includePaybill854845 : includePaybill247247
                      const onChange = index === 0 ? setIncludePaybill854845 : setIncludePaybill247247
                      return (
                        <label
                          key={option.paybill}
                          className="flex items-start gap-3 cursor-pointer select-none rounded-xl bg-white/70 border border-emerald-100 px-3 py-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onChange(e.target.checked)}
                            className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer"
                            aria-label={`Include paybill ${option.paybill} on receipt`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              Paybill {option.paybill}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Account <span className="font-bold text-gray-900">{option.account}</span>
                            </p>
                          </div>
                        </label>
                      )
                    })}
                    <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl bg-white/70 border border-emerald-100 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={includeMpesaAgentStore}
                        onChange={(e) => setIncludeMpesaAgentStore(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer"
                        aria-label="Include M-Pesa agent and store numbers on receipt"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Agent &amp; Store on receipt</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Agent no.{MPESA_AGENT_NO} · Store no. {MPESA_STORE_NO}
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1 border-t border-gray-200 pt-3">
                    {safeHandlingAmount > 0 ? (
                      <div className="flex justify-between text-sm text-teal-700">
                        <span>{SAFE_HANDLING_SECTION_LABEL}</span>
                        <span className="font-semibold tabular-nums">
                          {safeHandlingAmount.toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-gray-900 uppercase tracking-wide">Total</span>
                      <span className="text-2xl font-bold text-gray-900 tabular-nums">
                        {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                  <button
                    onClick={() => void handleGenerateReceipt()}
                    disabled={generating}
                    className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-lg rounded-2xl py-4 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Printer size={20} />
                    {generating ? 'Reserving order no…' : 'Generate Receipt'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearCart()
                      resetFees()
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-base rounded-2xl py-3.5 transition-all flex items-center justify-center gap-2 border-2 border-red-700"
                  >
                    <Trash2 size={18} />
                    Clear Order
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
