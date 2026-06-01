import { Router, Request, Response } from 'express'
import {
  getAllInventoryEntries,
  createInventoryEntry,
  updateInventoryEntry,
  deleteInventoryEntry,
  getInventoryTotals,
} from '../data/inventoryStore'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({
    entries: getAllInventoryEntries(),
    totals: getInventoryTotals(),
  })
})

router.post('/', (req: Request, res: Response) => {
  const { description, moneyIn, moneyOut, notes, dateKey } = req.body as {
    description: string
    moneyIn: number
    moneyOut: number
    notes?: string
    dateKey?: string
  }

  if (!description?.trim()) {
    res.status(400).json({ message: 'Description is required.' })
    return
  }

  const entry = createInventoryEntry({
    description: description.trim(),
    moneyIn: moneyIn ?? 0,
    moneyOut: moneyOut ?? 0,
    notes,
    dateKey,
  })
  res.status(201).json(entry)
})

router.patch('/:id', (req: Request, res: Response) => {
  const entry = updateInventoryEntry(String(req.params.id), req.body)
  if (!entry) {
    res.status(404).json({ message: 'Entry not found.' })
    return
  }
  res.json(entry)
})

router.delete('/:id', (req: Request, res: Response) => {
  const ok = deleteInventoryEntry(String(req.params.id))
  if (!ok) {
    res.status(404).json({ message: 'Entry not found.' })
    return
  }
  res.json({ success: true })
})

export default router
