export const DELIVERY_OPTIONS = [50, 100, 150] as const
export const PACKAGING_OPTIONS = [30, 50] as const

export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number]
export type PackagingOption = (typeof PACKAGING_OPTIONS)[number]
