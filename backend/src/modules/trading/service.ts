import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../../lib/prisma'
import {
  NotFoundError,
  ValidationError,
  CclNotAvailableError,
  InsufficientUnitsError,
  PositionAlreadyClosedError,
} from '../../lib/errors'
import { calcOpenUnits, calcAvgCostUsd, calcPositionSummary } from '../../lib/calculations'
import type { ListPositionsQuery, CreatePositionBody, AddTradeBody, UpdateTradeBody } from './schema'

// ── Helpers ────────────────────────────────────────────────────────────────────

async function lookupCclRate(tradeDate: string, currency: string) {
  if (currency === 'USD') return null
  const date = new Date(tradeDate)
  const ccl = await prisma.cclRate.findFirst({
    where: { date: { lte: date } },
    orderBy: { date: 'desc' },
  })
  if (!ccl) throw new CclNotAvailableError(tradeDate)
  return ccl
}

async function buildTradeAmounts(
  priceNative: number,
  units: number,
  currency: string,
  tradeDate: string,
  brokerId: string,
  commissionPctOverride?: number,
) {
  const cclRate = await lookupCclRate(tradeDate, currency)
  const priceUsd = currency === 'ARS'
    ? new Decimal(priceNative).div(cclRate!.rate)
    : new Decimal(priceNative)

  const totalUsd = priceUsd.mul(units)

  const broker = await prisma.broker.findUnique({ where: { id: brokerId } })
  if (!broker) throw new NotFoundError(`No existe un broker con ID ${brokerId}`)

  const commissionPct = commissionPctOverride !== undefined
    ? new Decimal(commissionPctOverride)
    : broker.commissionPct
  const commissionAmount = totalUsd.mul(commissionPct).div(100)

  return {
    priceUsd,
    totalUsd,
    commissionPct,
    commissionAmount,
    cclRateId: cclRate?.id ?? null,
  }
}

// ── Positions ──────────────────────────────────────────────────────────────────

const positionWithTrades = {
  portfolio: { include: { broker: true } },
  asset: true,
  broker: true,
  trades: { orderBy: { tradeDate: 'asc' as const } },
}

function enrichPosition(pos: {
  trades: Array<{ type: string; units: Decimal; priceUsd: Decimal; totalUsd: Decimal; commissionAmount: Decimal }>
  [key: string]: unknown
}) {
  const summary = calcPositionSummary(pos.trades, null)
  return {
    ...pos,
    status: summary.status,
    openUnits: summary.openUnits,
    avgCostUsd: summary.avgCostUsd,
    realizedPnlUsd: summary.realizedPnlUsd,
  }
}

export async function listPositions(query: ListPositionsQuery) {
  const { portfolioId, assetId, page, limit } = query
  const skip = (page - 1) * limit

  const allPositions = await prisma.position.findMany({
    where: {
      ...(portfolioId && { portfolioId }),
      ...(assetId && { assetId }),
    },
    include: positionWithTrades,
    orderBy: { openedAt: 'desc' },
    skip,
    take: limit,
  })

  const enriched = allPositions.map(enrichPosition)

  const filtered = query.status
    ? enriched.filter((p) => p.status === query.status)
    : enriched

  return {
    data: filtered,
    meta: { total: filtered.length, page, limit, pages: Math.ceil(filtered.length / limit) },
  }
}

export async function getPositionById(id: string) {
  const pos = await prisma.position.findUnique({ where: { id }, include: positionWithTrades })
  if (!pos) throw new NotFoundError(`No existe una posición con ID ${id}`)
  return enrichPosition(pos)
}

export async function getPositionPnl(id: string) {
  const pos = await prisma.position.findUnique({
    where: { id },
    include: {
      asset: true,
      trades: { orderBy: { tradeDate: 'asc' } },
    },
  })
  if (!pos) throw new NotFoundError(`No existe una posición con ID ${id}`)

  // Get latest price snapshot
  const snapshot = await prisma.priceSnapshot.findFirst({
    where: { assetId: pos.assetId },
    orderBy: { priceDate: 'desc' },
  })

  const currentPriceUsd = snapshot ? snapshot.price : null
  const summary = calcPositionSummary(pos.trades, currentPriceUsd)

  return {
    positionId: id,
    assetTicker: pos.asset.ticker,
    ...summary,
    currentPriceUsd,
    priceDate: snapshot?.priceDate ?? null,
    priceStale: !snapshot,
  }
}

export async function createPosition(body: CreatePositionBody) {
  // Validate relations
  const [portfolio, asset] = await Promise.all([
    prisma.portfolio.findUnique({ where: { id: body.portfolioId } }),
    prisma.asset.findUnique({ where: { id: body.assetId } }),
  ])
  if (!portfolio) throw new NotFoundError(`No existe una cartera con ID ${body.portfolioId}`)
  if (!asset) throw new NotFoundError(`No existe un activo con ID ${body.assetId}`)

  // Check unique constraint
  const existing = await prisma.position.findUnique({
    where: { portfolioId_assetId: { portfolioId: body.portfolioId, assetId: body.assetId } },
  })
  if (existing) {
    throw new ValidationError('Ya existe una posición para este activo en esta cartera', [
      { field: 'assetId', message: 'Ya hay una posición abierta o cerrada para este activo' },
    ])
  }

  const amounts = await buildTradeAmounts(
    body.priceNative,
    body.units,
    body.currency,
    body.tradeDate,
    body.brokerId,
    body.commissionPct,
  )

  return prisma.$transaction(async (tx) => {
    const position = await tx.position.create({
      data: {
        portfolioId: body.portfolioId,
        assetId: body.assetId,
        brokerId: body.brokerId,
        openedAt: new Date(body.openedAt),
        notes: body.notes,
      },
    })

    await tx.trade.create({
      data: {
        positionId: position.id,
        brokerId: body.brokerId,
        type: 'BUY',
        tradeDate: new Date(body.tradeDate),
        units: body.units,
        priceNative: body.priceNative,
        currency: body.currency,
        cclRateId: amounts.cclRateId,
        priceUsd: amounts.priceUsd,
        totalUsd: amounts.totalUsd,
        commissionPct: amounts.commissionPct,
        commissionAmount: amounts.commissionAmount,
        notes: body.tradeNotes,
      },
    })

    const created = await tx.position.findUnique({ where: { id: position.id }, include: positionWithTrades })
    return enrichPosition(created!)
  })
}

// ── Trades ─────────────────────────────────────────────────────────────────────

export async function listTrades(positionId: string) {
  const pos = await prisma.position.findUnique({ where: { id: positionId } })
  if (!pos) throw new NotFoundError(`No existe una posición con ID ${positionId}`)

  const trades = await prisma.trade.findMany({
    where: { positionId },
    orderBy: { tradeDate: 'asc' },
    include: { cclRate: true },
  })
  return { data: trades }
}

export async function addTrade(positionId: string, body: AddTradeBody) {
  const pos = await prisma.position.findUnique({
    where: { id: positionId },
    include: { trades: true, broker: true },
  })
  if (!pos) throw new NotFoundError(`No existe una posición con ID ${positionId}`)

  const openUnits = calcOpenUnits(pos.trades)

  if (body.type === 'SELL') {
    if (openUnits.isZero()) throw new PositionAlreadyClosedError(positionId)
    if (new Decimal(body.units).greaterThan(openUnits)) {
      throw new InsufficientUnitsError(openUnits.toString(), body.units.toString())
    }
  }

  const amounts = await buildTradeAmounts(
    body.priceNative,
    body.units,
    body.currency,
    body.tradeDate,
    pos.brokerId,
    body.commissionPct,
  )

  return prisma.trade.create({
    data: {
      positionId,
      brokerId: pos.brokerId,
      type: body.type,
      tradeDate: new Date(body.tradeDate),
      units: body.units,
      priceNative: body.priceNative,
      currency: body.currency,
      cclRateId: amounts.cclRateId,
      priceUsd: amounts.priceUsd,
      totalUsd: amounts.totalUsd,
      commissionPct: amounts.commissionPct,
      commissionAmount: amounts.commissionAmount,
      notes: body.notes,
    },
    include: { cclRate: true },
  })
}

export async function updateTrade(id: string, body: UpdateTradeBody) {
  const trade = await prisma.trade.findUnique({ where: { id }, include: { position: { include: { trades: true } } } })
  if (!trade) throw new NotFoundError(`No existe un trade con ID ${id}`)

  // Recalculate amounts if price/currency changed
  let updateData: Record<string, unknown> = { notes: body.notes }

  if (body.priceNative !== undefined || body.units !== undefined || body.currency !== undefined || body.tradeDate !== undefined) {
    const priceNative = body.priceNative ?? Number(trade.priceNative)
    const units = body.units ?? Number(trade.units)
    const currency = body.currency ?? trade.currency
    const tradeDate = body.tradeDate ?? trade.tradeDate.toISOString().split('T')[0]

    const amounts = await buildTradeAmounts(priceNative, units, currency, tradeDate, trade.brokerId, body.commissionPct !== undefined ? body.commissionPct : Number(trade.commissionPct))

    updateData = {
      ...updateData,
      tradeDate: body.tradeDate ? new Date(body.tradeDate) : undefined,
      units: body.units,
      priceNative: body.priceNative,
      currency: body.currency,
      cclRateId: amounts.cclRateId,
      priceUsd: amounts.priceUsd,
      totalUsd: amounts.totalUsd,
      commissionPct: amounts.commissionPct,
      commissionAmount: amounts.commissionAmount,
    }
  } else if (body.commissionPct !== undefined) {
    const totalUsd = trade.totalUsd
    const commissionAmount = new Decimal(body.commissionPct).div(100).mul(totalUsd)
    updateData = { ...updateData, commissionPct: body.commissionPct, commissionAmount }
  }

  // Remove undefined values
  const cleanData = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined))

  return prisma.trade.update({ where: { id }, data: cleanData, include: { cclRate: true } })
}

export async function deleteTrade(id: string) {
  const trade = await prisma.trade.findUnique({
    where: { id },
    include: { position: { include: { trades: true } } },
  })
  if (!trade) throw new NotFoundError(`No existe un trade con ID ${id}`)

  // After deleting this trade, what would the position look like?
  const remainingTrades = trade.position.trades.filter((t) => t.id !== id)
  const wouldBeOpenUnits = calcOpenUnits(remainingTrades)

  // Don't allow deleting a trade if it would result in negative open units
  if (wouldBeOpenUnits.isNegative()) {
    throw new ValidationError('No se puede eliminar este trade porque resultaría en unidades negativas', [
      { field: 'id', message: 'Eliminá primero los trades SELL posteriores' },
    ])
  }

  await prisma.trade.delete({ where: { id } })
}

export async function getTradeById(id: string) {
  const trade = await prisma.trade.findUnique({ where: { id }, include: { cclRate: true } })
  if (!trade) throw new NotFoundError(`No existe un trade con ID ${id}`)
  return trade
}
