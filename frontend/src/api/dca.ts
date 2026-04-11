import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface DcaEntry {
  id: string
  strategyId: string
  type: 'APERTURA' | 'INCREMENTO' | 'CIERRE'
  entryDate: string
  amountUsd: number
  amountArs: number | null
  assetPriceAtEntry: number | null
  unitsReceived: number | null
  profitLossUsd: number | null
  cclRate: { rate: number } | null
  notes: string | null
  createdAt: string
}

export interface DcaStrategy {
  id: string
  name: string
  isActive: boolean
  startedAt: string
  notes: string | null
  createdAt: string
  asset: { ticker: string; name: string; currencyNative: 'ARS' | 'USD' }
  broker: { name: string }
  portfolio: { name: string }
  entries: DcaEntry[]
  summary: {
    total_invested_usd: number
    profit_loss_usd: number
    net_invested_usd: number
    entry_count: number
  }
}

export interface CreateStrategyInput {
  portfolioId: string
  assetId: string
  brokerId: string
  name: string
  startedAt: string
  notes?: string
}

export interface CreateDcaEntryInput {
  type: DcaEntry['type']
  entryDate: string
  amountUsd: number
  amountArs?: number
  assetPriceAtEntry?: number
  unitsReceived?: number
  profitLossUsd?: number
  notes?: string
}

export type UpdateDcaEntryInput = Partial<Omit<CreateDcaEntryInput, 'type'>>

// ── Query keys ─────────────────────────────────────────────────────────────

export const dcaKeys = {
  all: ['dca'] as const,
  strategies: () => [...dcaKeys.all, 'strategies'] as const,
  strategiesByStatus: (status?: 'ACTIVE' | 'CLOSED') =>
    [...dcaKeys.strategies(), { status }] as const,
  strategy: (id: string) => [...dcaKeys.all, 'strategy', id] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useDcaStrategies(status?: 'ACTIVE' | 'CLOSED', limit = 50) {
  const params = new URLSearchParams()
  if (status !== undefined) params.set('isActive', status === 'ACTIVE' ? 'true' : 'false')
  if (limit !== 50) params.set('limit', String(limit))
  const qs = params.size > 0 ? `?${params}` : ''
  return useQuery({
    queryKey: dcaKeys.strategiesByStatus(status),
    queryFn: () => api.get<DcaStrategy[]>(`/dca/strategies${qs}`),
  })
}

export function useDcaStrategy(id: string) {
  return useQuery({
    queryKey: dcaKeys.strategy(id),
    queryFn: () => api.get<DcaStrategy>(`/dca/strategies/${id}`),
    enabled: !!id,
  })
}

export function useCreateStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStrategyInput) =>
      api.post<DcaStrategy>('/dca/strategies', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategies() }),
  })
}

export function useCloseStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<DcaStrategy>(`/dca/strategies/${id}/close`, {}),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: dcaKeys.strategies() })
      qc.invalidateQueries({ queryKey: dcaKeys.strategy(id) })
    },
  })
}

export function useDeleteStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/dca/strategies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategies() }),
  })
}

export function useAddDcaEntry(strategyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDcaEntryInput) =>
      api.post<DcaEntry>(`/dca/strategies/${strategyId}/entries`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategy(strategyId) }),
  })
}

export function useUpdateDcaEntry(strategyId: string, entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateDcaEntryInput) =>
      api.patch<DcaEntry>(`/dca/strategies/${strategyId}/entries/${entryId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategy(strategyId) }),
  })
}

export function useDeleteDcaEntry(strategyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) =>
      api.delete<void>(`/dca/strategies/${strategyId}/entries/${entryId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategy(strategyId) }),
  })
}
