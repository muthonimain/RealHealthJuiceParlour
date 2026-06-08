import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { MenuItem } from '../types/menu'
import { normalizePrice } from '../lib/menuPrice'
import { useAuth } from './AuthContext'
import { authFetch, readApiJson } from '../lib/api'

export interface CartItem extends MenuItem {
  quantity: number
  categoryName: string
}

interface CartState {
  items: CartItem[]
  updatedAt: string | null
}

type CartAction =
  | { type: 'SYNC'; items: CartItem[]; updatedAt: string }
  | { type: 'ADD'; item: MenuItem; categoryName: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'INCREMENT'; id: string }
  | { type: 'DECREMENT'; id: string }
  | { type: 'CLEAR' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SYNC':
      return { items: action.items, updatedAt: action.updatedAt }
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return {
        ...state,
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
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'CLEAR':
      return { items: [], updatedAt: state.updatedAt }
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
  isSyncing: boolean
}

const CartContext = createContext<CartContextType | null>(null)

const POLL_MS = 2000

function cartFingerprint(items: CartItem[]): string {
  return JSON.stringify(
    items.map((i) => ({ id: i.id, q: i.quantity, p: i.price, n: i.name }))
  )
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, handleSessionInactive } = useAuth()
  const [state, dispatch] = useReducer(cartReducer, { items: [], updatedAt: null })
  const [isSyncing, setIsSyncing] = useState(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushing = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  const isEmployee = user?.role === 'employee'

  const pushCart = useCallback(
    async (items: CartItem[]) => {
      if (!isEmployee) return
      pushing.current = true
      try {
        const res = await authFetch('/api/cart', {
          method: 'PUT',
          body: JSON.stringify({ items }),
        })
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}))
          if (data.code === 'SESSION_INACTIVE') handleSessionInactive()
          return
        }
        if (res.ok) {
          const data = await readApiJson<{ items: CartItem[]; updatedAt: string }>(res)
          dispatch({ type: 'SYNC', items: data.items, updatedAt: data.updatedAt })
        }
      } finally {
        pushing.current = false
      }
    },
    [isEmployee, handleSessionInactive]
  )

  const schedulePush = useCallback(
    (items: CartItem[]) => {
      if (!isEmployee) return
      if (pushTimer.current) clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(() => {
        void pushCart(items)
      }, 250)
    },
    [isEmployee, pushCart]
  )

  const applyLocal = useCallback(
    (action: CartAction) => {
      const next = cartReducer(stateRef.current, action)
      dispatch(action)
      if (action.type !== 'SYNC') {
        schedulePush(next.items)
      }
    },
    [schedulePush]
  )

  const pullCart = useCallback(async () => {
    if (!isEmployee || pushing.current) return
    try {
      const res = await authFetch('/api/cart')
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        if (data.code === 'SESSION_INACTIVE') handleSessionInactive()
        return
      }
      if (!res.ok) return
      const data = await readApiJson<{ items: CartItem[]; updatedAt: string }>(res)
      const remoteTime = new Date(data.updatedAt).getTime()
      const localTime = stateRef.current.updatedAt
        ? new Date(stateRef.current.updatedAt).getTime()
        : 0
      const remoteChanged =
        cartFingerprint(data.items) !== cartFingerprint(stateRef.current.items)
      if (remoteTime > localTime || remoteChanged) {
        dispatch({ type: 'SYNC', items: data.items, updatedAt: data.updatedAt })
      }
    } catch {
      /* ignore poll errors */
    }
  }, [isEmployee, handleSessionInactive])

  useEffect(() => {
    if (!isEmployee) {
      dispatch({ type: 'CLEAR' })
      return
    }
    setIsSyncing(true)
    void pullCart().finally(() => setIsSyncing(false))
    const id = setInterval(() => void pullCart(), POLL_MS)
    return () => clearInterval(id)
  }, [isEmployee, user?.id, pullCart])

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = state.items.reduce(
    (sum, i) => sum + normalizePrice(i.price) * i.quantity,
    0
  )

  const addItem = (item: MenuItem, categoryName: string) =>
    applyLocal({ type: 'ADD', item, categoryName })
  const removeItem = (id: string) => applyLocal({ type: 'REMOVE', id })
  const increment = (id: string) => applyLocal({ type: 'INCREMENT', id })
  const decrement = (id: string) => applyLocal({ type: 'DECREMENT', id })

  const clearCart = () => {
    if (isEmployee) {
      void authFetch('/api/cart', { method: 'DELETE' }).then(async (res) => {
        if (res.ok) {
          const data = await readApiJson<{ items: CartItem[]; updatedAt: string }>(res)
          dispatch({ type: 'SYNC', items: data.items, updatedAt: data.updatedAt })
        } else {
          dispatch({ type: 'CLEAR' })
        }
      })
      return
    }
    dispatch({ type: 'CLEAR' })
  }

  const getQuantity = (id: string) => state.items.find((i) => i.id === id)?.quantity ?? 0

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        increment,
        decrement,
        clearCart,
        getQuantity,
        isSyncing,
      }}
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
