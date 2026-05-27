import { Router } from 'express'
import { menuData } from '../data/menu'

const router = Router()

router.get('/categories', (_req, res) => {
  res.json(menuData)
})

router.get('/categories/:id', (req, res) => {
  const category = menuData.find((c) => c.id === req.params.id)
  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }
  res.json(category)
})

export default router
