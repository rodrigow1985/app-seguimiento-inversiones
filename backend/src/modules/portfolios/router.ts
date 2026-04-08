import { Router, Request, Response, NextFunction } from 'express'
import { listPortfoliosSchema, createPortfolioSchema, updatePortfolioSchema } from './schema'
import * as service from './service'
import { ValidationError } from '../../lib/errors'

export const portfoliosRouter: import('express').Router = Router()

portfoliosRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listPortfoliosSchema.safeParse(req.query)
    if (!parsed.success) throw new ValidationError('Parámetros inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json(await service.listPortfolios(parsed.data))
  } catch (err) { next(err) }
})

portfoliosRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getPortfolioById(req.params.id) })
  } catch (err) { next(err) }
})

portfoliosRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createPortfolioSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.status(201).json({ data: await service.createPortfolio(parsed.data) })
  } catch (err) { next(err) }
})

portfoliosRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updatePortfolioSchema.safeParse(req.body)
    if (!parsed.success) throw new ValidationError('Datos inválidos', parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    res.json({ data: await service.updatePortfolio(req.params.id, parsed.data) })
  } catch (err) { next(err) }
})

portfoliosRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deletePortfolio(req.params.id)
    res.status(204).send()
  } catch (err) { next(err) }
})
