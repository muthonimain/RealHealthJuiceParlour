import { Router, Request, Response } from 'express'
import { createOrder, getAllOrders, getOrderById } from '../data/ordersStore'
import type { OrderItem } from '../data/ordersStore'
import { revokeClearanceIfSuperseded } from '../data/clearanceStore'
import {
  sumRevenueForWorkingMonth,
  countOrdersForWorkingMonth,
  workingMonthLabel,
  toMonthKey,
} from '../lib/workingMonth'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

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

export default router
