import { buildDefaultMenu } from './menuSeed'
import { syncMenuFromSeedIfNeeded } from './syncMenuFromSeed'
import { isMenuEmpty, replaceAllCategories } from '../data/menuStore'
import { seedEmployeesFromEnvIfEmpty } from '../data/employeeStore'
import { syncOrderNumberSequence } from '../lib/orderNumber'
import { getDataDir } from '../lib/persistence'
import fs from 'fs'

/**
 * Initialize disk-backed data stores (no PostgreSQL).
 * On Render, mount a persistent disk and set DATA_DIR to the mount path.
 */
export async function initDatabase(): Promise<void> {
  const dataDir = getDataDir()
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  console.log('[data] Using disk store at %s', dataDir)

  await seedEmployeesFromEnvIfEmpty()
  await syncOrderNumberSequence()

  if (await isMenuEmpty()) {
    const menu = buildDefaultMenu()
    await replaceAllCategories(menu)
    console.log('[data] Menu seeded (%d categories)', menu.length)
  }

  await syncMenuFromSeedIfNeeded()
  console.log('[data] Disk persistence ready')
}
