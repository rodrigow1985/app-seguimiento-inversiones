import { z } from 'zod'

const CurrencyEnum = z.enum(['ARS', 'USD'])
const PortfolioTypeEnum = z.enum(['TRADING', 'DCA'])
const PortfolioStrategyEnum = z.enum(['CORTO_PLAZO', 'LARGO_PLAZO', 'JUBILACION'])

export const listPortfoliosSchema = z.object({
  isActive: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  type: PortfolioTypeEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  portfolioType: PortfolioTypeEnum,
  strategy: PortfolioStrategyEnum,
  currencyBase: CurrencyEnum,
  brokerId: z.string().uuid(),
  description: z.string().max(300).optional(),
})

export const updatePortfolioSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(300).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' })

export type ListPortfoliosQuery = z.infer<typeof listPortfoliosSchema>
export type CreatePortfolioBody = z.infer<typeof createPortfolioSchema>
export type UpdatePortfolioBody = z.infer<typeof updatePortfolioSchema>
