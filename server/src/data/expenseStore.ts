import { toDateKey } from '../lib/dateKey'
import { pool } from '../db/pool'

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

interface ExpenseRow {
  id: string
  date_key: string
  description: string
  amount: number
  recorded_by_id: string
  recorded_by_name: string
  recorded_by_role: 'owner' | 'employee'
  created_at: Date
}

function mapExpense(row: ExpenseRow): Expense {
  const dateKey =
    typeof row.date_key === 'string'
      ? row.date_key.slice(0, 10)
      : new Date(row.date_key).toISOString().slice(0, 10)
  return {
    id: row.id,
    dateKey,
    description: row.description,
    amount: row.amount,
    recordedById: row.recorded_by_id,
    recordedByName: row.recorded_by_name,
    recordedByRole: row.recorded_by_role,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function getExpensesForDate(dateKey: string): Promise<Expense[]> {
  const { rows } = await pool.query<ExpenseRow>(
    `SELECT * FROM expenses WHERE date_key = $1::date ORDER BY created_at DESC`,
    [dateKey]
  )
  return rows.map(mapExpense)
}

export async function getAllExpenses(): Promise<Expense[]> {
  const { rows } = await pool.query<ExpenseRow>(
    'SELECT * FROM expenses ORDER BY date_key DESC, created_at DESC'
  )
  return rows.map(mapExpense)
}

export async function sumExpensesForDate(dateKey: string): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    'SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses WHERE date_key = $1::date',
    [dateKey]
  )
  return Number(rows[0]?.total ?? 0)
}

export async function createExpense(data: {
  description: string
  amount: number
  recordedById: string
  recordedByName: string
  recordedByRole: 'owner' | 'employee'
  dateKey?: string
}): Promise<Expense> {
  const id = `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const dateKey = data.dateKey ?? toDateKey()
  const { rows } = await pool.query<ExpenseRow>(
    `INSERT INTO expenses (id, date_key, description, amount, recorded_by_id, recorded_by_name, recorded_by_role)
     VALUES ($1, $2::date, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      id,
      dateKey,
      data.description.trim(),
      data.amount,
      data.recordedById,
      data.recordedByName,
      data.recordedByRole,
    ]
  )
  return mapExpense(rows[0])
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  const { rows } = await pool.query<ExpenseRow>('SELECT * FROM expenses WHERE id = $1', [id])
  return rows[0] ? mapExpense(rows[0]) : undefined
}

export async function updateExpense(
  id: string,
  data: { description?: string; amount?: number; dateKey?: string }
): Promise<Expense | undefined> {
  const existing = await getExpenseById(id)
  if (!existing) return undefined

  const description = data.description?.trim() ?? existing.description
  const amount =
    data.amount !== undefined ? Math.round(Number(data.amount)) : existing.amount
  const dateKey = data.dateKey ?? existing.dateKey

  if (!description) return undefined
  if (!Number.isFinite(amount) || amount <= 0) return undefined

  const { rows } = await pool.query<ExpenseRow>(
    `UPDATE expenses SET date_key = $2::date, description = $3, amount = $4 WHERE id = $1 RETURNING *`,
    [id, dateKey, description, amount]
  )
  return rows[0] ? mapExpense(rows[0]) : undefined
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM expenses WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}
