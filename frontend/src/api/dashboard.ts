import { useQuery } from '@tanstack/react-query'
import { api } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  capital: {
    total_usd: number
    total_ars: number
    ccl_rate: number
  }
  trading: {
    open_positions: number
    total_invested_usd: number
    unrealized_pnl_usd: number
    unrealized_pnl_pct: number
    realized_pnl_usd: number
  }
  dca: {
    active_strategies: number
    total_invested_usd: number
    net_invested_usd: number
  }
  ccl_today: number | null
}

// ── Query keys ─────────────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => api.get<DashboardSummary>('/dashboard'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
