import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { touchEmployeeSession, isEmployeeSessionActive } from '../data/employeeSessionStore'

export interface JwtPayload {
  id: string
  role: string
  sessionId?: string
}

export interface AuthRequest extends Request {
  user?: JwtPayload
}

const JWT_SECRET = process.env.JWT_SECRET || 'rhjp_dev_secret_change_in_production'

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Token invalid or expired.' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied.' })
      return
    }
    next()
  }
}

export async function requireEmployeeSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || req.user.role !== 'employee' || !req.user.sessionId) {
    res.status(401).json({ message: 'Employee session required.' })
    return
  }

  const active = await isEmployeeSessionActive(req.user.id, req.user.sessionId)
  if (!active) {
    res.status(409).json({
      message: 'This staff session is no longer active. Tap Switch staff and sign in again.',
      code: 'SESSION_INACTIVE',
    })
    return
  }

  await touchEmployeeSession(req.user.id, req.user.sessionId)
  next()
}
