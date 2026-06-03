export interface MenuItem {
  id: string
  name: string
  price: number
  note?: string
  section?: string
}

export interface MenuCategory {
  id: string
  name: string
  emoji: string
  sections?: string[]
  items: MenuItem[]
}

export const menuData: MenuCategory[] = [
  {
    id: 'soups-gruels',
    name: 'Soups & Gruels',
    emoji: '🍲',
    items: [
      { id: 'sg-1', name: 'Bone Soup', price: 400 },
      { id: 'sg-2', name: 'Chicken Soup', price: 400 },
      { id: 'sg-3', name: 'Turbo (Gruel)', price: 130 },
      { id: 'sg-4', name: 'Vegetable (Gruel)', price: 170 },
      { id: 'sg-5', name: 'Pumpkin (Gruel)', price: 170 },
      { id: 'sg-6', name: 'Yogo Yogo (Gruel)', price: 250 },
    ],
  },
  {
    id: 'fresh-salads',
    name: 'Fresh Salads',
    emoji: '🥗',
    items: [
      { id: 'fs-1', name: 'Fruit Salad', price: 250 },
      { id: 'fs-2', name: 'Vegetable Salad', price: 300 },
      { id: 'fs-3', name: 'Rainbow Salad', price: 300 },
    ],
  },
  {
    id: 'vegetables-greens',
    name: 'Vegetables & Greens',
    emoji: '🥬',
    items: [
      { id: 'vg-1', name: 'Spinach', price: 150 },
      { id: 'vg-2', name: 'Managu', price: 150 },
      { id: 'vg-3', name: 'Cabbage', price: 150 },
      { id: 'vg-4', name: 'Mchicha', price: 150 },
    ],
  },
  {
    id: 'sides-extras',
    name: 'Sides & Extras',
    emoji: '🍽️',
    items: [
      { id: 'se-1', name: 'Ugali – Brown', price: 100 },
      { id: 'se-2', name: 'Ugali – Yellow', price: 100 },
      { id: 'se-3', name: 'Ugali – White', price: 100 },
      { id: 'se-4', name: 'Rice', price: 150 },
      { id: 'se-5', name: 'Pumpkin Chapati', price: 50 },
      { id: 'se-6', name: 'Brown Chapati', price: 50 },
      { id: 'se-7', name: 'Cassava Pancakes', price: 50 },
      { id: 'se-8', name: 'Groundnut Sauce', price: 100 },
      { id: 'se-9', name: 'Kienyeji Eggs (2) – Boiled', price: 100 },
      { id: 'se-10', name: 'Kienyeji Eggs (2) – Fried', price: 100 },
      { id: 'se-11', name: 'Omelette (2 Eggs)', price: 150 },
    ],
  },
  {
    id: 'smoothies',
    name: 'Smoothies',
    emoji: '🥤',
    items: [
      { id: 'sm-1', name: 'Rainbow Smoothie', price: 170 },
      { id: 'sm-2', name: 'Tropical Mix', price: 170 },
      { id: 'sm-3', name: 'Cream Passion', price: 170 },
      { id: 'sm-4', name: 'Tropical Nuts', price: 220 },
      { id: 'sm-5', name: 'Magma', price: 220 },
      { id: 'sm-6', name: 'Slimming Smoothie', price: 250 },
    ],
  },
  {
    id: 'herbal-teas',
    name: 'Herbal & Wellness Teas',
    emoji: '🫖',
    items: [
      { id: 'ht-1', name: 'African Tea – Small', price: 60 },
      { id: 'ht-2', name: 'African Tea – Large', price: 120 },
      { id: 'ht-3', name: 'Golden Milk – Small', price: 60 },
      { id: 'ht-4', name: 'Golden Milk – Large', price: 120 },
      { id: 'ht-5', name: 'Specialty Herbal Tea', price: 120 },
    ],
  },
  {
    id: 'healthy-snacks',
    name: 'Healthy Snacks',
    emoji: '🥜',
    items: [
      { id: 'hs-1', name: 'Roasted Peanuts', price: 50 },
      { id: 'hs-2', name: 'Roasted Cashew Nuts', price: 150 },
      { id: 'hs-3', name: 'Pumpkin Seeds', price: 250 },
    ],
  },
  {
    id: 'herbs',
    name: 'Herbs',
    emoji: '🌿',
    sections: ['Powders', 'Seeds'],
    items: [],
  },
  {
    id: 'boost-your-meal',
    name: 'Boost Your Meal',
    emoji: '✨',
    items: [
      { id: 'bm-1', name: 'Detox Boost (Add-on)', price: 0, note: 'Price on request' },
      { id: 'bm-2', name: 'Energy Boost (Add-on)', price: 0, note: 'Price on request' },
      { id: 'bm-3', name: 'Gut Health Boost (Add-on)', price: 0, note: 'Price on request' },
      { id: 'bm-4', name: 'Immunity Boost (Add-on)', price: 0, note: 'Price on request' },
    ],
  },
  {
    id: 'gut-healing-drinks',
    name: 'Gut-Healing Drinks',
    emoji: '🍵',
    items: [
      { id: 'gh-1', name: 'Kombucha – Small', price: 100 },
      { id: 'gh-2', name: 'Kombucha – Medium', price: 200 },
      { id: 'gh-3', name: 'Kombucha – Large', price: 350 },
      { id: 'gh-4', name: 'Kefir Milk – Small', price: 250 },
      { id: 'gh-5', name: 'Kefir Milk – Large', price: 500 },
      { id: 'gh-6', name: 'Fermented Porridge', price: 150 },
    ],
  },
  {
    id: 'elite-traditional-meals',
    name: 'Elite Traditional Meals',
    emoji: '🍛',
    items: [
      { id: 'et-1', name: 'Githeri', price: 250 },
      { id: 'et-2', name: 'Matoke', price: 250 },
      { id: 'et-3', name: 'Omushenye', price: 250 },
      { id: 'et-4', name: 'Mukimo', price: 250 },
      { id: 'et-5', name: 'Mataha', price: 250 },
      { id: 'et-6', name: 'Nduma Stew', price: 250 },
      { id: 'et-7', name: 'Special (Traditional)', price: 400 },
    ],
  },
  {
    id: 'proteins-stews',
    name: 'Proteins & Stews',
    emoji: '🍖',
    items: [
      { id: 'ps-1', name: 'Liver Stew – Small', price: 200 },
      { id: 'ps-2', name: 'Liver Stew – Large', price: 400 },
      { id: 'ps-3', name: 'Beef Stew – Small', price: 200 },
      { id: 'ps-4', name: 'Beef Stew – Large', price: 400 },
      { id: 'ps-5', name: 'Whole Tilapia', price: 450 },
      { id: 'ps-6', name: 'Beef Tripe (Matumbo)', price: 250 },
      { id: 'ps-7', name: 'Omena', price: 150 },
    ],
  },
]
