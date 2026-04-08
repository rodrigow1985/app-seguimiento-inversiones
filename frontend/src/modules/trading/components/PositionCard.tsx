import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import type { Position } from '@/api/trading'

interface PositionCardProps {
  position: Position
}

export function PositionCard({ position }: PositionCardProps) {
  const pnl = position.pnl
  const isOpen = position.status === 'OPEN'
  const pnlValue = isOpen ? (pnl?.unrealized_pnl_usd ?? null) : (pnl?.realized_pnl_usd ?? null)
  const pnlPct = isOpen ? (pnl?.unrealized_pnl_pct ?? null) : null
  const isPositive = pnlValue != null && pnlValue >= 0

  return (
    <Link to={`/trading/${position.id}`} className="block group">
      <Card className="h-full transition-all duration-200 group-hover:border-primary/40 group-hover:bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-base text-foreground">
                  {position.asset.ticker}
                </span>
                <Badge variant={isOpen ? 'profit' : 'muted'} className="text-[10px]">
                  {isOpen ? 'ABIERTA' : 'CERRADA'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {position.asset.name}
              </p>
            </div>
            {pnlValue != null && (
              <div className="text-right shrink-0">
                <p className={`font-mono font-bold text-sm ${isPositive ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(pnlValue, 'USD')}
                </p>
                {pnlPct != null && (
                  <Badge variant={isPositive ? 'profit' : 'loss'} className="text-[10px] mt-0.5">
                    {isPositive ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                    {formatPercent(pnlPct)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Broker</p>
              <p className="text-xs font-medium mt-0.5 truncate">{position.broker.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trades</p>
              <p className="text-xs font-mono font-medium mt-0.5">{position.trades.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unidades</p>
              <p className="text-xs font-mono font-medium mt-0.5">
                {pnl ? formatNumber(pnl.total_units, 2) : '—'}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              {position.portfolio.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Invertido: {pnl ? formatCurrency(pnl.total_invested_usd, 'USD') : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
