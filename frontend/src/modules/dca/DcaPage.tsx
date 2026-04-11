import { useState } from 'react'
import { AlertCircle, Plus, RefreshCcw } from 'lucide-react'
import { useDcaStrategies } from '@/api/dca'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { DcaStrategyCard } from './components/DcaStrategyCard'
import { DcaStatsBar } from './components/DcaStatsBar'
import { DcaStrategyGuideSheet } from './components/DcaStrategyGuideSheet'
import { NewStrategyDialog } from './components/NewStrategyDialog'

const ASSET_FILTERS = ['Todos', 'ETH', 'ADA', 'PAXG'] as const
type AssetFilter = typeof ASSET_FILTERS[number]

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
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('Todos')
  const [newOpen, setNewOpen] = useState(false)

  const { data: allStrategies, isLoading, isError, refetch } = useDcaStrategies(tab)

  const strategies = assetFilter === 'Todos'
    ? allStrategies
    : allStrategies?.filter((s) => s.asset.ticker === assetFilter)

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">DCA</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Estrategias de acumulación</p>
        </div>
        <div className="flex items-center gap-2">
          <DcaStrategyGuideSheet />
          <Button size="sm" onClick={() => setNewOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nueva estrategia
          </Button>
        </div>
      </div>

      <DcaStatsBar />

      {/* Filtro por activo */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ASSET_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setAssetFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${assetFilter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

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
            emptyText={assetFilter === 'Todos' ? 'No tenés estrategias DCA activas' : `No hay estrategias ${assetFilter} activas`}
          />
        </TabsContent>
        <TabsContent value="CLOSED">
          <StrategyList
            strategies={strategies}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyText={assetFilter === 'Todos' ? 'No tenés estrategias DCA cerradas' : `No hay estrategias ${assetFilter} cerradas`}
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
