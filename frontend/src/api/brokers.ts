import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Broker {
  id: number
  name: string
  commission_pct: number
  currency: 'ARS' | 'USD'
  active: boolean
  created_at: string
}

export interface CreateBrokerInput {
  name: string
  commission_pct: number
  currency: 'ARS' | 'USD'
}

export type UpdateBrokerInput = Partial<CreateBrokerInput> & { active?: boolean }

// ── Query keys ─────────────────────────────────────────────────────────────

export const brokerKeys = {
  all: ['brokers'] as const,
  list: () => [...brokerKeys.all, 'list'] as const,
  detail: (id: number) => [...brokerKeys.all, 'detail', id] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useBrokers() {
  return useQuery({
    queryKey: brokerKeys.list(),
    queryFn: () => api.get<Broker[]>('/brokers'),
  })
}

export function useBroker(id: number) {
  return useQuery({
    queryKey: brokerKeys.detail(id),
    queryFn: () => api.get<Broker>(`/brokers/${id}`),
    enabled: !!id,
  })
}

export function useCreateBroker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBrokerInput) => api.post<Broker>('/brokers', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: brokerKeys.list() }),
  })
}

export function useUpdateBroker(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateBrokerInput) => api.patch<Broker>(`/brokers/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: brokerKeys.list() })
      qc.invalidateQueries({ queryKey: brokerKeys.detail(id) })
    },
  })
}

export function useDeleteBroker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/brokers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: brokerKeys.list() }),
  })
}
