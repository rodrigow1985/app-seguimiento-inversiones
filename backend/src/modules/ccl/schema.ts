import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')

export const listCclSchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
})

export const createCclSchema = z.object({
  date: dateString,
  rate: z.coerce.number().positive(),
})

export const updateCclSchema = z.object({
  rate: z.coerce.number().positive(),
})

export type ListCclQuery = z.infer<typeof listCclSchema>
export type CreateCclBody = z.infer<typeof createCclSchema>
export type UpdateCclBody = z.infer<typeof updateCclSchema>
