export function getAuthHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('rhjp_user')
    if (!stored) return {}
    const { token } = JSON.parse(stored) as { token?: string }
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  return fetch(url, { ...init, headers })
}

/** Parse JSON API responses; surface clear errors when HTML/error pages are returned. */
export async function readApiJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) {
    if (!res.ok) throw new Error(`Request failed (${res.status}).`)
    return {} as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    if (text.trimStart().startsWith('<')) {
      if (res.status === 404) {
        throw new Error(
          'API endpoint not found. If you just deployed, wait for Render to finish, then hard-refresh the page.'
        )
      }
      throw new Error(
        `Server returned an unexpected page (${res.status}). Try again after the app finishes deploying.`
      )
    }
    throw new Error(text.slice(0, 200) || `Request failed (${res.status}).`)
  }
}
