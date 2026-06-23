import { pool } from '../db/pool'
import { allocateOrderId, isFormattedOrderId } from '../lib/orderNumber'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  categoryName: string
}

export type SafeHandlingCounts = Partial<Record<number, number>>

export interface Order {
  id: string
  employeeId: string
  employeeName: string
  items: OrderItem[]
  subtotal: number
  deliveryIncluded: boolean
  safeHandlingAmount: number
  safeHandlingCounts: SafeHandlingCounts
  deliveryAmount: number
  packagingAmount: number
  packaging30Count: number
  packaging50Count: number
  specialDeliveryAmount: number
  boxAndTapesAmount: number
  includePaybill854845: boolean
  includePaybill247247: boolean
  includeMpesaAgentStore: boolean
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
  safe_handling_amount: number
  safe_handling_counts: SafeHandlingCounts | null
  delivery_amount: number
  packaging_amount: number
  packaging_30_count: number
  packaging_50_count: number
  special_delivery_amount: number
  box_and_tapes_amount: number
  include_paybill: boolean
  include_paybill_247247: boolean
  include_mpesa_agent_store?: boolean
  grand_total: number
  created_at: Date
}

function normalizeCounts(raw: SafeHandlingCounts | Record<string, number> | null | undefined): SafeHandlingCounts {
  if (!raw || typeof raw !== 'object') return {}
  const normalized: SafeHandlingCounts = {}
  for (const [key, value] of Object.entries(raw)) {
    const amount = Number(key)
    const count = Number(value)
    if (Number.isFinite(amount) && Number.isFinite(count) && count > 0) {
      normalized[amount] = Math.floor(count)
    }
  }
  return normalized
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    items: row.items,
    subtotal: row.subtotal,
    deliveryIncluded: row.delivery_included,
    safeHandlingAmount: row.safe_handling_amount ?? 0,
    safeHandlingCounts: normalizeCounts(row.safe_handling_counts),
    deliveryAmount: row.delivery_amount,
    packagingAmount: row.packaging_amount ?? 0,
    packaging30Count: row.packaging_30_count ?? 0,
    packaging50Count: row.packaging_50_count ?? 0,
    specialDeliveryAmount: row.special_delivery_amount ?? 0,
    boxAndTapesAmount: row.box_and_tapes_amount ?? 0,
    includePaybill854845: row.include_paybill ?? false,
    includePaybill247247: row.include_paybill_247247 ?? false,
    includeMpesaAgentStore: row.include_mpesa_agent_store ?? false,
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
  if (ts > now + 60_000 || ts < now - 5 * 60_000) return null
  return parsed.toISOString()
}

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt'> & { generatedAt?: string; id?: string }
): Promise<Order> {
  let id = data.id?.trim() ?? ''
  if (!id || !isFormattedOrderId(id) || (await getOrderById(id))) {
    id = await allocateOrderId()
  }
  const generatedAt = resolveGeneratedAt(data.generatedAt)
  const safeHandlingCounts = normalizeCounts(data.safeHandlingCounts)
  const { rows } = await pool.query<OrderRow>(
    generatedAt
      ? `INSERT INTO orders (
           id, employee_id, employee_name, items, subtotal, delivery_included,
           safe_handling_amount, safe_handling_counts,
           delivery_amount, packaging_amount, packaging_30_count, packaging_50_count,
           special_delivery_amount, box_and_tapes_amount, include_paybill, include_paybill_247247, include_mpesa_agent_store, grand_total, created_at
         )
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::timestamptz)
         RETURNING *`
      : `INSERT INTO orders (
           id, employee_id, employee_name, items, subtotal, delivery_included,
           safe_handling_amount, safe_handling_counts,
           delivery_amount, packaging_amount, packaging_30_count, packaging_50_count,
           special_delivery_amount, box_and_tapes_amount, include_paybill, include_paybill_247247, include_mpesa_agent_store, grand_total
         )
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
    generatedAt
      ? [
          id,
          data.employeeId ?? '',
          data.employeeName,
          JSON.stringify(data.items),
          data.subtotal,
          data.deliveryIncluded,
          data.safeHandlingAmount ?? 0,
          JSON.stringify(safeHandlingCounts),
          data.deliveryAmount ?? 0,
          data.packagingAmount ?? 0,
          data.packaging30Count ?? 0,
          data.packaging50Count ?? 0,
          data.specialDeliveryAmount ?? 0,
          data.boxAndTapesAmount ?? 0,
          data.includePaybill854845 ?? false,
          data.includePaybill247247 ?? false,
          data.includeMpesaAgentStore ?? false,
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
          data.safeHandlingAmount ?? 0,
          JSON.stringify(safeHandlingCounts),
          data.deliveryAmount ?? 0,
          data.packagingAmount ?? 0,
          data.packaging30Count ?? 0,
          data.packaging50Count ?? 0,
          data.specialDeliveryAmount ?? 0,
          data.boxAndTapesAmount ?? 0,
          data.includePaybill854845 ?? false,
          data.includePaybill247247 ?? false,
          data.includeMpesaAgentStore ?? false,
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
  const safeHandlingAmount = data.safeHandlingAmount ?? existing.safeHandlingAmount
  const safeHandlingCounts = data.safeHandlingCounts
    ? normalizeCounts(data.safeHandlingCounts)
    : existing.safeHandlingCounts
  const deliveryAmount = data.deliveryAmount ?? existing.deliveryAmount
  const packagingAmount = data.packagingAmount ?? existing.packagingAmount
  const packaging30Count = data.packaging30Count ?? existing.packaging30Count
  const packaging50Count = data.packaging50Count ?? existing.packaging50Count
  const specialDeliveryAmount = data.specialDeliveryAmount ?? existing.specialDeliveryAmount
  const boxAndTapesAmount = data.boxAndTapesAmount ?? existing.boxAndTapesAmount
  const includePaybill854845 = data.includePaybill854845 ?? existing.includePaybill854845
  const includePaybill247247 = data.includePaybill247247 ?? existing.includePaybill247247
  const includeMpesaAgentStore = data.includeMpesaAgentStore ?? existing.includeMpesaAgentStore
  const grandTotal = data.grandTotal ?? existing.grandTotal
  const employeeId = data.employeeId ?? existing.employeeId
  const employeeName = data.employeeName ?? existing.employeeName
  const createdAt = data.createdAt ?? existing.createdAt

  if (!employeeName?.trim() || !items?.length) return undefined
  if (
    subtotal < 0 ||
    grandTotal < 0 ||
    safeHandlingAmount < 0 ||
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
       safe_handling_amount = $7,
       safe_handling_counts = $8::jsonb,
       delivery_amount = $9,
       packaging_amount = $10,
       packaging_30_count = $11,
       packaging_50_count = $12,
       special_delivery_amount = $13,
       box_and_tapes_amount = $14,
       include_paybill = $15,
       include_paybill_247247 = $16,
       include_mpesa_agent_store = $17,
       grand_total = $18,
       created_at = $19::timestamptz
     WHERE id = $1
     RETURNING *`,
    [
      id,
      employeeId ?? '',
      employeeName.trim(),
      JSON.stringify(items),
      subtotal,
      deliveryIncluded,
      safeHandlingAmount,
      JSON.stringify(safeHandlingCounts),
      deliveryAmount,
      packagingAmount,
      packaging30Count,
      packaging50Count,
      specialDeliveryAmount,
      boxAndTapesAmount,
      includePaybill854845,
      includePaybill247247,
      includeMpesaAgentStore,
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

export async function deleteOrdersByEmployee(
  employeeId: string,
  employeeName: string,
  dateKey?: string
): Promise<number> {
  const name = employeeName.trim()
  const dateFilter =
    dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
      ? `AND created_at::date = $${employeeId.startsWith('name:') ? 2 : 3}::date`
      : ''
  const dateParams = dateFilter ? [dateKey] : []

  const { rowCount } = employeeId.startsWith('name:')
    ? await pool.query(
        `DELETE FROM orders WHERE employee_name = $1 ${dateFilter}`,
        [employeeId.slice(5).trim() || name, ...dateParams]
      )
    : await pool.query(
        `DELETE FROM orders
         WHERE (employee_id = $1
            OR (COALESCE(employee_id, '') = '' AND employee_name = $2)
            OR employee_name = $2)
         ${dateFilter}`,
        [employeeId, name, ...dateParams]
      )
  return rowCount ?? 0
}
