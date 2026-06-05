import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Minus, ShoppingCart, Trash2, Printer, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  employeeName?: string
}

const DELIVERY_FEE = 50
const PACKAGING_FEE = 30
const DELIVERY_TOTAL = DELIVERY_FEE + PACKAGING_FEE

const drawer: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '100%', transition: { duration: 0.2 } },
}

export default function CartDrawer({ open, onClose, employeeName = 'Employee' }: Props) {
  const { items, totalItems, totalPrice, increment, decrement, removeItem, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [withDelivery, setWithDelivery] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const grandTotal = totalPrice + (withDelivery ? DELIVERY_TOTAL : 0)

  const handleGenerateReceipt = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token ?? ''}`,
        },
        body: JSON.stringify({
          employeeId: user?.id ?? '',
          employeeName: user?.name ?? employeeName,
          items,
          subtotal: totalPrice,
          deliveryIncluded: withDelivery,
          deliveryAmount: withDelivery ? DELIVERY_TOTAL : 0,
          grandTotal,
          generatedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error('Failed to save order.')
      const order = await res.json()
      clearCart()
      onClose()
      navigate(`/receipt/${order.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save order. Try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            variants={drawer}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-sky-700 px-5 py-4 flex items-center justify-between">
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

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <ShoppingCart size={48} className="opacity-30" />
                  <p className="text-sm">No items added yet</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm leading-tight truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.categoryName}</div>
                      <div className="text-sky-700 font-bold text-sm mt-1">
                        {item.price === 0
                          ? 'On request'
                          : `Ksh ${(item.price * item.quantity).toLocaleString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => decrement(item.id)} title="Decrease quantity"
                        className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                        <Minus size={16} />
                      </button>
                      <span className="w-6 text-center font-bold text-gray-900">{item.quantity}</span>
                      <button onClick={() => increment(item.id)} title="Increase quantity"
                        className="w-9 h-9 rounded-xl bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => removeItem(item.id)} title="Remove item"
                        className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 ml-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                {/* Delivery Checkbox */}
                <label className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 cursor-pointer select-none">
                  <input type="checkbox" checked={withDelivery}
                    onChange={(e) => setWithDelivery(e.target.checked)}
                    className="w-5 h-5 accent-orange-500 cursor-pointer" />
                  <div className="flex items-center gap-2 flex-1">
                    <Truck size={18} className="text-orange-500 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Delivery + Packaging</div>
                      <div className="text-xs text-gray-500">Delivery Ksh {DELIVERY_FEE} + Packaging Ksh {PACKAGING_FEE}</div>
                    </div>
                  </div>
                  <span className="font-bold text-orange-600 text-sm">+Ksh {DELIVERY_TOTAL}</span>
                </label>

                {/* Totals */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>Ksh {totalPrice.toLocaleString()}</span>
                  </div>
                  {withDelivery && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Delivery + Packaging</span>
                      <span>Ksh {DELIVERY_TOTAL}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="font-semibold text-gray-700">Grand Total</span>
                    <span className="text-2xl font-bold text-gray-900">Ksh {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs text-center">{error}</p>
                )}

                {/* Generate Receipt */}
                <button
                  onClick={handleGenerateReceipt}
                  disabled={isSubmitting}
                  className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60 text-white font-bold text-lg rounded-2xl py-4 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? <div className="w-5 h-5 rounded-full border-4 border-white border-t-transparent animate-spin" />
                    : <><Printer size={20} />Generate Receipt</>}
                </button>

                <button onClick={clearCart}
                  className="w-full text-sm text-gray-400 hover:text-red-500 py-2 transition-colors">
                  Clear Order
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
