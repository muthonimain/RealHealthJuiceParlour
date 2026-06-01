import { loadJson, saveJson } from '../lib/persistence'

export interface DailyClearance {
  employeeId: string
  employeeName: string
  dateKey: string
  clearedAt: string
  clearedBy: string
}

const CLEARANCES_FILE = 'clearances.json'

let clearances: DailyClearance[] = loadJson<DailyClearance[]>(CLEARANCES_FILE, [])

function persistClearances() {
  saveJson(CLEARANCES_FILE, clearances)
}

export function toDateKey(isoOrDate: Date | string = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-CA')
}

export function isCleared(employeeId: string, dateKey: string): boolean {
  return clearances.some((c) => c.employeeId === employeeId && c.dateKey === dateKey)
}

export function clearEmployeeDay(
  employeeId: string,
  employeeName: string,
  dateKey: string,
  clearedBy: string
): DailyClearance {
  const existing = clearances.find((c) => c.employeeId === employeeId && c.dateKey === dateKey)
  if (existing) return existing

  const record: DailyClearance = {
    employeeId,
    employeeName,
    dateKey,
    clearedAt: new Date().toISOString(),
    clearedBy,
  }
  clearances.push(record)
  persistClearances()
  return record
}

export function getClearancesForDate(dateKey: string): DailyClearance[] {
  return clearances.filter((c) => c.dateKey === dateKey)
}
