import './env' // MUST be first — loads .env before any other module reads process.env
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import authRoutes from './routes/auth'
import menuRoutes from './routes/menu'
import employeeRoutes from './routes/employees'
import ownerRoutes from './routes/owners'
import ordersRoutes from './routes/orders'
import clearancesRoutes from './routes/clearances'
import expensesRoutes from './routes/expenses'
import profitRoutes from './routes/profit'
import { initDatabase } from './db/init'
import { pool } from './db/pool'

const app = express()
const PORT = process.env.PORT || 5000
const isProd = process.env.NODE_ENV === 'production'

app.use(
  cors({
    origin: isProd ? false : process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/owners', ownerRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/clearances', clearancesRoutes)
app.use('/api/expenses', expensesRoutes)
app.use('/api/profit', profitRoutes)

app.get('/api/health', async (_req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      await pool.query('SELECT 1')
    }
    res.json({
      status: 'ok',
      service: 'Real Health Juice Parlour POS',
      database: process.env.DATABASE_URL ? 'postgresql' : 'not_configured',
    })
  } catch {
    res.status(503).json({ status: 'degraded', message: 'Database unreachable' })
  }
})

// Serve React static build in production (single host — API + SPA)
if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist')
  const indexHtml = path.join(clientDist, 'index.html')
  app.use(express.static(clientDist))
  // Fallback for client-side routes — avoid app.get('*') / wildcards (Express 5 path-to-regexp)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api')) return next()
    res.sendFile(indexHtml)
  })
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api]', err)
  res.status(500).json({ message: err.message || 'Internal server error.' })
})

async function main() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
