import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Plus, Minus, ShoppingCart, Trash2, Printer, Truck, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { savePendingReceipt, PENDING_RECEIPT_ROUTE_ID } from '../lib/pendingReceipt'
import {
  DELIVERY_OPTIONS,
  PACKAGING_OPTIONS,
  DELIVERY_PAYBILL,
  DELIVERY_ACCOUNT,
  type DeliveryOption,
  type PackagingOption,
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

function FeeCheckboxRow({
  label,
  icon: Icon,
  options,
  selected,
  onSelect,
}: {
  label: string
  icon: typeof Truck
  options: readonly number[]
  selected: number | null
  onSelect: (amount: number) => void
}) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-orange-500 shrink-0" />
        <span className="text-sm font-semibold text-gray-800">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((amount) => {
          const checked = selected === amount
          return (
            <label
              key={amount}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer select-none text-sm font-semibold transition-colors ${
                checked
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white border-orange-200 text-gray-700 hover:bg-orange-100'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onSelect(amount)}
                className="w-4 h-4 accent-orange-500 cursor-pointer"
              />
              Ksh {amount}
            </label>
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
  const [deliveryFee, setDeliveryFee] = useState<DeliveryOption | null>(null)
  const [packagingFee, setPackagingFee] = useState<PackagingOption | null>(null)
  const [includePaybill, setIncludePaybill] = useState(false)
  const [error, setError] = useState('')

  const deliveryAmount = deliveryFee ?? 0
  const packagingAmount = packagingFee ?? 0
  const hasExtras = deliveryAmount > 0 || packagingAmount > 0
  const grandTotal = totalPrice + deliveryAmount + packagingAmount

  const toggleDelivery = (amount: DeliveryOption) => {
    setDeliveryFee((prev) => (prev === amount ? null : amount))
  }

  const togglePackaging = (amount: PackagingOption) => {
    setPackagingFee((prev) => (prev === amount ? null : amount))
  }

  useEffect(() => {
    if (deliveryAmount > 0) {
      setIncludePaybill(true)
    }
  }, [deliveryAmount])

  const handleGenerateReceipt = () => {
    setError('')
    savePendingReceipt({
      employeeId: user?.id ?? '',
      employeeName: user?.name ?? employeeName,
      items,
      subtotal: totalPrice,
      deliveryIncluded: hasExtras,
      deliveryAmount,
      packagingAmount,
      includePaybill,
      grandTotal,
    })
    clearCart()
    setDeliveryFee(null)
    setPackagingFee(null)
    setIncludePaybill(false)
    onClose()
    navigate(`/receipt/${PENDING_RECEIPT_ROUTE_ID}`)
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
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
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
                        className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 ml-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <FeeCheckboxRow
                  label="Delivery"
                  icon={Truck}
                  options={DELIVERY_OPTIONS}
                  selected={deliveryFee}
                  onSelect={(amount) => toggleDelivery(amount as DeliveryOption)}
                />
                <FeeCheckboxRow
                  label="Packaging"
                  icon={Package}
                  options={PACKAGING_OPTIONS}
                  selected={packagingFee}
                  onSelect={(amount) => togglePackaging(amount as PackagingOption)}
                />

                <label className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePaybill}
                    onChange={(e) => setIncludePaybill(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer"
                    aria-label="Include M-Pesa paybill on receipt"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Include M-Pesa Paybill on receipt</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Paybill <span className="font-bold text-gray-900">{DELIVERY_PAYBILL}</span>
                      {' · '}
                      Account <span className="font-bold text-gray-900">{DELIVERY_ACCOUNT}</span>
                    </p>
                  </div>
                </label>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>Ksh {totalPrice.toLocaleString()}</span>
                  </div>
                  {deliveryAmount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Delivery</span>
                      <span>Ksh {deliveryAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {packagingAmount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Packaging</span>
                      <span>Ksh {packagingAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="font-semibold text-gray-700">Grand Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      Ksh {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                <button
                  onClick={handleGenerateReceipt}
                  className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-lg rounded-2xl py-4 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  Generate Receipt
                </button>

                <button
                  onClick={() => {
                    clearCart()
                    setDeliveryFee(null)
                    setPackagingFee(null)
                    setIncludePaybill(false)
                  }}
                  className="w-full text-sm text-gray-400 hover:text-red-500 py-2 transition-colors"
                >
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
