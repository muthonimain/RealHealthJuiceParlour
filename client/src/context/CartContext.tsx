import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { MenuItem } from '../types/menu'
import { normalizePrice } from '../lib/menuPrice'

export interface CartItem extends MenuItem {
  quantity: number
  categoryName: string
}

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; item: MenuItem; categoryName: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'INCREMENT'; id: string }
  | { type: 'DECREMENT'; id: string }
  | { type: 'CLEAR' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            ...action.item,
            price: normalizePrice(action.item.price),
            quantity: 1,
            categoryName: action.categoryName,
          },
        ],
      }
    }
    case 'INCREMENT':
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case 'DECREMENT':
      return {
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.id !== action.id) }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addItem: (item: MenuItem, categoryName: string) => void
  removeItem: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void
  getQuantity: (id: string) => number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = state.items.reduce(
    (sum, i) => sum + normalizePrice(i.price) * i.quantity,
    0
  )

  const addItem = (item: MenuItem, categoryName: string) =>
    dispatch({ type: 'ADD', item, categoryName })
  const removeItem = (id: string) => dispatch({ type: 'REMOVE', id })
  const increment = (id: string) => dispatch({ type: 'INCREMENT', id })
  const decrement = (id: string) => dispatch({ type: 'DECREMENT', id })
  const clearCart = () => dispatch({ type: 'CLEAR' })
  const getQuantity = (id: string) =>
    state.items.find((i) => i.id === id)?.quantity ?? 0

  return (
    <CartContext.Provider
      value={{ items: state.items, totalItems, totalPrice, addItem, removeItem, increment, decrement, clearCart, getQuantity }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
