import { toDateKey } from '../lib/dateKey'
import { pool } from '../db/pool'

export { toDateKey }

export interface DailyClearance {
  employeeId: string
  employeeName: string
  dateKey: string
  clearedAt: string
  clearedBy: string
}

interface ClearanceRow {
  employee_id: string
  employee_name: string
  date_key: string
  cleared_at: Date
  cleared_by: string
}

function mapClearance(row: ClearanceRow): DailyClearance {
  const dateKey =
    typeof row.date_key === 'string'
      ? row.date_key.slice(0, 10)
      : new Date(row.date_key).toISOString().slice(0, 10)
  return {
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    dateKey,
    clearedAt: new Date(row.cleared_at).toISOString(),
    clearedBy: row.cleared_by,
  }
}

export async function findClearance(
  employeeId: string,
  dateKey: string
): Promise<DailyClearance | undefined> {
  const { rows } = await pool.query<ClearanceRow>(
    'SELECT * FROM clearances WHERE employee_id = $1 AND date_key = $2::date',
    [employeeId, dateKey]
  )
  return rows[0] ? mapClearance(rows[0]) : undefined
}

export function resolveClearanceStatus(
  ordersForDay: { createdAt: string }[],
  clearance: DailyClearance | undefined
): 'pending' | 'cleared' {
  if (ordersForDay.length === 0) return 'cleared'
  if (!clearance) return 'pending'

  const clearedAtMs = new Date(clearance.clearedAt).getTime()
  const hasOrdersAfterClearance = ordersForDay.some(
    (o) => new Date(o.createdAt).getTime() > clearedAtMs
  )
  return hasOrdersAfterClearance ? 'pending' : 'cleared'
}

export async function revokeClearanceIfSuperseded(
  employeeId: string,
  employeeName: string,
  orderCreatedAt: string
): Promise<void> {
  const dateKey = toDateKey(orderCreatedAt)
  const createdMs = new Date(orderCreatedAt).getTime()

  const clearance = await findClearance(employeeId, dateKey)
  if (!clearance && employeeName) {
    const { rows } = await pool.query<ClearanceRow>(
      'SELECT * FROM clearances WHERE date_key = $1::date AND employee_name = $2',
      [dateKey, employeeName]
    )
    if (rows[0] && createdMs > new Date(rows[0].cleared_at).getTime()) {
      await pool.query(
        'DELETE FROM clearances WHERE employee_id = $1 AND date_key = $2::date',
        [rows[0].employee_id, dateKey]
      )
    }
    return
  }

  if (clearance && createdMs > new Date(clearance.clearedAt).getTime()) {
    await pool.query(
      'DELETE FROM clearances WHERE employee_id = $1 AND date_key = $2::date',
      [employeeId, dateKey]
    )
  }
}

export async function clearEmployeeDay(
  employeeId: string,
  employeeName: string,
  dateKey: string,
  clearedBy: string
): Promise<DailyClearance> {
  const clearedAt = new Date().toISOString()
  const { rows } = await pool.query<ClearanceRow>(
    `INSERT INTO clearances (employee_id, employee_name, date_key, cleared_at, cleared_by)
     VALUES ($1, $2, $3::date, $4::timestamptz, $5)
     ON CONFLICT (employee_id, date_key)
     DO UPDATE SET
       employee_name = EXCLUDED.employee_name,
       cleared_at = EXCLUDED.cleared_at,
       cleared_by = EXCLUDED.cleared_by
     RETURNING *`,
    [employeeId, employeeName, dateKey, clearedAt, clearedBy]
  )
  return mapClearance(rows[0])
}

export async function getClearancesForDate(dateKey: string): Promise<DailyClearance[]> {
  const { rows } = await pool.query<ClearanceRow>(
    'SELECT * FROM clearances WHERE date_key = $1::date',
    [dateKey]
  )
  return rows.map(mapClearance)
}
