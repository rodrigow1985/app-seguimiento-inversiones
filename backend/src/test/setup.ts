import { beforeEach, afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

// Limpia todas las tablas antes de cada test para garantizar aislamiento
beforeEach(async () => {
  // Orden importa por las FKs — de hijos a padres
  await prisma.$transaction([
    prisma.priceSnapshot.deleteMany(),
    prisma.dcaEntry.deleteMany(),
    prisma.dcaStrategy.deleteMany(),
    prisma.trade.deleteMany(),
    prisma.position.deleteMany(),
    prisma.cclRate.deleteMany(),
    prisma.portfolio.deleteMany(),
    prisma.broker.deleteMany(),
    prisma.asset.deleteMany(),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
