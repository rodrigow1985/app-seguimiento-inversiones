// Factories para crear datos de test con valores por defecto sensatos.
// Cada factory devuelve la entidad creada en DB.

import { prisma } from '../lib/prisma'
import type {
  Asset,
  Broker,
  Portfolio,
  CclRate,
  Position,
  Trade,
  DcaStrategy,
  AssetType,
  CurrencyType,
  PriceSource,
  PortfolioType,
  PortfolioStrategy,
  TradeType,
  CclSource,
} from '@prisma/client'

// ── Assets ────────────────────────────────────────────────────────────────────

export async function createAsset(overrides: Partial<{
  ticker: string
  name: string
  assetType: AssetType
  currencyNative: CurrencyType
  priceSource: PriceSource
  priceSourceId: string
  isActive: boolean
}> = {}): Promise<Asset> {
  return prisma.asset.create({
    data: {
      ticker: overrides.ticker ?? 'BTC',
      name: overrides.name ?? 'Bitcoin',
      assetType: overrides.assetType ?? 'CRYPTO',
      currencyNative: overrides.currencyNative ?? 'USD',
      priceSource: overrides.priceSource ?? 'COINGECKO',
      priceSourceId: overrides.priceSourceId ?? 'bitcoin',
      isActive: overrides.isActive ?? true,
    },
  })
}

export async function createAssetARS(overrides: Partial<{
  ticker: string
  name: string
  assetType: AssetType
}> = {}): Promise<Asset> {
  return createAsset({
    ticker: overrides.ticker ?? 'GGAL',
    name: overrides.name ?? 'Grupo Galicia',
    assetType: overrides.assetType ?? 'ACCION_ARG',
    currencyNative: 'ARS',
    priceSource: 'IOL',
  })
}

// ── Brokers ───────────────────────────────────────────────────────────────────

export async function createBroker(overrides: Partial<{
  name: string
  commissionPct: string
  currency: CurrencyType
}> = {}): Promise<Broker> {
  return prisma.broker.create({
    data: {
      name: overrides.name ?? 'Binance',
      commissionPct: overrides.commissionPct ?? '0.7260',
      currency: overrides.currency ?? 'USD',
    },
  })
}

export async function createBrokerARS(overrides: Partial<{ name: string }> = {}): Promise<Broker> {
  return createBroker({
    name: overrides.name ?? 'IOL',
    commissionPct: '0.7000',
    currency: 'ARS',
  })
}

// ── Portfolios ────────────────────────────────────────────────────────────────

export async function createPortfolio(
  brokerId: string,
  overrides: Partial<{
    name: string
    portfolioType: PortfolioType
    strategy: PortfolioStrategy
    currencyBase: CurrencyType
  }> = {},
): Promise<Portfolio> {
  return prisma.portfolio.create({
    data: {
      name: overrides.name ?? 'Cryptos',
      portfolioType: overrides.portfolioType ?? 'TRADING',
      strategy: overrides.strategy ?? 'CORTO_PLAZO',
      currencyBase: overrides.currencyBase ?? 'USD',
      brokerId,
    },
  })
}

// ── CCL Rates ─────────────────────────────────────────────────────────────────

export async function createCclRate(overrides: Partial<{
  date: Date
  rate: string
  source: CclSource
}> = {}): Promise<CclRate> {
  return prisma.cclRate.create({
    data: {
      date: overrides.date ?? new Date('2024-01-15'),
      rate: overrides.rate ?? '1150.0000',
      source: overrides.source ?? 'AMBITO',
    },
  })
}

// ── Positions ─────────────────────────────────────────────────────────────────

export async function createPosition(
  portfolioId: string,
  assetId: string,
  brokerId: string,
  overrides: Partial<{
    openedAt: Date
    notes: string
  }> = {},
): Promise<Position> {
  return prisma.position.create({
    data: {
      portfolioId,
      assetId,
      brokerId,
      openedAt: overrides.openedAt ?? new Date('2024-01-15'),
      notes: overrides.notes,
    },
  })
}

// ── Trades ────────────────────────────────────────────────────────────────────

export async function createTrade(
  positionId: string,
  brokerId: string,
  overrides: Partial<{
    type: TradeType
    tradeDate: Date
    units: string
    priceNative: string
    currency: CurrencyType
    cclRateId: string
    priceUsd: string
    totalUsd: string
    commissionPct: string
    commissionAmount: string
    notes: string
  }> = {},
): Promise<Trade> {
  const units = overrides.units ?? '10'
  const priceUsd = overrides.priceUsd ?? '42000.00000000'
  const totalUsd = overrides.totalUsd ?? '420000.0000'
  const commissionPct = overrides.commissionPct ?? '0.7260'
  const commissionAmount = overrides.commissionAmount ?? '3049.2000'

  return prisma.trade.create({
    data: {
      positionId,
      brokerId,
      type: overrides.type ?? 'BUY',
      tradeDate: overrides.tradeDate ?? new Date('2024-01-15'),
      units,
      priceNative: overrides.priceNative ?? priceUsd,
      currency: overrides.currency ?? 'USD',
      cclRateId: overrides.cclRateId,
      priceUsd,
      totalUsd,
      commissionPct,
      commissionAmount,
      notes: overrides.notes,
    },
  })
}

// ── DCA ───────────────────────────────────────────────────────────────────────

export async function createDcaStrategy(
  portfolioId: string,
  assetId: string,
  brokerId: string,
  overrides: Partial<{
    name: string
    isActive: boolean
    startedAt: Date
  }> = {},
): Promise<DcaStrategy> {
  return prisma.dcaStrategy.create({
    data: {
      portfolioId,
      assetId,
      brokerId,
      name: overrides.name ?? 'DCA BTC',
      isActive: overrides.isActive ?? true,
      startedAt: overrides.startedAt ?? new Date('2024-01-15'),
    },
  })
}
