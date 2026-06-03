import { menuData as seedMenu } from '../data/menu'
import type { MenuCategory } from '../data/menuStore'

const STYLE_BY_ID: Record<string, { color: string; lightColor: string; textColor: string }> = {
  'soups-gruels': { color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' },
  'fresh-salads': { color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700' },
  'vegetables-greens': { color: 'bg-emerald-600', lightColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
  'sides-extras': { color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-700' },
  smoothies: { color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-700' },
  'herbal-teas': { color: 'bg-yellow-600', lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  'healthy-snacks': { color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
  herbs: { color: 'bg-green-600', lightColor: 'bg-green-50', textColor: 'text-green-700' },
  'honey-nuts-oils': { color: 'bg-amber-600', lightColor: 'bg-amber-50', textColor: 'text-amber-800' },
  'boost-your-meal': { color: 'bg-lime-600', lightColor: 'bg-lime-50', textColor: 'text-lime-700' },
  'gut-healing-drinks': { color: 'bg-teal-600', lightColor: 'bg-teal-50', textColor: 'text-teal-700' },
  'elite-traditional-meals': { color: 'bg-yellow-700', lightColor: 'bg-yellow-50', textColor: 'text-yellow-800' },
  'proteins-stews': { color: 'bg-red-700', lightColor: 'bg-red-50', textColor: 'text-red-800' },
}

const COLOR_PRESETS = [
  { color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  { color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-700' },
  { color: 'bg-cyan-600', lightColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
  { color: 'bg-rose-500', lightColor: 'bg-rose-50', textColor: 'text-rose-700' },
  { color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-700' },
]

function enrichCategory(cat: (typeof seedMenu)[0], index: number): MenuCategory {
  const style = STYLE_BY_ID[cat.id] ?? COLOR_PRESETS[index % COLOR_PRESETS.length]
  return { ...cat, ...style }
}

export function buildDefaultMenu(): MenuCategory[] {
  return seedMenu.map((c, i) => enrichCategory(c, i))
}
