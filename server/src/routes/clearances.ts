import { Router, Request, Response } from 'express'
import { getAllOrders } from '../data/ordersStore'
import { employees } from '../data/employees'
import {
  toDateKey,
  isCleared,
  clearEmployeeDay,
  getClearancesForDate,
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

function buildSummaries(dateKey: string): EmployeeDaySummary[] {
  const orders = getAllOrders().filter((o) => toDateKey(o.createdAt) === dateKey)
  const clearances = getClearancesForDate(dateKey)

  const byEmployee = new Map<string, { name: string; orders: typeof orders; total: number }>()

  for (const emp of employees) {
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
    const cleared = isCleared(employeeId, dateKey)
    const hasOrders = data.orders.length > 0

    summaries.push({
      employeeId,
      employeeName: data.name,
      dateKey,
      totalOrders: data.orders.length,
      totalAmount: data.total,
      status: hasOrders ? (cleared ? 'cleared' : 'pending') : 'cleared',
      clearedAt: clearance?.clearedAt,
      clearedBy: clearance?.clearedBy,
    })
  }

  return summaries.sort((a, b) => b.totalAmount - a.totalAmount)
}

// GET /api/clearances/summaries?date=YYYY-MM-DD
router.get('/summaries', (req: Request, res: Response) => {
  const dateKey =
    typeof req.query.date === 'string' && req.query.date
      ? req.query.date
      : toDateKey()
  res.json(buildSummaries(dateKey))
})

// POST /api/clearances/clear — owner clears an employee for a day
router.post('/clear', (req: Request, res: Response) => {
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
  const record = clearEmployeeDay(
    employeeId,
    employeeName,
    dateKey,
    clearedBy || 'Owner'
  )

  res.json({
    ...record,
    summaries: buildSummaries(dateKey),
  })
})

export default router
