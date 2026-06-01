import { loadJson, saveJson } from '../lib/persistence'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  categoryName: string
}

export interface Order {
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

const ORDERS_FILE = 'orders.json'

// Load saved orders on server start (survives refresh & restarts)
let orders: Order[] = loadJson<Order[]>(ORDERS_FILE, [])

function persistOrders() {
  saveJson(ORDERS_FILE, orders)
}

export function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Order {
  const order: Order = {
    ...data,
    id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  }
  orders.unshift(order)
  persistOrders()
  return order
}

export function getAllOrders(): Order[] {
  return orders
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id)
}

export function toDateKey(isoOrDate: Date | string = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-CA')
}

export interface DailyRevenue {
  dateKey: string
  orderCount: number
  revenue: number
}

export function getRevenueStats() {
  const allTimeRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0)
  const todayKey = toDateKey()

  const byDay = new Map<string, { orderCount: number; revenue: number }>()
  for (const order of orders) {
    const key = toDateKey(order.createdAt)
    const entry = byDay.get(key) ?? { orderCount: 0, revenue: 0 }
    entry.orderCount += 1
    entry.revenue += order.grandTotal
    byDay.set(key, entry)
  }

  const daily: DailyRevenue[] = [...byDay.entries()]
    .map(([dateKey, v]) => ({ dateKey, orderCount: v.orderCount, revenue: v.revenue }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))

  const today = byDay.get(todayKey) ?? { orderCount: 0, revenue: 0 }

  return {
    today: {
      dateKey: todayKey,
      orderCount: today.orderCount,
      revenue: today.revenue,
    },
    allTime: {
      orderCount: orders.length,
      revenue: allTimeRevenue,
    },
    daily,
  }
}
