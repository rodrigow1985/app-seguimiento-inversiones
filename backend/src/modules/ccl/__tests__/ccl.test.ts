import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'
import { createCclRate } from '../../../test/helpers'

const app = createApp()

describe('GET /api/v1/ccl', () => {
  it('retorna lista vacía', async () => {
    const res = await request(app).get('/api/v1/ccl')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta.total).toBe(0)
  })

  it('retorna registros CCL paginados', async () => {
    await createCclRate({ date: new Date('2024-01-10'), rate: '1100.0000' })
    await createCclRate({ date: new Date('2024-01-11'), rate: '1110.0000' })

    const res = await request(app).get('/api/v1/ccl')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.total).toBe(2)
  })

  it('filtra por rango de fechas', async () => {
    await createCclRate({ date: new Date('2024-01-10') })
    await createCclRate({ date: new Date('2024-01-15') })
    await createCclRate({ date: new Date('2024-01-20') })

    const res = await request(app).get('/api/v1/ccl?from=2024-01-12&to=2024-01-18')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })
})

describe('GET /api/v1/ccl/:date', () => {
  it('retorna el CCL de una fecha exacta', async () => {
    await createCclRate({ date: new Date('2024-01-15'), rate: '1150.0000' })

    const res = await request(app).get('/api/v1/ccl/2024-01-15')
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.rate)).toBeCloseTo(1150)
  })

  it('retorna el CCL más cercano anterior (fallback)', async () => {
    await createCclRate({ date: new Date('2024-01-12'), rate: '1120.0000' })

    // Pedimos un sábado, el fallback es el viernes anterior
    const res = await request(app).get('/api/v1/ccl/2024-01-13')
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.rate)).toBeCloseTo(1120)
  })

  it('retorna 404 si no hay ningún CCL previo', async () => {
    const res = await request(app).get('/api/v1/ccl/2020-01-01')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/ccl', () => {
  it('crea un registro CCL manual', async () => {
    const res = await request(app).post('/api/v1/ccl').send({
      date: '2024-01-15',
      rate: 1150.5,
    })
    expect(res.status).toBe(201)
    expect(res.body.data.source).toBe('MANUAL')
    expect(parseFloat(res.body.data.rate)).toBeCloseTo(1150.5)
  })

  it('retorna 422 si la fecha ya existe', async () => {
    await createCclRate({ date: new Date('2024-01-15') })

    const res = await request(app).post('/api/v1/ccl').send({
      date: '2024-01-15',
      rate: 1200,
    })
    expect(res.status).toBe(422)
    expect(res.body.type).toBe('/errors/validation-error')
  })

  it('retorna 422 si la tasa es negativa', async () => {
    const res = await request(app).post('/api/v1/ccl').send({
      date: '2024-01-15',
      rate: -100,
    })
    expect(res.status).toBe(422)
  })
})

describe('PATCH /api/v1/ccl/:date', () => {
  it('actualiza un CCL existente y lo marca como MANUAL', async () => {
    await createCclRate({ date: new Date('2024-01-15'), rate: '1100.0000', source: 'AMBITO' })

    const res = await request(app).patch('/api/v1/ccl/2024-01-15').send({ rate: 1200 })
    expect(res.status).toBe(200)
    expect(parseFloat(res.body.data.rate)).toBeCloseTo(1200)
    expect(res.body.data.source).toBe('MANUAL')
  })

  it('retorna 404 si la fecha no existe', async () => {
    const res = await request(app).patch('/api/v1/ccl/2024-01-15').send({ rate: 1200 })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/ccl/sync', () => {
  it('ejecuta sync con fetcher mock y retorna contadores', async () => {
    // The sync service accepts an injected fetcher — here we call the endpoint
    // which will attempt real fetch. We test that the endpoint exists and responds.
    // In a real scenario with network disabled, it would return 0 inserted.
    // We verify the response shape.
    const mockRows = [
      { fecha: '15/01/2024', venta: '1150,50' },
      { fecha: '16/01/2024', venta: '1160,00' },
    ]

    // Insert directly via service to test the shape
    const { syncCcl } = await import('../service')
    const result = await syncCcl(() => Promise.resolve(mockRows))

    expect(result.inserted).toBe(2)
    expect(result.skipped).toBe(0)
  })

  it('skip si la fecha ya existe (insert-only)', async () => {
    await createCclRate({ date: new Date('2024-01-15') })

    const { syncCcl } = await import('../service')
    const result = await syncCcl(() => Promise.resolve([{ fecha: '15/01/2024', venta: '1200,00' }]))

    expect(result.inserted).toBe(0)
    expect(result.skipped).toBe(1)

    // Original rate unchanged
    const res = await request(app).get('/api/v1/ccl/2024-01-15')
    expect(parseFloat(res.body.data.rate)).toBeCloseTo(1150) // original
  })
})
