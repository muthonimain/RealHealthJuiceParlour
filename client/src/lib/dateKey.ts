/** Local calendar day key (YYYY-MM-DD) and labels for records pages. */

export function todayDateKey(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function offsetDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

export function isTodayDateKey(dateKey: string): boolean {
  return dateKey === todayDateKey()
}

export function dayLabelFromKey(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function shortDateFromKey(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isOnDay(createdAt: string, dayKey: string): boolean {
  return new Date(createdAt).toLocaleDateString('en-CA') === dayKey
}
