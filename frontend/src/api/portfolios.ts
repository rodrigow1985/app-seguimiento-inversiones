import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Portfolio {
  id: number
  name: string
  type: 'TRADING' | 'DCA' | 'MIXTO'
  description: string | null
  active: boolean
  created_at: string
}

export interface CreatePortfolioInput {
  name: string
  type: Portfolio['type']
  description?: string
}

export type UpdatePortfolioInput = Partial<CreatePortfolioInput> & { active?: boolean }

// ── Query keys ─────────────────────────────────────────────────────────────

export const portfolioKeys = {
  all: ['portfolios'] as const,
  list: () => [...portfolioKeys.all, 'list'] as const,
  detail: (id: number) => [...portfolioKeys.all, 'detail', id] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function usePortfolios() {
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: () => api.get<Portfolio[]>('/portfolios'),
  })
}

export function usePortfolio(id: number) {
  return useQuery({
    queryKey: portfolioKeys.detail(id),
    queryFn: () => api.get<Portfolio>(`/portfolios/${id}`),
    enabled: !!id,
  })
}

export function useCreatePortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePortfolioInput) => api.post<Portfolio>('/portfolios', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.list() }),
  })
}

export function useUpdatePortfolio(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdatePortfolioInput) => api.patch<Portfolio>(`/portfolios/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: portfolioKeys.list() })
      qc.invalidateQueries({ queryKey: portfolioKeys.detail(id) })
    },
  })
}

export function useDeletePortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/portfolios/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.list() }),
  })
}
