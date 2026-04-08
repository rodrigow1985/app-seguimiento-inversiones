import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Trade {
  id: number
  position_id: number
  type: 'BUY' | 'SELL'
  date: string
  price: number
  units: number
  commission: number
  currency: 'ARS' | 'USD'
  ccl_rate: number | null
  notes: string | null
  created_at: string
}

export interface Position {
  id: number
  portfolio_id: number
  asset_id: number
  broker_id: number
  status: 'OPEN' | 'CLOSED'
  opened_at: string
  closed_at: string | null
  notes: string | null
  created_at: string
  asset: { ticker: string; name: string; currency: 'ARS' | 'USD' }
  broker: { name: string }
  portfolio: { name: string }
  trades: Trade[]
  pnl?: {
    avg_cost_usd: number
    current_price_usd: number | null
    unrealized_pnl_usd: number | null
    unrealized_pnl_pct: number | null
    realized_pnl_usd: number
    total_units: number
    total_invested_usd: number
  }
}

export interface CreatePositionInput {
  portfolio_id: number
  asset_id: number
  broker_id: number
  notes?: string
  first_trade: {
    date: string
    price: number
    units: number
    commission?: number
    currency: 'ARS' | 'USD'
    ccl_rate?: number
  }
}

export interface CreateTradeInput {
  type: 'BUY' | 'SELL'
  date: string
  price: number
  units: number
  commission?: number
  currency: 'ARS' | 'USD'
  ccl_rate?: number
  notes?: string
}

export type UpdateTradeInput = Partial<Omit<CreateTradeInput, 'type'>>

// ── Query keys ─────────────────────────────────────────────────────────────

export const tradingKeys = {
  all: ['trading'] as const,
  positions: () => [...tradingKeys.all, 'positions'] as const,
  positionsByStatus: (status?: 'OPEN' | 'CLOSED') =>
    [...tradingKeys.positions(), { status }] as const,
  position: (id: number) => [...tradingKeys.all, 'position', id] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function usePositions(status?: 'OPEN' | 'CLOSED') {
  const params = status ? `?status=${status}` : ''
  return useQuery({
    queryKey: tradingKeys.positionsByStatus(status),
    queryFn: () => api.get<Position[]>(`/trading/positions${params}`),
  })
}

export function usePosition(id: number) {
  return useQuery({
    queryKey: tradingKeys.position(id),
    queryFn: () => api.get<Position>(`/trading/positions/${id}`),
    enabled: !!id,
  })
}

export function useCreatePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePositionInput) =>
      api.post<Position>('/trading/positions', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tradingKeys.positions() }),
  })
}

export function useClosePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.patch<Position>(`/trading/positions/${id}/close`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: tradingKeys.positions() }),
  })
}

export function useDeletePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/trading/positions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: tradingKeys.positions() }),
  })
}

export function useAddTrade(positionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTradeInput) =>
      api.post<Trade>(`/trading/positions/${positionId}/trades`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradingKeys.position(positionId) })
      qc.invalidateQueries({ queryKey: tradingKeys.positions() })
    },
  })
}

export function useUpdateTrade(positionId: number, tradeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateTradeInput) =>
      api.patch<Trade>(`/trading/positions/${positionId}/trades/${tradeId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: tradingKeys.position(positionId) }),
  })
}

export function useDeleteTrade(positionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tradeId: number) =>
      api.delete<void>(`/trading/positions/${positionId}/trades/${tradeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tradingKeys.position(positionId) })
      qc.invalidateQueries({ queryKey: tradingKeys.positions() })
    },
  })
}
