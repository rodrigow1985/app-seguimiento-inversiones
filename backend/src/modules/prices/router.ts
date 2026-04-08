import { Router, Request, Response, NextFunction } from 'express'
import * as service from './service'

// mergeParams: true is required so :assetId from the parent app route is accessible here
export const pricesRouter: import('express').Router = Router({ mergeParams: true })

// GET /api/v1/assets/:assetId/price/current
pricesRouter.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.getCurrentPrice(req.params.assetId) })
  } catch (err) { next(err) }
})

// POST /api/v1/prices/sync — separate mount point in app.ts
export const pricesSyncRouter: import('express').Router = Router()

pricesSyncRouter.post('/sync', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await service.syncAllPrices() })
  } catch (err) { next(err) }
})
