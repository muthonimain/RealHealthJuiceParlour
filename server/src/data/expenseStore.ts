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
