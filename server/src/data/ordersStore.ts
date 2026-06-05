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
  packagingAmount: number
  specialDeliveryAmount: number
  boxAndTapesAmount: number
  includePaybill: boolean
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
  packaging_amount: number
  special_delivery_amount: number
  box_and_tapes_amount: number
  include_paybill: boolean
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
    packagingAmount: row.packaging_amount ?? 0,
    specialDeliveryAmount: row.special_delivery_amount ?? 0,
    boxAndTapesAmount: row.box_and_tapes_amount ?? 0,
    includePaybill: row.include_paybill ?? false,
    grandTotal: row.grand_total,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

function resolveGeneratedAt(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  const now = Date.now()
  const ts = parsed.getTime()
  // Accept client clock within 5 min past or 1 min future (minor skew).
  if (ts > now + 60_000 || ts < now - 5 * 60_000) return null
  return parsed.toISOString()
}

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt'> & { generatedAt?: string }
): Promise<Order> {
  const id = await allocateOrderId()
  const generatedAt = resolveGeneratedAt(data.generatedAt)
  const { rows } = await pool.query<OrderRow>(
    generatedAt
      ? `INSERT INTO orders (id, employee_id, employee_name, items, subtotal, delivery_included, delivery_amount, packaging_amount, special_delivery_amount, box_and_tapes_amount, include_paybill, grand_total, created_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamptz)
         RETURNING *`
      : `INSERT INTO orders (id, employee_id, employee_name, items, subtotal, delivery_included, delivery_amount, packaging_amount, special_delivery_amount, box_and_tapes_amount, include_paybill, grand_total)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
    generatedAt
      ? [
          id,
          data.employeeId ?? '',
          data.employeeName,
          JSON.stringify(data.items),
          data.subtotal,
          data.deliveryIncluded,
          data.deliveryAmount,
          data.packagingAmount ?? 0,
          data.specialDeliveryAmount ?? 0,
          data.boxAndTapesAmount ?? 0,
          data.includePaybill ?? false,
          data.grandTotal,
          generatedAt,
        ]
      : [
          id,
          data.employeeId ?? '',
          data.employeeName,
          JSON.stringify(data.items),
          data.subtotal,
          data.deliveryIncluded,
          data.deliveryAmount,
          data.packagingAmount ?? 0,
          data.specialDeliveryAmount ?? 0,
          data.boxAndTapesAmount ?? 0,
          data.includePaybill ?? false,
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

export async function updateOrder(
  id: string,
  data: Partial<Omit<Order, 'id'>> & { createdAt?: string }
): Promise<Order | undefined> {
  const existing = await getOrderById(id)
  if (!existing) return undefined

  const items = data.items ?? existing.items
  const subtotal = data.subtotal ?? existing.subtotal
  const deliveryIncluded = data.deliveryIncluded ?? existing.deliveryIncluded
  const deliveryAmount = data.deliveryAmount ?? existing.deliveryAmount
  const packagingAmount = data.packagingAmount ?? existing.packagingAmount
  const specialDeliveryAmount = data.specialDeliveryAmount ?? existing.specialDeliveryAmount
  const boxAndTapesAmount = data.boxAndTapesAmount ?? existing.boxAndTapesAmount
  const includePaybill = data.includePaybill ?? existing.includePaybill
  const grandTotal = data.grandTotal ?? existing.grandTotal
  const employeeId = data.employeeId ?? existing.employeeId
  const employeeName = data.employeeName ?? existing.employeeName
  const createdAt = data.createdAt ?? existing.createdAt

  if (!employeeName?.trim() || !items?.length) return undefined
  if (
    subtotal < 0 ||
    grandTotal < 0 ||
    deliveryAmount < 0 ||
    packagingAmount < 0 ||
    specialDeliveryAmount < 0 ||
    boxAndTapesAmount < 0
  ) {
    return undefined
  }

  const { rows } = await pool.query<OrderRow>(
    `UPDATE orders SET
       employee_id = $2,
       employee_name = $3,
       items = $4::jsonb,
       subtotal = $5,
       delivery_included = $6,
       delivery_amount = $7,
       packaging_amount = $8,
       special_delivery_amount = $9,
       box_and_tapes_amount = $10,
       include_paybill = $11,
       grand_total = $12,
       created_at = $13::timestamptz
     WHERE id = $1
     RETURNING *`,
    [
      id,
      employeeId ?? '',
      employeeName.trim(),
      JSON.stringify(items),
      subtotal,
      deliveryIncluded,
      deliveryAmount,
      packagingAmount,
      specialDeliveryAmount,
      boxAndTapesAmount,
      includePaybill,
      grandTotal,
      createdAt,
    ]
  )
  return rows[0] ? mapOrder(rows[0]) : undefined
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}
