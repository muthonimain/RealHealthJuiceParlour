/** Landing = neutral welcome. Owner = warm (logo red). Employee = cool (logo green). */

export const landingTheme = {
  page: 'bg-gradient-to-br from-white via-emerald-50/90 to-rose-50/70',
  subtitle: 'text-red-700',
  hint: 'text-emerald-800/70',
  back: 'text-emerald-900/60 hover:text-emerald-900 hover:bg-white/60',
  footer: 'text-emerald-800/40',
} as const

export const ownerTheme = {
  page: 'bg-gradient-to-br from-amber-50 via-orange-50/95 to-rose-100/80',
  subtitle: 'text-red-800',
  hint: 'text-orange-900/65',
  back: 'text-orange-900/55 hover:text-red-900 hover:bg-amber-100/80',
  footer: 'text-orange-900/35',
  header: 'bg-gradient-to-r from-red-900 via-rose-900 to-amber-900',
  headerAccent: 'text-amber-200',
  shellPage: 'bg-gradient-to-b from-orange-50/60 via-amber-50/40 to-rose-50/50',
  card: 'bg-white/90 border-amber-200/60',
  openLink: 'text-red-700',
} as const

export const employeeTheme = {
  page: 'bg-gradient-to-br from-cyan-50 via-teal-50/95 to-sky-100/80',
  subtitle: 'text-teal-800',
  hint: 'text-sky-900/65',
  back: 'text-teal-900/55 hover:text-teal-900 hover:bg-cyan-100/80',
  footer: 'text-teal-900/35',
  header: 'bg-gradient-to-r from-teal-900 via-emerald-800 to-cyan-900',
  headerAccent: 'text-teal-200',
  shellPage: 'bg-gradient-to-b from-cyan-50/70 via-teal-50/50 to-sky-50/60',
  cartBar: 'bg-teal-700 border-teal-600',
  cartBtn: 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700',
  /** − / + on menu item cards (diner order qty) */
  orderStepperBtn:
    'border-2 border-red-500 bg-white hover:bg-red-50 active:bg-red-100 text-red-600',
  orderStepperBtnDisabled:
    'border-2 border-red-200 bg-red-50/50 text-red-300 cursor-not-allowed',
  orderStepperQty: 'text-red-700',
  orderStepperQtyEmpty: 'text-red-300',
} as const
