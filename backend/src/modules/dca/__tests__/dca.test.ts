import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'
import {
  createAsset,
  createBroker,
  createPortfolio,
  createDcaStrategy,
} from '../../../test/helpers'

const app = createApp()

// ── Strategies ─────────────────────────────────────────────────────────────────

describe('GET /api/v1/dca/strategies', () => {
  it('retorna lista vacía', async () => {
    const res = await request(app).get('/api/v1/dca/strategies')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('retorna estrategias con capital acumulado calculado', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const res = await request(app).get('/api/v1/dca/strategies')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].accumulatedCapitalUsd).toBeDefined()
  })

  it('filtra por portfolioId', async () => {
    const broker = await createBroker()
    const p1 = await createPortfolio(broker.id, { name: 'P1' })
    const p2 = await createPortfolio(broker.id, { name: 'P2' })
    const a1 = await createAsset({ ticker: 'BTC' })
    const a2 = await createAsset({ ticker: 'ETH', priceSourceId: 'ethereum' })

    await createDcaStrategy(p1.id, a1.id, broker.id)
    await createDcaStrategy(p2.id, a2.id, broker.id)

    const res = await request(app).get(`/api/v1/dca/strategies?portfolioId=${p1.id}`)
    expect(res.body.data).toHaveLength(1)
  })

  it('filtra por isActive', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    await request(app).patch(`/api/v1/dca/strategies/${strategy.id}`).send({ isActive: false })

    const activeRes = await request(app).get('/api/v1/dca/strategies?isActive=true')
    expect(activeRes.body.data).toHaveLength(0)

    const allRes = await request(app).get('/api/v1/dca/strategies?isActive=false')
    expect(allRes.body.data).toHaveLength(1)
  })
})

describe('GET /api/v1/dca/strategies/:id', () => {
  it('retorna la estrategia con entradas y capital acumulado', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const res = await request(app).get(`/api/v1/dca/strategies/${strategy.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(strategy.id)
    expect(res.body.data.entries).toEqual([])
    expect(parseFloat(res.body.data.accumulatedCapitalUsd)).toBe(0)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/v1/dca/strategies/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/dca/strategies', () => {
  it('crea una estrategia DCA', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()

    const res = await request(app).post('/api/v1/dca/strategies').send({
      portfolioId: portfolio.id,
      assetId: asset.id,
      brokerId: broker.id,
      name: 'DCA BTC Mensual',
      startedAt: '2024-01-01',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('DCA BTC Mensual')
    expect(res.body.data.isActive).toBe(true)
    expect(parseFloat(res.body.data.accumulatedCapitalUsd)).toBe(0)
  })

  it('retorna 404 si el portfolio no existe', async () => {
    const broker = await createBroker()
    const asset = await createAsset()
    const res = await request(app).post('/api/v1/dca/strategies').send({
      portfolioId: '00000000-0000-0000-0000-000000000000',
      assetId: asset.id,
      brokerId: broker.id,
      name: 'DCA',
      startedAt: '2024-01-01',
    })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/v1/dca/strategies/:id', () => {
  it('actualiza el nombre', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id, { name: 'Original' })

    const res = await request(app).patch(`/api/v1/dca/strategies/${strategy.id}`).send({ name: 'Actualizado' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Actualizado')
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).patch('/api/v1/dca/strategies/00000000-0000-0000-0000-000000000000').send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

// ── Entries ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/dca/strategies/:id/entries', () => {
  it('retorna entradas de la estrategia', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'APERTURA',
      entryDate: '2024-01-15',
      amountUsd: 100,
    })

    const res = await request(app).get(`/api/v1/dca/strategies/${strategy.id}/entries`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('retorna 404 si la estrategia no existe', async () => {
    const res = await request(app).get('/api/v1/dca/strategies/00000000-0000-0000-0000-000000000000/entries')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/dca/strategies/:id/entries', () => {
  it('crea una entrada APERTURA', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const res = await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'APERTURA',
      entryDate: '2024-01-15',
      amountUsd: 500,
      amountArs: undefined,
      unitsReceived: 0.01,
      assetPriceAtEntry: 50000,
    })
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('APERTURA')
    expect(parseFloat(res.body.data.amountUsd)).toBeCloseTo(500)
  })

  it('crea una entrada CIERRE y cierra la estrategia', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const res = await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'CIERRE',
      entryDate: '2024-06-01',
      amountUsd: 600,
      profitLossUsd: 100,
    })
    expect(res.status).toBe(201)

    // Strategy should now be inactive
    const stratRes = await request(app).get(`/api/v1/dca/strategies/${strategy.id}`)
    expect(stratRes.body.data.isActive).toBe(false)
  })

  it('retorna 409 si la estrategia ya está cerrada', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    // Close it
    await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'CIERRE', entryDate: '2024-06-01', amountUsd: 600,
    })

    // Try adding another entry
    const res = await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'INCREMENTO', entryDate: '2024-07-01', amountUsd: 100,
    })
    expect(res.status).toBe(409)
    expect(res.body.type).toBe('/errors/strategy-already-closed')
  })

  it('calcula accumulatedCapitalUsd correctamente', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'APERTURA', entryDate: '2024-01-01', amountUsd: 100,
    })
    await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'INCREMENTO', entryDate: '2024-02-01', amountUsd: 200,
    })

    const res = await request(app).get(`/api/v1/dca/strategies/${strategy.id}`)
    expect(parseFloat(res.body.data.accumulatedCapitalUsd)).toBeCloseTo(300)
  })
})

describe('PATCH /api/v1/dca/entries/:id', () => {
  it('actualiza el monto de una entrada', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const entryRes = await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'APERTURA', entryDate: '2024-01-15', amountUsd: 100,
    })
    const entryId = entryRes.body.data.id

    const res = await request(app).patch(`/api/v1/dca/entries/${entryId}`).send({ amountUsd: 150 })
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.amountUsd)).toBeCloseTo(150)
  })

  it('retorna 404 para entrada inexistente', async () => {
    const res = await request(app).patch('/api/v1/dca/entries/00000000-0000-0000-0000-000000000000').send({ amountUsd: 100 })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/dca/entries/:id', () => {
  it('elimina una entrada y reactiva estrategia si era CIERRE', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    const strategy = await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const entryRes = await request(app).post(`/api/v1/dca/strategies/${strategy.id}/entries`).send({
      type: 'CIERRE', entryDate: '2024-06-01', amountUsd: 500,
    })
    const entryId = entryRes.body.data.id

    // Strategy is now closed
    const beforeDel = await request(app).get(`/api/v1/dca/strategies/${strategy.id}`)
    expect(beforeDel.body.data.isActive).toBe(false)

    // Delete CIERRE entry
    const res = await request(app).delete(`/api/v1/dca/entries/${entryId}`)
    expect(res.status).toBe(204)

    // Strategy should be active again
    const afterDel = await request(app).get(`/api/v1/dca/strategies/${strategy.id}`)
    expect(afterDel.body.data.isActive).toBe(true)
  })

  it('retorna 404 para entrada inexistente', async () => {
    const res = await request(app).delete('/api/v1/dca/entries/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
