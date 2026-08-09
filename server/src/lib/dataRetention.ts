import { toDayKey } from './workingMonth'
import { purgeOrdersBeforeDateKey } from '../data/ordersStore'
import { purgeExpensesBeforeDateKey } from '../data/expenseStore'
import { purgeClearancesBeforeDateKey } from '../data/clearanceStore'

/**
 * Keep current month + previous calendar month only.
 * Anything older than the 1st of the previous month is purged.
 * Items sold and employee sales come from orders, so they follow the same window.
 */
export function getRetentionCutoffDateKey(reference: Date = new Date()): string {
  const todayKey = toDayKey(reference)
  const [year, month] = todayKey.split('-').map(Number)
  let prevYear = year
  let prevMonth = month - 1
  if (prevMonth < 1) {
    prevMonth = 12
    prevYear -= 1
  }
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
}

export interface RetentionPurgeResult {
  cutoffDateKey: string
  deletedOrders: number
  deletedExpenses: number
  deletedClearances: number
}

/** Remove sales/expenses/clearances older than the retention window. */
export async function purgeRecordsOlderThanPreviousMonth(
  reference: Date = new Date()
): Promise<RetentionPurgeResult> {
  const cutoffDateKey = getRetentionCutoffDateKey(reference)
  const deletedOrders = await purgeOrdersBeforeDateKey(cutoffDateKey)
  const deletedExpenses = await purgeExpensesBeforeDateKey(cutoffDateKey)
  const deletedClearances = await purgeClearancesBeforeDateKey(cutoffDateKey)

  if (deletedOrders || deletedExpenses || deletedClearances) {
    console.log(
      '[data] Retention purge (keep from %s): orders=%d expenses=%d clearances=%d',
      cutoffDateKey,
      deletedOrders,
      deletedExpenses,
      deletedClearances
    )
  }

  return { cutoffDateKey, deletedOrders, deletedExpenses, deletedClearances }
}

let lastPurgeDay = ''

/** Run retention at most once per Kenya calendar day (for long-running servers). */
export async function purgeRecordsIfNeeded(): Promise<void> {
  const today = toDayKey()
  if (lastPurgeDay === today) return
  lastPurgeDay = today
  await purgeRecordsOlderThanPreviousMonth()
}
