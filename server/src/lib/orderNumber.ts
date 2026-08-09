import { JsonDocument, loadJson } from '../lib/persistence'

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

interface OrderSeqDoc {
  [yearSuffix: string]: number
}

const seqDb = new JsonDocument<OrderSeqDoc>('order-number-seq.json', () => ({}))

let allocateChain: Promise<string> = Promise.resolve('')

/** Allocate the next order id for the current calendar year (serialized writes). */
export async function allocateOrderId(): Promise<string> {
  const run = async (): Promise<string> => {
    const yy = orderYearSuffix()
    const seq = seqDb.read()
    const next = (seq[yy] ?? 0) + 1
    seq[yy] = next
    seqDb.write(seq)
    await seqDb.flush()
    return formatOrderNumber(yy, next)
  }

  allocateChain = allocateChain.then(run, run)
  return allocateChain
}

/** After startup: align sequence with highest existing RHJPyy-#### id for this year. */
export async function syncOrderNumberSequence(): Promise<void> {
  const yy = orderYearSuffix()
  const prefix = `RHJP${yy}-`
  const orders = loadJson<{ id: string }[]>('orders.json', [])
  let lastFromOrders = 0
  for (const order of orders) {
    if (!order.id?.startsWith(prefix)) continue
    const match = order.id.match(/^RHJP\d{2}-(\d{4})$/)
    if (match) {
      lastFromOrders = Math.max(lastFromOrders, parseInt(match[1], 10))
    }
  }

  const seq = seqDb.read()
  seq[yy] = Math.max(seq[yy] ?? 0, lastFromOrders)
  seqDb.write(seq)
  await seqDb.flush()
}
