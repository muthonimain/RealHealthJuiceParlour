import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { employees } from '../data/employees'

const router = Router()
const env = (key: string, fallback: string) => (process.env[key] ?? '').trim() || fallback

const JWT_SECRET = env('JWT_SECRET', 'rhjp_dev_secret_change_in_production')
const JWT_EXPIRES = '8h'

router.post('/login', async (req: Request, res: Response) => {
  const { role, username, password } = req.body as {
    role: string
    username: string
    password: string
  }

  if (!role || !username || !password) {
    res.status(400).json({ message: 'Role, username and password are required.' })
    return
  }

  if (role === 'owner') {
    const ownerUsername = env('OWNER_USERNAME', 'owner')
    const ownerPassword = env('OWNER_PASSWORD', 'owner1234')
    const ownerName = env('OWNER_NAME', 'Owner')

    if (username !== ownerUsername || password !== ownerPassword) {
      res.status(401).json({ message: 'Invalid username or password.' })
      return
    }

    const token = jwt.sign({ id: 'owner-1', role: 'owner' }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
    res.json({ token, user: { id: 'owner-1', name: ownerName, role: 'owner' } })
    return
  }

  if (role === 'employee') {
    const employee = employees.find((e) => e.username === username)
    if (!employee) {
      res.status(401).json({ message: 'Invalid username or password.' })
      return
    }

    const valid = await bcrypt.compare(password, employee.passwordHash)
    if (!valid) {
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
