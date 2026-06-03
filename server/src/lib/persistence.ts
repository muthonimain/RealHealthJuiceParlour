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
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export function saveJson<T>(filename: string, data: T): void {
  ensureDir()
  fs.writeFileSync(path.join(PERSIST_DIR, filename), JSON.stringify(data, null, 2), 'utf-8')
}
