/** Mirrors server presets so section headings show even before DB sync completes. */

const PRESETS: { idPrefixes: string[]; nameIncludes: string; sections: string[] }[] = [
  { idPrefixes: ['herbs'], nameIncludes: 'herbs', sections: ['Powders', 'Seeds'] },
  {
    idPrefixes: ['honey-nuts-oils', 'honey-nuts'],
    nameIncludes: 'honeynuts',
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
    return idMatch || nameNorm.includes(p.nameIncludes)
  })
  return preset?.sections
}
