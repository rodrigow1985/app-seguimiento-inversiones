import { useState } from 'react'
import { AlertCircle, Plus, RefreshCcw } from 'lucide-react'
import { usePositions } from '@/api/trading'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { PositionCard } from './components/PositionCard'
import { NewPositionDialog } from './components/NewPositionDialog'

function PositionSkeleton() {
  return (
    <Card className="h-36">
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-20 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
          <div className="h-5 w-16 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
        </div>
        <div className="h-3.5 w-32 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
        <div className="h-3 w-full rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
      </div>
    </Card>
  )
}

export default function TradingPage() {
  const [tab, setTab] = useState<'OPEN' | 'CLOSED'>('OPEN')
  const [newOpen, setNewOpen] = useState(false)

  const { data: positions, isLoading, isError, refetch } = usePositions(tab)

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Trading</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Posiciones de compra/venta
          </p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nueva posición
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'OPEN' | 'CLOSED')}>
        <TabsList>
          <TabsTrigger value="OPEN">Abiertas</TabsTrigger>
          <TabsTrigger value="CLOSED">Cerradas</TabsTrigger>
        </TabsList>

        <TabsContent value="OPEN">
          <PositionList
            positions={positions}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyText="No tenés posiciones abiertas"
          />
        </TabsContent>

        <TabsContent value="CLOSED">
          <PositionList
            positions={positions}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyText="No tenés posiciones cerradas"
          />
        </TabsContent>
      </Tabs>

      <NewPositionDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

interface PositionListProps {
  positions: ReturnType<typeof usePositions>['data']
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  emptyText: string
}

function PositionList({ positions, isLoading, isError, onRetry, emptyText }: PositionListProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-loss opacity-60" />
        <p className="text-sm text-muted-foreground">Error al cargar posiciones</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => <PositionSkeleton key={i} />)}
      </div>
    )
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {positions.map((p) => (
        <PositionCard key={p.id} position={p} />
      ))}
    </div>
  )
}
