import { Router, Response } from 'express'
import { requireAuth, requireRole, requireEmployeeSession, AuthRequest } from '../middleware/auth'
import { getEmployeeCart, setEmployeeCart, clearEmployeeCart, type EmployeeCartItem } from '../data/employeeCartStore'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()
const employeeAuth = [requireAuth, requireRole('employee'), requireEmployeeSession]

router.get(
  '/',
  ...employeeAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = req.user!.id
    res.json(await getEmployeeCart(employeeId))
  })
)

router.put(
  '/',
  ...employeeAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = req.user!.id
    const { items } = req.body as { items?: EmployeeCartItem[] }
    if (!Array.isArray(items)) {
      res.status(400).json({ message: 'items array is required.' })
      return
    }
    res.json(await setEmployeeCart(employeeId, items))
  })
)

router.delete(
  '/',
  ...employeeAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await clearEmployeeCart(req.user!.id)
    res.json({ success: true, items: [], updatedAt: new Date().toISOString() })
  })
)

export default router
