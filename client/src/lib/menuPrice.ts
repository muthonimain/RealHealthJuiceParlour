/** Normalize menu prices from API (handles strings, commas, null). */
export function normalizePrice(price: unknown): number {
  if (price === null || price === undefined || price === '') return 0
  const raw = typeof price === 'number' ? price : parseFloat(String(price).replace(/,/g, '').trim())
  return Number.isFinite(raw) && raw >= 0 ? raw : 0
}

export function formatItemPrice(price: unknown): string {
  const n = normalizePrice(price)
  if (n <= 0) return 'On request'
  return `Ksh ${n.toLocaleString('en-KE')}`
}

export function hasDisplayPrice(price: unknown): boolean {
  return normalizePrice(price) > 0
}
