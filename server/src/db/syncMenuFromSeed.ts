import { buildDefaultMenu } from './menuSeed'
import { JsonDocument } from '../lib/persistence'
import { replaceAllCategories } from '../data/menuStore'

/** Bump when menu.ts changes and live menu should be replaced from seed. */
export const MENU_SEED_REVISION = 2

interface AppSettings {
  menu_seed_revision?: number
}

const settingsDb = new JsonDocument<AppSettings>('app-settings.json', () => ({}))

/** Replace the live menu when menu.ts revision advances (e.g. after a PDF menu update). */
export async function syncMenuFromSeedIfNeeded(): Promise<void> {
  const settings = settingsDb.read()
  const applied = Number(settings.menu_seed_revision ?? 0)
  if (applied >= MENU_SEED_REVISION) return

  const menu = buildDefaultMenu()
  await replaceAllCategories(menu)
  settingsDb.write({ ...settings, menu_seed_revision: MENU_SEED_REVISION })
  await settingsDb.flush()
  console.log(
    '[data] Menu replaced from seed (revision %d, %d categories)',
    MENU_SEED_REVISION,
    menu.length
  )
}
