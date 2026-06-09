import type { CartItem } from '../context/CartContext'
import type { SafeHandlingCounts } from '../constants/orderFees'
import { emptySafeHandlingCounts, normalizeSafeHandlingCounts } from '../constants/orderFees'

export const PENDING_RECEIPT_ROUTE_ID = 'pending'
const STORAGE_KEY = 'rhjp_pending_receipt'

export interface PendingReceiptPayload {
  employeeId: string
  employeeName: string
  items: CartItem[]
  subtotal: number
  deliveryIncluded: boolean
  safeHandlingAmount: number
  safeHandlingCounts: SafeHandlingCounts
  includePaybill854845: boolean
  includePaybill247247: boolean
  includeMpesaAgentStore: boolean
  grandTotal: number
  reservedOrderId?: string
}

export interface ReceiptPreviewOrder {
  id: string
  employeeId: string
  employeeName: string
  items: CartItem[]
  subtotal: number
  deliveryIncluded: boolean
  safeHandlingAmount: number
  safeHandlingCounts: SafeHandlingCounts
  includePaybill854845: boolean
  includePaybill247247: boolean
  includeMpesaAgentStore: boolean
  grandTotal: number
  createdAt: string
}

export function savePendingReceipt(payload: PendingReceiptPayload): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function loadPendingReceipt(): PendingReceiptPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PendingReceiptPayload> & {
      includePaybill?: boolean
      deliveryAmount?: number
      packagingAmount?: number
      packaging30Count?: number
      packaging50Count?: number
      specialDeliveryAmount?: number
      boxAndTapesAmount?: number
    }
    if (!parsed.items?.length || !parsed.employeeName) return null

    const safeHandlingCounts = parsed.safeHandlingCounts
      ? normalizeSafeHandlingCounts(parsed.safeHandlingCounts)
      : emptySafeHandlingCounts()

    const legacyTotal =
      (parsed.deliveryAmount ?? 0) +
      (parsed.packagingAmount ?? 0) +
      (parsed.specialDeliveryAmount ?? 0) +
      (parsed.boxAndTapesAmount ?? 0)

    const safeHandlingAmount = parsed.safeHandlingAmount ?? legacyTotal

    return {
      employeeId: parsed.employeeId ?? '',
      employeeName: parsed.employeeName,
      items: parsed.items,
      subtotal: parsed.subtotal ?? 0,
      deliveryIncluded: parsed.deliveryIncluded ?? safeHandlingAmount > 0,
      safeHandlingAmount,
      safeHandlingCounts,
      includePaybill854845: parsed.includePaybill854845 ?? parsed.includePaybill ?? false,
      includePaybill247247: parsed.includePaybill247247 ?? false,
      includeMpesaAgentStore: parsed.includeMpesaAgentStore ?? false,
      grandTotal: parsed.grandTotal ?? 0,
      reservedOrderId: parsed.reservedOrderId,
    }
  } catch {
    return null
  }
}

export function clearPendingReceipt(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export async function reserveOrderId(): Promise<string> {
  const res = await fetch('/api/orders/next-id')
  if (!res.ok) throw new Error('Could not reserve order number.')
  const data = (await res.json()) as { id?: string }
  if (!data.id?.trim()) throw new Error('Could not reserve order number.')
  return data.id.trim()
}

export async function ensurePendingOrderId(
  payload: PendingReceiptPayload
): Promise<PendingReceiptPayload> {
  if (payload.reservedOrderId?.trim()) return payload
  const reservedOrderId = await reserveOrderId()
  const updated = { ...payload, reservedOrderId }
  savePendingReceipt(updated)
  return updated
}

export function pendingToPreviewOrder(payload: PendingReceiptPayload): ReceiptPreviewOrder {
  return {
    id: payload.reservedOrderId?.trim() || '—',
    employeeId: payload.employeeId,
    employeeName: payload.employeeName,
    items: payload.items,
    subtotal: payload.subtotal,
    deliveryIncluded: payload.deliveryIncluded,
    safeHandlingAmount: payload.safeHandlingAmount,
    safeHandlingCounts: payload.safeHandlingCounts,
    includePaybill854845: payload.includePaybill854845,
    includePaybill247247: payload.includePaybill247247,
    includeMpesaAgentStore: payload.includeMpesaAgentStore,
    grandTotal: payload.grandTotal,
    createdAt: new Date().toISOString(),
  }
}
