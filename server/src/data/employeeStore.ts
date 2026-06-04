import '../env'
import { pool } from '../db/pool'

export interface EmployeeRecord {
  id: string
  name: string
  username: string
}

export interface EmployeeWithPassword extends EmployeeRecord {
  password: string
}

interface EmployeeRow {
  id: string
  name: string
  username: string
  password: string
  sort_order: number
}

function mapEmployee(row: EmployeeRow): EmployeeWithPassword {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    password: row.password,
  }
}

const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

function loadEmployeesFromEnv(): EmployeeWithPassword[] {
  const employees: EmployeeWithPassword[] = []
  let i = 1
  while (true) {
    const name = env(`EMPLOYEE_${i}_NAME`, '')
    const username = env(`EMPLOYEE_${i}_USERNAME`, '')
    const password = env(`EMPLOYEE_${i}_PASSWORD`, '')
    if (!name && !username) break
    const resolvedUsername = username || `employee${i}`
    employees.push({
      id: `emp-${i}`,
      name: name || resolvedUsername,
      username: resolvedUsername,
      password,
    })
    i++
  }
  return employees
}

export async function countEmployees(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM employees')
  return Number(rows[0]?.count ?? 0)
}

export async function seedEmployeesFromEnvIfEmpty(): Promise<void> {
  if ((await countEmployees()) > 0) return
  const fromEnv = loadEmployeesFromEnv()
  if (!fromEnv.length) return

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let sort = 0
    for (const emp of fromEnv) {
      await client.query(
        `INSERT INTO employees (id, name, username, password, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [emp.id, emp.name, emp.username, emp.password, sort++]
      )
    }
    await client.query('COMMIT')
    console.log('[db] Seeded %d employees from environment', fromEnv.length)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function listEmployees(): Promise<EmployeeRecord[]> {
  const { rows } = await pool.query<EmployeeRow>(
    'SELECT * FROM employees ORDER BY sort_order ASC, name ASC'
  )
  return rows.map(({ password: _p, ...rest }) => rest)
}

export async function listEmployeesWithPasswords(): Promise<EmployeeWithPassword[]> {
  const { rows } = await pool.query<EmployeeRow>(
    'SELECT * FROM employees ORDER BY sort_order ASC, name ASC'
  )
  return rows.map(mapEmployee)
}

export async function getEmployeeById(id: string): Promise<EmployeeRecord | null> {
  const { rows } = await pool.query<EmployeeRow>('SELECT * FROM employees WHERE id = $1', [id])
  if (!rows[0]) return null
  const { password: _p, ...rest } = mapEmployee(rows[0])
  return rest
}

export async function verifyEmployeeLogin(
  username: string,
  password: string
): Promise<EmployeeRecord | null> {
  const u = username.trim().toLowerCase()
  const p = password.trim()
  if (!u || !p) return null

  const { rows } = await pool.query<EmployeeRow>(
    'SELECT * FROM employees WHERE LOWER(username) = $1 AND password = $2',
    [u, p]
  )
  if (!rows[0]) return null
  const { password: _pw, ...publicEmployee } = mapEmployee(rows[0])
  return publicEmployee
}

async function usernameTaken(username: string, exceptId?: string): Promise<boolean> {
  const u = username.trim().toLowerCase()
  const { rows } = await pool.query<{ id: string }>(
    exceptId
      ? 'SELECT id FROM employees WHERE LOWER(username) = $1 AND id <> $2 LIMIT 1'
      : 'SELECT id FROM employees WHERE LOWER(username) = $1 LIMIT 1',
    exceptId ? [u, exceptId] : [u]
  )
  return rows.length > 0
}

function newEmployeeId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export async function createEmployee(data: {
  name: string
  username?: string
  password: string
}): Promise<EmployeeWithPassword> {
  const name = data.name.trim()
  const password = data.password.trim()
  const username = (data.username?.trim() || name).trim()
  if (!name) throw new Error('Employee name is required.')
  if (!username) throw new Error('Username is required.')
  if (!password) throw new Error('Password is required.')
  if (await usernameTaken(username)) throw new Error('That username is already in use.')

  const { rows: sortRows } = await pool.query<{ max: number | null }>(
    'SELECT MAX(sort_order) AS max FROM employees'
  )
  const sortOrder = (sortRows[0]?.max ?? -1) + 1
  const id = newEmployeeId()

  const { rows } = await pool.query<EmployeeRow>(
    `INSERT INTO employees (id, name, username, password, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, name, username, password, sortOrder]
  )
  return mapEmployee(rows[0])
}

export async function updateEmployee(
  id: string,
  data: { name?: string; username?: string; password?: string }
): Promise<EmployeeWithPassword | null> {
  const existing = await pool.query<EmployeeRow>('SELECT * FROM employees WHERE id = $1', [id])
  if (!existing.rows[0]) return null

  const name = data.name !== undefined ? data.name.trim() : existing.rows[0].name
  const username =
    data.username !== undefined ? data.username.trim() : existing.rows[0].username
  const password =
    data.password !== undefined ? data.password.trim() : existing.rows[0].password

  if (!name) throw new Error('Employee name is required.')
  if (!username) throw new Error('Username is required.')
  if (!password) throw new Error('Password is required.')
  if (await usernameTaken(username, id)) throw new Error('That username is already in use.')

  const { rows } = await pool.query<EmployeeRow>(
    `UPDATE employees SET name = $2, username = $3, password = $4 WHERE id = $1 RETURNING *`,
    [id, name, username, password]
  )
  return mapEmployee(rows[0])
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1', [id])
  return (rowCount ?? 0) > 0
}
