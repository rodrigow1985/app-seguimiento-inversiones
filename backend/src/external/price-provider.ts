// Abstracción sobre los proveedores de precios externos.
// Nunca llamar a CoinGecko, Rava, IOL directamente desde módulos.
// Usar siempre este módulo como punto de entrada.

import { PriceUnavailableError } from '../lib/errors'

export interface PriceResult {
  priceUsd: number
  currency: 'USD' | 'ARS'
  source: string
  fetchedAt: Date
}

async function fetchCoinGecko(priceSourceId: string): Promise<PriceResult> {
  const apiKey = process.env.COINGECKO_API_KEY
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(priceSourceId)}&vs_currencies=usd`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) })

  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)

  const data = (await res.json()) as Record<string, { usd?: number }>
  const price = data[priceSourceId]?.usd
  if (price === undefined) throw new Error(`CoinGecko: no price for ${priceSourceId}`)

  return { priceUsd: price, currency: 'USD', source: 'COINGECKO', fetchedAt: new Date() }
}

async function fetchIOL(_ticker: string): Promise<PriceResult> {
  // IOL requires OAuth — placeholder para implementación futura
  throw new Error('IOL price provider not yet implemented')
}

async function fetchRava(_ticker: string): Promise<PriceResult> {
  // Rava Bursátil placeholder
  throw new Error('RAVA price provider not yet implemented')
}

export async function fetchCurrentPrice(asset: {
  ticker: string
  priceSource: string
  priceSourceId: string | null
  currencyNative: string
}): Promise<PriceResult> {
  const id = asset.priceSourceId ?? asset.ticker

  try {
    switch (asset.priceSource) {
      case 'COINGECKO':
        return await fetchCoinGecko(id)
      case 'IOL':
        return await fetchIOL(id)
      case 'RAVA':
        return await fetchRava(id)
      case 'MANUAL':
        throw new Error('MANUAL price source requires a snapshot')
      default:
        throw new Error(`Unknown price source: ${asset.priceSource}`)
    }
  } catch {
    throw new PriceUnavailableError(asset.ticker, asset.priceSource)
  }
}
