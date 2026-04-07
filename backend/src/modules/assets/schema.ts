import { z } from 'zod'

const AssetTypeEnum = z.enum(['CRYPTO', 'ACCION_ARG', 'CEDEAR', 'FCI', 'BONO', 'COMMODITY'])
const CurrencyEnum = z.enum(['ARS', 'USD'])
const PriceSourceEnum = z.enum(['COINGECKO', 'IOL', 'RAVA', 'MANUAL'])

export const listAssetsSchema = z.object({
  type: AssetTypeEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? true : v === 'true')),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
})

export const createAssetSchema = z.object({
  ticker: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  assetType: AssetTypeEnum,
  currencyNative: CurrencyEnum,
  priceSource: PriceSourceEnum,
  priceSourceId: z.string().max(100).optional(),
})

export const updateAssetSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    priceSourceId: z.string().max(100).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Se requiere al menos un campo para actualizar',
  })

export type ListAssetsQuery = z.infer<typeof listAssetsSchema>
export type CreateAssetBody = z.infer<typeof createAssetSchema>
export type UpdateAssetBody = z.infer<typeof updateAssetSchema>
