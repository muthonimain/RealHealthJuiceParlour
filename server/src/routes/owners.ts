import { Router } from 'express'
import { listOwners } from '../data/owners'

const router = Router()

// Return owner names + usernames only (no passwords)
router.get('/', (_req, res) => {
  res.json(listOwners())
})

export default router
