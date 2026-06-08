import { pool } from '../db/pool'

export interface EmployeeCartItem {
  id: string
  name: string
  price: number
  quantity: number
  categoryName: string
  categoryId?: string
  note?: string
  section?: string
}

interface CartRow {
  employee_id: string
  items: EmployeeCartItem[]
  updated_at: Date
}

export async function getEmployeeCart(employeeId: string): Promise<{
  items: EmployeeCartItem[]
  updatedAt: string
}> {
  const { rows } = await pool.query<CartRow>(
    'SELECT items, updated_at FROM employee_carts WHERE employee_id = $1',
    [employeeId]
  )
  if (!rows[0]) {
    return { items: [], updatedAt: new Date(0).toISOString() }
  }
  return {
    items: rows[0].items ?? [],
    updatedAt: new Date(rows[0].updated_at).toISOString(),
  }
}

export async function setEmployeeCart(
  employeeId: string,
  items: EmployeeCartItem[]
): Promise<{ items: EmployeeCartItem[]; updatedAt: string }> {
  const { rows } = await pool.query<CartRow>(
    `INSERT INTO employee_carts (employee_id, items, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (employee_id) DO UPDATE SET
       items = EXCLUDED.items,
       updated_at = NOW()
     RETURNING items, updated_at`,
    [employeeId, JSON.stringify(items)]
  )
  return {
    items: rows[0].items ?? [],
    updatedAt: new Date(rows[0].updated_at).toISOString(),
  }
}

export async function clearEmployeeCart(employeeId: string): Promise<void> {
  await pool.query('DELETE FROM employee_carts WHERE employee_id = $1', [employeeId])
}
