import '../env'

const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

export interface OwnerRecord {
  id: string
  name: string
  username: string
}

function loadOwnersFromEnv(): Array<OwnerRecord & { password: string }> {
  const owners: Array<OwnerRecord & { password: string }> = []
  let i = 1
  while (true) {
    const name = env(`OWNER_${i}_NAME`, '')
    const username = env(`OWNER_${i}_USERNAME`, '')
    const password = env(`OWNER_${i}_PASSWORD`, '')
    if (!name && !username) break
    const resolvedUsername = username || `owner${i}`
    owners.push({
      id: `owner-${i}`,
      name: name || resolvedUsername,
      username: resolvedUsername,
      password,
    })
    i++
  }

  if (owners.length === 0) {
    const name = env('OWNER_NAME', '')
    const username = env('OWNER_USERNAME', '')
    const password = env('OWNER_PASSWORD', '')
    if (name || username) {
      const resolvedUsername = username || 'owner'
      owners.push({
        id: 'owner-1',
        name: name || resolvedUsername,
        username: resolvedUsername,
        password,
      })
    }
  }

  return owners
}

/** Public list for owner-select screen (no passwords). */
export function listOwners(): OwnerRecord[] {
  return loadOwnersFromEnv().map(({ password: _p, ...rest }) => rest)
}

/** Read .env on each login so credential updates apply without restart. */
export function verifyOwnerLogin(username: string, password: string): OwnerRecord | null {
  const u = username.trim().toLowerCase()
  const p = password.trim()
  if (!u || !p) return null

  const match = loadOwnersFromEnv().find(
    (o) => o.username.toLowerCase() === u && o.password === p
  )
  if (!match) return null

  const { password: _pw, ...publicOwner } = match
  return publicOwner
}
