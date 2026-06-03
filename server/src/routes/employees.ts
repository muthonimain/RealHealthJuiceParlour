import { Router } from 'express'
import { listEmployees } from '../data/employees'

const router = Router()

// Return employee names + usernames only (no passwords)
router.get('/', (_req, res) => {
  res.json(listEmployees())
})

export default router
