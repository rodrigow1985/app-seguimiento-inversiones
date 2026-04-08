import { useQuery } from '@tanstack/react-query'
import { api } from './client'

// ── Types — must match backend/src/modules/dashboard/service.ts ────────────

export interface DashboardOpenPosition {
  positionId: number
  ticker: string
  portfolioName: string
  openUnits: string
  avgCostUsd: string
  currentPriceUsd: string | null
  priceStale: boolean
}

export interface DashboardSummary {
  trading: {
    openPositionsCount: number
    closedPositionsCount: number
    totalInvestedUsd: string
    openPositions: DashboardOpenPosition[]
  }
  dca: {
    activeDcaCount: number
    totalDcaCapitalUsd: string
  }
  latestCclRate: { date: string; rate: string } | null
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
    staleTime: 1000 * 60 * 2,
  })
}
