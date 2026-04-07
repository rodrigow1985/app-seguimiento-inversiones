import { Request, Response, NextFunction } from 'express'

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.API_KEY

  // Sin API_KEY configurada → pasa (modo dev sin config)
  if (!apiKey) {
    next()
    return
  }

  const authHeader = req.headers['authorization']
  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    res.status(401).json({
      type: '/errors/unauthorized',
      title: 'No autorizado',
      status: 401,
      detail: 'API key inválida o ausente',
      instance: req.path,
    })
    return
  }

  next()
}
