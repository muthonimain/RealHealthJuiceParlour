import { Router, Request, Response } from 'express'
import {
  createOrder,
  deleteOrder,
  deleteOrdersByEmployee,
  getAllOrders,
  getOrderById,
  updateOrder,
} from '../data/ordersStore'
import { deleteClearancesByEmployee } from '../data/clearanceStore'
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
import { buildDailyProductSalesReport, buildProductSalesReport } from '../services/productSalesReport'
import { allocateOrderId } from '../lib/orderNumber'
import { getRetentionCutoffDateKey, purgeRecordsIfNeeded } from '../lib/dataRetention'

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
    const {
      employeeId,
      employeeName,
      items,
      subtotal,
      deliveryIncluded,
      safeHandlingAmount,
      safeHandlingCounts,
      includePaybill854845,
      includePaybill247247,
      includeMpesaAgentStore,
      grandTotal,
      generatedAt,
      id: reservedOrderId,
    } = req.body as {
      employeeId: string
      employeeName: string
      items: OrderItem[]
      subtotal: number
      deliveryIncluded: boolean
      safeHandlingAmount?: number
      safeHandlingCounts?: Record<string, number>
      includePaybill854845?: boolean
      includePaybill247247?: boolean
      includeMpesaAgentStore?: boolean
      grandTotal: number
      generatedAt?: string
      id?: string
    }

    if (!employeeName || !items?.length) {
      res.status(400).json({ message: 'employeeName and items are required.' })
      return
    }

    const order = await createOrder({
      id: reservedOrderId,
      employeeId,
      employeeName,
      items,
      subtotal,
      deliveryIncluded,
      safeHandlingAmount: safeHandlingAmount ?? 0,
      safeHandlingCounts: safeHandlingCounts ?? {},
      deliveryAmount: 0,
      packagingAmount: 0,
      packaging30Count: 0,
      packaging50Count: 0,
      specialDeliveryAmount: 0,
      boxAndTapesAmount: 0,
      includePaybill854845: includePaybill854845 ?? false,
      includePaybill247247: includePaybill247247 ?? false,
      includeMpesaAgentStore: includeMpesaAgentStore ?? false,
      grandTotal,
      generatedAt,
    })

    await revokeClearanceIfSuperseded(employeeId ?? '', employeeName, order.createdAt)

    res.status(201).json(order)
  })
)

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    await purgeRecordsIfNeeded()
    res.json(await getAllOrders())
  })
)

router.get(
  '/reports/product-sales',
  ...ownerOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await purgeRecordsIfNeeded()
    const monthParam = typeof req.query.month === 'string' ? req.query.month : ''
    let monthKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : toMonthKey()
    const minMonth = getRetentionCutoffDateKey().slice(0, 7)
    if (monthKey < minMonth) monthKey = minMonth
    res.json(await buildProductSalesReport(monthKey))
  })
)

router.get(
  '/reports/items-sold-today',
  ...ownerOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const dateParam = typeof req.query.date === 'string' ? req.query.date : ''
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined
    res.json(await buildDailyProductSalesReport(dateKey))
  })
)

router.get(
  '/next-id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ id: await allocateOrderId() })
  })
)

router.delete(
  '/employee/:employeeId',
  ...ownerOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = String(req.params.employeeId)
    const { employeeName, date } = req.body as { employeeName?: string; date?: string }

    if (!employeeName?.trim()) {
      res.status(400).json({ message: 'employeeName is required.' })
      return
    }

    const dateKey =
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined

    const deletedCount = await deleteOrdersByEmployee(employeeId, employeeName.trim(), dateKey)
    if (deletedCount === 0) {
      res.status(404).json({ message: 'No sales found for this employee.' })
      return
    }

    await deleteClearancesByEmployee(employeeId)

    res.json({
      success: true,
      deletedCount,
      orders: await getAllOrders(),
    })
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
      packagingAmount?: number
      specialDeliveryAmount?: number
      boxAndTapesAmount?: number
      includePaybill854845?: boolean
      includePaybill247247?: boolean
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
    const packagingAmount =
      body.packagingAmount !== undefined ? Number(body.packagingAmount) : undefined

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
    if (packagingAmount !== undefined && (!Number.isFinite(packagingAmount) || packagingAmount < 0)) {
      res.status(400).json({ message: 'Invalid packaging amount.' })
      return
    }

    const order = await updateOrder(id, {
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      items: body.items,
      subtotal,
      deliveryIncluded: body.deliveryIncluded,
      deliveryAmount,
      packagingAmount,
      specialDeliveryAmount: body.specialDeliveryAmount,
      boxAndTapesAmount: body.boxAndTapesAmount,
      includePaybill854845: body.includePaybill854845,
      includePaybill247247: body.includePaybill247247,
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
