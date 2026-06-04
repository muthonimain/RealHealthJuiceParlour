import { pool } from '../db/pool'

/** Two-digit year suffix for order numbers (e.g. 2026 → "26"). */
export function orderYearSuffix(date = new Date()): string {
  return String(date.getFullYear()).slice(-2)
}

/** Format: RHJP26-0001 */
export function formatOrderNumber(yearSuffix: string, sequence: number): string {
  return `RHJP${yearSuffix}-${String(sequence).padStart(4, '0')}`
}

const ORDER_ID_PATTERN = /^RHJP\d{2}-\d{4}$/

export function isFormattedOrderId(id: string): boolean {
  return ORDER_ID_PATTERN.test(id)
}

/** Allocate the next order id for the current calendar year (thread-safe via UPSERT). */
export async function allocateOrderId(): Promise<string> {
  const yy = orderYearSuffix()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query<{ last_number: number }>(
      `INSERT INTO order_number_seq (year_suffix, last_number)
       VALUES ($1, 1)
       ON CONFLICT (year_suffix) DO UPDATE
         SET last_number = order_number_seq.last_number + 1
       RETURNING last_number`,
      [yy]
    )
    const seq = rows[0]?.last_number ?? 1
    await client.query('COMMIT')
    return formatOrderNumber(yy, seq)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** After deploy: align sequence with highest existing RHJPyy-#### id for this year. */
export async function syncOrderNumberSequence(): Promise<void> {
  const yy = orderYearSuffix()
  const prefix = `RHJP${yy}-`
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM orders WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  )

  let lastFromOrders = 0
  const latest = rows[0]?.id
  if (latest) {
    const match = latest.match(/^RHJP\d{2}-(\d{4})$/)
    if (match) lastFromOrders = parseInt(match[1], 10)
  }

  await pool.query(
    `INSERT INTO order_number_seq (year_suffix, last_number)
     VALUES ($1, $2)
     ON CONFLICT (year_suffix) DO UPDATE
       SET last_number = GREATEST(order_number_seq.last_number, EXCLUDED.last_number)`,
    [yy, lastFromOrders]
  )
}
