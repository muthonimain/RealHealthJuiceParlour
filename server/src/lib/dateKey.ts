/** Local calendar day as YYYY-MM-DD */
export function toDateKey(isoOrDate: Date | string = new Date()): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-CA')
}
