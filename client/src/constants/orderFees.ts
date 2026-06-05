export const DELIVERY_OPTIONS = [50, 100, 150] as const
export const PACKAGING_OPTIONS = [30, 50] as const
export const SPECIAL_DELIVERY_OPTIONS = [350, 450, 550] as const
export const BOX_AND_TAPES_AMOUNT = 150 as const
export const SPECIAL_DELIVERY_CHECKBOX_LABEL = 'Delivery & COT'
export const SPECIAL_DELIVERY_RECEIPT_LABEL = 'Delivery & COT'

export const DELIVERY_PAYBILL = '854845'
export const DELIVERY_ACCOUNT = '248899'

export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number]
export type PackagingOption = (typeof PACKAGING_OPTIONS)[number]
export type SpecialDeliveryOption = (typeof SPECIAL_DELIVERY_OPTIONS)[number]
