import { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toJSON(req.path))
    return
  }

  // Error inesperado
  console.error('[internal-error]', err)
  res.status(500).json({
    type: '/errors/internal-error',
    title: 'Error interno del servidor',
    status: 500,
    detail: 'Error inesperado. Revisá los logs.',
    instance: req.path,
  })
}
