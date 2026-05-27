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

// In-memory store — persists while server is running
const orders: Order[] = []

export function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Order {
  const order: Order = {
    ...data,
    id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  }
  orders.unshift(order) // newest first
  return order
}

export function getAllOrders(): Order[] {
  return orders
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id)
}
