import { Router, Request, Response, NextFunction } from 'express'
import {
  listStrategiesSchema,
  createStrategySchema,
  updateStrategySchema,
  listEntriesSchema,
  createEntrySchema,
  updateEntrySchema,
} from './schema'
import * as service from './service'
import { ValidationError } from '../../lib/errors'

export const dcaRouter: import('express').Router = Router()

// ── Strategies ─────────────────────────────────────────────────────────────────

dcaRouter.get('/strategies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listStrategiesSchema.safeParse(req.query)
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json(await service.listStrategies(parsed.data))
  } catch (err) { next(err) }
})

dcaRouter.get('/strategies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getStrategyById(req.params.id) })
  } catch (err) { next(err) }
})

dcaRouter.post('/strategies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createStrategySchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.createStrategy(parsed.data) })
  } catch (err) { next(err) }
})

dcaRouter.patch('/strategies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateStrategySchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json({ data: await service.updateStrategy(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

// ── Entries ────────────────────────────────────────────────────────────────────

dcaRouter.get('/strategies/:id/entries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listEntriesSchema.safeParse(req.query)
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json(await service.listEntries(req.params.id, parsed.data))
  } catch (err) { next(err) }
})

dcaRouter.post('/strategies/:id/entries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createEntrySchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.createEntry(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

dcaRouter.patch('/entries/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateEntrySchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json({ data: await service.updateEntry(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

dcaRouter.delete('/entries/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteEntry(req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})
