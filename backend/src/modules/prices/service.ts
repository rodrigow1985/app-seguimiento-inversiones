import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../lib/errors'
import { fetchCurrentPrice } from '../../external/price-provider'
import type { PriceResult } from '../../external/price-provider'

const TTL_CRYPTO_MS = 60_000    // 60 s
const TTL_STOCK_MS  = 300_000   // 5 min

// In-memory cache: assetId → { priceUsd, result, expiresAt }
const cache = new Map<string, { priceUsd: number; result: PriceResult; expiresAt: number }>()

function getTtl(priceSource: string): number {
  return priceSource === 'COINGECKO' ? TTL_CRYPTO_MS : TTL_STOCK_MS
}

// Para activos ARS, convertir usando el último CCL disponible en DB.
async function toUsd(priceNative: number, currency: 'USD' | 'ARS'): Promise<number> {
  if (currency === 'USD') return priceNative
  const latestCcl = await prisma.cclRate.findFirst({ orderBy: { date: 'desc' } })
  if (!latestCcl) throw new Error('No hay tipo de cambio CCL disponible para convertir precio ARS→USD')
  return priceNative / Number(latestCcl.rate)
}

export async function getCurrentPrice(assetId: string): Promise<{
  priceUsd: number
  priceNative: number
  currency: string
  source: string
  fetchedAt: Date
  stale: boolean
  priceDate: Date | null
}> {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!asset) throw new NotFoundError(`No existe un activo con ID ${assetId}`)

  // Check in-memory cache
  const cached = cache.get(assetId)
  if (cached && cached.expiresAt > Date.now()) {
    return {
      priceUsd: cached.priceUsd,
      priceNative: cached.result.priceNative,
      currency: cached.result.currency,
      source: cached.result.source,
      fetchedAt: cached.result.fetchedAt,
      stale: false,
      priceDate: null,
    }
  }

  // Try external provider
  try {
    const result = await fetchCurrentPrice(asset)
    const priceUsd = await toUsd(result.priceNative, result.currency)

    cache.set(assetId, { priceUsd, result, expiresAt: Date.now() + getTtl(asset.priceSource) })

    // Snapshot siempre en USD para compatibilidad con cálculos de P&L
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await prisma.priceSnapshot.upsert({
      where: { assetId_priceDate: { assetId, priceDate: today } },
      create: { assetId, priceDate: today, price: priceUsd, currency: 'USD', source: result.source },
      update: { price: priceUsd, source: result.source },
    })

    return {
      priceUsd,
      priceNative: result.priceNative,
      currency: result.currency,
      source: result.source,
      fetchedAt: result.fetchedAt,
      stale: false,
      priceDate: today,
    }
  } catch {
    // Fallback al último snapshot
    const snapshot = await prisma.priceSnapshot.findFirst({
      where: { assetId },
      orderBy: { priceDate: 'desc' },
    })
    if (!snapshot) throw new NotFoundError(`No hay precio disponible para el activo ${asset.ticker}`)

    return {
      priceUsd: Number(snapshot.price),
      priceNative: Number(snapshot.price),
      currency: snapshot.currency,
      source: snapshot.source,
      fetchedAt: snapshot.createdAt,
      stale: true,
      priceDate: snapshot.priceDate,
    }
  }
}

export async function syncAllPrices(): Promise<{ synced: number; failed: number; errors: string[] }> {
  const assets = await prisma.asset.findMany({
    where: { isActive: true, priceSource: { not: 'MANUAL' } },
  })

  let synced = 0
  let failed = 0
  const errors: string[] = []

  for (const asset of assets) {
    try {
      const result = await fetchCurrentPrice(asset)
      const priceUsd = await toUsd(result.priceNative, result.currency)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      await prisma.priceSnapshot.upsert({
        where: { assetId_priceDate: { assetId: asset.id, priceDate: today } },
        create: { assetId: asset.id, priceDate: today, price: priceUsd, currency: 'USD', source: result.source },
        update: { price: priceUsd, source: result.source },
      })
      cache.set(asset.id, { priceUsd, result, expiresAt: Date.now() + getTtl(asset.priceSource) })
      synced++
    } catch (err) {
      failed++
      errors.push(`${asset.ticker}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return { synced, failed, errors }
}
