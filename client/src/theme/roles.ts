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
  header: 'bg-red-900 sm:bg-gradient-to-r sm:from-red-900 sm:via-rose-900 sm:to-amber-900',
  headerAccent: 'text-amber-200',
  shellPage: 'bg-amber-50 sm:bg-gradient-to-b sm:from-amber-50 sm:via-orange-50/90 sm:to-rose-100/80',
  card: 'bg-white/95 border-2 border-amber-200/70 shadow-sm hover:shadow-md',
  statCard:
    'bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-amber-100/80 min-w-0 w-full box-border',
  moduleCard:
    'bg-white rounded-2xl p-3 sm:p-6 shadow-sm border border-amber-100/60 hover:shadow-md min-w-0 w-full box-border',
  openLink: 'text-red-700',
  pageTitle: 'text-red-950',
  pageHint: 'text-orange-800/70',
} as const

export const employeeTheme = {
  page: 'bg-gradient-to-br from-sky-50 via-blue-50/95 to-indigo-100/70',
  subtitle: 'text-sky-800',
  hint: 'text-blue-900/65',
  back: 'text-sky-900/55 hover:text-sky-900 hover:bg-sky-100/80',
  footer: 'text-sky-900/35',
  header: 'bg-gradient-to-r from-sky-800 via-blue-800 to-indigo-900',
  headerAccent: 'text-sky-200',
  shellPage: 'bg-gradient-to-b from-sky-100/90 via-blue-50/80 to-indigo-50/70',
  cartBar: 'bg-blue-700 border-blue-600',
  cartBtn: 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700',
  pageTitle: 'text-sky-950',
  pageHint: 'text-sky-700/75',
  categoryCard:
    'bg-white/95 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-50/90 shadow-sm hover:shadow-md',
  categoryName: 'text-sky-950',
  categoryMeta: 'text-sky-600',
  addCategoryCard:
    'bg-sky-50/90 border-2 border-dashed border-sky-400 hover:border-sky-600 hover:bg-sky-100/90',
  addCategoryIconBg: 'bg-sky-200',
  addCategoryIcon: 'text-sky-800',
  addCategoryLabel: 'text-sky-900',
  signInCard:
    'bg-sky-50 border-2 border-sky-300 hover:shadow-xl hover:shadow-sky-900/10 rounded-3xl shadow-sm',
  signInCardIconBg: 'bg-sky-100',
  signInCardIcon: 'text-sky-600',
  signInCardName: 'text-sky-900',
  signInFormHeader: 'bg-sky-600',
  signInFormSub: 'text-sky-200',
  signInSubmit: 'bg-sky-600 hover:bg-sky-700',
  signInInputFocus: 'focus:border-sky-400 focus:ring-sky-400',
  panel: 'bg-white rounded-2xl shadow-sm border-2 border-sky-200',
  tableHead: 'bg-sky-50 text-sky-800',
  /** − / + on menu item cards (diner order qty) */
  orderStepperBtn:
    'border-2 border-red-500 bg-white hover:bg-red-50 active:bg-red-100 text-red-600',
  orderStepperBtnDisabled:
    'border-2 border-red-200 bg-red-50/50 text-red-300 cursor-not-allowed',
  orderStepperQty: 'text-red-700',
  orderStepperQtyEmpty: 'text-red-300',
} as const
