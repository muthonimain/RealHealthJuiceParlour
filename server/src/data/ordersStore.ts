import { allocateOrderId, isFormattedOrderId } from '../lib/orderNumber'
import { JsonCollection } from '../lib/persistence'

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

const ordersDb = new JsonCollection<Order>('orders.json')

function normalizeCounts(
  raw: SafeHandlingCounts | Record<string, number> | null | undefined
): SafeHandlingCounts {
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

function resolveGeneratedAt(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  const now = Date.now()
  const ts = parsed.getTime()
  if (ts > now + 60_000 || ts < now - 5 * 60_000) return null
  return parsed.toISOString()
}

function sortNewestFirst(list: Order[]): Order[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt'> & { generatedAt?: string; id?: string }
): Promise<Order> {
  let id = data.id?.trim() ?? ''
  if (!id || !isFormattedOrderId(id) || (await getOrderById(id))) {
    id = await allocateOrderId()
  }

  const order: Order = {
    id,
    employeeId: data.employeeId ?? '',
    employeeName: data.employeeName,
    items: data.items,
    subtotal: data.subtotal,
    deliveryIncluded: data.deliveryIncluded,
    safeHandlingAmount: data.safeHandlingAmount ?? 0,
    safeHandlingCounts: normalizeCounts(data.safeHandlingCounts),
    deliveryAmount: data.deliveryAmount ?? 0,
    packagingAmount: data.packagingAmount ?? 0,
    packaging30Count: data.packaging30Count ?? 0,
    packaging50Count: data.packaging50Count ?? 0,
    specialDeliveryAmount: data.specialDeliveryAmount ?? 0,
    boxAndTapesAmount: data.boxAndTapesAmount ?? 0,
    includePaybill854845: data.includePaybill854845 ?? false,
    includePaybill247247: data.includePaybill247247 ?? false,
    includeMpesaAgentStore: data.includeMpesaAgentStore ?? false,
    grandTotal: data.grandTotal,
    createdAt: resolveGeneratedAt(data.generatedAt) ?? new Date().toISOString(),
  }

  const all = ordersDb.read()
  all.unshift(order)
  ordersDb.write(all)
  return order
}

export async function getAllOrders(): Promise<Order[]> {
  return sortNewestFirst(ordersDb.read())
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return ordersDb.read().find((o) => o.id === id)
}

export async function updateOrder(
  id: string,
  data: Partial<Omit<Order, 'id'>> & { createdAt?: string }
): Promise<Order | undefined> {
  const all = ordersDb.read()
  const index = all.findIndex((o) => o.id === id)
  if (index < 0) return undefined

  const existing = all[index]
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

  const updated: Order = {
    id,
    employeeId: employeeId ?? '',
    employeeName: employeeName.trim(),
    items,
    subtotal,
    deliveryIncluded,
    safeHandlingAmount,
    safeHandlingCounts,
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
  }

  all[index] = updated
  ordersDb.write(all)
  return updated
}

export async function deleteOrder(id: string): Promise<boolean> {
  const all = ordersDb.read()
  const next = all.filter((o) => o.id !== id)
  if (next.length === all.length) return false
  ordersDb.write(next)
  return true
}

/** Delete orders with createdAt before YYYY-MM-DD (Kenya calendar day). */
export async function purgeOrdersBeforeDateKey(cutoffDateKey: string): Promise<number> {
  const all = ordersDb.read()
  const kept = all.filter((order) => {
    const day = new Date(order.createdAt).toLocaleDateString('en-CA', {
      timeZone: 'Africa/Nairobi',
    })
    return day >= cutoffDateKey
  })
  const deleted = all.length - kept.length
  if (deleted > 0) ordersDb.write(kept)
  return deleted
}

export async function deleteOrdersByEmployee(
  employeeId: string,
  employeeName: string,
  dateKey?: string
): Promise<number> {
  const name = employeeName.trim()
  const all = ordersDb.read()
  const before = all.length

  const next = all.filter((order) => {
    if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const orderDay = new Date(order.createdAt).toLocaleDateString('en-CA')
      if (orderDay !== dateKey) return true
    }

    if (employeeId.startsWith('name:')) {
      const matchName = employeeId.slice(5).trim() || name
      return order.employeeName !== matchName
    }

    const matchesId = order.employeeId === employeeId
    const matchesName =
      order.employeeName === name ||
      (!order.employeeId && order.employeeName === name)
    return !(matchesId || matchesName)
  })

  ordersDb.write(next)
  return before - next.length
}
