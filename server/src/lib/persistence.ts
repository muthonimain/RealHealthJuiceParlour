import fs from 'fs'
import path from 'path'

/**
 * Persistent JSON data directory.
 * On Render, mount a persistent disk and set DATA_DIR to that mount path
 * (e.g. /var/data). Falls back to server/persisted for local development.
 */
export function getDataDir(): string {
  const fromEnv = process.env.DATA_DIR?.trim()
  if (fromEnv) return path.resolve(fromEnv)
  return path.join(__dirname, '../../persisted')
}

function ensureDir(dir = getDataDir()) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function filePath(filename: string): string {
  return path.join(getDataDir(), filename)
}

/** Atomic write: temp file in same directory, then rename. */
export function saveJson<T>(filename: string, data: T): void {
  ensureDir()
  const target = filePath(filename)
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, target)
}

export function loadJson<T>(filename: string, fallback: T): T {
  ensureDir()
  const target = filePath(filename)
  if (!fs.existsSync(target)) return fallback
  try {
    return JSON.parse(fs.readFileSync(target, 'utf-8')) as T
  } catch {
    return fallback
  }
}

export function dataFileExists(filename: string): boolean {
  return fs.existsSync(filePath(filename))
}

/** Simple in-memory cache + disk-backed JSON collection. */
export class JsonCollection<T> {
  private cache: T[] | null = null
  private writeChain: Promise<void> = Promise.resolve()

  constructor(
    private readonly filename: string,
    private readonly clone: (items: T[]) => T[] = (items) =>
      JSON.parse(JSON.stringify(items)) as T[]
  ) {}

  read(): T[] {
    if (this.cache) return this.clone(this.cache)
    this.cache = loadJson<T[]>(this.filename, [])
    return this.clone(this.cache)
  }

  /** Synchronously update memory + queue durable write. */
  write(items: T[]): T[] {
    const next = this.clone(items)
    this.cache = next
    const snapshot = this.clone(next)
    this.writeChain = this.writeChain
      .then(() => {
        saveJson(this.filename, snapshot)
      })
      .catch((err) => {
        console.error(`[persist] Failed to write ${this.filename}`, err)
      })
    return this.clone(next)
  }

  async flush(): Promise<void> {
    await this.writeChain
  }
}

export class JsonDocument<T extends object> {
  private cache: T | null = null
  private writeChain: Promise<void> = Promise.resolve()

  constructor(
    private readonly filename: string,
    private readonly fallback: () => T
  ) {}

  read(): T {
    if (this.cache) return JSON.parse(JSON.stringify(this.cache)) as T
    this.cache = loadJson<T>(this.filename, this.fallback())
    return JSON.parse(JSON.stringify(this.cache)) as T
  }

  write(data: T): T {
    const next = JSON.parse(JSON.stringify(data)) as T
    this.cache = next
    const snapshot = JSON.parse(JSON.stringify(next)) as T
    this.writeChain = this.writeChain
      .then(() => {
        saveJson(this.filename, snapshot)
      })
      .catch((err) => {
        console.error(`[persist] Failed to write ${this.filename}`, err)
      })
    return JSON.parse(JSON.stringify(next)) as T
  }

  async flush(): Promise<void> {
    await this.writeChain
  }
}
