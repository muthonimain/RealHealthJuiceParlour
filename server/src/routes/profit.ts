import { Router, Response } from 'express'
import { requireAuth, requireRole } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'
import { toDateKey } from '../lib/dateKey'
import { buildDailyProfit } from '../services/dailyProfit'
import { getExpensesForDate } from '../data/expenseStore'

const router = Router()

router.use(requireAuth, requireRole('owner'))

router.get(
  '/daily',
  asyncHandler(async (req, res: Response) => {
    const dateParam = typeof req.query.date === 'string' ? req.query.date.trim() : ''
    const dateKey =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : toDateKey()

    res.json({
      ...(await buildDailyProfit(dateKey)),
      expenses: await getExpensesForDate(dateKey),
    })
  })
)

export default router
