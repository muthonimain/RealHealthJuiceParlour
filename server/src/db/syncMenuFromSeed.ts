import { pool } from './pool'
import { buildDefaultMenu } from './menuSeed'
import type { MenuCategory } from '../data/menuStore'

/** Bump when menu.ts changes and deployed DB should be replaced. */
export const MENU_SEED_REVISION = 2

async function getAppliedRevision(): Promise<number> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  const { rows } = await pool.query<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = 'menu_seed_revision'`
  )
  const n = parseInt(rows[0]?.value ?? '0', 10)
  return Number.isFinite(n) ? n : 0
}

async function setAppliedRevision(revision: number): Promise<void> {
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('menu_seed_revision', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(revision)]
  )
}

async function replaceMenu(categories: MenuCategory[]): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM menu_items')
    await client.query('DELETE FROM menu_categories')

    let sort = 0
    for (const cat of categories) {
      const sectionsJson = cat.sections?.length ? JSON.stringify(cat.sections) : null
      await client.query(
        `INSERT INTO menu_categories (id, name, emoji, color, light_color, text_color, sort_order, sections)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [cat.id, cat.name, cat.emoji, cat.color, cat.lightColor, cat.textColor, sort++, sectionsJson]
      )
      let itemSort = 0
      for (const item of cat.items) {
        await client.query(
          `INSERT INTO menu_items (id, category_id, name, price, note, section, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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

/** Replace the live menu when menu.ts revision advances (e.g. after a PDF menu update). */
export async function syncMenuFromSeedIfNeeded(): Promise<void> {
  const applied = await getAppliedRevision()
  if (applied >= MENU_SEED_REVISION) return

  const menu = buildDefaultMenu()
  await replaceMenu(menu)
  await setAppliedRevision(MENU_SEED_REVISION)
  console.log('[db] Menu replaced from seed (revision %d, %d categories)', MENU_SEED_REVISION, menu.length)
}
