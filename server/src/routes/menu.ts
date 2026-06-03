import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  addItem,
  updateItem,
  deleteItem,
} from '../data/menuStore'

const router = Router()

router.get(
  '/categories',
  asyncHandler(async (_req, res: Response) => {
    res.json(await getAllCategories())
  })
)

router.get(
  '/categories/:id',
  asyncHandler(async (req, res: Response) => {
    const category = await getCategoryById(String(req.params.id))
    if (!category) {
      res.status(404).json({ message: 'Category not found' })
      return
    }
    res.json(category)
  })
)

const staffOnly = [requireAuth, requireRole('owner', 'employee')]

router.post(
  '/categories',
  ...staffOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, emoji } = req.body as { name?: string; emoji?: string }
    if (!name?.trim()) {
      res.status(400).json({ message: 'Category title is required.' })
      return
    }
    res.status(201).json(await createCategory(name, emoji))
  })
)

router.patch(
  '/categories/:id',
  ...staffOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await updateCategory(String(req.params.id), req.body)
    if (!category) {
      res.status(404).json({ message: 'Category not found' })
      return
    }
    res.json(category)
  })
)

router.delete(
  '/categories/:id',
  ...staffOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!(await deleteCategory(String(req.params.id)))) {
      res.status(404).json({ message: 'Category not found' })
      return
    }
    res.json({ success: true })
  })
)

router.post(
  '/categories/:id/items',
  ...staffOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, price, note, section } = req.body as {
      name?: string
      price?: number
      note?: string
      section?: string
    }
    if (!name?.trim()) {
      res.status(400).json({ message: 'Item name is required.' })
      return
    }
    const item = await addItem(String(req.params.id), {
      name,
      price: price ?? 0,
      note,
      section,
    })
    if (!item) {
      res.status(404).json({ message: 'Category not found' })
      return
    }
    res.status(201).json(item)
  })
)

router.patch(
  '/categories/:categoryId/items/:itemId',
  ...staffOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await updateItem(
      String(req.params.categoryId),
      String(req.params.itemId),
      req.body
    )
    if (!item) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json(item)
  })
)

router.delete(
  '/categories/:categoryId/items/:itemId',
  ...staffOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!(await deleteItem(String(req.params.categoryId), String(req.params.itemId)))) {
      res.status(404).json({ message: 'Item not found' })
      return
    }
    res.json({ success: true })
  })
)

export default router
