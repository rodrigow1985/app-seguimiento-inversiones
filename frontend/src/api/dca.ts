import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface DcaEntry {
  id: number
  strategy_id: number
  type: 'APERTURA' | 'INCREMENTO' | 'CIERRE'
  date: string
  amount_usd: number
  amount_ars: number | null
  asset_price: number | null
  ccl_rate: number | null
  notes: string | null
  created_at: string
}

export interface DcaStrategy {
  id: number
  portfolio_id: number
  asset_id: number
  broker_id: number
  name: string
  status: 'ACTIVE' | 'CLOSED'
  started_at: string
  closed_at: string | null
  notes: string | null
  created_at: string
  asset: { ticker: string; name: string; currency: 'ARS' | 'USD' }
  broker: { name: string }
  portfolio: { name: string }
  entries: DcaEntry[]
  summary?: {
    total_invested_usd: number
    total_withdrawn_usd: number
    net_invested_usd: number
    entry_count: number
  }
}

export interface CreateStrategyInput {
  portfolio_id: number
  asset_id: number
  broker_id: number
  name: string
  started_at: string
  notes?: string
}

export interface CreateDcaEntryInput {
  type: DcaEntry['type']
  date: string
  amount_usd: number
  amount_ars?: number
  asset_price?: number
  ccl_rate?: number
  notes?: string
}

export type UpdateDcaEntryInput = Partial<Omit<CreateDcaEntryInput, 'type'>>

// ── Query keys ─────────────────────────────────────────────────────────────

export const dcaKeys = {
  all: ['dca'] as const,
  strategies: () => [...dcaKeys.all, 'strategies'] as const,
  strategiesByStatus: (status?: 'ACTIVE' | 'CLOSED') =>
    [...dcaKeys.strategies(), { status }] as const,
  strategy: (id: number) => [...dcaKeys.all, 'strategy', id] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useDcaStrategies(status?: 'ACTIVE' | 'CLOSED') {
  const params = status ? `?status=${status}` : ''
  return useQuery({
    queryKey: dcaKeys.strategiesByStatus(status),
    queryFn: () => api.get<DcaStrategy[]>(`/dca/strategies${params}`),
  })
}

export function useDcaStrategy(id: number) {
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
    mutationFn: (id: number) =>
      api.patch<DcaStrategy>(`/dca/strategies/${id}/close`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategies() }),
  })
}

export function useDeleteStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/dca/strategies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategies() }),
  })
}

export function useAddDcaEntry(strategyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDcaEntryInput) =>
      api.post<DcaEntry>(`/dca/strategies/${strategyId}/entries`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategy(strategyId) }),
  })
}

export function useUpdateDcaEntry(strategyId: number, entryId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateDcaEntryInput) =>
      api.patch<DcaEntry>(`/dca/strategies/${strategyId}/entries/${entryId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategy(strategyId) }),
  })
}

export function useDeleteDcaEntry(strategyId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: number) =>
      api.delete<void>(`/dca/strategies/${strategyId}/entries/${entryId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: dcaKeys.strategy(strategyId) }),
  })
}
