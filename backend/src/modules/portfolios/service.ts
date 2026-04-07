import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ValidationError } from '../../lib/errors'
import type { ListPortfoliosQuery, CreatePortfolioBody, UpdatePortfolioBody } from './schema'

export async function listPortfolios(query: ListPortfoliosQuery) {
  const { isActive, type, page, limit } = query
  const skip = (page - 1) * limit

  const where: Prisma.PortfolioWhereInput = {
    isActive: isActive ?? true, // por defecto solo activos
    ...(type && { portfolioType: type }),
  }

  const [data, total] = await Promise.all([
    prisma.portfolio.findMany({ where, skip, take: limit, orderBy: { name: 'asc' }, include: { broker: true } }),
    prisma.portfolio.count({ where }),
  ])

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function getPortfolioById(id: string) {
  const portfolio = await prisma.portfolio.findUnique({ where: { id }, include: { broker: true } })
  if (!portfolio) throw new NotFoundError(`No existe una cartera con ID ${id}`)
  return portfolio
}

export async function createPortfolio(body: CreatePortfolioBody) {
  const broker = await prisma.broker.findUnique({ where: { id: body.brokerId } })
  if (!broker) throw new NotFoundError(`No existe un broker con ID ${body.brokerId}`)

  return prisma.portfolio.create({ data: body, include: { broker: true } })
}

export async function updatePortfolio(id: string, body: UpdatePortfolioBody) {
  await getPortfolioById(id)
  return prisma.portfolio.update({ where: { id }, data: body, include: { broker: true } })
}

export async function deletePortfolio(id: string) {
  await getPortfolioById(id)

  const hasPositions = await prisma.position.count({ where: { portfolioId: id } })
  if (hasPositions > 0) throw new ValidationError('No se puede eliminar una cartera con posiciones', [{ field: 'id', message: 'La cartera tiene posiciones asociadas' }])

  const hasDca = await prisma.dcaStrategy.count({ where: { portfolioId: id } })
  if (hasDca > 0) throw new ValidationError('No se puede eliminar una cartera con estrategias DCA', [{ field: 'id', message: 'La cartera tiene estrategias DCA asociadas' }])

  return prisma.portfolio.delete({ where: { id } })
}
