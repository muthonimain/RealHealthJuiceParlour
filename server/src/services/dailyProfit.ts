import { toDateKey } from '../lib/dateKey'
import { DAILY_OPERATIONAL_COST } from '../constants/finance'
import { getAllOrders } from '../data/ordersStore'
import { getExpensesForDate, sumExpensesForDate } from '../data/expenseStore'

export interface DailyProfitSummary {
  dateKey: string
  todayRevenue: number
  costOfGoods: number
  grossProfit: number
  dailyOperationalCost: number
  netProfit: number
  orderCount: number
  expenseCount: number
}

export async function buildDailyProfit(dateKey: string = toDateKey()): Promise<DailyProfitSummary> {
  const allOrders = await getAllOrders()
  const dayOrders = allOrders.filter((o) => toDateKey(o.createdAt) === dateKey)
  const todayRevenue = dayOrders.reduce((sum, o) => sum + o.grandTotal, 0)
  const costOfGoods = await sumExpensesForDate(dateKey)
  const grossProfit = todayRevenue - costOfGoods
  const netProfit = grossProfit - DAILY_OPERATIONAL_COST
  const dayExpenses = await getExpensesForDate(dateKey)

  return {
    dateKey,
    todayRevenue,
    costOfGoods,
    grossProfit,
    dailyOperationalCost: DAILY_OPERATIONAL_COST,
    netProfit,
    orderCount: dayOrders.length,
    expenseCount: dayExpenses.length,
  }
}
