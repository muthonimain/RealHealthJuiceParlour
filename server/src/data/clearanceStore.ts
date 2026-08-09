import { toDateKey } from '../lib/dateKey'
import { JsonCollection } from '../lib/persistence'

export { toDateKey }

export interface DailyClearance {
  employeeId: string
  employeeName: string
  dateKey: string
  clearedAt: string
  clearedBy: string
}

const clearancesDb = new JsonCollection<DailyClearance>('clearances.json')

export async function findClearance(
  employeeId: string,
  dateKey: string
): Promise<DailyClearance | undefined> {
  return clearancesDb
    .read()
    .find((c) => c.employeeId === employeeId && c.dateKey === dateKey)
}

export function resolveClearanceStatus(
  ordersForDay: { createdAt: string }[],
  clearance: DailyClearance | undefined
): 'pending' | 'cleared' {
  if (ordersForDay.length === 0) return 'cleared'
  if (!clearance) return 'pending'

  const clearedAtMs = new Date(clearance.clearedAt).getTime()
  const hasOrdersAfterClearance = ordersForDay.some(
    (o) => new Date(o.createdAt).getTime() > clearedAtMs
  )
  return hasOrdersAfterClearance ? 'pending' : 'cleared'
}

export async function revokeClearanceIfSuperseded(
  employeeId: string,
  employeeName: string,
  orderCreatedAt: string
): Promise<void> {
  const dateKey = toDateKey(orderCreatedAt)
  const createdMs = new Date(orderCreatedAt).getTime()
  const all = clearancesDb.read()

  let clearance = all.find((c) => c.employeeId === employeeId && c.dateKey === dateKey)

  if (!clearance && employeeName) {
    clearance = all.find((c) => c.dateKey === dateKey && c.employeeName === employeeName)
  }

  if (!clearance) return
  if (createdMs <= new Date(clearance.clearedAt).getTime()) return

  clearancesDb.write(
    all.filter(
      (c) => !(c.employeeId === clearance!.employeeId && c.dateKey === dateKey)
    )
  )
}

export async function clearEmployeeDay(
  employeeId: string,
  employeeName: string,
  dateKey: string,
  clearedBy: string
): Promise<DailyClearance> {
  const record: DailyClearance = {
    employeeId,
    employeeName,
    dateKey,
    clearedAt: new Date().toISOString(),
    clearedBy,
  }

  const all = clearancesDb.read()
  const index = all.findIndex((c) => c.employeeId === employeeId && c.dateKey === dateKey)
  if (index >= 0) all[index] = record
  else all.push(record)
  clearancesDb.write(all)
  return record
}

export async function getClearancesForDate(dateKey: string): Promise<DailyClearance[]> {
  return clearancesDb.read().filter((c) => c.dateKey === dateKey)
}

export async function deleteClearancesByEmployee(employeeId: string): Promise<void> {
  const all = clearancesDb.read()
  clearancesDb.write(all.filter((c) => c.employeeId !== employeeId))
}
