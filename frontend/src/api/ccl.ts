import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface CclRate {
  id: number
  date: string
  rate: number
  source: 'AMBITO' | 'MANUAL'
  created_at: string
}

export interface CclSyncResult {
  inserted: number
  skipped: number
}

// ── Query keys ─────────────────────────────────────────────────────────────

export const cclKeys = {
  all: ['ccl'] as const,
  list: () => [...cclKeys.all, 'list'] as const,
  byDate: (date: string) => [...cclKeys.all, 'date', date] as const,
  latest: () => [...cclKeys.all, 'latest'] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useCclRates() {
  return useQuery({
    queryKey: cclKeys.list(),
    queryFn: () => api.get<CclRate[]>('/ccl'),
  })
}

export function useCclByDate(date: string) {
  return useQuery({
    queryKey: cclKeys.byDate(date),
    queryFn: () => api.get<CclRate>(`/ccl/${date}`),
    enabled: !!date,
  })
}

export function useCclLatest() {
  return useQuery({
    queryKey: cclKeys.latest(),
    queryFn: () => api.get<CclRate>('/ccl/latest'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useSyncCcl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<CclSyncResult>('/ccl/sync', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: cclKeys.all }),
  })
}

export function useCreateManualCcl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { date: string; rate: number }) =>
      api.post<CclRate>('/ccl', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cclKeys.all }),
  })
}
