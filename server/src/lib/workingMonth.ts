/** Calendar working month (YYYY-MM). Revenue accumulates daily and resets on the 1st. */

export function toMonthKey(isoOrDate: Date | string = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function workingMonthLabel(isoOrDate: Date | string = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
}

export function isInWorkingMonth(createdAt: string, reference: Date = new Date()): boolean {
  return toMonthKey(createdAt) === toMonthKey(reference)
}

export function sumRevenueForWorkingMonth(
  orders: { createdAt: string; grandTotal: number }[],
  reference: Date = new Date()
): number {
  const key = toMonthKey(reference)
  return orders
    .filter((o) => toMonthKey(o.createdAt) === key)
    .reduce((sum, o) => sum + o.grandTotal, 0)
}

export function countOrdersForWorkingMonth(
  orders: { createdAt: string }[],
  reference: Date = new Date()
): number {
  const key = toMonthKey(reference)
  return orders.filter((o) => toMonthKey(o.createdAt) === key).length
}
