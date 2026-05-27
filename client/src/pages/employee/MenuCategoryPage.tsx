import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { menuData } from '../../data/menu'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import CartDrawer from '../../components/CartDrawer'
import type { MenuItem } from '../../data/menu'

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const cardVariant: Variants = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }

function ItemCard({ item, categoryName, color }: { item: MenuItem; categoryName: string; color: string }) {
  const { addItem, increment, decrement, getQuantity } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const qty = getQuantity(item.id)

  const handleAdd = () => {
    addItem(item, categoryName)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 800)
  }

  return (
    <motion.div
      variants={cardVariant}
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 min-h-[140px]"
    >
      <div className="flex-1">
        <div className="font-bold text-gray-900 text-sm leading-tight">{item.name}</div>
        {item.note && <div className="text-xs text-gray-400 mt-1 italic">{item.note}</div>}
        <div className={`font-bold mt-2 text-base ${item.price === 0 ? 'text-gray-400' : 'text-gray-800'}`}>
          {item.price === 0 ? 'On request' : `Ksh ${item.price.toLocaleString()}`}
        </div>
      </div>

      {qty === 0 ? (
        <button
          onClick={handleAdd}
          className={`
            w-full rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-all
            ${justAdded
              ? 'bg-green-500 text-white'
              : `${color} text-white active:opacity-80`
            }
          `}
        >
          {justAdded ? (
            <>
              <Check size={16} />
              Added
            </>
          ) : (
            <>
              <Plus size={16} />
              Add
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => decrement(item.id)}
            title="Decrease quantity"
            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-xl py-3 flex items-center justify-center"
          >
            <Minus size={16} className="text-gray-700" />
          </button>
          <span className="text-xl font-bold text-gray-900 w-8 text-center">{qty}</span>
          <button
            onClick={() => increment(item.id)}
            title="Increase quantity"
            className={`flex-1 ${color} text-white rounded-xl py-3 flex items-center justify-center`}
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default function MenuCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { totalItems, totalPrice } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const { user } = useAuth()

  const category = menuData.find((c) => c.id === categoryId)

  if (!category) {
    navigate('/dashboard/employee')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-sky-900 shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/employee')}
              title="Back to menu categories"
              className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="text-white font-bold text-base flex items-center gap-2">
                <span>{category.emoji}</span>
                {category.name}
              </div>
              <div className="text-sky-300 text-xs">{category.items.length} items</div>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl px-4 py-2.5 font-semibold text-sm transition-all"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Diner's Order</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Items Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {category.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              categoryName={category.name}
              color={category.color}
            />
          ))}
        </motion.div>
      </main>

      {/* Sticky Cart Bar */}
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          className="sticky bottom-0 bg-sky-700 border-t border-sky-600 px-4 py-3 z-20"
        >
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between text-white"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl px-3 py-1 text-sm font-bold">
                {totalItems} items
              </div>
              <span className="font-semibold text-sm">View Current Order</span>
            </div>
            <span className="font-bold text-lg">Ksh {totalPrice.toLocaleString()}</span>
          </button>
        </motion.div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} employeeName={user?.name} />
    </div>
  )
}
