import { Router, Request, Response } from 'express'
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
} from '../data/ordersStore'
import type { OrderItem } from '../data/ordersStore'
import { revokeClearanceIfSuperseded } from '../data/clearanceStore'
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth'
import {
  sumRevenueForWorkingMonth,
  countOrdersForWorkingMonth,
  workingMonthLabel,
  toMonthKey,
} from '../lib/workingMonth'
import { asyncHandler } from '../middleware/asyncHandler'
import { buildProductSalesReport } from '../services/productSalesReport'

const router = Router()
const ownerOnly = [requireAuth, requireRole('owner')]

router.get(
  '/stats/monthly',
  asyncHandler(async (_req: Request, res: Response) => {
    const all = await getAllOrders()
    const monthKey = toMonthKey()
    res.json({
      monthKey,
      monthLabel: workingMonthLabel(),
      revenue: sumRevenueForWorkingMonth(all),
      orderCount: countOrdersForWorkingMonth(all),
    })
  })
)

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, employeeName, items, subtotal, deliveryIncluded, deliveryAmount, grandTotal } =
      req.body as {
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

    const order = await createOrder({
      employeeId,
      employeeName,
      items,
      subtotal,
      deliveryIncluded,
      deliveryAmount,
      grandTotal,
    })

    await revokeClearanceIfSuperseded(employeeId ?? '', employeeName, order.createdAt)

    res.status(201).json(order)
  })
)

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await getAllOrders())
  })
)

router.get(
  '/reports/product-sales',
  ...ownerOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const monthParam = typeof req.query.month === 'string' ? req.query.month : ''
    const monthKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : toMonthKey()
    res.json(await buildProductSalesReport(monthKey))
  })
)

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const order = await getOrderById(String(req.params.id))
    if (!order) {
      res.status(404).json({ message: 'Order not found.' })
      return
    }
    res.json(order)
  })
)

router.patch(
  '/:id',
  ...ownerOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    const body = req.body as {
      employeeId?: string
      employeeName?: string
      items?: OrderItem[]
      subtotal?: number
      deliveryIncluded?: boolean
      deliveryAmount?: number
      grandTotal?: number
      createdAt?: string
    }

    const existing = await getOrderById(id)
    if (!existing) {
      res.status(404).json({ message: 'Order not found.' })
      return
    }

    if (body.items !== undefined && body.items.length === 0) {
      res.status(400).json({ message: 'Order must include at least one item.' })
      return
    }

    const subtotal = body.subtotal !== undefined ? Number(body.subtotal) : undefined
    const grandTotal = body.grandTotal !== undefined ? Number(body.grandTotal) : undefined
    const deliveryAmount = body.deliveryAmount !== undefined ? Number(body.deliveryAmount) : undefined

    if (subtotal !== undefined && (!Number.isFinite(subtotal) || subtotal < 0)) {
      res.status(400).json({ message: 'Invalid subtotal.' })
      return
    }
    if (grandTotal !== undefined && (!Number.isFinite(grandTotal) || grandTotal < 0)) {
      res.status(400).json({ message: 'Invalid grand total.' })
      return
    }
    if (deliveryAmount !== undefined && (!Number.isFinite(deliveryAmount) || deliveryAmount < 0)) {
      res.status(400).json({ message: 'Invalid delivery amount.' })
      return
    }

    const order = await updateOrder(id, {
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      items: body.items,
      subtotal,
      deliveryIncluded: body.deliveryIncluded,
      deliveryAmount,
      grandTotal,
      createdAt: body.createdAt,
    })

    if (!order) {
      res.status(400).json({ message: 'Could not update order.' })
      return
    }

    await revokeClearanceIfSuperseded(
      order.employeeId ?? '',
      order.employeeName,
      order.createdAt
    )

    res.json({
      order,
      orders: await getAllOrders(),
    })
  })
)

router.delete(
  '/:id',
  ...ownerOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id)
    const existing = await getOrderById(id)
    if (!existing) {
      res.status(404).json({ message: 'Order not found.' })
      return
    }

    if (!(await deleteOrder(id))) {
      res.status(404).json({ message: 'Order not found.' })
      return
    }

    res.json({
      success: true,
      orders: await getAllOrders(),
    })
  })
)

export default router
