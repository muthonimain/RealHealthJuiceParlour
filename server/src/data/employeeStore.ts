import '../env'
import { JsonCollection } from '../lib/persistence'

export interface EmployeeRecord {
  id: string
  name: string
  username: string
}

export interface EmployeeWithPassword extends EmployeeRecord {
  password: string
}

interface StoredEmployee extends EmployeeWithPassword {
  sortOrder: number
  createdAt: string
}

const employeesDb = new JsonCollection<StoredEmployee>('employees.json')

const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

function loadEmployeesFromEnv(): StoredEmployee[] {
  const employees: StoredEmployee[] = []
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
      sortOrder: i - 1,
      createdAt: new Date().toISOString(),
    })
    i++
  }
  return employees
}

function sortEmployees(list: StoredEmployee[]): StoredEmployee[] {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

function publicEmployee(emp: StoredEmployee): EmployeeRecord {
  return { id: emp.id, name: emp.name, username: emp.username }
}

function withPassword(emp: StoredEmployee): EmployeeWithPassword {
  return {
    id: emp.id,
    name: emp.name,
    username: emp.username,
    password: emp.password,
  }
}

export async function countEmployees(): Promise<number> {
  return employeesDb.read().length
}

export async function seedEmployeesFromEnvIfEmpty(): Promise<void> {
  if ((await countEmployees()) > 0) return
  const fromEnv = loadEmployeesFromEnv()
  if (!fromEnv.length) return
  employeesDb.write(fromEnv)
  console.log('[data] Seeded %d employees from environment', fromEnv.length)
}

export async function listEmployees(): Promise<EmployeeRecord[]> {
  return sortEmployees(employeesDb.read()).map(publicEmployee)
}

export async function listEmployeesWithPasswords(): Promise<EmployeeWithPassword[]> {
  return sortEmployees(employeesDb.read()).map(withPassword)
}

export async function getEmployeeById(id: string): Promise<EmployeeRecord | null> {
  const emp = employeesDb.read().find((e) => e.id === id)
  return emp ? publicEmployee(emp) : null
}

export async function verifyEmployeeLogin(
  username: string,
  password: string
): Promise<EmployeeRecord | null> {
  const u = username.trim().toLowerCase()
  const p = password.trim()
  if (!u || !p) return null
  const emp = employeesDb
    .read()
    .find((e) => e.username.toLowerCase() === u && e.password === p)
  return emp ? publicEmployee(emp) : null
}

async function usernameTaken(username: string, exceptId?: string): Promise<boolean> {
  const u = username.trim().toLowerCase()
  return employeesDb
    .read()
    .some((e) => e.username.toLowerCase() === u && e.id !== exceptId)
}

function newEmployeeId(): string {
  return `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export async function createEmployee(data: {
  name: string
  username?: string
  password: string
}): Promise<EmployeeWithPassword> {
  const name = data.name.trim()
  const password = data.password.trim()
  const username = (data.username?.trim() || name).trim()
  if (!name) throw new Error('Employee name is required.')
  if (!username) throw new Error('Username is required.')
  if (!password) throw new Error('Password is required.')
  if (await usernameTaken(username)) throw new Error('That username is already in use.')

  const all = employeesDb.read()
  const sortOrder = all.reduce((max, e) => Math.max(max, e.sortOrder), -1) + 1
  const created: StoredEmployee = {
    id: newEmployeeId(),
    name,
    username,
    password,
    sortOrder,
    createdAt: new Date().toISOString(),
  }
  all.push(created)
  employeesDb.write(all)
  return withPassword(created)
}

export async function updateEmployee(
  id: string,
  data: { name?: string; username?: string; password?: string }
): Promise<EmployeeWithPassword | null> {
  const all = employeesDb.read()
  const index = all.findIndex((e) => e.id === id)
  if (index < 0) return null

  const existing = all[index]
  const name = data.name !== undefined ? data.name.trim() : existing.name
  const username = data.username !== undefined ? data.username.trim() : existing.username
  const password = data.password !== undefined ? data.password.trim() : existing.password

  if (!name) throw new Error('Employee name is required.')
  if (!username) throw new Error('Username is required.')
  if (!password) throw new Error('Password is required.')
  if (await usernameTaken(username, id)) throw new Error('That username is already in use.')

  const updated: StoredEmployee = { ...existing, name, username, password }
  all[index] = updated
  employeesDb.write(all)
  return withPassword(updated)
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const all = employeesDb.read()
  const next = all.filter((e) => e.id !== id)
  if (next.length === all.length) return false
  employeesDb.write(next)
  return true
}
