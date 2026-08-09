import { JsonDocument } from '../lib/persistence'

export interface EmployeeCartItem {
  id: string
  name: string
  price: number
  quantity: number
  categoryName: string
  categoryId?: string
  note?: string
  section?: string
}

interface CartMap {
  [employeeId: string]: {
    items: EmployeeCartItem[]
    updatedAt: string
  }
}

const cartsDb = new JsonDocument<CartMap>('employee-carts.json', () => ({}))

export async function getEmployeeCart(employeeId: string): Promise<{
  items: EmployeeCartItem[]
  updatedAt: string
}> {
  const carts = cartsDb.read()
  const cart = carts[employeeId]
  if (!cart) {
    return { items: [], updatedAt: new Date(0).toISOString() }
  }
  return {
    items: cart.items ?? [],
    updatedAt: cart.updatedAt,
  }
}

export async function setEmployeeCart(
  employeeId: string,
  items: EmployeeCartItem[]
): Promise<{ items: EmployeeCartItem[]; updatedAt: string }> {
  const carts = cartsDb.read()
  const updatedAt = new Date().toISOString()
  carts[employeeId] = { items, updatedAt }
  cartsDb.write(carts)
  return { items, updatedAt }
}

export async function clearEmployeeCart(employeeId: string): Promise<void> {
  const carts = cartsDb.read()
  if (!(employeeId in carts)) return
  delete carts[employeeId]
  cartsDb.write(carts)
}
