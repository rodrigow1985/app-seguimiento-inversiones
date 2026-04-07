import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'
import {
  createAsset,
  createBroker,
  createPortfolio,
  createCclRate,
  createPosition,
  createTrade,
  createDcaStrategy,
} from '../../../test/helpers'
import { prisma } from '../../../lib/prisma'

const app = createApp()

describe('GET /api/v1/dashboard', () => {
  it('retorna dashboard vacío cuando no hay datos', async () => {
    const res = await request(app).get('/api/v1/dashboard')
    expect(res.status).toBe(200)
    expect(res.body.data.trading.openPositionsCount).toBe(0)
    expect(res.body.data.trading.closedPositionsCount).toBe(0)
    expect(res.body.data.dca.activeDcaCount).toBe(0)
    expect(res.body.data.latestCclRate).toBeNull()
  })

  it('cuenta posiciones abiertas y cerradas correctamente', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const a1 = await createAsset({ ticker: 'BTC' })
    const a2 = await createAsset({ ticker: 'ETH', priceSourceId: 'ethereum' })

    // Posición abierta
    const pos1 = await createPosition(portfolio.id, a1.id, broker.id)
    await createTrade(pos1.id, broker.id, { units: '5' })

    // Posición cerrada (BUY + SELL completo)
    const pos2 = await createPosition(portfolio.id, a2.id, broker.id)
    await createTrade(pos2.id, broker.id, { units: '3' })
    await createTrade(pos2.id, broker.id, {
      type: 'SELL',
      units: '3',
      priceUsd: '42000.00000000',
      totalUsd: '126000.0000',
    })

    const res = await request(app).get('/api/v1/dashboard')
    expect(res.status).toBe(200)
    expect(res.body.data.trading.openPositionsCount).toBe(1)
    expect(res.body.data.trading.closedPositionsCount).toBe(1)
  })

  it('incluye capital DCA acumulado', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    await prisma.dcaEntry.createMany({
      data: [
        { strategyId: strategy.id, type: 'APERTURA', entryDate: new Date('2024-01-01'), amountUsd: 500 },
        { strategyId: strategy.id, type: 'INCREMENTO', entryDate: new Date('2024-02-01'), amountUsd: 300 },
      ],
    })

    const res = await request(app).get('/api/v1/dashboard')
    expect(res.status).toBe(200)
    expect(res.body.data.dca.activeDcaCount).toBe(1)
    expect(parseFloat(res.body.data.dca.totalDcaCapitalUsd)).toBeCloseTo(800)
  })

  it('incluye el último CCL registrado', async () => {
    await createCclRate({ date: new Date('2024-01-10'), rate: '1100.0000' })
    await createCclRate({ date: new Date('2024-01-15'), rate: '1150.0000' })

    const res = await request(app).get('/api/v1/dashboard')
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.latestCclRate.rate)).toBeCloseTo(1150)
  })
})
