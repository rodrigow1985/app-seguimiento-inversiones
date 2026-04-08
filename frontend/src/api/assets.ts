import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Asset {
  id: number
  ticker: string
  name: string
  type: 'ACCION' | 'CEDEAR' | 'CRYPTO' | 'FCI' | 'BONO' | 'OTRO'
  currency: 'ARS' | 'USD'
  price_source: 'IOL' | 'COINGECKO' | 'MANUAL' | null
  coingecko_id: string | null
  iol_symbol: string | null
  active: boolean
  created_at: string
}

export interface CreateAssetInput {
  ticker: string
  name: string
  type: Asset['type']
  currency: Asset['currency']
  price_source?: Asset['price_source']
  coingecko_id?: string
  iol_symbol?: string
}

export type UpdateAssetInput = Partial<CreateAssetInput> & { active?: boolean }

// ── Query keys ─────────────────────────────────────────────────────────────

export const assetKeys = {
  all: ['assets'] as const,
  list: () => [...assetKeys.all, 'list'] as const,
  detail: (id: number) => [...assetKeys.all, 'detail', id] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useAssets() {
  return useQuery({
    queryKey: assetKeys.list(),
    queryFn: () => api.get<Asset[]>('/assets'),
  })
}

export function useAsset(id: number) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => api.get<Asset>(`/assets/${id}`),
    enabled: !!id,
  })
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAssetInput) => api.post<Asset>('/assets', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.list() }),
  })
}

export function useUpdateAsset(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAssetInput) => api.patch<Asset>(`/assets/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.list() })
      qc.invalidateQueries({ queryKey: assetKeys.detail(id) })
    },
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/assets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.list() }),
  })
}
