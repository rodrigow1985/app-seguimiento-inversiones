import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'

const app = createApp()

describe('GET /api/v1/assets', () => {
  it('retorna lista vacía cuando no hay activos', async () => {
    const res = await request(app).get('/api/v1/assets')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta.total).toBe(0)
  })

  it('retorna activos creados con paginación correcta', async () => {
    await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO', priceSourceId: 'bitcoin',
    })
    await request(app).post('/api/v1/assets').send({
      ticker: 'ETH', name: 'Ethereum', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO', priceSourceId: 'ethereum',
    })

    const res = await request(app).get('/api/v1/assets')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.total).toBe(2)
  })

  it('filtra por tipo de activo', async () => {
    await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    await request(app).post('/api/v1/assets').send({
      ticker: 'GGAL', name: 'Grupo Galicia', assetType: 'ACCION_ARG',
      currencyNative: 'ARS', priceSource: 'IOL',
    })

    const res = await request(app).get('/api/v1/assets?type=CRYPTO')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].ticker).toBe('BTC')
  })

  it('filtra por isActive=false incluye inactivos', async () => {
    await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    const btcRes = await request(app).get('/api/v1/assets')
    const btcId = btcRes.body.data[0].id
    await request(app).delete(`/api/v1/assets/${btcId}`)

    const activeRes = await request(app).get('/api/v1/assets')
    expect(activeRes.body.data).toHaveLength(0)

    const allRes = await request(app).get('/api/v1/assets?isActive=false')
    expect(allRes.body.data).toHaveLength(1)
  })

  it('busca por ticker (case-insensitive)', async () => {
    await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })

    const res = await request(app).get('/api/v1/assets?search=btc')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].ticker).toBe('BTC')
  })

  it('busca por nombre', async () => {
    await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })

    const res = await request(app).get('/api/v1/assets?search=bit')
    expect(res.status).toBe(200)
    expect(res.body.data[0].name).toBe('Bitcoin')
  })

  it('respeta limit de paginación', async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app).post('/api/v1/assets').send({
        ticker: `TKN${i}`, name: `Token ${i}`, assetType: 'CRYPTO',
        currencyNative: 'USD', priceSource: 'COINGECKO',
      })
    }

    const res = await request(app).get('/api/v1/assets?limit=2&page=1')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.pages).toBe(2)
    expect(res.body.meta.total).toBe(3)
  })
})

describe('GET /api/v1/assets/:id', () => {
  it('retorna el activo correctamente', async () => {
    const created = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO', priceSourceId: 'bitcoin',
    })
    const id = created.body.data.id

    const res = await request(app).get(`/api/v1/assets/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.ticker).toBe('BTC')
    expect(res.body.data.priceSourceId).toBe('bitcoin')
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/v1/assets/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
    expect(res.body.type).toBe('/errors/not-found')
  })
})

describe('POST /api/v1/assets', () => {
  it('crea un activo con datos válidos', async () => {
    const res = await request(app).post('/api/v1/assets').send({
      ticker: 'eth',
      name: 'Ethereum',
      assetType: 'CRYPTO',
      currencyNative: 'USD',
      priceSource: 'COINGECKO',
      priceSourceId: 'ethereum',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.ticker).toBe('ETH') // normalizado a mayúsculas
    expect(res.body.data.isActive).toBe(true)
  })

  it('retorna 422 si falta un campo requerido', async () => {
    const res = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC',
      // name faltante
      assetType: 'CRYPTO',
      currencyNative: 'USD',
      priceSource: 'COINGECKO',
    })
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/validation-error')
    expect(res.body.errors.some((e: { field: string }) => e.field === 'name')).toBe(true)
  })

  it('retorna 422 si el ticker ya existe', async () => {
    await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })

    const res = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin Duplicado', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/validation-error')
  })

  it('retorna 422 si assetType es inválido', async () => {
    const res = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'INVALIDO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    expect(res.status).toBe(422)
  })
})

describe('PATCH /api/v1/assets/:id', () => {
  it('actualiza el nombre del activo', async () => {
    const created = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    const id = created.body.data.id

    const res = await request(app).patch(`/api/v1/assets/${id}`).send({ name: 'Bitcoin Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Bitcoin Updated')
  })

  it('desactiva un activo con isActive: false', async () => {
    const created = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    const id = created.body.data.id

    const res = await request(app).patch(`/api/v1/assets/${id}`).send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .patch('/api/v1/assets/00000000-0000-0000-0000-000000000000')
      .send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/assets/:id', () => {
  it('desactiva el activo (soft delete)', async () => {
    const created = await request(app).post('/api/v1/assets').send({
      ticker: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO',
      currencyNative: 'USD', priceSource: 'COINGECKO',
    })
    const id = created.body.data.id

    const deleteRes = await request(app).delete(`/api/v1/assets/${id}`)
    expect(deleteRes.status).toBe(204)

    // Verifica que está inactivo pero existe
    const getRes = await request(app).get(`/api/v1/assets/${id}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.data.isActive).toBe(false)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).delete('/api/v1/assets/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
