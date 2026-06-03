import type { MenuCategory, MenuItem } from '../types/menu'
import { resolveCategorySections } from './categorySectionPresets'

export interface MenuSectionGroup {
  title: string
  items: MenuItem[]
}

/** Group items under category section headings (e.g. Herbs → Powders, Seeds). */
export function getMenuSectionGroups(category: MenuCategory): MenuSectionGroup[] {
  const definedSections = resolveCategorySections(
    category.id,
    category.name,
    category.sections
  )
  const titles = definedSections?.length
    ? definedSections
    : [...new Set(category.items.map((i) => i.section).filter(Boolean) as string[])]

  if (titles.length === 0) {
    return category.items.length > 0 ? [{ title: '', items: category.items }] : []
  }

  const groups = titles.map((title) => ({
    title,
    items: category.items.filter(
      (i) => (i.section ?? '').trim().toLowerCase() === title.trim().toLowerCase()
    ),
  }))

  // Categories with explicit sections (e.g. Herbs → Powders, Seeds) show only those headings.
  if (category.sections?.length) {
    return groups
  }

  const sectionKeys = new Set(titles.map((t) => t.trim().toLowerCase()))
  const other = category.items.filter((i) => {
    const s = (i.section ?? '').trim().toLowerCase()
    return !s || !sectionKeys.has(s)
  })
  if (other.length > 0) {
    groups.push({ title: 'More', items: other })
  }

  return groups
}

export function categoryUsesSections(category: MenuCategory): boolean {
  return (resolveCategorySections(category.id, category.name, category.sections)?.length ?? 0) > 0
}
