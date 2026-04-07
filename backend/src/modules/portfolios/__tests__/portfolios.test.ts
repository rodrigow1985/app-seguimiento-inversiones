import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../app'
import { createBroker, createPortfolio, createAsset, createPosition, createDcaStrategy } from '../../../test/helpers'

const app = createApp()

describe('GET /api/v1/portfolios', () => {
  it('retorna lista vacía', async () => {
    const res = await request(app).get('/api/v1/portfolios')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
    expect(res.body.meta.total).toBe(0)
  })

  it('retorna portfolios con broker incluido', async () => {
    const broker = await createBroker()
    await createPortfolio(broker.id, { name: 'Cryptos' })
    await createPortfolio(broker.id, { name: 'Cedears' })

    const res = await request(app).get('/api/v1/portfolios')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].broker).toBeDefined()
  })

  it('filtra por isActive', async () => {
    const broker = await createBroker()
    await createPortfolio(broker.id, { name: 'Activo' })

    const portfolioId = (await request(app).get('/api/v1/portfolios')).body.data[0].id
    await request(app).patch(`/api/v1/portfolios/${portfolioId}`).send({ isActive: false })

    const activeRes = await request(app).get('/api/v1/portfolios')
    expect(activeRes.body.data).toHaveLength(0)

    const allRes = await request(app).get('/api/v1/portfolios?isActive=false')
    expect(allRes.body.data).toHaveLength(1)
  })

  it('filtra por type', async () => {
    const broker = await createBroker()
    await createPortfolio(broker.id, { portfolioType: 'TRADING' })
    await createPortfolio(broker.id, { portfolioType: 'DCA', name: 'DCA port' })

    const res = await request(app).get('/api/v1/portfolios?type=DCA')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].portfolioType).toBe('DCA')
  })
})

describe('GET /api/v1/portfolios/:id', () => {
  it('retorna el portfolio con broker', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id, { name: 'Cryptos' })

    const res = await request(app).get(`/api/v1/portfolios/${portfolio.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Cryptos')
    expect(res.body.data.broker.id).toBe(broker.id)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).get('/api/v1/portfolios/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/portfolios', () => {
  it('crea un portfolio con datos válidos', async () => {
    const broker = await createBroker()

    const res = await request(app).post('/api/v1/portfolios').send({
      name: 'Mi Cartera',
      portfolioType: 'TRADING',
      strategy: 'CORTO_PLAZO',
      currencyBase: 'USD',
      brokerId: broker.id,
    })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Mi Cartera')
    expect(res.body.data.isActive).toBe(true)
    expect(res.body.data.broker.id).toBe(broker.id)
  })

  it('retorna 422 si falta campo requerido', async () => {
    const res = await request(app).post('/api/v1/portfolios').send({
      portfolioType: 'TRADING',
      strategy: 'CORTO_PLAZO',
      currencyBase: 'USD',
      // name y brokerId faltantes
    })
    expect(res.status).toBe(422)
  })

  it('retorna 404 si el broker no existe', async () => {
    const res = await request(app).post('/api/v1/portfolios').send({
      name: 'Cartera',
      portfolioType: 'TRADING',
      strategy: 'LARGO_PLAZO',
      currencyBase: 'ARS',
      brokerId: '00000000-0000-0000-0000-000000000000',
    })
    expect(res.status).toBe(404)
  })

  it('retorna 422 si portfolioType es inválido', async () => {
    const broker = await createBroker()
    const res = await request(app).post('/api/v1/portfolios').send({
      name: 'Cartera',
      portfolioType: 'INVALIDO',
      strategy: 'CORTO_PLAZO',
      currencyBase: 'USD',
      brokerId: broker.id,
    })
    expect(res.status).toBe(422)
  })
})

describe('PATCH /api/v1/portfolios/:id', () => {
  it('actualiza el nombre', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id, { name: 'Original' })

    const res = await request(app).patch(`/api/v1/portfolios/${portfolio.id}`).send({ name: 'Actualizado' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Actualizado')
  })

  it('desactiva un portfolio', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)

    const res = await request(app).patch(`/api/v1/portfolios/${portfolio.id}`).send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).patch('/api/v1/portfolios/00000000-0000-0000-0000-000000000000').send({ name: 'X' })
    expect(res.status).toBe(404)
  })

  it('retorna 422 si el body está vacío', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const res = await request(app).patch(`/api/v1/portfolios/${portfolio.id}`).send({})
    expect(res.status).toBe(422)
  })
})

describe('DELETE /api/v1/portfolios/:id', () => {
  it('elimina el portfolio sin posiciones', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)

    const res = await request(app).delete(`/api/v1/portfolios/${portfolio.id}`)
    expect(res.status).toBe(204)

    const getRes = await request(app).get(`/api/v1/portfolios/${portfolio.id}`)
    expect(getRes.status).toBe(404)
  })

  it('retorna 422 si tiene posiciones', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id)
    const asset = await createAsset()
    await createPosition(portfolio.id, asset.id, broker.id)

    const res = await request(app).delete(`/api/v1/portfolios/${portfolio.id}`)
    expect(res.status).toBe(422)
  })

  it('retorna 422 si tiene estrategias DCA', async () => {
    const broker = await createBroker()
    const portfolio = await createPortfolio(broker.id, { portfolioType: 'DCA' })
    const asset = await createAsset()
    await createDcaStrategy(portfolio.id, asset.id, broker.id)

    const res = await request(app).delete(`/api/v1/portfolios/${portfolio.id}`)
    expect(res.status).toBe(422)
  })

  it('retorna 404 para ID inexistente', async () => {
    const res = await request(app).delete('/api/v1/portfolios/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})
