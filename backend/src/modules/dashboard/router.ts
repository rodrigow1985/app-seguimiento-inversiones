import { Router, Request, Response, NextFunction } from 'express'
import * as service from './service'

export const dashboardRouter = Router()

dashboardRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getDashboard() })
  } catch (err) { next(err) }
})
