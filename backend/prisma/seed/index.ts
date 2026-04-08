// Seed principal: carga brokers y activos iniciales.
// Uso: pnpm db:seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const brokers = [
  { name: 'IOL',    commissionPct: 0.007,   currency: 'ARS' as const },
  { name: 'Binance',commissionPct: 0.00726, currency: 'USD' as const },
  { name: 'BingX',  commissionPct: 0.002,   currency: 'USD' as const },
  { name: 'Balanz', commissionPct: 0.007,   currency: 'ARS' as const },
]

const assets = [
  // Crypto (USD, CoinGecko)
  { ticker: 'BTC',   name: 'Bitcoin',           assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'bitcoin' },
  { ticker: 'ETH',   name: 'Ethereum',           assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'ethereum' },
  { ticker: 'ADA',   name: 'Cardano',            assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'cardano' },
  { ticker: 'PAXG',  name: 'PAX Gold',           assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'pax-gold' },
  { ticker: 'BNB',   name: 'BNB',                assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'binancecoin' },
  { ticker: 'AVAX',  name: 'Avalanche',          assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'avalanche-2' },
  { ticker: 'SOL',   name: 'Solana',             assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'solana' },
  { ticker: 'DOT',   name: 'Polkadot',           assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'polkadot' },
  { ticker: 'MATIC', name: 'Polygon',            assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'matic-network' },
  { ticker: 'RUNE',  name: 'THORChain',          assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'thorchain' },
  { ticker: 'XTZ',   name: 'Tezos',              assetType: 'CRYPTO' as const,     currencyNative: 'USD' as const, priceSource: 'COINGECKO' as const, priceSourceId: 'tezos' },
  // CEDEARs (ARS, IOL)
  { ticker: 'AAPL',  name: 'Apple (CEDEAR)',      assetType: 'CEDEAR' as const,     currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'AAPL' },
  { ticker: 'GOOGL', name: 'Alphabet (CEDEAR)',   assetType: 'CEDEAR' as const,     currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'GOOGL' },
  { ticker: 'AMZN',  name: 'Amazon (CEDEAR)',     assetType: 'CEDEAR' as const,     currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'AMZN' },
  { ticker: 'MSFT',  name: 'Microsoft (CEDEAR)',  assetType: 'CEDEAR' as const,     currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'MSFT' },
  { ticker: 'NVDA',  name: 'NVIDIA (CEDEAR)',     assetType: 'CEDEAR' as const,     currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'NVDA' },
  // Acciones ARG (ARS, IOL)
  { ticker: 'GGAL',  name: 'Grupo Galicia',       assetType: 'ACCION_ARG' as const, currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'GGAL' },
  { ticker: 'YPF',   name: 'YPF',                 assetType: 'ACCION_ARG' as const, currencyNative: 'ARS' as const, priceSource: 'IOL' as const, priceSourceId: 'YPF' },
]

async function main() {
  console.log('Seeding brokers...')
  for (const broker of brokers) {
    await prisma.broker.upsert({
      where: { name: broker.name },
      update: {},
      create: broker,
    })
  }
  console.log(`  ${brokers.length} brokers OK`)

  console.log('Seeding assets...')
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { ticker: asset.ticker },
      update: {},
      create: asset,
    })
  }
  console.log(`  ${assets.length} assets OK`)

  console.log('Seed completo.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
