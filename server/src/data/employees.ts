import bcrypt from 'bcryptjs'

const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

export interface EmployeeRecord {
  id: string
  name: string
  username: string
  passwordHash: string
}

// Build employee list from numbered env vars: EMPLOYEE_1_*, EMPLOYEE_2_*, etc.
function loadEmployees(): EmployeeRecord[] {
  const employees: EmployeeRecord[] = []
  let i = 1
  while (true) {
    const name = env(`EMPLOYEE_${i}_NAME`, '')
    const username = env(`EMPLOYEE_${i}_USERNAME`, '')
    const password = env(`EMPLOYEE_${i}_PASSWORD`, '')
    if (!name && !username) break
    employees.push({
      id: `emp-${i}`,
      name: name || `Employee ${i}`,
      username: username || `employee${i}`,
      passwordHash: bcrypt.hashSync(password || 'changeme', 10),
    })
    i++
  }
  return employees
}

export const employees = loadEmployees()
