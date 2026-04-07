import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ValidationError } from '../../lib/errors'
import type { ListAssetsQuery, CreateAssetBody, UpdateAssetBody } from './schema'

export async function listAssets(query: ListAssetsQuery) {
  const { type, isActive, search, page, limit } = query
  const skip = (page - 1) * limit

  const where: Prisma.AssetWhereInput = {
    ...(type && { assetType: type }),
    isActive,
    ...(search && {
      OR: [
        { ticker: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [data, total] = await Promise.all([
    prisma.asset.findMany({ where, skip, take: limit, orderBy: { ticker: 'asc' } }),
    prisma.asset.count({ where }),
  ])

  return {
    data,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  }
}

export async function getAssetById(id: string) {
  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) throw new NotFoundError(`No existe un activo con ID ${id}`)
  return asset
}

export async function createAsset(body: CreateAssetBody) {
  const existing = await prisma.asset.findUnique({ where: { ticker: body.ticker.toUpperCase() } })
  if (existing) {
    throw new ValidationError('El ticker ya existe', [
      { field: 'ticker', message: `El ticker ${body.ticker} ya está registrado` },
    ])
  }

  return prisma.asset.create({
    data: {
      ...body,
      ticker: body.ticker.toUpperCase(),
    },
  })
}

export async function updateAsset(id: string, body: UpdateAssetBody) {
  await getAssetById(id)

  return prisma.asset.update({
    where: { id },
    data: body,
  })
}

export async function deleteAsset(id: string) {
  await getAssetById(id)

  return prisma.asset.update({
    where: { id },
    data: { isActive: false },
  })
}
