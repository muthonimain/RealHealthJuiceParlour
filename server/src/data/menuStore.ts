import { menuData as seedMenu } from './menu'
import { pool } from '../db/pool'

export interface MenuItem {
  id: string
  name: string
  price: number
  note?: string
  section?: string
}

export interface MenuCategory {
  id: string
  name: string
  emoji: string
  color: string
  lightColor: string
  textColor: string
  sections?: string[]
  items: MenuItem[]
}

const SEED_PRICE_BY_ID: Record<string, number> = {}
for (const cat of seedMenu) {
  for (const item of cat.items) {
    if (item.price > 0) SEED_PRICE_BY_ID[item.id] = item.price
  }
}

const COLOR_PRESETS = [
  { color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  { color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-700' },
  { color: 'bg-cyan-600', lightColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
  { color: 'bg-rose-500', lightColor: 'bg-rose-50', textColor: 'text-rose-700' },
  { color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-700' },
]

function normalizePrice(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function normalizeItem(item: MenuItem): MenuItem {
  let price = normalizePrice(item.price)
  if (price === 0 && item.note?.toLowerCase().includes('on request')) {
    return { ...item, price: 0 }
  }
  if (price === 0 && SEED_PRICE_BY_ID[item.id] !== undefined) {
    price = SEED_PRICE_BY_ID[item.id]
  }
  return { ...item, price }
}

function normalizeCategory(cat: MenuCategory): MenuCategory {
  return {
    ...cat,
    items: cat.items.map(normalizeItem),
  }
}

function parseSections(value: unknown): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const list = value.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    return list.length ? list : undefined
  }
  return undefined
}

interface CategoryRow {
  id: string
  name: string
  emoji: string
  color: string
  light_color: string
  text_color: string
  sections: unknown
}

interface ItemRow {
  id: string
  category_id: string
  name: string
  price: number
  note: string | null
  section: string | null
}

async function loadItemsByCategory(): Promise<Map<string, MenuItem[]>> {
  const { rows } = await pool.query<ItemRow>(
    'SELECT * FROM menu_items ORDER BY category_id, sort_order'
  )
  const map = new Map<string, MenuItem[]>()
  for (const row of rows) {
    const list = map.get(row.category_id) ?? []
    list.push({
      id: row.id,
      name: row.name,
      price: row.price,
      note: row.note ?? undefined,
      section: row.section ?? undefined,
    })
    map.set(row.category_id, list)
  }
  return map
}

async function loadCategoriesFromDb(): Promise<MenuCategory[]> {
  const { rows } = await pool.query<CategoryRow>(
    'SELECT * FROM menu_categories ORDER BY sort_order'
  )
  const itemsByCat = await loadItemsByCategory()
  return rows.map((c: CategoryRow) =>
    normalizeCategory({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      lightColor: c.light_color,
      textColor: c.text_color,
      sections: parseSections(c.sections),
      items: itemsByCat.get(c.id) ?? [],
    })
  )
}

function slugify(name: string, existingIds: Set<string>): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  let id = base || 'category'
  let n = 1
  while (existingIds.has(id)) {
    id = `${base}-${n++}`
  }
  return id
}

function newItemId(categoryId: string): string {
  return `${categoryId}-item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
}

export async function getAllCategories(): Promise<MenuCategory[]> {
  return loadCategoriesFromDb()
}

export async function getCategoryById(id: string): Promise<MenuCategory | undefined> {
  const all = await loadCategoriesFromDb()
  return all.find((c) => c.id === id)
}

export async function createCategory(name: string, emoji = '📋'): Promise<MenuCategory> {
  const existing = await loadCategoriesFromDb()
  const ids = new Set(existing.map((c) => c.id))
  const preset = COLOR_PRESETS[existing.length % COLOR_PRESETS.length]
  const id = slugify(name, ids)
  const sortOrder = existing.length

  await pool.query(
    `INSERT INTO menu_categories (id, name, emoji, color, light_color, text_color, sort_order, sections)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, name.trim(), emoji, preset.color, preset.lightColor, preset.textColor, sortOrder, null]
  )

  return {
    id,
    name: name.trim(),
    emoji,
    items: [],
    sections: undefined,
    ...preset,
  }
}

export async function updateCategory(
  id: string,
  data: Partial<Pick<MenuCategory, 'name' | 'emoji'>>
): Promise<MenuCategory | undefined> {
  const cat = await getCategoryById(id)
  if (!cat) return undefined

  const name = data.name !== undefined ? data.name.trim() : cat.name
  const emoji = data.emoji !== undefined ? data.emoji : cat.emoji

  await pool.query('UPDATE menu_categories SET name = $2, emoji = $3 WHERE id = $1', [
    id,
    name,
    emoji,
  ])

  return getCategoryById(id)
}

export async function deleteCategory(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM menu_categories WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

export async function addItem(
  categoryId: string,
  data: { name: string; price: number; note?: string; section?: string }
): Promise<MenuItem | undefined> {
  const cat = await getCategoryById(categoryId)
  if (!cat) return undefined

  let section = data.section?.trim() || undefined
  if (section && cat.sections?.length) {
    const match = cat.sections.find((s) => s.toLowerCase() === section!.toLowerCase())
    section = match ?? section
  }

  const item: MenuItem = {
    id: newItemId(categoryId),
    name: data.name.trim(),
    price: normalizePrice(data.price),
    note: data.note?.trim() || undefined,
    section,
  }

  await pool.query(
    `INSERT INTO menu_items (id, category_id, name, price, note, section, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [item.id, categoryId, item.name, item.price, item.note ?? null, item.section ?? null, cat.items.length]
  )

  return item
}

export async function updateItem(
  categoryId: string,
  itemId: string,
  data: Partial<Pick<MenuItem, 'name' | 'price' | 'note' | 'section'>>
): Promise<MenuItem | undefined> {
  const cat = await getCategoryById(categoryId)
  const existing = cat?.items.find((i) => i.id === itemId)
  if (!existing) return undefined

  const name = data.name !== undefined ? data.name.trim() : existing.name
  const price = data.price !== undefined ? normalizePrice(data.price) : existing.price
  const note = data.note !== undefined ? data.note.trim() || undefined : existing.note
  let section = data.section !== undefined ? data.section.trim() || undefined : existing.section
  if (section && cat?.sections?.length) {
    const match = cat.sections.find((s) => s.toLowerCase() === section!.toLowerCase())
    section = match ?? section
  }

  await pool.query(
    'UPDATE menu_items SET name = $3, price = $4, note = $5, section = $6 WHERE category_id = $1 AND id = $2',
    [categoryId, itemId, name, price, note ?? null, section ?? null]
  )

  return { id: itemId, name, price, note, section }
}

export async function deleteItem(categoryId: string, itemId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM menu_items WHERE category_id = $1 AND id = $2',
    [categoryId, itemId]
  )
  return (result.rowCount ?? 0) > 0
}
