import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'
import { toDateKey } from '../lib/dateKey'
import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  getExpensesForDate,
  sumExpensesForDate,
  updateExpense,
} from '../data/expenseStore'
import { listEmployees } from '../data/employees'
import { listOwners } from '../data/owners'

const router = Router()

async function staffDisplayName(userId: string, role: string): Promise<string> {
  if (role === 'owner') {
    return listOwners().find((o) => o.id === userId)?.name ?? 'Owner'
  }
  const employees = await listEmployees()
  return employees.find((e) => e.id === userId)?.name ?? 'Employee'
}

router.use(requireAuth, requireRole('owner', 'employee'))

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const dateFilter = typeof req.query.date === 'string' ? req.query.date : ''

    if (dateFilter) {
      const items = await getExpensesForDate(dateFilter)
      res.json({
        dateKey: dateFilter,
        items,
        total: await sumExpensesForDate(dateFilter),
      })
      return
    }

    const items = await getAllExpenses()
    res.json({
      dateKey: null,
      items,
      total: items.reduce((sum, e) => sum + e.amount, 0),
    })
  })
)

router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { description, amount, date } = req.body as {
      description?: string
      amount?: number
      date?: string
    }

    if (!description?.trim()) {
      res.status(400).json({ message: 'Description is required.' })
      return
    }

    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      res.status(400).json({ message: 'Amount must be greater than 0.' })
      return
    }

    const role = req.user?.role === 'owner' ? 'owner' : 'employee'
    const userId = req.user?.id ?? ''
    const dateKey =
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : toDateKey()

    const expense = await createExpense({
      description: description.trim(),
      amount: Math.round(parsed),
      recordedById: userId,
      recordedByName: await staffDisplayName(userId, role),
      recordedByRole: role,
      dateKey,
    })

    res.status(201).json({
      expense,
      total: await sumExpensesForDate(dateKey),
      items: await getExpensesForDate(dateKey),
    })
  })
)

router.patch(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    const { description, amount, date } = req.body as {
      description?: string
      amount?: number
      date?: string
    }

    const updates: { description?: string; amount?: number; dateKey?: string } = {}
    if (description !== undefined) {
      if (!description.trim()) {
        res.status(400).json({ message: 'Description is required.' })
        return
      }
      updates.description = description.trim()
    }
    if (amount !== undefined) {
      const parsed = Number(amount)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        res.status(400).json({ message: 'Amount must be greater than 0.' })
        return
      }
      updates.amount = Math.round(parsed)
    }
    if (typeof date === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ message: 'Invalid date format.' })
        return
      }
      updates.dateKey = date
    }

    const expense = await updateExpense(id, updates)
    if (!expense) {
      res.status(404).json({ message: 'Expense not found.' })
      return
    }

    const items = await getAllExpenses()
    res.json({
      expense,
      items,
      total: items.reduce((sum, e) => sum + e.amount, 0),
    })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    if (!(await deleteExpense(id))) {
      res.status(404).json({ message: 'Expense not found.' })
      return
    }
    const items = await getAllExpenses()
    res.json({
      success: true,
      items,
      total: items.reduce((sum, e) => sum + e.amount, 0),
    })
  })
)

export default router
