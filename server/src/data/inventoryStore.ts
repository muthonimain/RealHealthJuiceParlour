import { loadJson, saveJson } from '../lib/persistence'

export interface InventoryEntry {
  id: string
  dateKey: string
  description: string
  moneyIn: number
  moneyOut: number
  notes?: string
  createdAt: string
}

const FILE = 'faith-inventory.json'

let entries: InventoryEntry[] = loadJson<InventoryEntry[]>(FILE, [])

function persist() {
  saveJson(FILE, entries)
}

export function getAllInventoryEntries(): InventoryEntry[] {
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createInventoryEntry(data: {
  dateKey?: string
  description: string
  moneyIn: number
  moneyOut: number
  notes?: string
}): InventoryEntry {
  const dateKey =
    data.dateKey || new Date().toLocaleDateString('en-CA')
  const entry: InventoryEntry = {
    id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    dateKey,
    description: data.description,
    moneyIn: Number(data.moneyIn) || 0,
    moneyOut: Number(data.moneyOut) || 0,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  }
  entries.unshift(entry)
  persist()
  return entry
}

export function updateInventoryEntry(
  id: string,
  data: Partial<Pick<InventoryEntry, 'description' | 'moneyIn' | 'moneyOut' | 'notes' | 'dateKey'>>
): InventoryEntry | undefined {
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return undefined
  entries[idx] = {
    ...entries[idx],
    ...data,
    moneyIn: data.moneyIn !== undefined ? Number(data.moneyIn) : entries[idx].moneyIn,
    moneyOut: data.moneyOut !== undefined ? Number(data.moneyOut) : entries[idx].moneyOut,
  }
  persist()
  return entries[idx]
}

export function deleteInventoryEntry(id: string): boolean {
  const before = entries.length
  entries = entries.filter((e) => e.id !== id)
  if (entries.length < before) {
    persist()
    return true
  }
  return false
}

export function getInventoryTotals() {
  const moneyIn = entries.reduce((s, e) => s + e.moneyIn, 0)
  const moneyOut = entries.reduce((s, e) => s + e.moneyOut, 0)
  return {
    moneyIn,
    moneyOut,
    profit: moneyIn - moneyOut,
    count: entries.length,
  }
}
