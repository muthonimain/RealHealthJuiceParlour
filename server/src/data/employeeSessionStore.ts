import { randomUUID } from 'crypto'
import { JsonCollection } from '../lib/persistence'

const SESSION_TTL_MS = 90_000

interface EmployeeSession {
  sessionId: string
  employeeId: string
  lastSeenAt: string
}

const sessionsDb = new JsonCollection<EmployeeSession>('employee-sessions.json')

function pruneExpired(sessions: EmployeeSession[]): EmployeeSession[] {
  const cutoff = Date.now() - SESSION_TTL_MS
  return sessions.filter((s) => new Date(s.lastSeenAt).getTime() >= cutoff)
}

function persistLive(sessions: EmployeeSession[]): EmployeeSession[] {
  const live = pruneExpired(sessions)
  sessionsDb.write(live)
  return live
}

/** Start a new device session for this employee (multiple devices allowed — shared cart). */
export async function createEmployeeSession(employeeId: string): Promise<string> {
  const sessions = pruneExpired(sessionsDb.read())
  const sessionId = randomUUID()
  sessions.push({
    sessionId,
    employeeId,
    lastSeenAt: new Date().toISOString(),
  })
  sessionsDb.write(sessions)
  return sessionId
}

export async function touchEmployeeSession(
  employeeId: string,
  sessionId: string
): Promise<boolean> {
  const sessions = pruneExpired(sessionsDb.read())
  const index = sessions.findIndex(
    (s) => s.employeeId === employeeId && s.sessionId === sessionId
  )
  if (index < 0) {
    sessionsDb.write(sessions)
    return false
  }
  sessions[index] = {
    ...sessions[index],
    lastSeenAt: new Date().toISOString(),
  }
  sessionsDb.write(sessions)
  return true
}

export async function releaseEmployeeSession(employeeId: string, sessionId: string): Promise<void> {
  const sessions = pruneExpired(sessionsDb.read())
  sessionsDb.write(
    sessions.filter((s) => !(s.employeeId === employeeId && s.sessionId === sessionId))
  )
}

export async function isEmployeeSessionActive(
  employeeId: string,
  sessionId: string
): Promise<boolean> {
  const sessions = persistLive(sessionsDb.read())
  const session = sessions.find(
    (s) => s.employeeId === employeeId && s.sessionId === sessionId
  )
  if (!session) return false
  return Date.now() - new Date(session.lastSeenAt).getTime() < SESSION_TTL_MS
}

/** Employees with at least one live device session (shown on staff picker). */
export async function getActiveEmployeeIds(): Promise<string[]> {
  const sessions = persistLive(sessionsDb.read())
  return [...new Set(sessions.map((s) => s.employeeId))]
}

/** Block a second person from picking an already-active staff name on the sign-in screen. */
export async function isEmployeeInUseByAnotherSession(
  employeeId: string,
  currentSessionId?: string
): Promise<boolean> {
  const sessions = persistLive(sessionsDb.read()).filter((s) => s.employeeId === employeeId)
  if (sessions.length === 0) return false
  if (currentSessionId && sessions.every((s) => s.sessionId === currentSessionId)) return false
  return true
}
