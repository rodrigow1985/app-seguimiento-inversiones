import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
const CurrencyEnum = z.enum(['ARS', 'USD'])
const DcaEntryTypeEnum = z.enum(['APERTURA', 'INCREMENTO', 'CIERRE'])

// ── Strategies ─────────────────────────────────────────────────────────────────

export const listStrategiesSchema = z.object({
  portfolioId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  isActive: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const createStrategySchema = z.object({
  portfolioId: z.string().uuid(),
  assetId: z.string().uuid(),
  brokerId: z.string().uuid(),
  name: z.string().min(1).max(100),
  startedAt: dateString,
  notes: z.string().max(500).optional(),
})

export const updateStrategySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' })

// ── Entries ────────────────────────────────────────────────────────────────────

export const listEntriesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const createEntrySchema = z.object({
  type: DcaEntryTypeEnum,
  entryDate: dateString,
  amountUsd: z.coerce.number().positive(),
  amountArs: z.coerce.number().positive().optional(),
  assetPriceAtEntry: z.coerce.number().positive().optional(),
  unitsReceived: z.coerce.number().positive().optional(),
  profitLossUsd: z.coerce.number().optional(),
  notes: z.string().max(500).optional(),
  currency: CurrencyEnum.optional(),
})

export const updateEntrySchema = z
  .object({
    entryDate: dateString.optional(),
    amountUsd: z.coerce.number().positive().optional(),
    amountArs: z.coerce.number().positive().optional(),
    assetPriceAtEntry: z.coerce.number().positive().optional(),
    unitsReceived: z.coerce.number().positive().optional(),
    profitLossUsd: z.coerce.number().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' })

export type ListStrategiesQuery = z.infer<typeof listStrategiesSchema>
export type CreateStrategyBody = z.infer<typeof createStrategySchema>
export type UpdateStrategyBody = z.infer<typeof updateStrategySchema>
export type ListEntriesQuery = z.infer<typeof listEntriesSchema>
export type CreateEntryBody = z.infer<typeof createEntrySchema>
export type UpdateEntryBody = z.infer<typeof updateEntrySchema>
