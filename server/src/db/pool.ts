import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL?.trim()

if (!connectionString) {
  console.warn(
    '[db] DATABASE_URL is not set. Set it to your PostgreSQL connection string (required on DigitalOcean App Platform).'
  )
}

/** Shared connection pool — use for all database access. */
export const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl:
    process.env.DATABASE_SSL === 'true' ||
    process.env.NODE_ENV === 'production' ||
    connectionString?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  max: Number(process.env.PG_POOL_MAX || 10),
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error', err)
})

export function requireDatabase(): Pool {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.')
  }
  return pool
}
