import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'
import { createAsset, createCclRate } from '../../../test/helpers'
import { prisma } from '../../../lib/prisma'

// Mock the external price provider so tests don't hit real APIs
vi.mock('../../../external/price-provider', () => ({
  fetchCurrentPrice: vi.fn(),
}))

import { fetchCurrentPrice } from '../../../external/price-provider'
const mockFetch = vi.mocked(fetchCurrentPrice)

const app = createApp()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/v1/assets/:id/price/current', () => {
  it('retorna precio desde proveedor externo (USD) y lo cachea como snapshot', async () => {
    const asset = await createAsset()
    mockFetch.mockResolvedValueOnce({
      priceNative: 45000,
      currency: 'USD',
      source: 'COINGECKO',
      fetchedAt: new Date(),
    })

    const res = await request(app).get(`/api/v1/assets/${asset.id}/price/current`)
    expect(res.status).toBe(200)
    expect(res.body.data.priceUsd).toBe(45000)
    expect(res.body.data.priceNative).toBe(45000)
    expect(res.body.data.stale).toBe(false)

    // Verify snapshot was persisted in USD
    const snapshot = await prisma.priceSnapshot.findFirst({ where: { assetId: asset.id } })
    expect(snapshot).not.toBeNull()
    expect(Number(snapshot!.price)).toBeCloseTo(45000)
    expect(snapshot!.currency).toBe('USD')
  })

  it('convierte precio ARS→USD usando CCL para activos IOL', async () => {
    await createCclRate({ date: new Date('2024-01-15'), rate: '1150.0000' })
    const asset = await createAsset({ ticker: 'GGAL', currencyNative: 'ARS', priceSource: 'IOL' })

    mockFetch.mockResolvedValueOnce({
      priceNative: 2300, // ARS
      currency: 'ARS',
      source: 'IOL',
      fetchedAt: new Date(),
    })

    const res = await request(app).get(`/api/v1/assets/${asset.id}/price/current`)
    expect(res.status).toBe(200)
    expect(res.body.data.priceNative).toBe(2300)
    expect(res.body.data.currency).toBe('ARS')
    // priceUsd = 2300 / 1150 ≈ 2.0
    expect(res.body.data.priceUsd).toBeCloseTo(2.0)

    // Snapshot guarda el equivalente USD
    const snapshot = await prisma.priceSnapshot.findFirst({ where: { assetId: asset.id } })
    expect(Number(snapshot!.price)).toBeCloseTo(2.0)
    expect(snapshot!.currency).toBe('USD')
  })

  it('retorna snapshot stale cuando el proveedor falla', async () => {
    const asset = await createAsset()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    await prisma.priceSnapshot.create({
      data: { assetId: asset.id, priceDate: yesterday, price: 40000, currency: 'USD', source: 'COINGECKO' },
    })

    mockFetch.mockRejectedValueOnce(new Error('API unavailable'))

    const res = await request(app).get(`/api/v1/assets/${asset.id}/price/current`)
    expect(res.status).toBe(200)
    expect(res.body.data.stale).toBe(true)
    expect(res.body.data.priceUsd).toBe(40000)
  })

  it('retorna 404 si no hay precio ni snapshot', async () => {
    const asset = await createAsset()
    mockFetch.mockRejectedValueOnce(new Error('API unavailable'))

    const res = await request(app).get(`/api/v1/assets/${asset.id}/price/current`)
    expect(res.status).toBe(404)
  })

  it('retorna 404 para activo inexistente', async () => {
    const res = await request(app).get('/api/v1/assets/00000000-0000-0000-0000-000000000000/price/current')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/prices/sync', () => {
  it('sincroniza todos los activos activos', async () => {
    await createAsset({ ticker: 'BTC', priceSource: 'COINGECKO' })
    await createAsset({ ticker: 'ETH', priceSourceId: 'ethereum' })

    mockFetch.mockResolvedValue({
      priceNative: 50000,
      currency: 'USD',
      source: 'COINGECKO',
      fetchedAt: new Date(),
    })

    const res = await request(app).post('/api/v1/prices/sync')
    expect(res.status).toBe(200)
    expect(res.body.data.synced).toBe(2)
    expect(res.body.data.failed).toBe(0)
  })

  it('reporta fallos por activo sin detener la sincronización', async () => {
    await createAsset({ ticker: 'BTC' })
    await createAsset({ ticker: 'ETH', priceSourceId: 'ethereum' })

    mockFetch
      .mockResolvedValueOnce({ priceNative: 50000, currency: 'USD', source: 'COINGECKO', fetchedAt: new Date() })
      .mockRejectedValueOnce(new Error('API error'))

    const res = await request(app).post('/api/v1/prices/sync')
    expect(res.status).toBe(200)
    expect(res.body.data.synced).toBe(1)
    expect(res.body.data.failed).toBe(1)
    expect(res.body.data.errors).toHaveLength(1)
  })
})
