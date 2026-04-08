import { useState } from 'react'
import { Plus, RefreshCcw } from 'lucide-react'
import { useCclRates, useSyncCcl } from '@/api/ccl'
import { useSyncPrices } from '@/api/prices'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatNumber } from '@/lib/utils'
import { ManualCclDialog } from './components/ManualCclDialog'

export default function CclPage() {
  const [manualOpen, setManualOpen] = useState(false)
  const { data: rates = [], isLoading } = useCclRates()
  const syncCcl = useSyncCcl()
  const syncPrices = useSyncPrices()

  const sorted = [...rates].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">CCL & Precios</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rates.length} registros históricos
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncCcl.mutate()}
            disabled={syncCcl.isPending}
            className="gap-1.5"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${syncCcl.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync CCL</span>
          </Button>
          <Button size="sm" onClick={() => setManualOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Manual</span>
          </Button>
        </div>
      </div>

      {/* Sync feedback */}
      {syncCcl.isSuccess && syncCcl.data && (
        <div className="rounded-md border border-profit/30 bg-profit/10 px-4 py-2 text-sm text-profit font-mono">
          Sync completado: {syncCcl.data.inserted} nuevos, {syncCcl.data.skipped} ya existentes
        </div>
      )}
      {syncPrices.isSuccess && syncPrices.data && (
        <div className="rounded-md border border-profit/30 bg-profit/10 px-4 py-2 text-sm text-profit font-mono">
          Precios actualizados: {syncPrices.data.updated} activos
          {syncPrices.data.failed.length > 0 && (
            <span className="text-warn"> · Fallaron: {syncPrices.data.failed.join(', ')}</span>
          )}
        </div>
      )}

      {/* CCL Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial CCL</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Cargando…</div>
          ) : sorted.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin registros CCL. Hacé sync desde Ambito o cargá uno manual.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">CCL</TableHead>
                  <TableHead>Fuente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-mono text-sm">{formatDate(rate.date)}</TableCell>
                    <TableCell className="font-mono text-sm text-right font-semibold text-warn">
                      ${formatNumber(rate.rate, 2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.source === 'AMBITO' ? 'muted' : 'outline'} className="text-[10px]">
                        {rate.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ManualCclDialog open={manualOpen} onOpenChange={setManualOpen} />
    </div>
  )
}
