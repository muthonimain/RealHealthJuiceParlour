export interface Expense {
  id: string
  dateKey: string
  description: string
  amount: number
  recordedById: string
  recordedByName: string
  recordedByRole: 'owner' | 'employee'
  createdAt: string
}

export interface DailyProfitSummary {
  dateKey: string
  todayRevenue: number
  costOfGoods: number
  grossProfit: number
  dailyOperationalCost: number
  netProfit: number
  orderCount: number
  expenseCount: number
  expenses?: Expense[]
}
