import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useDcaStrategies, type DcaStrategy } from '@/api/dca'

interface StrategyPnl {
  strategy: DcaStrategy
  pnl: number
}

function computeStats(closed: DcaStrategy[]) {
  const strategyPnl: StrategyPnl[] = closed
    .map((s) => ({
      strategy: s,
      pnl: s.entries
        .filter((e) => e.type === 'CIERRE')
        .reduce((sum, e) => sum + Number(e.profitLossUsd ?? 0), 0),
    }))
    .filter((s) => s.pnl !== 0)

  if (strategyPnl.length === 0) return null

  const totalGanado = strategyPnl.reduce((sum, s) => sum + s.pnl, 0)
  const avgGain = totalGanado / strategyPnl.length
  const bestClose = strategyPnl.reduce((best, curr) => (curr.pnl > best.pnl ? curr : best))
  const worstClose = strategyPnl.reduce((worst, curr) => (curr.pnl < worst.pnl ? curr : worst))

  return { totalGanado, avgGain, bestClose, worstClose }
}

function StatCard({
  icon,
  label,
  value,
  sub,
  positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  positive?: boolean
}) {
  const valueColor =
    positive === true
      ? 'text-profit'
      : positive === false
        ? 'text-loss'
        : 'text-foreground'

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className={`font-mono font-bold text-base leading-tight ${valueColor}`}>{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DcaStatsBar() {
  const { data: closed = [], isLoading } = useDcaStrategies('CLOSED', 200)

  if (isLoading) return null

  const stats = computeStats(closed)
  if (!stats) return null

  const { totalGanado, avgGain, bestClose, worstClose } = stats

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Total ganado"
        value={formatCurrency(totalGanado, 'USD')}
        positive={totalGanado >= 0}
      />
      <StatCard
        icon={<TrendingDown className="h-4 w-4" />}
        label="Ganancia promedio"
        value={formatCurrency(avgGain, 'USD')}
        sub={`sobre ${closed.length} cierres`}
        positive={avgGain >= 0}
      />
      <StatCard
        icon={<Trophy className="h-4 w-4" />}
        label="Mejor cierre"
        value={formatCurrency(bestClose.pnl, 'USD')}
        sub={bestClose.strategy.name}
        positive={true}
      />
      <StatCard
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Peor cierre"
        value={formatCurrency(worstClose.pnl, 'USD')}
        sub={worstClose.strategy.name}
        positive={worstClose.pnl >= 0}
      />
    </div>
  )
}
