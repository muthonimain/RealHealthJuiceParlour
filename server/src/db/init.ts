import fs from 'fs'
import path from 'path'
import { pool, requireDatabase } from './pool'
import { buildDefaultMenu } from './menuSeed'
import type { MenuCategory } from '../data/menuStore'
import type { Order } from '../data/ordersStore'
import type { Expense } from '../data/expenseStore'
import type { DailyClearance } from '../data/clearanceStore'

const PERSIST_DIR = path.join(__dirname, '../../persisted')

function readJsonFile<T>(filename: string): T | null {
  const filePath = path.join(PERSIST_DIR, filename)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

async function runSchema(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf-8')
  await pool.query(sql)
}

async function seedMenu(categories: MenuCategory[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let sort = 0
    for (const cat of categories) {
      await client.query(
        `INSERT INTO menu_categories (id, name, emoji, color, light_color, text_color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.name, cat.emoji, cat.color, cat.lightColor, cat.textColor, sort++]
      )
      let itemSort = 0
      for (const item of cat.items) {
        await client.query(
          `INSERT INTO menu_items (id, category_id, name, price, note, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [item.id, cat.id, item.name, item.price, item.note ?? null, itemSort++]
        )
      }
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

async function importOrders(orders: Order[]): Promise<void> {
  for (const o of orders) {
    await pool.query(
      `INSERT INTO orders (id, employee_id, employee_name, items, subtotal, delivery_included, delivery_amount, grand_total, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9::timestamptz)
       ON CONFLICT (id) DO NOTHING`,
      [
        o.id,
        o.employeeId ?? '',
        o.employeeName,
        JSON.stringify(o.items),
        o.subtotal,
        o.deliveryIncluded,
        o.deliveryAmount,
        o.grandTotal,
        o.createdAt,
      ]
    )
  }
}

async function importExpenses(items: Expense[]): Promise<void> {
  for (const e of items) {
    await pool.query(
      `INSERT INTO expenses (id, date_key, description, amount, recorded_by_id, recorded_by_name, recorded_by_role, created_at)
       VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8::timestamptz)
       ON CONFLICT (id) DO NOTHING`,
      [
        e.id,
        e.dateKey,
        e.description,
        e.amount,
        e.recordedById,
        e.recordedByName,
        e.recordedByRole,
        e.createdAt,
      ]
    )
  }
}

async function importClearances(items: DailyClearance[]): Promise<void> {
  for (const c of items) {
    await pool.query(
      `INSERT INTO clearances (employee_id, employee_name, date_key, cleared_at, cleared_by)
       VALUES ($1, $2, $3::date, $4::timestamptz, $5)
       ON CONFLICT (employee_id, date_key) DO NOTHING`,
      [c.employeeId, c.employeeName, c.dateKey, c.clearedAt, c.clearedBy]
    )
  }
}

export async function initDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'DATABASE_URL is required. On DigitalOcean App Platform, attach a PostgreSQL database to inject this variable.'
    )
  }

  requireDatabase()
  await runSchema()

  const { rows: menuCount } = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM menu_categories'
  )
  if (Number(menuCount[0]?.count) === 0) {
    const fromFile = readJsonFile<MenuCategory[]>('menu.json')
    const menu = fromFile?.length ? fromFile : buildDefaultMenu()
    await seedMenu(menu)
    console.log('[db] Menu seeded (%d categories)', menu.length)
  }

  const { rows: orderCount } = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM orders'
  )
  if (Number(orderCount[0]?.count) === 0) {
    const orders = readJsonFile<Order[]>('orders.json')
    if (orders?.length) {
      await importOrders(orders)
      console.log('[db] Imported %d orders from persisted JSON', orders.length)
    }
  }

  const { rows: expenseCount } = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM expenses'
  )
  if (Number(expenseCount[0]?.count) === 0) {
    const expenses = readJsonFile<Expense[]>('expenses.json')
    if (expenses?.length) {
      await importExpenses(expenses)
      console.log('[db] Imported %d expenses from persisted JSON', expenses.length)
    }
  }

  const clearances = readJsonFile<DailyClearance[]>('clearances.json')
  if (clearances?.length) {
    await importClearances(clearances)
    console.log('[db] Merged clearances from persisted JSON')
  }

  console.log('[db] PostgreSQL ready')
}
