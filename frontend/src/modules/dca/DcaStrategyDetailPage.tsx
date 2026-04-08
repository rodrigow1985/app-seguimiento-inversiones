import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import { useDcaStrategy, useDeleteStrategy, useCloseStrategy, useDeleteDcaEntry, type DcaEntry } from '@/api/dca'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AccumulationChart } from './components/AccumulationChart'
import { DcaEntryRow } from './components/DcaEntryRow'
import { AddDcaEntryDialog } from './components/AddDcaEntryDialog'
import { EditDcaEntryDialog } from './components/EditDcaEntryDialog'

export default function DcaStrategyDetailPage() {
  const { strategyId } = useParams<{ strategyId: string }>()
  const navigate = useNavigate()
  const id = Number(strategyId)

  const { data: strategy, isLoading, isError } = useDcaStrategy(id)
  const deleteStrategy = useDeleteStrategy()
  const closeStrategy = useCloseStrategy()
  const deleteEntry = useDeleteDcaEntry(id)

  const [addOpen, setAddOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<DcaEntry | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isError || !strategy) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-loss opacity-60" />
        <p className="text-sm text-muted-foreground">Estrategia no encontrada</p>
        <Link to="/dca"><Button variant="outline" size="sm">Volver</Button></Link>
      </div>
    )
  }

  const isActive = strategy.status === 'ACTIVE'
  const summary = strategy.summary

  const handleDelete = () => {
    if (!confirm('¿Eliminar esta estrategia y todas sus entradas?')) return
    deleteStrategy.mutate(id, { onSuccess: () => navigate('/dca') })
  }

  const handleClose = () => {
    if (!confirm('¿Cerrar esta estrategia DCA?')) return
    closeStrategy.mutate(id)
  }

  const handleDeleteEntry = (entry: DcaEntry) => {
    if (!confirm(`¿Eliminar entrada del ${formatDate(entry.date)}?`)) return
    deleteEntry.mutate(entry.id)
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/dca">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold">{strategy.asset.ticker}</h1>
            <Badge variant={isActive ? 'profit' : 'muted'}>{isActive ? 'ACTIVA' : 'CERRADA'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{strategy.name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {strategy.broker.name} · {strategy.portfolio.name} · Desde {formatDate(strategy.started_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && (
            <>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Entrada
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={closeStrategy.isPending}
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
            disabled={deleteStrategy.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Capital neto', value: formatCurrency(summary.net_invested_usd, 'USD'), accent: true },
            { label: 'Total invertido', value: formatCurrency(summary.total_invested_usd, 'USD') },
            { label: 'Total retirado', value: formatCurrency(summary.total_withdrawn_usd, 'USD') },
            { label: 'Entradas', value: String(summary.entry_count) },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className={`font-mono font-bold text-lg ${item.accent ? 'text-profit' : 'text-foreground'}`}>
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      {strategy.entries.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Capital acumulado en el tiempo</CardTitle></CardHeader>
          <CardContent>
            <AccumulationChart entries={strategy.entries} />
          </CardContent>
        </Card>
      )}

      {/* Entries table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de entradas</CardTitle>
            <span className="text-xs text-muted-foreground font-mono">
              {strategy.entries.length} entradas
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {strategy.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-sm text-muted-foreground">Sin entradas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto USD</TableHead>
                  <TableHead className="text-right">Monto ARS</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">CCL</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategy.entries.map((entry) => (
                  <DcaEntryRow
                    key={entry.id}
                    entry={entry}
                    onEdit={setEditEntry}
                    onDelete={handleDeleteEntry}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {strategy.notes && (
        <Card>
          <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{strategy.notes}</p>
          </CardContent>
        </Card>
      )}

      <AddDcaEntryDialog strategyId={id} open={addOpen} onOpenChange={setAddOpen} />
      <EditDcaEntryDialog
        strategyId={id}
        entry={editEntry}
        open={!!editEntry}
        onOpenChange={(o) => { if (!o) setEditEntry(null) }}
      />
    </div>
  )
}
