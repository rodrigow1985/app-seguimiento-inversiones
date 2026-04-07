import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../../lib/prisma'
import { calcOpenUnits, calcAvgCostUsd, calcDcaAccumulatedCapital } from '../../lib/calculations'

export async function getDashboard() {
  const [positions, dcaStrategies, latestCcl] = await Promise.all([
    prisma.position.findMany({
      include: {
        asset: true,
        portfolio: true,
        trades: { orderBy: { tradeDate: 'asc' } },
      },
    }),
    prisma.dcaStrategy.findMany({
      include: {
        asset: true,
        portfolio: true,
        entries: { orderBy: { entryDate: 'asc' } },
      },
    }),
    prisma.cclRate.findFirst({ orderBy: { date: 'desc' } }),
  ])

  // ── Trading summary ────────────────────────────────────────────────────────

  let openPositionsCount = 0
  let closedPositionsCount = 0
  let totalInvestedUsd = new Decimal(0)
  let totalOpenUnitsValue = new Decimal(0) // sum of (openUnits * avgCost)

  const openPositions = []

  for (const pos of positions) {
    const openUnits = calcOpenUnits(pos.trades)
    const avgCostUsd = calcAvgCostUsd(pos.trades)
    const isOpen = !openUnits.isZero()

    if (isOpen) {
      openPositionsCount++
      const positionValue = openUnits.mul(avgCostUsd)
      totalOpenUnitsValue = totalOpenUnitsValue.add(positionValue)

      // Get latest price snapshot for unrealized P&L
      const snapshot = await prisma.priceSnapshot.findFirst({
        where: { assetId: pos.assetId },
        orderBy: { priceDate: 'desc' },
      })

      openPositions.push({
        positionId: pos.id,
        ticker: pos.asset.ticker,
        portfolioName: pos.portfolio.name,
        openUnits,
        avgCostUsd,
        currentPriceUsd: snapshot ? snapshot.price : null,
        priceStale: !snapshot,
      })
    } else {
      closedPositionsCount++
    }

    // Total invested = sum of all BUY trade totals
    const buyTotal = pos.trades
      .filter((t) => t.type === 'BUY')
      .reduce((acc, t) => acc.add(t.totalUsd), new Decimal(0))
    totalInvestedUsd = totalInvestedUsd.add(buyTotal)
  }

  // ── DCA summary ────────────────────────────────────────────────────────────

  let activeDcaCount = 0
  let totalDcaCapitalUsd = new Decimal(0)

  for (const strat of dcaStrategies) {
    const accumulatedCapital = calcDcaAccumulatedCapital(strat.entries)
    if (strat.isActive) {
      activeDcaCount++
      totalDcaCapitalUsd = totalDcaCapitalUsd.add(accumulatedCapital)
    }
  }

  return {
    trading: {
      openPositionsCount,
      closedPositionsCount,
      totalInvestedUsd,
      openPositions,
    },
    dca: {
      activeDcaCount,
      totalDcaCapitalUsd,
    },
    latestCclRate: latestCcl ? { date: latestCcl.date, rate: latestCcl.rate } : null,
  }
}
