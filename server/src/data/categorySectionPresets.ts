/** Known menu categories that use fixed section headings (synced to DB on startup and on create). */

export interface CategorySectionPreset {
  /** Match category id exactly or as prefix (e.g. honey-nuts-oils-2). */
  idPrefixes: string[]
  /** Normalized category name must include this substring (letters/digits only, lowercased). */
  nameIncludes?: string
  /** All of these substrings must appear in the normalized name (any word order). */
  nameMustIncludeAll?: string[]
  sections: string[]
  /** Items with no section are assigned here on sync. */
  defaultItemSection: string
}

export const CATEGORY_SECTION_PRESETS: CategorySectionPreset[] = [
  {
    idPrefixes: ['gut-healing-drinks', 'gut-healing'],
    nameIncludes: 'guthealing',
    sections: ['Flavored Kombucha', 'Plain Kombucha', 'Other Drinks'],
    defaultItemSection: 'Other Drinks',
  },
]

export function normalizeCategoryKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function findPresetForCategory(id: string, name: string): CategorySectionPreset | undefined {
  const idLower = id.toLowerCase()
  const nameNorm = normalizeCategoryKey(name)
  return CATEGORY_SECTION_PRESETS.find((preset) => {
    const idMatch = preset.idPrefixes.some(
      (p) => idLower === p || idLower.startsWith(`${p}-`) || idLower.startsWith(p)
    )
    const nameMatch =
      (preset.nameIncludes != null && nameNorm.includes(preset.nameIncludes)) ||
      (preset.nameMustIncludeAll != null &&
        preset.nameMustIncludeAll.every((part) => nameNorm.includes(part)))
    return idMatch || nameMatch
  })
}
