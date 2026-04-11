import { Router, Request, Response, NextFunction } from 'express'
import { listAssetsSchema, createAssetSchema, updateAssetSchema } from './schema'
import * as service from './service'
import { ValidationError } from '../../lib/errors'

export const assetsRouter: import('express').Router = Router()

// GET /assets
assetsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listAssetsSchema.safeParse(req.query)
    if (!parsed.success) {
      throw new ValidationError('Parámetros inválidos', parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })))
    }
    const result = await service.listAssets(parsed.data)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// GET /assets/:id
assetsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await service.getAssetById(req.params.id)
    res.json({ data: asset })
  } catch (err) {
    next(err)
  }
})

// POST /assets
assetsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createAssetSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new ValidationError('Datos inválidos', parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })))
    }
    const asset = await service.createAsset(parsed.data)
    res.status(201).json({ data: asset })
  } catch (err) {
    next(err)
  }
})

// PATCH /assets/:id
assetsRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateAssetSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new ValidationError('Datos inválidos', parsed.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })))
    }
    const asset = await service.updateAsset(req.params.id, parsed.data)
    res.json({ data: asset })
  } catch (err) {
    next(err)
  }
})

// DELETE /assets/:id (soft delete)
assetsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.deleteAsset(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
