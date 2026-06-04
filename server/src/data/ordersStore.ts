import { pool } from '../db/pool'
import { allocateOrderId } from '../lib/orderNumber'

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

interface OrderRow {
  id: string
  employee_id: string
  employee_name: string
  items: OrderItem[]
  subtotal: number
  delivery_included: boolean
  delivery_amount: number
  grand_total: number
  created_at: Date
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    items: row.items,
    subtotal: row.subtotal,
    deliveryIncluded: row.delivery_included,
    deliveryAmount: row.delivery_amount,
    grandTotal: row.grand_total,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const id = await allocateOrderId()
  const { rows } = await pool.query<OrderRow>(
    `INSERT INTO orders (id, employee_id, employee_name, items, subtotal, delivery_included, delivery_amount, grand_total)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
     RETURNING *`,
    [
      id,
      data.employeeId ?? '',
      data.employeeName,
      JSON.stringify(data.items),
      data.subtotal,
      data.deliveryIncluded,
      data.deliveryAmount,
      data.grandTotal,
    ]
  )
  return mapOrder(rows[0])
}

export async function getAllOrders(): Promise<Order[]> {
  const { rows } = await pool.query<OrderRow>(
    'SELECT * FROM orders ORDER BY created_at DESC'
  )
  return rows.map(mapOrder)
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const { rows } = await pool.query<OrderRow>('SELECT * FROM orders WHERE id = $1', [id])
  return rows[0] ? mapOrder(rows[0]) : undefined
}
