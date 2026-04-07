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
} from '../../../test/helpers'
import { prisma } from '../../../lib/prisma'

const app = createApp()

// Helper: creates a complete position with first BUY trade via API
async function apiCreatePosition(overrides: Record<string, unknown> = {}) {
  const broker = await createBroker()
  const portfolio = await createPortfolio(broker.id)
  const asset = await createAsset()

  const body = {
    portfolioId: portfolio.id,
    assetId: asset.id,
    brokerId: broker.id,
    openedAt: '2024-01-15',
    tradeDate: '2024-01-15',
    units: 10,
    priceNative: 42000,
    currency: 'USD',
    ...overrides,
  }

  const res = await request(app).post('/api/v1/trading/positions').send(body)
  return { res, broker, portfolio, asset }
}

// ── GET /trading/positions ─────────────────────────────────────────────────────

describe('GET /api/v1/trading/positions', () => {
  it('retorna lista vacía', async () => {
    const res = await request(app).get('/api/v1/trading/positions')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('retorna posiciones con status calculado', async () => {
    const { res: createRes } = await apiCreatePosition()
    expect(createRes.status).toBe(201)

    const res = await request(app).get('/api/v1/trading/positions')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].status).toBe('OPEN')
    expect(parseFloat(res.body.data[0].openUnits)).toBe(10)
  })

  it('filtra por portfolioId', async () => {
    const broker = await createBroker()
    const p1 = await createPortfolio(broker.id, { name: 'P1' })
    const p2 = await createPortfolio(broker.id, { name: 'P2' })
    const a1 = await createAsset({ ticker: 'BTC' })
    const a2 = await createAsset({ ticker: 'ETH', priceSourceId: 'ethereum' })

    await createPosition(p1.id, a1.id, broker.id)
    await createPosition(p2.id, a2.id, broker.id)

    const res = await request(app).get(`/api/v1/trading/positions?portfolioId=${p1.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por status=OPEN', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const a1 = await createAsset({ ticker: 'BTC' })
    const a2 = await createAsset({ ticker: 'ETH', priceSourceId: 'ethereum' })

    const pos1 = await createPosition(portfolio.id, a1.id, broker.id)
    const pos2 = await createPosition(portfolio.id, a2.id, broker.id)

    // Add BUY + SELL to close pos1
    const trade1 = await createTrade(pos1.id, broker.id, { units: '5', totalUsd: '210000.0000' })
    await createTrade(pos1.id, broker.id, { type: 'SELL', units: '5', totalUsd: '210000.0000', priceUsd: '42000.00000000' })
    void trade1

    // pos2 has no trades, so openUnits = 0 (CLOSED) — but it has no trades at all

    // Actually pos2 has 0 trades = openUnits 0 = CLOSED
    // Let's add a BUY to pos2 to make it OPEN
    await createTrade(pos2.id, broker.id, { units: '3', totalUsd: '126000.0000' })

    const res = await request(app).get('/api/v1/trading/positions?status=OPEN')
    expect(res.status).toBe(200)
    expect(res.body.data.every((p: { status: string }) => p.status === 'OPEN')).toBe(true)
  })
})

// ── GET /trading/positions/:id ─────────────────────────────────────────────────

describe('GET /api/v1/trading/positions/:id', () => {
  it('retorna la posición con trades y campos calculados', async () => {
    const { res: createRes } = await apiCreatePosition()
    const posId = createRes.body.data.id

    const res = await request(app).get(`/api/v1/trading/positions/${posId}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('OPEN')
    expect(res.body.data.trades).toHaveLength(1)
    expect(res.body.data.trades[0].type).toBe('BUY')
    expect(parseFloat(res.body.data.avgCostUsd)).toBeCloseTo(42000)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/v1/trading/positions/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

// ── GET /trading/positions/:id/pnl ────────────────────────────────────────────

describe('GET /api/v1/trading/positions/:id/pnl', () => {
  it('retorna P&L con snapshot de precio disponible', async () => {
    const { res: createRes, asset } = await apiCreatePosition()
    const posId = createRes.body.data.id

    // Crear snapshot de precio
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await prisma.priceSnapshot.create({
      data: { assetId: asset.id, priceDate: today, price: 50000, currency: 'USD', source: 'COINGECKO' },
    })

    const res = await request(app).get(`/api/v1/trading/positions/${posId}/pnl`)
    expect(res.status).toBe(200)
    expect(res.body.data.positionId).toBe(posId)
    expect(res.body.data.status).toBe('OPEN')
    expect(parseFloat(res.body.data.currentPriceUsd)).toBeCloseTo(50000)
    expect(parseFloat(res.body.data.unrealizedPnlUsd)).toBeCloseTo(80000) // (50000-42000)*10
  })

  it('retorna P&L sin precio (priceStale: true)', async () => {
    const { res: createRes } = await apiCreatePosition()
    const posId = createRes.body.data.id

    const res = await request(app).get(`/api/v1/trading/positions/${posId}/pnl`)
    expect(res.status).toBe(200)
    expect(res.body.data.priceStale).toBe(true)
    expect(res.body.data.currentPriceUsd).toBeNull()
    expect(res.body.data.unrealizedPnlUsd).toBeNull()
  })
})

// ── POST /trading/positions ────────────────────────────────────────────────────

describe('POST /api/v1/trading/positions', () => {
  it('crea posición con primer trade BUY (USD)', async () => {
    const { res } = await apiCreatePosition()
    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('OPEN')
    expect(res.body.data.trades).toHaveLength(1)
    expect(res.body.data.trades[0].type).toBe('BUY')
    expect(parseFloat(res.body.data.trades[0].totalUsd)).toBeCloseTo(420000)
  })

  it('crea posición con trade en ARS usando CCL', async () => {
    await createCclRate({ date: new Date('2024-01-15'), rate: '1150.0000' })
    const broker = await createBroker({ currency: 'ARS' })
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset({ ticker: 'GGAL', currencyNative: 'ARS', priceSource: 'IOL' })

    const res = await request(app).post('/api/v1/trading/positions').send({
      portfolioId: portfolio.id,
      assetId: asset.id,
      brokerId: broker.id,
      openedAt: '2024-01-15',
      tradeDate: '2024-01-15',
      units: 100,
      priceNative: 2300, // ARS
      currency: 'ARS',
    })
    expect(res.status).toBe(201)
    // priceUsd = 2300 / 1150 = 2.0
    expect(parseFloat(res.body.data.trades[0].priceUsd)).toBeCloseTo(2.0)
  })

  it('retorna 422 si no hay CCL para la fecha (ARS)', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset({ ticker: 'GGAL', currencyNative: 'ARS', priceSource: 'IOL' })

    const res = await request(app).post('/api/v1/trading/positions').send({
      portfolioId: portfolio.id,
      assetId: asset.id,
      brokerId: broker.id,
      openedAt: '2024-01-15',
      tradeDate: '2024-01-15',
      units: 100,
      priceNative: 2300,
      currency: 'ARS',
    })
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/ccl-not-available')
  })

  it('retorna 422 si ya existe posición para ese activo en esa cartera', async () => {
    const { res: first, broker, portfolio, asset } = await apiCreatePosition()
    expect(first.status).toBe(201)

    const second = await request(app).post('/api/v1/trading/positions').send({
      portfolioId: portfolio.id,
      assetId: asset.id,
      brokerId: broker.id,
      openedAt: '2024-01-15',
      tradeDate: '2024-01-15',
      units: 5,
      priceNative: 43000,
      currency: 'USD',
    })
    expect(second.status).toBe(422)
  })

  it('retorna 404 si el portfolio no existe', async () => {
    const broker = await createBroker()
    const asset = await createAsset()
    const res = await request(app).post('/api/v1/trading/positions').send({
      portfolioId: '00000000-0000-0000-0000-000000000000',
      assetId: asset.id,
      brokerId: broker.id,
      openedAt: '2024-01-15',
      tradeDate: '2024-01-15',
      units: 1,
      priceNative: 100,
      currency: 'USD',
    })
    expect(res.status).toBe(404)
  })
})

// ── GET /trading/positions/:id/trades ─────────────────────────────────────────

describe('GET /api/v1/trading/positions/:id/trades', () => {
  it('retorna los trades de una posición', async () => {
    const { res: createRes, broker } = await apiCreatePosition()
    const posId = createRes.body.data.id

    // Add a SELL
    await request(app).post(`/api/v1/trading/positions/${posId}/trades`).send({
      type: 'SELL',
      tradeDate: '2024-01-20',
      units: 3,
      priceNative: 45000,
      currency: 'USD',
    })
    void broker

    const res = await request(app).get(`/api/v1/trading/positions/${posId}/trades`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
  })

  it('retorna 404 si la posición no existe', async () => {
    const res = await request(app).get('/api/v1/trading/positions/00000000-0000-0000-0000-000000000000/trades')
    expect(res.status).toBe(404)
  })
})

// ── POST /trading/positions/:id/trades ────────────────────────────────────────

describe('POST /api/v1/trading/positions/:id/trades', () => {
  it('agrega un trade SELL', async () => {
    const { res: createRes } = await apiCreatePosition()
    const posId = createRes.body.data.id

    const res = await request(app).post(`/api/v1/trading/positions/${posId}/trades`).send({
      type: 'SELL',
      tradeDate: '2024-01-20',
      units: 5,
      priceNative: 45000,
      currency: 'USD',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('SELL')
  })

  it('retorna 409 si se intenta vender más unidades de las disponibles', async () => {
    const { res: createRes } = await apiCreatePosition()
    const posId = createRes.body.data.id

    const res = await request(app).post(`/api/v1/trading/positions/${posId}/trades`).send({
      type: 'SELL',
      tradeDate: '2024-01-20',
      units: 15, // solo hay 10
      priceNative: 45000,
      currency: 'USD',
    })
    expect(res.status).toBe(409)
    expect(res.body.type).toBe('/errors/insufficient-units')
  })

  it('retorna 409 si la posición está cerrada', async () => {
    const { res: createRes } = await apiCreatePosition()
    const posId = createRes.body.data.id

    // Sell all 10 units to close position
    await request(app).post(`/api/v1/trading/positions/${posId}/trades`).send({
      type: 'SELL', tradeDate: '2024-01-20', units: 10, priceNative: 45000, currency: 'USD',
    })

    // Try adding another trade
    const res = await request(app).post(`/api/v1/trading/positions/${posId}/trades`).send({
      type: 'SELL', tradeDate: '2024-01-25', units: 5, priceNative: 46000, currency: 'USD',
    })
    expect(res.status).toBe(409)
    expect(res.body.type).toBe('/errors/position-already-closed')
  })
})

// ── PATCH /trading/trades/:id ─────────────────────────────────────────────────

describe('PATCH /api/v1/trading/trades/:id', () => {
  it('actualiza el precio de un trade', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const pos = await createPosition(portfolio.id, asset.id, broker.id)
    const trade = await createTrade(pos.id, broker.id)

    const res = await request(app).patch(`/api/v1/trading/trades/${trade.id}`).send({
      priceNative: 50000,
      currency: 'USD',
    })
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.priceNative)).toBeCloseTo(50000)
  })

  it('retorna 404 para trade inexistente', async () => {
    const res = await request(app).patch('/api/v1/trading/trades/00000000-0000-0000-0000-000000000000').send({ notes: 'x' })
    expect(res.status).toBe(404)
  })
})

// ── DELETE /trading/trades/:id ────────────────────────────────────────────────

describe('DELETE /api/v1/trading/trades/:id', () => {
  it('elimina un trade BUY cuando no hay SELL posterior', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const pos = await createPosition(portfolio.id, asset.id, broker.id)
    const trade = await createTrade(pos.id, broker.id)

    const res = await request(app).delete(`/api/v1/trading/trades/${trade.id}`)
    expect(res.status).toBe(204)
  })

  it('retorna 404 para trade inexistente', async () => {
    const res = await request(app).delete('/api/v1/trading/trades/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
