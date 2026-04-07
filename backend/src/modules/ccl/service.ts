import { prisma } from '../../lib/prisma'
import { NotFoundError, ValidationError } from '../../lib/errors'
import type { ListCclQuery, CreateCclBody, UpdateCclBody } from './schema'
import type { AmbitoCclResponse } from '../../external/ambito-ccl'

export async function listCcl(query: ListCclQuery) {
  const { from, to, page, limit } = query
  const skip = (page - 1) * limit

  const where = {
    ...(from && { date: { gte: new Date(from) } }),
    ...(to && { date: { lte: new Date(to) } }),
    ...(from && to && { date: { gte: new Date(from), lte: new Date(to) } }),
  }

  const [data, total] = await Promise.all([
    prisma.cclRate.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.cclRate.count({ where }),
  ])

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export async function getCclByDate(dateStr: string) {
  // Fallback: closest previous business day
  const date = new Date(dateStr)
  const rate = await prisma.cclRate.findFirst({
    where: { date: { lte: date } },
    orderBy: { date: 'desc' },
  })
  if (!rate) throw new NotFoundError(`No hay CCL disponible para la fecha ${dateStr} ni para días anteriores`)
  return rate
}

export async function createCcl(body: CreateCclBody) {
  const date = new Date(body.date)

  const existing = await prisma.cclRate.findUnique({ where: { date } })
  if (existing) {
    throw new ValidationError('Ya existe un CCL para esa fecha', [
      { field: 'date', message: `Ya hay un registro para ${body.date}` },
    ])
  }

  return prisma.cclRate.create({
    data: { date, rate: body.rate, source: 'MANUAL' },
  })
}

export async function updateCcl(dateStr: string, body: UpdateCclBody) {
  const date = new Date(dateStr)
  const existing = await prisma.cclRate.findUnique({ where: { date } })
  if (!existing) throw new NotFoundError(`No existe un CCL para la fecha ${dateStr}`)

  return prisma.cclRate.update({
    where: { date },
    data: { rate: body.rate, source: 'MANUAL' },
  })
}

// Sincronización desde fuente externa (insert-only: ignora fechas ya existentes)
export async function syncCcl(
  fetcher: () => Promise<AmbitoCclResponse[]> = () =>
    import('../../external/ambito-ccl').then((m) => m.fetchAmbitoCcl()),
): Promise<{ inserted: number; skipped: number }> {
  const rows = await fetcher()

  let inserted = 0
  let skipped = 0

  for (const row of rows) {
    const [day, month, year] = row.fecha.split('/')
    const date = new Date(`${year}-${month}-${day}`)
    const rate = parseFloat(row.venta.replace(',', '.'))

    if (isNaN(rate) || rate <= 0) { skipped++; continue }

    const exists = await prisma.cclRate.findUnique({ where: { date } })
    if (exists) { skipped++; continue }

    await prisma.cclRate.create({ data: { date, rate, source: 'AMBITO' } })
    inserted++
  }

  return { inserted, skipped }
}
