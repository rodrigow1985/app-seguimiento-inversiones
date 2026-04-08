import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import type { Trade } from '@/api/trading'

interface TradeRowProps {
  trade: Trade
  onEdit: (trade: Trade) => void
  onDelete: (trade: Trade) => void
}

export function TradeRow({ trade, onEdit, onDelete }: TradeRowProps) {
  const isBuy = trade.type === 'BUY'

  return (
    <TableRow>
      <TableCell>
        <Badge variant={isBuy ? 'profit' : 'loss'} className="font-mono">
          {trade.type}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {formatDate(trade.date)}
      </TableCell>
      <TableCell className="font-mono text-sm text-right">
        {formatCurrency(trade.price, trade.currency)}
      </TableCell>
      <TableCell className="font-mono text-sm text-right">
        {formatNumber(trade.units, 4)}
      </TableCell>
      <TableCell className="font-mono text-sm text-right text-muted-foreground">
        {trade.commission > 0 ? formatCurrency(trade.commission, trade.currency) : '—'}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground text-right">
        {trade.ccl_rate ? `$${formatNumber(trade.ccl_rate, 2)}` : '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(trade)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-loss hover:bg-loss/10"
            onClick={() => onDelete(trade)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
