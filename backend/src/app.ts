import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/error-handler'
import { assetsRouter } from './modules/assets/router'

export function createApp() {
  const app = express()

  // ── Middlewares globales ──────────────────────────────────────────────────

  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  app.use(express.json())
  app.use(authMiddleware)

  // ── Health check (sin auth) ───────────────────────────────────────────────

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // ── Rutas de negocio ─────────────────────────────────────────────────────

  app.use('/api/v1/assets', assetsRouter)

  // ── Error handler (siempre al final) ─────────────────────────────────────

  app.use(errorHandler)

  return app
}
