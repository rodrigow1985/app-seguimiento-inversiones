import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { DcaStrategy } from '@/api/dca'

interface DcaStrategyCardProps {
  strategy: DcaStrategy
}

export function DcaStrategyCard({ strategy }: DcaStrategyCardProps) {
  const isActive = strategy.isActive
  const { summary, entries } = strategy

  const cierreEntry = entries.findLast((e) => e.type === 'CIERRE')
  const pnl = summary.profit_loss_usd
  const hasPnl = cierreEntry !== undefined
  const pnlPositive = pnl > 0
  const pnlNegative = pnl < 0

  return (
    <Link to={`/dca/${strategy.id}`} className="block group">
      <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-base text-foreground">
                  {strategy.asset.ticker}
                </span>
                <Badge variant={isActive ? 'profit' : 'muted'} className="text-[10px]">
                  {isActive ? 'ACTIVA' : 'CERRADA'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{strategy.name}</p>
            </div>

            {/* P&L principal — solo si hay cierre */}
            {hasPnl && (
              <div className="text-right shrink-0">
                <p className={`font-mono font-bold text-sm ${pnlPositive ? 'text-profit' : pnlNegative ? 'text-loss' : 'text-foreground'}`}>
                  {pnl > 0 ? '+' : ''}{formatCurrency(pnl, 'USD')}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">P&amp;L cierre</p>
              </div>
            )}

            {/* Capital neto — solo si está activa */}
            {isActive && (
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-sm text-foreground">
                  {formatCurrency(summary.net_invested_usd, 'USD')}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">capital neto</p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Broker</p>
              <p className="text-xs font-medium mt-0.5 truncate">{strategy.broker.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entradas</p>
              <p className="text-xs font-mono font-medium mt-0.5">{summary.entry_count}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Invertido</p>
              <p className="text-xs font-mono font-medium mt-0.5">
                {formatCurrency(summary.total_invested_usd, 'USD')}
              </p>
            </div>
          </div>

          {/* Importe del cierre */}
          {cierreEntry && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">Cierre</span>
              <span className={`text-xs font-mono font-semibold ${pnlPositive ? 'text-profit' : pnlNegative ? 'text-loss' : 'text-foreground'}`}>
                {Number(cierreEntry.amountUsd) > 0 ? '+' : ''}{formatCurrency(Number(cierreEntry.amountUsd), 'USD')}
              </span>
            </div>
          )}

          {/* Footer sin cierre (activa) */}
          {!cierreEntry && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">{strategy.portfolio.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{strategy.asset.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
