import { getAllOrders } from '../data/ordersStore'
import type { OrderItem } from '../data/ordersStore'
import { toMonthKey, workingMonthLabel, countOrdersForWorkingMonth } from '../lib/workingMonth'

export interface ProductSalesRow {
  productId: string
  name: string
  categoryName: string
  quantitySold: number
  revenue: number
  orderCount: number
}

export interface ProductSalesReport {
  monthKey: string
  monthLabel: string
  orderCount: number
  totalUnitsSold: number
  uniqueProductsSold: number
  topProducts: ProductSalesRow[]
  leastProducts: ProductSalesRow[]
}

const TOP_LIMIT = 10
const LEAST_LIMIT = 10

function aggregateProducts(
  items: OrderItem[],
  orderId: string,
  map: Map<
    string,
    ProductSalesRow & { orderIds: Set<string> }
  >
) {
  const seenInOrder = new Set<string>()

  for (const item of items) {
    const productId = item.id?.trim() || item.name.trim()
    const name = item.name.trim() || 'Unknown item'
    const categoryName = item.categoryName?.trim() || '—'
    const lineRevenue = item.price * item.quantity

    let row = map.get(productId)
    if (!row) {
      row = {
        productId,
        name,
        categoryName,
        quantitySold: 0,
        revenue: 0,
        orderCount: 0,
        orderIds: new Set<string>(),
      }
      map.set(productId, row)
    }

    row.quantitySold += item.quantity
    row.revenue += lineRevenue
    if (!seenInOrder.has(productId)) {
      seenInOrder.add(productId)
      row.orderIds.add(orderId)
    }
  }
}

export async function buildProductSalesReport(monthKey: string): Promise<ProductSalesReport> {
  const allOrders = await getAllOrders()
  const monthOrders = allOrders.filter((o) => toMonthKey(o.createdAt) === monthKey)

  const map = new Map<string, ProductSalesRow & { orderIds: Set<string> }>()

  for (const order of monthOrders) {
    aggregateProducts(order.items, order.id, map)
  }

  const rows: ProductSalesRow[] = Array.from(map.values()).map((r) => ({
    productId: r.productId,
    name: r.name,
    categoryName: r.categoryName,
    quantitySold: r.quantitySold,
    revenue: r.revenue,
    orderCount: r.orderIds.size,
  }))

  const byQuantityDesc = [...rows].sort((a, b) => {
    if (b.quantitySold !== a.quantitySold) return b.quantitySold - a.quantitySold
    return b.revenue - a.revenue
  })

  const byQuantityAsc = [...rows].sort((a, b) => {
    if (a.quantitySold !== b.quantitySold) return a.quantitySold - b.quantitySold
    return a.revenue - b.revenue
  })

  const referenceDate = new Date(`${monthKey}-01T12:00:00`)

  return {
    monthKey,
    monthLabel: workingMonthLabel(referenceDate),
    orderCount: countOrdersForWorkingMonth(allOrders, referenceDate),
    totalUnitsSold: rows.reduce((sum, r) => sum + r.quantitySold, 0),
    uniqueProductsSold: rows.length,
    topProducts: byQuantityDesc.slice(0, TOP_LIMIT),
    leastProducts: byQuantityAsc.slice(0, LEAST_LIMIT),
  }
}
