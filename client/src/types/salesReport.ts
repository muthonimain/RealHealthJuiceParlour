export interface ProductSalesRow {
  productId: string
  name: string
  categoryName: string
  quantitySold: number
  revenue: number
  orderCount: number
}

export interface ProductSalesReport {
  monthKey: string
  monthLabel: string
  orderCount: number
  totalUnitsSold: number
  uniqueProductsSold: number
  topProducts: ProductSalesRow[]
  leastProducts: ProductSalesRow[]
}

export interface DailyProductSalesReport {
  dateKey: string
  dateLabel: string
  orderCount: number
  totalUnitsSold: number
  uniqueProductsSold: number
  products: ProductSalesRow[]
}
