export const SAFE_HANDLING_OPTIONS = [
  30, 50, 80, 100, 130, 150, 180, 200, 250, 300, 350, 400, 450, 500, 550, 600,
] as const

export const SAFE_HANDLING_SECTION_LABEL = 'Safe Handling & Delivery Service'
export const SAFE_HANDLING_RECEIPT_LABEL = 'Safe Handling & Delivery Service'

export const MPESA_PAYBILL_OPTIONS = [
  { paybill: '854845', account: '248899' },
  { paybill: '247247', account: '248899' },
] as const

export const MPESA_AGENT_NO = '81294'
export const MPESA_STORE_NO = '383438'

export type MpesaPaybillOption = (typeof MPESA_PAYBILL_OPTIONS)[number]

/** @deprecated Use MPESA_PAYBILL_OPTIONS */
export const DELIVERY_PAYBILL = MPESA_PAYBILL_OPTIONS[0].paybill
/** @deprecated Use MPESA_PAYBILL_OPTIONS */
export const DELIVERY_ACCOUNT = MPESA_PAYBILL_OPTIONS[0].account

export function activePaybills(order: {
  includePaybill854845?: boolean
  includePaybill247247?: boolean
  includePaybill?: boolean
}): MpesaPaybillOption[] {
  const selected: MpesaPaybillOption[] = []
  if (order.includePaybill854845 ?? order.includePaybill) {
    selected.push(MPESA_PAYBILL_OPTIONS[0])
  }
  if (order.includePaybill247247) {
    selected.push(MPESA_PAYBILL_OPTIONS[1])
  }
  return selected
}

export type SafeHandlingOption = (typeof SAFE_HANDLING_OPTIONS)[number]
export type SafeHandlingCounts = Partial<Record<SafeHandlingOption, number>>

export function emptySafeHandlingCounts(): SafeHandlingCounts {
  return {}
}

export function safeHandlingTotal(counts: SafeHandlingCounts): number {
  return SAFE_HANDLING_OPTIONS.reduce((sum, amount) => sum + amount * (counts[amount] ?? 0), 0)
}

export function safeHandlingActiveLines(
  counts: SafeHandlingCounts
): { amount: SafeHandlingOption; count: number }[] {
  return SAFE_HANDLING_OPTIONS.filter((amount) => (counts[amount] ?? 0) > 0).map((amount) => ({
    amount,
    count: counts[amount]!,
  }))
}

export function normalizeSafeHandlingCounts(
  raw: SafeHandlingCounts | Record<string, number> | null | undefined
): SafeHandlingCounts {
  if (!raw || typeof raw !== 'object') return {}
  const normalized: SafeHandlingCounts = {}
  for (const amount of SAFE_HANDLING_OPTIONS) {
    const count = Number((raw as Record<string, number>)[amount] ?? (raw as Record<string, number>)[String(amount)] ?? 0)
    if (Number.isFinite(count) && count > 0) normalized[amount] = Math.floor(count)
  }
  return normalized
}

/** Total service fees on an order (new safe-handling model or legacy fee columns). */
export function orderServiceFeeTotal(order: {
  safeHandlingAmount?: number
  deliveryAmount?: number
  packagingAmount?: number
  specialDeliveryAmount?: number
  boxAndTapesAmount?: number
}): number {
  if ((order.safeHandlingAmount ?? 0) > 0) return order.safeHandlingAmount ?? 0
  return (
    (order.deliveryAmount ?? 0) +
    (order.packagingAmount ?? 0) +
    (order.specialDeliveryAmount ?? 0) +
    (order.boxAndTapesAmount ?? 0)
  )
}
