import { randomUUID } from 'crypto'
import { pool } from '../db/pool'

const SESSION_TTL_MS = 90_000

interface SessionRow {
  session_id: string
  employee_id: string
  last_seen_at: Date
}

/** Start a new device session for this employee (multiple devices allowed — shared cart). */
export async function createEmployeeSession(employeeId: string): Promise<string> {
  const sessionId = randomUUID()
  await pool.query(
    `INSERT INTO employee_sessions (session_id, employee_id, last_seen_at)
     VALUES ($1, $2, NOW())`,
    [sessionId, employeeId]
  )
  return sessionId
}

export async function touchEmployeeSession(
  employeeId: string,
  sessionId: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE employee_sessions
     SET last_seen_at = NOW()
     WHERE employee_id = $1 AND session_id = $2`,
    [employeeId, sessionId]
  )
  return (rowCount ?? 0) > 0
}

export async function releaseEmployeeSession(employeeId: string, sessionId: string): Promise<void> {
  await pool.query('DELETE FROM employee_sessions WHERE employee_id = $1 AND session_id = $2', [
    employeeId,
    sessionId,
  ])
}

export async function isEmployeeSessionActive(employeeId: string, sessionId: string): Promise<boolean> {
  const { rows } = await pool.query<SessionRow>(
    `SELECT last_seen_at FROM employee_sessions
     WHERE employee_id = $1 AND session_id = $2`,
    [employeeId, sessionId]
  )
  if (!rows[0]) return false
  const lastSeen = new Date(rows[0].last_seen_at).getTime()
  return Date.now() - lastSeen < SESSION_TTL_MS
}

/** Employees with at least one live device session (shown on staff picker). */
export async function getActiveEmployeeIds(): Promise<string[]> {
  const { rows } = await pool.query<{ employee_id: string }>(
    `SELECT DISTINCT employee_id FROM employee_sessions
     WHERE last_seen_at >= NOW() - INTERVAL '90 seconds'`
  )
  return rows.map((r) => r.employee_id)
}

/** Block a second person from picking an already-active staff name on the sign-in screen. */
export async function isEmployeeInUseByAnotherSession(
  employeeId: string,
  currentSessionId?: string
): Promise<boolean> {
  const { rows } = await pool.query<{ session_id: string }>(
    `SELECT session_id FROM employee_sessions
     WHERE employee_id = $1
       AND last_seen_at >= NOW() - INTERVAL '90 seconds'`,
    [employeeId]
  )
  if (rows.length === 0) return false
  if (currentSessionId && rows.every((r) => r.session_id === currentSessionId)) return false
  return true
}
