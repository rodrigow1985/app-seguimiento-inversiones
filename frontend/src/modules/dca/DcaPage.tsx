import { useState } from 'react'
import { AlertCircle, Plus, RefreshCcw } from 'lucide-react'
import { useDcaStrategies } from '@/api/dca'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { DcaStrategyCard } from './components/DcaStrategyCard'
import { DcaStatsBar } from './components/DcaStatsBar'
import { NewStrategyDialog } from './components/NewStrategyDialog'

function StrategySkeleton() {
  return (
    <Card className="h-36">
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-20 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
          <div className="h-5 w-16 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
        </div>
        <div className="h-3.5 w-40 rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
        <div className="h-3 w-full rounded bg-gradient-to-r from-muted via-accent to-muted bg-[length:400px_100%] animate-shimmer" />
      </div>
    </Card>
  )
}

export default function DcaPage() {
  const [tab, setTab] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE')
  const [newOpen, setNewOpen] = useState(false)

  const { data: strategies, isLoading, isError, refetch } = useDcaStrategies(tab)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">DCA</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Estrategias de acumulación</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nueva estrategia
        </Button>
      </div>

      <DcaStatsBar />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'ACTIVE' | 'CLOSED')}>
        <TabsList>
          <TabsTrigger value="ACTIVE">Activas</TabsTrigger>
          <TabsTrigger value="CLOSED">Cerradas</TabsTrigger>
        </TabsList>

        <TabsContent value="ACTIVE">
          <StrategyList
            strategies={strategies}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyText="No tenés estrategias DCA activas"
          />
        </TabsContent>
        <TabsContent value="CLOSED">
          <StrategyList
            strategies={strategies}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyText="No tenés estrategias DCA cerradas"
          />
        </TabsContent>
      </Tabs>

      <NewStrategyDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

interface StrategyListProps {
  strategies: ReturnType<typeof useDcaStrategies>['data']
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  emptyText: string
}

function StrategyList({ strategies, isLoading, isError, onRetry, emptyText }: StrategyListProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-loss opacity-60" />
        <p className="text-sm text-muted-foreground">Error al cargar estrategias</p>
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
        {Array.from({ length: 3 }).map((_, i) => <StrategySkeleton key={i} />)}
      </div>
    )
  }

  if (!strategies || strategies.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {strategies.map((s) => (
        <DcaStrategyCard key={s.id} strategy={s} />
      ))}
    </div>
  )
}
