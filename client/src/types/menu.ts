export interface MenuItem {
  id: string
  name: string
  price: number
  note?: string
}

export interface MenuCategory {
  id: string
  name: string
  emoji: string
  color: string
  lightColor: string
  textColor: string
  items: MenuItem[]
}
