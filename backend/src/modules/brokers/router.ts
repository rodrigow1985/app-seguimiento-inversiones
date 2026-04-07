import { Router, Request, Response, NextFunction } from 'express'
import { listBrokersSchema, createBrokerSchema, updateBrokerSchema } from './schema'
import * as service from './service'
import { ValidationError } from '../../lib/errors'

export const brokersRouter = Router()

brokersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listBrokersSchema.safeParse(req.query)
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json(await service.listBrokers(parsed.data))
  } catch (err) { next(err) }
})

brokersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getBrokerById(req.params.id) })
  } catch (err) { next(err) }
})

brokersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createBrokerSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.createBroker(parsed.data) })
  } catch (err) { next(err) }
})

brokersRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateBrokerSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json({ data: await service.updateBroker(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

brokersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteBroker(req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})
