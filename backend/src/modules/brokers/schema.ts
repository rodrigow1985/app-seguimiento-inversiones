import { z } from 'zod'

const CurrencyEnum = z.enum(['ARS', 'USD'])

export const listBrokersSchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const createBrokerSchema = z.object({
  name: z.string().min(1).max(50),
  commissionPct: z.coerce.number().min(0).max(100),
  currency: CurrencyEnum,
  config: z.record(z.unknown()).optional(),
})

export const updateBrokerSchema = z
  .object({
    commissionPct: z.coerce.number().min(0).max(100).optional(),
    config: z.record(z.unknown()).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' })

export type ListBrokersQuery = z.infer<typeof listBrokersSchema>
export type CreateBrokerBody = z.infer<typeof createBrokerSchema>
export type UpdateBrokerBody = z.infer<typeof updateBrokerSchema>
