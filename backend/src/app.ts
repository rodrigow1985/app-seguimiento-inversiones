import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/error-handler'
import { assetsRouter } from './modules/assets/router'
import { brokersRouter } from './modules/brokers/router'
import { portfoliosRouter } from './modules/portfolios/router'
import { cclRouter } from './modules/ccl/router'
import { tradingRouter } from './modules/trading/router'
import { dcaRouter } from './modules/dca/router'
import { pricesRouter, pricesSyncRouter } from './modules/prices/router'
import { dashboardRouter } from './modules/dashboard/router'

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
  app.use('/api/v1/assets/:assetId/price', pricesRouter)
  app.use('/api/v1/brokers', brokersRouter)
  app.use('/api/v1/portfolios', portfoliosRouter)
  app.use('/api/v1/ccl', cclRouter)
  app.use('/api/v1/trading', tradingRouter)
  app.use('/api/v1/dca', dcaRouter)
  app.use('/api/v1/prices', pricesSyncRouter)
  app.use('/api/v1/dashboard', dashboardRouter)

  // ── Error handler (siempre al final) ─────────────────────────────────────

  app.use(errorHandler)

  return app
}
