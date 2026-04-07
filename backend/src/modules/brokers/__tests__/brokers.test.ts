import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'
import { createBroker, createPosition, createAsset, createPortfolio } from '../../../test/helpers'

const app = createApp()

describe('GET /api/v1/brokers', () => {
  it('retorna lista vacía cuando no hay brokers', async () => {
    const res = await request(app).get('/api/v1/brokers')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta.total).toBe(0)
  })

  it('retorna brokers creados con paginación', async () => {
    await createBroker({ name: 'Binance' })
    await createBroker({ name: 'IOL' })

    const res = await request(app).get('/api/v1/brokers')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.total).toBe(2)
  })

  it('respeta limit y page', async () => {
    await createBroker({ name: 'Broker1' })
    await createBroker({ name: 'Broker2' })
    await createBroker({ name: 'Broker3' })

    const res = await request(app).get('/api/v1/brokers?limit=2&page=1')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pages).toBe(2)
  })
})

describe('GET /api/v1/brokers/:id', () => {
  it('retorna el broker correctamente', async () => {
    const broker = await createBroker({ name: 'Binance' })

    const res = await request(app).get(`/api/v1/brokers/${broker.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Binance')
    expect(res.body.data.id).toBe(broker.id)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/v1/brokers/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.type).toBe('/errors/not-found')
  })
})

describe('POST /api/v1/brokers', () => {
  it('crea un broker con datos válidos', async () => {
    const res = await request(app).post('/api/v1/brokers').send({
      name: 'Binance',
      commissionPct: 0.726,
      currency: 'USD',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Binance')
    expect(res.body.data.currency).toBe('USD')
  })

  it('retorna 422 si falta campo requerido', async () => {
    const res = await request(app).post('/api/v1/brokers').send({
      commissionPct: 0.5,
      currency: 'USD',
      // name faltante
    })
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/validation-error')
  })

  it('retorna 422 si el nombre ya existe', async () => {
    await createBroker({ name: 'Binance' })

    const res = await request(app).post('/api/v1/brokers').send({
      name: 'Binance',
      commissionPct: 0.5,
      currency: 'USD',
    })
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/validation-error')
  })

  it('acepta config JSON opcional', async () => {
    const res = await request(app).post('/api/v1/brokers').send({
      name: 'BingX',
      commissionPct: 0.3,
      currency: 'USD',
      config: { apiKey: 'test123' },
    })
    expect(res.status).toBe(201)
    expect(res.body.data.config).toEqual({ apiKey: 'test123' })
  })
})

describe('PATCH /api/v1/brokers/:id', () => {
  it('actualiza la comisión', async () => {
    const broker = await createBroker({ name: 'Binance' })

    const res = await request(app).patch(`/api/v1/brokers/${broker.id}`).send({ commissionPct: 0.5 })
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.commissionPct)).toBeCloseTo(0.5)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).patch('/api/v1/brokers/00000000-0000-0000-0000-000000000000').send({ commissionPct: 0.5 })
    expect(res.status).toBe(404)
  })

  it('retorna 422 si el body está vacío', async () => {
    const broker = await createBroker({ name: 'Binance' })
    const res = await request(app).patch(`/api/v1/brokers/${broker.id}`).send({})
    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/v1/brokers/:id', () => {
  it('elimina el broker sin posiciones', async () => {
    const broker = await createBroker({ name: 'Binance' })

    const res = await request(app).delete(`/api/v1/brokers/${broker.id}`)
    expect(res.status).toBe(204)

    const getRes = await request(app).get(`/api/v1/brokers/${broker.id}`)
    expect(getRes.status).toBe(404)
  })

  it('retorna 422 si tiene posiciones asociadas', async () => {
    const broker = await createBroker({ name: 'Binance' })
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    await createPosition(portfolio.id, asset.id, broker.id)

    const res = await request(app).delete(`/api/v1/brokers/${broker.id}`)
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/validation-error')
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).delete('/api/v1/brokers/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
