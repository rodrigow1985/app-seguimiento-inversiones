import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import type { Position } from '@/api/trading'

interface PnlSummaryProps {
  position: Position
}

export function PnlSummary({ position }: PnlSummaryProps) {
  const pnl = position.pnl
  if (!pnl) return null

  const isProfit = (pnl.unrealized_pnl_usd ?? 0) >= 0
  const isRealizedProfit = pnl.realized_pnl_usd >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen P&L</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Costo promedio</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {formatCurrency(pnl.avg_cost_usd, 'USD')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Precio actual</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {pnl.current_price_usd != null
                ? formatCurrency(pnl.current_price_usd, 'USD')
                : '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Unidades</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {formatNumber(pnl.total_units, 4)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Capital invertido</p>
            <p className="font-mono text-sm font-semibold text-foreground">
              {formatCurrency(pnl.total_invested_usd, 'USD')}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
          {position.status === 'OPEN' && pnl.unrealized_pnl_usd != null && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">P&L no realizado</p>
                <p className={`font-mono text-lg font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                  {formatCurrency(pnl.unrealized_pnl_usd, 'USD')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {isProfit ? (
                  <TrendingUp className="h-5 w-5 text-profit" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-loss" />
                )}
                {pnl.unrealized_pnl_pct != null && (
                  <Badge variant={isProfit ? 'profit' : 'loss'}>
                    {formatPercent(pnl.unrealized_pnl_pct)}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">P&L realizado</p>
              <p className={`font-mono text-lg font-bold ${isRealizedProfit ? 'text-profit' : 'text-loss'}`}>
                {formatCurrency(pnl.realized_pnl_usd, 'USD')}
              </p>
            </div>
            {isRealizedProfit ? (
              <TrendingUp className="h-5 w-5 text-profit" />
            ) : (
              <TrendingDown className="h-5 w-5 text-loss" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
