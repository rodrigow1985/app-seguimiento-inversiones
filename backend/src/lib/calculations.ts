import { Decimal } from '@prisma/client/runtime/library'

type TradeLike = {
  type: string
  units: Decimal
  priceUsd: Decimal
  totalUsd: Decimal
  commissionAmount: Decimal
}

export function calcOpenUnits(trades: TradeLike[]): Decimal {
  return trades.reduce((acc, t) => {
    return t.type === 'BUY' ? acc.add(t.units) : acc.sub(t.units)
  }, new Decimal(0))
}

export function calcAvgCostUsd(trades: TradeLike[]): Decimal {
  const buys = trades.filter((t) => t.type === 'BUY')
  const totalUnits = buys.reduce((acc, t) => acc.add(t.units), new Decimal(0))
  if (totalUnits.isZero()) return new Decimal(0)
  const totalCost = buys.reduce((acc, t) => acc.add(t.units.mul(t.priceUsd)), new Decimal(0))
  return totalCost.div(totalUnits)
}

export function calcRealizedPnl(trades: TradeLike[]): Decimal {
  // For each SELL trade: gain = (sellPrice - avgCost) * units
  // We use a running avg cost approach
  let totalBuyUnits = new Decimal(0)
  let totalBuyCost = new Decimal(0)
  let realizedPnl = new Decimal(0)

  for (const t of trades) {
    if (t.type === 'BUY') {
      totalBuyUnits = totalBuyUnits.add(t.units)
      totalBuyCost = totalBuyCost.add(t.units.mul(t.priceUsd))
    } else {
      const avgCost = totalBuyUnits.isZero() ? new Decimal(0) : totalBuyCost.div(totalBuyUnits)
      realizedPnl = realizedPnl.add(t.priceUsd.sub(avgCost).mul(t.units))
      totalBuyUnits = totalBuyUnits.sub(t.units)
      totalBuyCost = totalBuyUnits.isZero()
        ? new Decimal(0)
        : totalBuyCost.sub(avgCost.mul(t.units))
    }
  }

  return realizedPnl
}

export function calcPositionSummary(
  trades: TradeLike[],
  currentPriceUsd: Decimal | null,
): {
  openUnits: Decimal
  avgCostUsd: Decimal
  status: 'OPEN' | 'CLOSED'
  unrealizedPnlUsd: Decimal | null
  unrealizedPnlPct: Decimal | null
  realizedPnlUsd: Decimal
} {
  const openUnits = calcOpenUnits(trades)
  const avgCostUsd = calcAvgCostUsd(trades)
  const status = openUnits.isZero() ? 'CLOSED' : 'OPEN'
  const realizedPnlUsd = calcRealizedPnl(trades)

  let unrealizedPnlUsd: Decimal | null = null
  let unrealizedPnlPct: Decimal | null = null

  if (currentPriceUsd !== null && !openUnits.isZero()) {
    unrealizedPnlUsd = currentPriceUsd.sub(avgCostUsd).mul(openUnits)
    if (!avgCostUsd.isZero()) {
      unrealizedPnlPct = unrealizedPnlUsd.div(avgCostUsd.mul(openUnits)).mul(100)
    }
  }

  return { openUnits, avgCostUsd, status, unrealizedPnlUsd, unrealizedPnlPct, realizedPnlUsd }
}

export function calcDcaAccumulatedCapital(
  entries: Array<{ type: string; amountUsd: Decimal }>,
): Decimal {
  return entries.reduce((acc, e) => {
    return e.type === 'CIERRE' ? acc.sub(e.amountUsd) : acc.add(e.amountUsd)
  }, new Decimal(0))
}
