import { menuData as seedMenu } from './menu'
import { findPresetForCategory } from './categorySectionPresets'
import { JsonCollection } from '../lib/persistence'

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

const menuDb = new JsonCollection<MenuCategory>('menu.json')

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
    items: sortItemsByNameGroups(cat.items.map(normalizeItem)),
  }
}

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase()
}

function normalizeSectionKey(section?: string): string {
  return (section ?? '').trim().toLowerCase()
}

/** Keep same-named items adjacent while preserving each name group's menu position. */
function sortItemsByNameGroups(items: MenuItem[]): MenuItem[] {
  if (items.length <= 1) return items

  const groups = new Map<string, { position: number; items: MenuItem[] }>()
  items.forEach((item, index) => {
    const key = normalizeNameKey(item.name)
    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, { position: index, items: [item] })
    } else {
      existing.items.push(item)
    }
  })

  return [...groups.values()]
    .sort((a, b) => a.position - b.position)
    .flatMap((g) => g.items)
}

function computeInsertIndex(items: MenuItem[], name: string, section?: string): number {
  const nameKey = normalizeNameKey(name)
  const sectionKey = normalizeSectionKey(section)
  let lastMatch = -1
  for (let i = 0; i < items.length; i++) {
    if (
      normalizeNameKey(items[i].name) === nameKey &&
      normalizeSectionKey(items[i].section) === sectionKey
    ) {
      lastMatch = i
    }
  }
  return lastMatch === -1 ? items.length : lastMatch + 1
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

function readNormalized(): MenuCategory[] {
  return menuDb.read().map(normalizeCategory)
}

function writeAll(categories: MenuCategory[]): void {
  menuDb.write(categories.map(normalizeCategory))
}

function ensureCategorySections(cat: MenuCategory): MenuCategory {
  if (cat.sections?.length) return cat
  const preset = findPresetForCategory(cat.id, cat.name)
  if (!preset) return cat
  return { ...cat, sections: preset.sections }
}

export async function getAllCategories(): Promise<MenuCategory[]> {
  const raw = readNormalized()
  let changed = false
  const all = raw.map((cat) => {
    const next = ensureCategorySections(cat)
    if (next !== cat && JSON.stringify(next.sections) !== JSON.stringify(cat.sections)) {
      changed = true
    }
    return next
  })
  if (changed) writeAll(all)
  return all
}

export async function getCategoryById(id: string): Promise<MenuCategory | undefined> {
  const all = await getAllCategories()
  return all.find((c) => c.id === id)
}

export async function createCategory(name: string, emoji = '📋'): Promise<MenuCategory> {
  const existing = readNormalized()
  const ids = new Set(existing.map((c) => c.id))
  const preset = COLOR_PRESETS[existing.length % COLOR_PRESETS.length]
  const id = slugify(name, ids)
  const trimmedName = name.trim()
  const sectionPreset = findPresetForCategory(id, trimmedName)

  const created: MenuCategory = {
    id,
    name: trimmedName,
    emoji,
    items: [],
    sections: sectionPreset?.sections,
    ...preset,
  }
  existing.push(created)
  writeAll(existing)
  return created
}

export async function updateCategory(
  id: string,
  data: Partial<Pick<MenuCategory, 'name' | 'emoji' | 'sections'>>
): Promise<MenuCategory | undefined> {
  const all = readNormalized()
  const index = all.findIndex((c) => c.id === id)
  if (index < 0) return undefined

  const cat = all[index]
  const name = data.name !== undefined ? data.name.trim() : cat.name
  const emoji = data.emoji !== undefined ? data.emoji : cat.emoji
  let sections = data.sections
  if (sections === undefined) {
    const preset = findPresetForCategory(id, name)
    if (preset) sections = preset.sections
    else sections = cat.sections
  }

  all[index] = {
    ...cat,
    name,
    emoji,
    sections: sections?.length ? sections : undefined,
  }
  writeAll(all)
  return all[index]
}

export async function deleteCategory(id: string): Promise<boolean> {
  const all = readNormalized()
  const next = all.filter((c) => c.id !== id)
  if (next.length === all.length) return false
  writeAll(next)
  return true
}

export async function addItem(
  categoryId: string,
  data: { name: string; price: number; note?: string; section?: string }
): Promise<MenuItem | undefined> {
  const all = readNormalized()
  const cat = all.find((c) => c.id === categoryId)
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

  const insertAt = computeInsertIndex(cat.items, item.name, item.section)
  cat.items.splice(insertAt, 0, item)
  writeAll(all)
  return item
}

export async function updateItem(
  categoryId: string,
  itemId: string,
  data: Partial<Pick<MenuItem, 'name' | 'price' | 'note' | 'section'>>
): Promise<MenuItem | undefined> {
  const all = readNormalized()
  const cat = all.find((c) => c.id === categoryId)
  if (!cat) return undefined

  const existingIndex = cat.items.findIndex((i) => i.id === itemId)
  if (existingIndex < 0) return undefined
  const existing = cat.items[existingIndex]

  const name = data.name !== undefined ? data.name.trim() : existing.name
  const price = data.price !== undefined ? normalizePrice(data.price) : existing.price
  const note = data.note !== undefined ? data.note.trim() || undefined : existing.note
  let section = data.section !== undefined ? data.section.trim() || undefined : existing.section
  if (section && cat.sections?.length) {
    const match = cat.sections.find((s) => s.toLowerCase() === section!.toLowerCase())
    section = match ?? section
  }

  const updated: MenuItem = { id: itemId, name, price, note, section }
  const nameChanged = normalizeNameKey(name) !== normalizeNameKey(existing.name)
  const sectionChanged = normalizeSectionKey(section) !== normalizeSectionKey(existing.section)

  if (nameChanged || sectionChanged) {
    const remaining = cat.items.filter((i) => i.id !== itemId)
    const insertAt = computeInsertIndex(remaining, name, section)
    remaining.splice(insertAt, 0, updated)
    cat.items = remaining
  } else {
    cat.items[existingIndex] = updated
  }

  writeAll(all)
  return updated
}

export async function deleteItem(categoryId: string, itemId: string): Promise<boolean> {
  const all = readNormalized()
  const cat = all.find((c) => c.id === categoryId)
  if (!cat) return false
  const before = cat.items.length
  cat.items = cat.items.filter((i) => i.id !== itemId)
  if (cat.items.length === before) return false
  writeAll(all)
  return true
}

/** Replace entire menu (used by seed sync). */
export async function replaceAllCategories(categories: MenuCategory[]): Promise<void> {
  writeAll(categories)
}

export async function isMenuEmpty(): Promise<boolean> {
  return menuDb.read().length === 0
}
