import { Router, Response } from 'express'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'
import {
  listEmployees,
  listEmployeesWithPasswords,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../data/employeeStore'
import { getActiveEmployeeIds } from '../data/employeeSessionStore'

const router = Router()

// Public list for employee sign-in screen (no passwords)
router.get(
  '/',
  asyncHandler(async (_req, res: Response) => {
    const [employees, activeIds] = await Promise.all([listEmployees(), getActiveEmployeeIds()])
    const activeSet = new Set(activeIds)
    res.json(
      employees.map((emp) => ({
        ...emp,
        isActive: activeSet.has(emp.id),
      }))
    )
  })
)

// Owner: full list with passwords for staff management
router.get(
  '/manage',
  requireAuth,
  requireRole('owner'),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.json(await listEmployeesWithPasswords())
  })
)

router.post(
  '/',
  requireAuth,
  requireRole('owner'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, username, password } = req.body as {
      name?: string
      username?: string
      password?: string
    }

    try {
      const employee = await createEmployee({
        name: name ?? '',
        username,
        password: password ?? '',
      })
      res.status(201).json({ employee, items: await listEmployeesWithPasswords() })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not add employee.'
      res.status(400).json({ message })
    }
  })
)

router.patch(
  '/:id',
  requireAuth,
  requireRole('owner'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    const { name, username, password } = req.body as {
      name?: string
      username?: string
      password?: string
    }

    try {
      const employee = await updateEmployee(id, { name, username, password })
      if (!employee) {
        res.status(404).json({ message: 'Employee not found.' })
        return
      }
      res.json({ employee, items: await listEmployeesWithPasswords() })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update employee.'
      res.status(400).json({ message })
    }
  })
)

router.delete(
  '/:id',
  requireAuth,
  requireRole('owner'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    if (!(await deleteEmployee(id))) {
      res.status(404).json({ message: 'Employee not found.' })
      return
    }
    res.json({ success: true, items: await listEmployeesWithPasswords() })
  })
)

export default router
