import { prisma } from '../../lib/prisma'
import { NotFoundError, ValidationError, StrategyAlreadyClosedError } from '../../lib/errors'
import { calcDcaAccumulatedCapital } from '../../lib/calculations'
import type {
  ListStrategiesQuery,
  CreateStrategyBody,
  UpdateStrategyBody,
  ListEntriesQuery,
  CreateEntryBody,
  UpdateEntryBody,
} from './schema'

// ── Strategies ─────────────────────────────────────────────────────────────────

const strategyIncludes = {
  portfolio: true,
  asset: true,
  broker: true,
  entries: { orderBy: { entryDate: 'asc' as const } },
}

function enrichStrategy(strategy: {
  isActive: boolean
  entries: Array<{ type: string; amountUsd: { toNumber(): number } }>
  [key: string]: unknown
}) {
  const entries = strategy.entries as Array<{ type: string; amountUsd: { add: (v: unknown) => unknown; sub: (v: unknown) => unknown; toString(): string } & { toNumber(): number } }>
  const accumulatedCapitalUsd = calcDcaAccumulatedCapital(
    entries.map((e) => ({ type: e.type, amountUsd: e.amountUsd as Parameters<typeof calcDcaAccumulatedCapital>[0][number]['amountUsd'] })),
  )
  return { ...strategy, accumulatedCapitalUsd }
}

export async function listStrategies(query: ListStrategiesQuery) {
  const { portfolioId, assetId, isActive, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    ...(portfolioId && { portfolioId }),
    ...(assetId && { assetId }),
    ...(isActive !== undefined && { isActive }),
  }

  const [data, total] = await Promise.all([
    prisma.dcaStrategy.findMany({ where, skip, take: limit, orderBy: { startedAt: 'desc' }, include: strategyIncludes }),
    prisma.dcaStrategy.count({ where }),
  ])

  return { data: data.map(enrichStrategy), meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function getStrategyById(id: string) {
  const strategy = await prisma.dcaStrategy.findUnique({ where: { id }, include: strategyIncludes })
  if (!strategy) throw new NotFoundError(`No existe una estrategia DCA con ID ${id}`)
  return enrichStrategy(strategy)
}

export async function createStrategy(body: CreateStrategyBody) {
  const [portfolio, asset, broker] = await Promise.all([
    prisma.portfolio.findUnique({ where: { id: body.portfolioId } }),
    prisma.asset.findUnique({ where: { id: body.assetId } }),
    prisma.broker.findUnique({ where: { id: body.brokerId } }),
  ])
  if (!portfolio) throw new NotFoundError(`No existe una cartera con ID ${body.portfolioId}`)
  if (!asset) throw new NotFoundError(`No existe un activo con ID ${body.assetId}`)
  if (!broker) throw new NotFoundError(`No existe un broker con ID ${body.brokerId}`)

  const strategy = await prisma.dcaStrategy.create({
    data: {
      portfolioId: body.portfolioId,
      assetId: body.assetId,
      brokerId: body.brokerId,
      name: body.name,
      startedAt: new Date(body.startedAt),
      notes: body.notes,
    },
    include: strategyIncludes,
  })
  return enrichStrategy(strategy)
}

export async function updateStrategy(id: string, body: UpdateStrategyBody) {
  await getStrategyById(id)
  const strategy = await prisma.dcaStrategy.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: strategyIncludes,
  })
  return enrichStrategy(strategy)
}

// ── Entries ────────────────────────────────────────────────────────────────────

export async function listEntries(strategyId: string, query: ListEntriesQuery) {
  const strategy = await prisma.dcaStrategy.findUnique({ where: { id: strategyId } })
  if (!strategy) throw new NotFoundError(`No existe una estrategia DCA con ID ${strategyId}`)

  const { page, limit } = query
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.dcaEntry.findMany({
      where: { strategyId },
      skip,
      take: limit,
      orderBy: { entryDate: 'asc' },
      include: { cclRate: true },
    }),
    prisma.dcaEntry.count({ where: { strategyId } }),
  ])

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function createEntry(strategyId: string, body: CreateEntryBody) {
  const strategy = await prisma.dcaStrategy.findUnique({ where: { id: strategyId } })
  if (!strategy) throw new NotFoundError(`No existe una estrategia DCA con ID ${strategyId}`)
  if (!strategy.isActive) throw new StrategyAlreadyClosedError(strategyId)

  // If CIERRE, mark strategy as inactive
  let cclRateId: string | null = null
  if (body.amountArs) {
    const date = new Date(body.entryDate)
    const ccl = await prisma.cclRate.findFirst({ where: { date: { lte: date } }, orderBy: { date: 'desc' } })
    cclRateId = ccl?.id ?? null
  }

  const entry = await prisma.dcaEntry.create({
    data: {
      strategyId,
      type: body.type,
      entryDate: new Date(body.entryDate),
      amountUsd: body.amountUsd,
      amountArs: body.amountArs,
      assetPriceAtEntry: body.assetPriceAtEntry,
      unitsReceived: body.unitsReceived,
      profitLossUsd: body.profitLossUsd,
      notes: body.notes,
      cclRateId,
    },
    include: { cclRate: true },
  })

  if (body.type === 'CIERRE') {
    await prisma.dcaStrategy.update({ where: { id: strategyId }, data: { isActive: false } })
  }

  return entry
}

export async function updateEntry(id: string, body: UpdateEntryBody) {
  const entry = await prisma.dcaEntry.findUnique({ where: { id } })
  if (!entry) throw new NotFoundError(`No existe una entrada DCA con ID ${id}`)

  return prisma.dcaEntry.update({
    where: { id },
    data: {
      ...(body.entryDate !== undefined && { entryDate: new Date(body.entryDate) }),
      ...(body.amountUsd !== undefined && { amountUsd: body.amountUsd }),
      ...(body.amountArs !== undefined && { amountArs: body.amountArs }),
      ...(body.assetPriceAtEntry !== undefined && { assetPriceAtEntry: body.assetPriceAtEntry }),
      ...(body.unitsReceived !== undefined && { unitsReceived: body.unitsReceived }),
      ...(body.profitLossUsd !== undefined && { profitLossUsd: body.profitLossUsd }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { cclRate: true },
  })
}

export async function deleteEntry(id: string) {
  const entry = await prisma.dcaEntry.findUnique({ where: { id } })
  if (!entry) throw new NotFoundError(`No existe una entrada DCA con ID ${id}`)

  if (entry.type === 'CIERRE') {
    // Re-activate strategy
    await prisma.dcaStrategy.update({ where: { id: entry.strategyId }, data: { isActive: true } })
  }

  await prisma.dcaEntry.delete({ where: { id } })
}
