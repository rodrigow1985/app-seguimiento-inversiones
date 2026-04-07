import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
const CurrencyEnum = z.enum(['ARS', 'USD'])
const TradeTypeEnum = z.enum(['BUY', 'SELL'])

// ── Positions ──────────────────────────────────────────────────────────────────

export const listPositionsSchema = z.object({
  portfolioId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const createPositionSchema = z.object({
  portfolioId: z.string().uuid(),
  assetId: z.string().uuid(),
  brokerId: z.string().uuid(),
  openedAt: dateString,
  notes: z.string().max(500).optional(),
  // First BUY trade
  tradeDate: dateString,
  units: z.coerce.number().positive(),
  priceNative: z.coerce.number().positive(),
  currency: CurrencyEnum,
  commissionPct: z.coerce.number().min(0).max(100).optional(),
  tradeNotes: z.string().max(500).optional(),
})

// ── Trades ─────────────────────────────────────────────────────────────────────

export const addTradeSchema = z.object({
  type: TradeTypeEnum,
  tradeDate: dateString,
  units: z.coerce.number().positive(),
  priceNative: z.coerce.number().positive(),
  currency: CurrencyEnum,
  commissionPct: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
})

export const updateTradeSchema = z
  .object({
    tradeDate: dateString.optional(),
    units: z.coerce.number().positive().optional(),
    priceNative: z.coerce.number().positive().optional(),
    currency: CurrencyEnum.optional(),
    commissionPct: z.coerce.number().min(0).max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' })

export type ListPositionsQuery = z.infer<typeof listPositionsSchema>
export type CreatePositionBody = z.infer<typeof createPositionSchema>
export type AddTradeBody = z.infer<typeof addTradeSchema>
export type UpdateTradeBody = z.infer<typeof updateTradeSchema>
