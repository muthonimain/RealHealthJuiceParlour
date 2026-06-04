import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { getAllOrders } from '../data/ordersStore'
import { listEmployees } from '../data/employees'
import {
  toDateKey,
  clearEmployeeDay,
  getClearancesForDate,
  resolveClearanceStatus,
} from '../data/clearanceStore'

const router = Router()

export interface EmployeeDaySummary {
  employeeId: string
  employeeName: string
  dateKey: string
  totalOrders: number
  totalAmount: number
  status: 'pending' | 'cleared'
  clearedAt?: string
  clearedBy?: string
}

async function buildSummaries(dateKey: string): Promise<EmployeeDaySummary[]> {
  const allOrders = await getAllOrders()
  const orders = allOrders.filter((o) => toDateKey(o.createdAt) === dateKey)
  const clearances = await getClearancesForDate(dateKey)

  const byEmployee = new Map<string, { name: string; orders: typeof orders; total: number }>()

  for (const emp of await listEmployees()) {
    byEmployee.set(emp.id, { name: emp.name, orders: [], total: 0 })
  }

  for (const order of orders) {
    const id = order.employeeId || `name:${order.employeeName}`
    if (!byEmployee.has(id)) {
      byEmployee.set(id, { name: order.employeeName, orders: [], total: 0 })
    }
    const entry = byEmployee.get(id)!
    entry.orders.push(order)
    entry.total += order.grandTotal
  }

  const summaries: EmployeeDaySummary[] = []

  for (const [employeeId, data] of byEmployee) {
    if (employeeId.startsWith('name:') && data.orders.length === 0) continue

    const clearance = clearances.find((c) => c.employeeId === employeeId)
    const status = resolveClearanceStatus(data.orders, clearance)

    summaries.push({
      employeeId,
      employeeName: data.name,
      dateKey,
      totalOrders: data.orders.length,
      totalAmount: data.total,
      status,
      clearedAt: status === 'cleared' ? clearance?.clearedAt : undefined,
      clearedBy: status === 'cleared' ? clearance?.clearedBy : undefined,
    })
  }

  return summaries.sort((a, b) => b.totalAmount - a.totalAmount)
}

router.get(
  '/summaries',
  asyncHandler(async (req: Request, res: Response) => {
    const dateKey =
      typeof req.query.date === 'string' && req.query.date ? req.query.date : toDateKey()
    res.json(await buildSummaries(dateKey))
  })
)

router.post(
  '/clear',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, employeeName, date, clearedBy } = req.body as {
      employeeId: string
      employeeName: string
      date?: string
      clearedBy?: string
    }

    if (!employeeId || !employeeName) {
      res.status(400).json({ message: 'employeeId and employeeName are required.' })
      return
    }

    const dateKey = date || toDateKey()
    const record = await clearEmployeeDay(
      employeeId,
      employeeName,
      dateKey,
      clearedBy || 'Owner'
    )

    res.json({
      ...record,
      summaries: await buildSummaries(dateKey),
    })
  })
)

export default router
