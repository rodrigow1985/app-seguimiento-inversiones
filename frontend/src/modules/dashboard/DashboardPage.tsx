import { AlertCircle, BarChart3, DollarSign, RefreshCcw, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useDashboard } from '@/api/dashboard'
import { useSyncPrices } from '@/api/prices'
import { useCurrencyStore } from '@/store/currency'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from './components/KpiCard'

// ── Skeleton loader ────────────────────────────────────────────────────────

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

// ── Section: Trading summary ───────────────────────────────────────────────

interface TradingSummaryProps {
  data: {
    open_positions: number
    total_invested_usd: number
    unrealized_pnl_usd: number
    unrealized_pnl_pct: number
    realized_pnl_usd: number
  }
}

function TradingSummary({ data }: TradingSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          Trading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">Posiciones abiertas</span>
          <span className="font-mono text-sm font-medium">{data.open_positions}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">Capital invertido</span>
          <span className="font-mono text-sm font-medium text-foreground">
            {formatCurrency(data.total_invested_usd, 'USD')}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">P&L no realizado</span>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm font-medium ${data.unrealized_pnl_usd >= 0 ? 'text-profit' : 'text-loss'}`}
            >
              {formatCurrency(data.unrealized_pnl_usd, 'USD')}
            </span>
            <Badge variant={data.unrealized_pnl_pct >= 0 ? 'profit' : 'loss'} className="text-[10px]">
              {formatPercent(data.unrealized_pnl_pct)}
            </Badge>
          </div>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-xs text-muted-foreground">P&L realizado</span>
          <span
            className={`font-mono text-sm font-medium ${data.realized_pnl_usd >= 0 ? 'text-profit' : 'text-loss'}`}
          >
            {formatCurrency(data.realized_pnl_usd, 'USD')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Section: DCA summary ───────────────────────────────────────────────────

interface DcaSummaryProps {
  data: {
    active_strategies: number
    total_invested_usd: number
    net_invested_usd: number
  }
}

function DcaSummary({ data }: DcaSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-primary" />
          DCA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">Estrategias activas</span>
          <span className="font-mono text-sm font-medium">{data.active_strategies}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">Total invertido</span>
          <span className="font-mono text-sm font-medium text-foreground">
            {formatCurrency(data.total_invested_usd, 'USD')}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-xs text-muted-foreground">Capital neto</span>
          <span
            className={`font-mono text-sm font-medium ${data.net_invested_usd >= 0 ? 'text-profit' : 'text-loss'}`}
          >
            {formatCurrency(data.net_invested_usd, 'USD')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard()
  const { currency } = useCurrencyStore()
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

  const capitalValue =
    currency === 'USD'
      ? formatCurrency(data?.capital.total_usd ?? 0, 'USD')
      : formatCurrency(data?.capital.total_ars ?? 0, 'ARS')

  const capitalSub =
    currency === 'USD'
      ? `ARS ${formatNumber(data?.capital.total_ars ?? 0, 0)}`
      : `USD ${formatNumber(data?.capital.total_usd ?? 0, 2)}`

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Dashboard</h1>
          {data && (
            <p className="text-xs text-muted-foreground mt-0.5">
              CCL hoy: ${formatNumber(data.ccl_today ?? data.capital.ccl_rate, 2)}
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

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} style={delay(i)} />
          ))
        ) : (
          <>
            <KpiCard
              label={`Capital ${currency}`}
              value={capitalValue}
              subValue={capitalSub}
              icon={Wallet}
              style={delay(0)}
            />
            <KpiCard
              label="P&L no realizado"
              value={formatCurrency(data!.trading.unrealized_pnl_usd, 'USD')}
              subValue="en posiciones abiertas"
              trend={data!.trading.unrealized_pnl_pct}
              icon={data!.trading.unrealized_pnl_usd >= 0 ? TrendingUp : TrendingDown}
              style={delay(1)}
            />
            <KpiCard
              label="P&L realizado"
              value={formatCurrency(data!.trading.realized_pnl_usd, 'USD')}
              subValue="operaciones cerradas"
              icon={DollarSign}
              style={delay(2)}
            />
            <KpiCard
              label="Posiciones abiertas"
              value={String(data!.trading.open_positions)}
              subValue={`${formatCurrency(data!.trading.total_invested_usd, 'USD')} invertidos`}
              icon={TrendingUp}
              linkTo="/trading"
              style={delay(3)}
            />
            <KpiCard
              label="DCA activos"
              value={String(data!.dca.active_strategies)}
              subValue={`${formatCurrency(data!.dca.net_invested_usd, 'USD')} neto`}
              icon={BarChart3}
              linkTo="/dca"
              style={delay(4)}
            />
            <KpiCard
              label="Capital DCA"
              value={formatCurrency(data!.dca.total_invested_usd, 'USD')}
              subValue="total acumulado"
              icon={BarChart3}
              style={delay(5)}
            />
          </>
        )}
      </div>

      {/* Summary cards */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TradingSummary data={data.trading} />
          <DcaSummary data={data.dca} />
        </div>
      )}
    </div>
  )
}
