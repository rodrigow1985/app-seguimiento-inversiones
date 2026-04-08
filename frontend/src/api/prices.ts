import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AssetPrice {
  asset_id: number
  ticker: string
  price: number
  currency: 'ARS' | 'USD'
  source: string
  fetched_at: string
}

export interface SyncPricesResult {
  updated: number
  failed: string[]
}

// ── Query keys ─────────────────────────────────────────────────────────────

export const priceKeys = {
  all: ['prices'] as const,
  current: (assetId: number) => [...priceKeys.all, 'current', assetId] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useAssetPrice(assetId: number) {
  return useQuery({
    queryKey: priceKeys.current(assetId),
    queryFn: () => api.get<AssetPrice>(`/assets/${assetId}/price/current`),
    enabled: !!assetId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSyncPrices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<SyncPricesResult>('/prices/sync', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: priceKeys.all }),
  })
}
