import { Router, Request, Response } from 'express'
import { createOrder, getAllOrders, getOrderById, getRevenueStats } from '../data/ordersStore'
import type { OrderItem } from '../data/ordersStore'

const router = Router()

// POST /api/orders — employee submits a completed order
router.post('/', (req: Request, res: Response) => {
  const { employeeId, employeeName, items, subtotal, deliveryIncluded, deliveryAmount, grandTotal } = req.body as {
    employeeId: string
    employeeName: string
    items: OrderItem[]
    subtotal: number
    deliveryIncluded: boolean
    deliveryAmount: number
    grandTotal: number
  }

  if (!employeeName || !items?.length) {
    res.status(400).json({ message: 'employeeName and items are required.' })
    return
  }

  const order = createOrder({ employeeId, employeeName, items, subtotal, deliveryIncluded, deliveryAmount, grandTotal })
  res.status(201).json(order)
})

// GET /api/orders — owner fetches all orders
router.get('/', (_req: Request, res: Response) => {
  res.json(getAllOrders())
})

// GET /api/orders/stats/revenue — today's + all-time + per-day revenue (persisted)
router.get('/stats/revenue', (_req: Request, res: Response) => {
  res.json(getRevenueStats())
})

// GET /api/orders/:id — fetch a single order (for receipt page)
router.get('/:id', (req: Request, res: Response) => {
  const order = getOrderById(String(req.params.id))
  if (!order) {
    res.status(404).json({ message: 'Order not found.' })
    return
  }
  res.json(order)
})

export default router
