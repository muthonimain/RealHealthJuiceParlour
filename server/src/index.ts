import './env' // MUST be first — loads .env before any other module reads process.env
import express from 'express'
import cors from 'cors'
import path from 'path'
import authRoutes from './routes/auth'
import menuRoutes from './routes/menu'
import employeeRoutes from './routes/employees'
import ordersRoutes from './routes/orders'
import clearancesRoutes from './routes/clearances'

const app = express()
const PORT = process.env.PORT || 5000
const isProd = process.env.NODE_ENV === 'production'

app.use(cors({
  origin: isProd ? false : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true,
}))
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/clearances', clearancesRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Real Health Juice Parlour POS' })
})

// Serve React static build in production (single localhost)
if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`)
})
