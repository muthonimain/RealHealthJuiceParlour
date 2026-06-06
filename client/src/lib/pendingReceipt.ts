import type { CartItem } from '../context/CartContext'

export const PENDING_RECEIPT_ROUTE_ID = 'pending'
const STORAGE_KEY = 'rhjp_pending_receipt'

export interface PendingReceiptPayload {
  employeeId: string
  employeeName: string
  items: CartItem[]
  subtotal: number
  deliveryIncluded: boolean
  deliveryAmount: number
  packagingAmount: number
  packaging30Count: number
  packaging50Count: number
  specialDeliveryAmount: number
  boxAndTapesAmount: number
  includePaybill: boolean
  grandTotal: number
}

export interface ReceiptPreviewOrder {
  id: string
  employeeId: string
  employeeName: string
  items: CartItem[]
  subtotal: number
  deliveryIncluded: boolean
  deliveryAmount: number
  packagingAmount: number
  packaging30Count: number
  packaging50Count: number
  specialDeliveryAmount: number
  boxAndTapesAmount: number
  includePaybill: boolean
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
    const parsed = JSON.parse(raw) as Partial<PendingReceiptPayload>
    if (!parsed.items?.length || !parsed.employeeName) return null
    return {
      employeeId: parsed.employeeId ?? '',
      employeeName: parsed.employeeName,
      items: parsed.items,
      subtotal: parsed.subtotal ?? 0,
      deliveryIncluded: parsed.deliveryIncluded ?? false,
      deliveryAmount: parsed.deliveryAmount ?? 0,
      packagingAmount: parsed.packagingAmount ?? 0,
      packaging30Count: parsed.packaging30Count ?? 0,
      packaging50Count: parsed.packaging50Count ?? 0,
      specialDeliveryAmount: parsed.specialDeliveryAmount ?? 0,
      boxAndTapesAmount: parsed.boxAndTapesAmount ?? 0,
      includePaybill: parsed.includePaybill ?? false,
      grandTotal: parsed.grandTotal ?? 0,
    }
  } catch {
    return null
  }
}

export function clearPendingReceipt(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function pendingToPreviewOrder(payload: PendingReceiptPayload): ReceiptPreviewOrder {
  return {
    id: '—',
    employeeId: payload.employeeId,
    employeeName: payload.employeeName,
    items: payload.items,
    subtotal: payload.subtotal,
    deliveryIncluded: payload.deliveryIncluded,
    deliveryAmount: payload.deliveryAmount,
    packagingAmount: payload.packagingAmount,
    packaging30Count: payload.packaging30Count,
    packaging50Count: payload.packaging50Count,
    specialDeliveryAmount: payload.specialDeliveryAmount,
    boxAndTapesAmount: payload.boxAndTapesAmount,
    includePaybill: payload.includePaybill,
    grandTotal: payload.grandTotal,
    createdAt: new Date().toISOString(),
  }
}
