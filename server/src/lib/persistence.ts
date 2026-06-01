import fs from 'fs'
import path from 'path'

const PERSIST_DIR = path.join(__dirname, '../../persisted')

function ensureDir() {
  if (!fs.existsSync(PERSIST_DIR)) {
    fs.mkdirSync(PERSIST_DIR, { recursive: true })
  }
}

export function loadJson<T>(filename: string, fallback: T): T {
  ensureDir()
  const filePath = path.join(PERSIST_DIR, filename)
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw) as T
    }
  } catch (err) {
    console.error(`[persist] Failed to load ${filename}:`, err)
  }
  return fallback
}

export function saveJson<T>(filename: string, data: T): void {
  ensureDir()
  const filePath = path.join(PERSIST_DIR, filename)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error(`[persist] Failed to save ${filename}:`, err)
  }
}
