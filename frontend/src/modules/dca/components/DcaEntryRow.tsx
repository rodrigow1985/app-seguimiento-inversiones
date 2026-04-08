import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import type { DcaEntry } from '@/api/dca'

const ENTRY_VARIANT: Record<DcaEntry['type'], 'profit' | 'loss' | 'warn'> = {
  APERTURA: 'warn',
  INCREMENTO: 'profit',
  CIERRE: 'loss',
}

interface DcaEntryRowProps {
  entry: DcaEntry
  onEdit: (entry: DcaEntry) => void
  onDelete: (entry: DcaEntry) => void
}

export function DcaEntryRow({ entry, onEdit, onDelete }: DcaEntryRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant={ENTRY_VARIANT[entry.type]} className="font-mono text-[10px]">
          {entry.type}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {formatDate(entry.date)}
      </TableCell>
      <TableCell className="font-mono text-sm text-right font-medium">
        {formatCurrency(entry.amount_usd, 'USD')}
      </TableCell>
      <TableCell className="font-mono text-xs text-right text-muted-foreground">
        {entry.amount_ars != null ? formatCurrency(entry.amount_ars, 'ARS') : '—'}
      </TableCell>
      <TableCell className="font-mono text-xs text-right text-muted-foreground">
        {entry.asset_price != null ? formatNumber(entry.asset_price, 4) : '—'}
      </TableCell>
      <TableCell className="font-mono text-xs text-right text-muted-foreground">
        {entry.ccl_rate != null ? `$${formatNumber(entry.ccl_rate, 2)}` : '—'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(entry)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-loss hover:bg-loss/10"
            onClick={() => onDelete(entry)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
