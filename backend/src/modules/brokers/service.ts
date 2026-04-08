import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ValidationError } from '../../lib/errors'
import type { ListBrokersQuery, CreateBrokerBody, UpdateBrokerBody } from './schema'

export async function listBrokers(query: ListBrokersQuery) {
  const { page, limit } = query
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.broker.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.broker.count(),
  ])

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function getBrokerById(id: string) {
  const broker = await prisma.broker.findUnique({ where: { id } })
  if (!broker) throw new NotFoundError(`No existe un broker con ID ${id}`)
  return broker
}

export async function createBroker(body: CreateBrokerBody) {
  const existing = await prisma.broker.findUnique({ where: { name: body.name } })
  if (existing) {
    throw new ValidationError('El nombre ya existe', [
      { field: 'name', message: `El broker "${body.name}" ya está registrado` },
    ])
  }

  return prisma.broker.create({
    data: {
      ...body,
      config: body.config as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function updateBroker(id: string, body: UpdateBrokerBody) {
  await getBrokerById(id)
  return prisma.broker.update({
    where: { id },
    data: {
      ...body,
      config: body.config as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function deleteBroker(id: string) {
  await getBrokerById(id)

  const hasPositions = await prisma.position.count({ where: { brokerId: id } })
  if (hasPositions > 0) {
    throw new ValidationError('No se puede eliminar un broker con posiciones asociadas', [
      { field: 'id', message: 'El broker tiene posiciones o trades existentes' },
    ])
  }

  return prisma.broker.delete({ where: { id } })
}
