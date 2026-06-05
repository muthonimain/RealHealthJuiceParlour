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
    const parsed = JSON.parse(raw) as PendingReceiptPayload
    if (!parsed.items?.length || !parsed.employeeName) return null
    return parsed
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
    includePaybill: payload.includePaybill,
    grandTotal: payload.grandTotal,
    createdAt: new Date().toISOString(),
  }
}
