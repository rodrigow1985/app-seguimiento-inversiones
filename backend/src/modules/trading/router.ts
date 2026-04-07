import { Router, Request, Response, NextFunction } from 'express'
import { listPositionsSchema, createPositionSchema, addTradeSchema, updateTradeSchema } from './schema'
import * as service from './service'
import { ValidationError } from '../../lib/errors'

export const tradingRouter = Router()

// ── Positions ──────────────────────────────────────────────────────────────────

tradingRouter.get('/positions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listPositionsSchema.safeParse(req.query)
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json(await service.listPositions(parsed.data))
  } catch (err) { next(err) }
})

tradingRouter.get('/positions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getPositionById(req.params.id) })
  } catch (err) { next(err) }
})

tradingRouter.get('/positions/:id/pnl', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getPositionPnl(req.params.id) })
  } catch (err) { next(err) }
})

tradingRouter.post('/positions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createPositionSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.createPosition(parsed.data) })
  } catch (err) { next(err) }
})

// ── Trades under a position ────────────────────────────────────────────────────

tradingRouter.get('/positions/:id/trades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.listTrades(req.params.id))
  } catch (err) { next(err) }
})

tradingRouter.post('/positions/:id/trades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = addTradeSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.addTrade(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

// ── Individual trade operations ────────────────────────────────────────────────

tradingRouter.patch('/trades/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateTradeSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json({ data: await service.updateTrade(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

tradingRouter.delete('/trades/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteTrade(req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})
