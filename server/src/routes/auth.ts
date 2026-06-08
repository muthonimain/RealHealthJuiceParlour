import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { verifyOwnerLogin } from '../data/owners'
import { verifyEmployeeLogin, getEmployeeById } from '../data/employees'
import {
  createEmployeeSession,
  touchEmployeeSession,
  releaseEmployeeSession,
  isEmployeeSessionActive,
  isEmployeeInUseByAnotherSession,
} from '../data/employeeSessionStore'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/asyncHandler'

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

router.post('/employee-select', async (req: Request, res: Response): Promise<void> => {
  const { employeeId } = req.body as { employeeId?: string }

  if (!employeeId?.trim()) {
    res.status(400).json({ message: 'Employee id is required.' })
    return
  }

  const employee = await getEmployeeById(employeeId.trim())
  if (!employee) {
    res.status(404).json({ message: 'Employee not found.' })
    return
  }

  const { resumeSessionId, sharedDevice } = req.body as {
    resumeSessionId?: string
    sharedDevice?: boolean
  }

  if (resumeSessionId) {
    const stillActive = await isEmployeeSessionActive(employee.id, resumeSessionId)
    if (stillActive) {
      const token = jwt.sign(
        { id: employee.id, role: 'employee', sessionId: resumeSessionId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      )
      await touchEmployeeSession(employee.id, resumeSessionId)
      res.json({
        token,
        user: { id: employee.id, name: employee.name, role: 'employee' },
        sessionId: resumeSessionId,
      })
      return
    }
  }

  if (!sharedDevice) {
    const inUse = await isEmployeeInUseByAnotherSession(employee.id)
    if (inUse) {
      res.status(409).json({
        message: `${employee.name} is already signed in on another device. Open the print monitor at /dashboard/employee/print, or tap Switch staff on the active device first.`,
        code: 'EMPLOYEE_IN_USE',
      })
      return
    }
  }

  const sessionId = await createEmployeeSession(employee.id)
  const token = jwt.sign(
    { id: employee.id, role: 'employee', sessionId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
  res.json({
    token,
    user: { id: employee.id, name: employee.name, role: 'employee' },
    sessionId,
  })
})

router.post(
  '/employee-heartbeat',
  requireAuth,
  requireRole('employee'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, sessionId } = req.user!
    if (!sessionId) {
      res.status(401).json({ message: 'Employee session required.', code: 'SESSION_INACTIVE' })
      return
    }

    const active = await isEmployeeSessionActive(id, sessionId)
    if (!active) {
      res.status(409).json({
        message: 'This staff session is no longer active.',
        code: 'SESSION_INACTIVE',
      })
      return
    }

    await touchEmployeeSession(id, sessionId)
    res.json({ ok: true })
  })
)

router.post(
  '/employee-release',
  requireAuth,
  requireRole('employee'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, sessionId } = req.user!
    if (sessionId) {
      await releaseEmployeeSession(id, sessionId)
    }
    res.json({ ok: true })
  })
)

export default router
