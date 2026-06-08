import fs from 'fs'
import path from 'path'
import { pool, requireDatabase } from './pool'
import { buildDefaultMenu } from './menuSeed'
import { findPresetForCategory } from '../data/categorySectionPresets'
import type { MenuCategory } from '../data/menuStore'
import type { Order } from '../data/ordersStore'
import type { Expense } from '../data/expenseStore'
import type { DailyClearance } from '../data/clearanceStore'
import { syncOrderNumberSequence } from '../lib/orderNumber'
import { seedEmployeesFromEnvIfEmpty } from '../data/employeeStore'

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
      const sectionsJson = cat.sections?.length ? JSON.stringify(cat.sections) : null
      await client.query(
        `INSERT INTO menu_categories (id, name, emoji, color, light_color, text_color, sort_order, sections)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.name, cat.emoji, cat.color, cat.lightColor, cat.textColor, sort++, sectionsJson]
      )
      let itemSort = 0
      for (const item of cat.items) {
        await client.query(
          `INSERT INTO menu_items (id, category_id, name, price, note, section, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [
            item.id,
            cat.id,
            item.name,
            item.price,
            item.note ?? null,
            item.section ?? null,
            itemSort++,
          ]
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

async function runMenuMigrations(): Promise<void> {
  await pool.query(`ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS sections JSONB`)
  await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS section TEXT`)

  const { rows: categories } = await pool.query<{ id: string; name: string }>(
    'SELECT id, name FROM menu_categories'
  )

  for (const cat of categories) {
    const preset = findPresetForCategory(cat.id, cat.name)
    if (!preset) continue

    await pool.query(`UPDATE menu_categories SET sections = $1::jsonb WHERE id = $2`, [
      JSON.stringify(preset.sections),
      cat.id,
    ])
    await pool.query(
      `UPDATE menu_items SET section = $2
       WHERE category_id = $1
         AND (section IS NULL OR TRIM(section) = '' OR LOWER(TRIM(section)) = 'more')`,
      [cat.id, preset.defaultItemSection]
    )
  }

  for (const seedCat of buildDefaultMenu()) {
    const exists = categories.some((c) => c.id === seedCat.id)
    if (!exists && seedCat.sections?.length) {
      await seedMenu([seedCat])
    }
  }

  const gutId = categories.find(
    (c) => findPresetForCategory(c.id, c.name)?.nameIncludes === 'guthealing'
  )?.id

  if (gutId) {
    await pool.query(
      `UPDATE menu_items SET
         name = REPLACE(name, 'Kombucha –', 'Plain Kombucha –'),
         section = 'Plain Kombucha'
       WHERE category_id = $1 AND id IN ('gh-1', 'gh-2', 'gh-3')`,
      [gutId]
    )
    const flavored = [
      { id: 'gh-f1', name: 'Flavored Kombucha – Small', price: 100 },
      { id: 'gh-f2', name: 'Flavored Kombucha – Medium', price: 200 },
      { id: 'gh-f3', name: 'Flavored Kombucha – Large', price: 350 },
    ]
    for (let i = 0; i < flavored.length; i++) {
      const item = flavored[i]
      await pool.query(
        `INSERT INTO menu_items (id, category_id, name, price, note, section, sort_order)
         VALUES ($1, $2, $3, $4, NULL, 'Flavored Kombucha', $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           section = EXCLUDED.section`,
        [item.id, gutId, item.name, item.price, 10 + i]
      )
    }
    await pool.query(
      `UPDATE menu_items SET section = 'Other Drinks'
       WHERE category_id = $1 AND id IN ('gh-4', 'gh-5', 'gh-6')`,
      [gutId]
    )
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
  await runMenuMigrations()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_number_seq (
      year_suffix CHAR(2) PRIMARY KEY,
      last_number INT NOT NULL DEFAULT 0
    )
  `)
  await syncOrderNumberSequence()
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS safe_handling_amount INT NOT NULL DEFAULT 0`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS safe_handling_counts JSONB NOT NULL DEFAULT '{}'::jsonb`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_amount INT NOT NULL DEFAULT 0`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS include_paybill BOOLEAN NOT NULL DEFAULT FALSE`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS include_paybill_247247 BOOLEAN NOT NULL DEFAULT FALSE`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_30_count INT NOT NULL DEFAULT 0`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_50_count INT NOT NULL DEFAULT 0`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_delivery_amount INT NOT NULL DEFAULT 0`
  )
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS box_and_tapes_amount INT NOT NULL DEFAULT 0`
  )
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_sessions (
      session_id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee ON employee_sessions(employee_id)
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_carts (
      employee_id TEXT PRIMARY KEY,
      items JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await seedEmployeesFromEnvIfEmpty()

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
