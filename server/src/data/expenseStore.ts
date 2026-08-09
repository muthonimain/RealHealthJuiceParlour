import { toDateKey } from '../lib/dateKey'
import { JsonCollection } from '../lib/persistence'

export { toDateKey }

export interface Expense {
  id: string
  dateKey: string
  description: string
  amount: number
  recordedById: string
  recordedByName: string
  recordedByRole: 'owner' | 'employee'
  createdAt: string
}

const expensesDb = new JsonCollection<Expense>('expenses.json')

export async function getExpensesForDate(dateKey: string): Promise<Expense[]> {
  return expensesDb
    .read()
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getAllExpenses(): Promise<Expense[]> {
  return expensesDb
    .read()
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
}

export async function sumExpensesForDate(dateKey: string): Promise<number> {
  const items = await getExpensesForDate(dateKey)
  return items.reduce((sum, e) => sum + e.amount, 0)
}

export async function createExpense(data: {
  description: string
  amount: number
  recordedById: string
  recordedByName: string
  recordedByRole: 'owner' | 'employee'
  dateKey?: string
}): Promise<Expense> {
  const expense: Expense = {
    id: `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    dateKey: data.dateKey ?? toDateKey(),
    description: data.description.trim(),
    amount: data.amount,
    recordedById: data.recordedById,
    recordedByName: data.recordedByName,
    recordedByRole: data.recordedByRole,
    createdAt: new Date().toISOString(),
  }
  const all = expensesDb.read()
  all.unshift(expense)
  expensesDb.write(all)
  return expense
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  return expensesDb.read().find((e) => e.id === id)
}

export async function updateExpense(
  id: string,
  data: { description?: string; amount?: number; dateKey?: string }
): Promise<Expense | undefined> {
  const all = expensesDb.read()
  const index = all.findIndex((e) => e.id === id)
  if (index < 0) return undefined

  const existing = all[index]
  const description = data.description?.trim() ?? existing.description
  const amount =
    data.amount !== undefined ? Math.round(Number(data.amount)) : existing.amount
  const dateKey = data.dateKey ?? existing.dateKey

  if (!description) return undefined
  if (!Number.isFinite(amount) || amount <= 0) return undefined

  const updated: Expense = { ...existing, description, amount, dateKey }
  all[index] = updated
  expensesDb.write(all)
  return updated
}

export async function deleteExpense(id: string): Promise<boolean> {
  const all = expensesDb.read()
  const next = all.filter((e) => e.id !== id)
  if (next.length === all.length) return false
  expensesDb.write(next)
  return true
}

/** Delete expenses with dateKey before YYYY-MM-DD. */
export async function purgeExpensesBeforeDateKey(cutoffDateKey: string): Promise<number> {
  const all = expensesDb.read()
  const kept = all.filter((e) => e.dateKey >= cutoffDateKey)
  const deleted = all.length - kept.length
  if (deleted > 0) expensesDb.write(kept)
  return deleted
}
