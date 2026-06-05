export const DELIVERY_OPTIONS = [50, 100, 150] as const
export const PACKAGING_OPTIONS = [30, 50] as const

export const DELIVERY_PAYBILL = '854845'
export const DELIVERY_ACCOUNT = '248899'

export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number]
export type PackagingOption = (typeof PACKAGING_OPTIONS)[number]
