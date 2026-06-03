export interface MenuItem {
  id: string
  name: string
  price: number
  note?: string
  /** Sub-heading within a category (e.g. Powders, Seeds under Herbs). */
  section?: string
}

export interface MenuCategory {
  id: string
  name: string
  emoji: string
  color: string
  lightColor: string
  textColor: string
  /** When set, the category UI shows these section headings (even if empty). */
  sections?: string[]
  items: MenuItem[]
}
