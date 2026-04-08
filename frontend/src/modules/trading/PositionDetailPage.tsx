import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { usePosition, useDeletePosition, useDeleteTrade, useClosePosition, type Trade } from '@/api/trading'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PnlSummary } from './components/PnlSummary'
import { TradeRow } from './components/TradeRow'
import { AddTradeDialog } from './components/AddTradeDialog'
import { EditTradeDialog } from './components/EditTradeDialog'
import { formatDate } from '@/lib/utils'

export default function PositionDetailPage() {
  const { positionId } = useParams<{ positionId: string }>()
  const navigate = useNavigate()
  const id = Number(positionId)

  const { data: position, isLoading, isError } = usePosition(id)
  const deletePosition = useDeletePosition()
  const deleteTrade = useDeleteTrade(id)
  const closePosition = useClosePosition()

  const [addTradeOpen, setAddTradeOpen] = useState(false)
  const [editTrade, setEditTrade] = useState<Trade | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isError || !position) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-loss opacity-60" />
        <p className="text-sm text-muted-foreground">Posición no encontrada</p>
        <Link to="/trading">
          <Button variant="outline" size="sm">Volver</Button>
        </Link>
      </div>
    )
  }

  const isOpen = position.status === 'OPEN'

  const handleDelete = () => {
    if (!confirm('¿Eliminar esta posición y todos sus trades?')) return
    deletePosition.mutate(id, { onSuccess: () => navigate('/trading') })
  }

  const handleDeleteTrade = (trade: Trade) => {
    if (!confirm(`¿Eliminar el trade del ${formatDate(trade.date)}?`)) return
    deleteTrade.mutate(trade.id)
  }

  const handleClose = () => {
    if (!confirm('¿Cerrar esta posición?')) return
    closePosition.mutate(id)
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/trading">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold">{position.asset.ticker}</h1>
            <Badge variant={isOpen ? 'profit' : 'muted'}>{isOpen ? 'ABIERTA' : 'CERRADA'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {position.asset.name} · {position.broker.name} · {position.portfolio.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Abierta {formatDate(position.opened_at)}
            {position.closed_at && ` · Cerrada ${formatDate(position.closed_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOpen && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddTradeOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Trade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={closePosition.isPending}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Cerrar
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-loss hover:bg-loss/10"
            onClick={handleDelete}
            disabled={deletePosition.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* P&L Summary */}
      <PnlSummary position={position} />

      {/* Trades table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ChevronDown className="h-3.5 w-3.5 text-primary" />
              Historial de trades
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono">
              {position.trades.length} operaciones
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {position.trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-muted-foreground">Sin trades registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="text-right">CCL</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {position.trades.map((trade) => (
                  <TradeRow
                    key={trade.id}
                    trade={trade}
                    onEdit={setEditTrade}
                    onDelete={handleDeleteTrade}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {position.notes && (
        <Card>
          <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{position.notes}</p>
          </CardContent>
        </Card>
      )}

      <AddTradeDialog
        positionId={id}
        open={addTradeOpen}
        onOpenChange={setAddTradeOpen}
      />
      <EditTradeDialog
        positionId={id}
        trade={editTrade}
        open={!!editTrade}
        onOpenChange={(o) => { if (!o) setEditTrade(null) }}
      />
    </div>
  )
}
