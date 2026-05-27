import { Router } from 'express'
import { employees } from '../data/employees'

const router = Router()

// Return employee names + usernames only (no passwords)
router.get('/', (_req, res) => {
  res.json(employees.map(({ id, name, username }) => ({ id, name, username })))
})

export default router
