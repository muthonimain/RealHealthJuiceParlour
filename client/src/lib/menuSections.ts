import type { MenuCategory, MenuItem } from '../types/menu'

export interface MenuSectionGroup {
  title: string
  items: MenuItem[]
}

/** Group items under category section headings (e.g. Herbs → Powders, Seeds). */
export function getMenuSectionGroups(category: MenuCategory): MenuSectionGroup[] {
  const titles = category.sections?.length
    ? category.sections
    : [...new Set(category.items.map((i) => i.section).filter(Boolean) as string[])]

  if (titles.length === 0) {
    return category.items.length > 0 ? [{ title: '', items: category.items }] : []
  }

  return titles.map((title) => ({
    title,
    items: category.items.filter(
      (i) => (i.section ?? '').trim().toLowerCase() === title.trim().toLowerCase()
    ),
  }))
}

export function categoryUsesSections(category: MenuCategory): boolean {
  return (category.sections?.length ?? 0) > 0
}
