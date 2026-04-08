import {
  AlertCircle,
  BarChart3,
  DollarSign,
  RefreshCcw,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useDashboard } from '@/api/dashboard'
import { useSyncPrices } from '@/api/prices'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from './components/KpiCard'

// ── Skeleton ───────────────────────────────────────────────────────────────

function KpiSkeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <Card style={style} className="h-full">
      <div className="p-4 pb-2">
        <div className="h-3.5 w-24 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="h-7 w-3/4 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
        <div className="h-4 w-1/2 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
      </div>
    </Card>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard()
  const syncPrices = useSyncPrices()

  const delay = (i: number): React.CSSProperties => ({
    animationDelay: `${i * 60}ms`,
  })

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-loss opacity-60" />
        <div>
          <p className="text-sm font-medium text-foreground">Error al cargar el dashboard</p>
          <p className="text-xs text-muted-foreground mt-1">
            Verificá que el backend esté corriendo en el puerto 3001
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      </div>
    )
  }

  const totalInvestedUsd = parseFloat(data?.trading.totalInvestedUsd ?? '0')
  const totalDcaUsd = parseFloat(data?.dca.totalDcaCapitalUsd ?? '0')
  const cclRate = data?.latestCclRate?.rate
    ? parseFloat(data.latestCclRate.rate)
    : null

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Dashboard</h1>
          {cclRate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              CCL: ${formatNumber(cclRate, 2)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncPrices.mutate()}
          disabled={syncPrices.isPending}
          className="gap-1.5"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${syncPrices.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync precios</span>
        </Button>
      </div>

      {/* Sync feedback */}
      {syncPrices.isSuccess && syncPrices.data && (
        <div className="rounded-md border border-profit/30 bg-profit/10 px-4 py-2 text-sm text-profit font-mono">
          Precios actualizados: {syncPrices.data.updated} activos
          {syncPrices.data.failed.length > 0 && (
            <span className="text-warn"> · Fallaron: {syncPrices.data.failed.join(', ')}</span>
          )}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading || !data ? (
          Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} style={delay(i)} />
          ))
        ) : (
          <>
            <KpiCard
              label="Posiciones abiertas"
              value={String(data.trading.openPositionsCount)}
              subValue={`${data.trading.closedPositionsCount} cerradas`}
              icon={TrendingUp}
              linkTo="/trading"
              style={delay(0)}
            />
            <KpiCard
              label="Capital trading"
              value={formatCurrency(totalInvestedUsd, 'USD')}
              subValue="total invertido (compras)"
              icon={Wallet}
              style={delay(1)}
            />
            <KpiCard
              label="DCA activos"
              value={String(data.dca.activeDcaCount)}
              subValue="estrategias en curso"
              icon={BarChart3}
              linkTo="/dca"
              style={delay(2)}
            />
            <KpiCard
              label="Capital DCA"
              value={formatCurrency(totalDcaUsd, 'USD')}
              subValue="capital acumulado"
              icon={DollarSign}
              style={delay(3)}
            />
          </>
        )}
      </div>

      {/* Open positions detail */}
      {data && data.trading.openPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Posiciones abiertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.trading.openPositions.map((pos) => {
              const units = parseFloat(pos.openUnits)
              const avgCost = parseFloat(pos.avgCostUsd)
              const currentPrice = pos.currentPriceUsd ? parseFloat(pos.currentPriceUsd) : null
              const invested = units * avgCost
              const currentValue = currentPrice ? units * currentPrice : null
              const pnl = currentValue != null ? currentValue - invested : null
              const pnlPct = pnl != null && invested > 0 ? (pnl / invested) * 100 : null

              return (
                <div
                  key={pos.positionId}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm w-16">{pos.ticker}</span>
                    <span className="text-xs text-muted-foreground">{pos.portfolioName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">Invertido</p>
                      <p className="font-mono text-xs">{formatCurrency(invested, 'USD')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {pos.priceStale ? 'Sin precio' : 'P&L est.'}
                      </p>
                      <p
                        className={`font-mono text-xs font-medium ${
                          pnl == null ? 'text-muted-foreground' : pnl >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {pnl != null
                          ? `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl, 'USD')} (${formatNumber(pnlPct!, 1)}%)`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
