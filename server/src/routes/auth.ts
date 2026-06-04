import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { verifyOwnerLogin } from '../data/owners'
import { verifyEmployeeLogin } from '../data/employees'

const router = Router()
const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

const JWT_SECRET = env('JWT_SECRET', 'rhjp_dev_secret_change_in_production')
const JWT_EXPIRES = '8h'

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { role, username, password } = req.body as {
    role: string
    username: string
    password: string
  }

  if (!role || !username?.trim() || !password?.trim()) {
    res.status(400).json({ message: 'Role, username and password are required.' })
    return
  }

  if (role === 'owner') {
    const owner = verifyOwnerLogin(username, password)
    if (!owner) {
      res.status(401).json({ message: 'Invalid username or password.' })
      return
    }

    const token = jwt.sign({ id: owner.id, role: 'owner' }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    res.json({ token, user: { id: owner.id, name: owner.name, role: 'owner' } })
    return
  }

  if (role === 'employee') {
    const employee = await verifyEmployeeLogin(username, password)
    if (!employee) {
      res.status(401).json({ message: 'Invalid username or password.' })
      return
    }

    const token = jwt.sign({ id: employee.id, role: 'employee' }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    res.json({ token, user: { id: employee.id, name: employee.name, role: 'employee' } })
    return
  }

  res.status(400).json({ message: 'Invalid role.' })
})

export default router
