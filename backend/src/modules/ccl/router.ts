import { Router, Request, Response, NextFunction } from 'express'
import { listCclSchema, createCclSchema, updateCclSchema } from './schema'
import * as service from './service'
import { ValidationError } from '../../lib/errors'

export const cclRouter = Router()

cclRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listCclSchema.safeParse(req.query)
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json(await service.listCcl(parsed.data))
  } catch (err) { next(err) }
})

cclRouter.get('/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getCclByDate(req.params.date) })
  } catch (err) { next(err) }
})

cclRouter.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.syncCcl()
    res.json({ data: result })
  } catch (err) { next(err) }
})

cclRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createCclSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.createCcl(parsed.data) })
  } catch (err) { next(err) }
})

cclRouter.patch('/:date', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateCclSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json({ data: await service.updateCcl(req.params.date, parsed.data) })
  } catch (err) { next(err) }
})
