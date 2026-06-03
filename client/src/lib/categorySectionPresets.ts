/** Mirrors server presets so section headings show even before DB sync completes. */

const PRESETS: {
  idPrefixes: string[]
  nameIncludes?: string
  nameMustIncludeAll?: string[]
  sections: string[]
}[] = [
  { idPrefixes: ['herbs'], nameIncludes: 'herbs', sections: ['Powders', 'Seeds'] },
  {
    idPrefixes: ['honey-nuts-oils', 'honey-nuts', 'nuts-oils-honey', 'nuts-oils'],
    nameMustIncludeAll: ['honey', 'nuts', 'oils'],
    sections: ['Honey', 'Nuts', 'Oils'],
  },
  {
    idPrefixes: ['gut-healing-drinks', 'gut-healing'],
    nameIncludes: 'guthealing',
    sections: ['Flavored Kombucha', 'Plain Kombucha', 'Other Drinks'],
  },
]

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function resolveCategorySections(
  id: string,
  name: string,
  sections?: string[]
): string[] | undefined {
  if (sections?.length) return sections
  const idLower = id.toLowerCase()
  const nameNorm = normalizeKey(name)
  const preset = PRESETS.find((p) => {
    const idMatch = p.idPrefixes.some(
      (prefix) => idLower === prefix || idLower.startsWith(`${prefix}-`) || idLower.startsWith(prefix)
    )
    const nameMatch =
      (p.nameIncludes != null && nameNorm.includes(p.nameIncludes)) ||
      (p.nameMustIncludeAll != null && p.nameMustIncludeAll.every((part) => nameNorm.includes(part)))
    return idMatch || nameMatch
  })
  return preset?.sections
}
