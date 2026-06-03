import '../env'

const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

export interface EmployeeRecord {
  id: string
  name: string
  username: string
}

function loadEmployeesFromEnv(): Array<EmployeeRecord & { password: string }> {
  const employees: Array<EmployeeRecord & { password: string }> = []
  let i = 1
  while (true) {
    const name = env(`EMPLOYEE_${i}_NAME`, '')
    const username = env(`EMPLOYEE_${i}_USERNAME`, '')
    const password = env(`EMPLOYEE_${i}_PASSWORD`, '')
    if (!name && !username) break
    const resolvedUsername = username || `employee${i}`
    employees.push({
      id: `emp-${i}`,
      name: name || resolvedUsername,
      username: resolvedUsername,
      password,
    })
    i++
  }
  return employees
}

/** Public list for employee-select screen (no passwords). */
export function listEmployees(): EmployeeRecord[] {
  return loadEmployeesFromEnv().map(({ password: _p, ...rest }) => rest)
}

/** Read .env on each login so credential updates apply without restart. */
export function verifyEmployeeLogin(username: string, password: string): EmployeeRecord | null {
  const u = username.trim().toLowerCase()
  const p = password.trim()
  if (!u || !p) return null

  const match = loadEmployeesFromEnv().find(
    (e) => e.username.toLowerCase() === u && e.password === p
  )
  if (!match) return null

  const { password: _pw, ...publicEmployee } = match
  return publicEmployee
}
