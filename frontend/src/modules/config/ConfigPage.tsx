import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AssetTable } from './components/AssetTable'
import { AssetDialog } from './components/AssetDialog'
import { BrokerTable } from './components/BrokerTable'
import { BrokerDialog } from './components/BrokerDialog'
import { PortfolioTable } from './components/PortfolioTable'
import { PortfolioDialog } from './components/PortfolioDialog'
import type { Asset } from '@/api/assets'
import type { Broker } from '@/api/brokers'
import type { Portfolio } from '@/api/portfolios'

export default function ConfigPage() {
  const [tab, setTab] = useState('assets')

  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)

  const [editBroker, setEditBroker] = useState<Broker | null>(null)
  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false)

  const [editPortfolio, setEditPortfolio] = useState<Portfolio | null>(null)
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)

  const openNewAsset = () => { setEditAsset(null); setAssetDialogOpen(true) }
  const openEditAsset = (a: Asset) => { setEditAsset(a); setAssetDialogOpen(true) }

  const openNewBroker = () => { setEditBroker(null); setBrokerDialogOpen(true) }
  const openEditBroker = (b: Broker) => { setEditBroker(b); setBrokerDialogOpen(true) }

  const openNewPortfolio = () => { setEditPortfolio(null); setPortfolioDialogOpen(true) }
  const openEditPortfolio = (p: Portfolio) => { setEditPortfolio(p); setPortfolioDialogOpen(true) }

  const addButtons: Record<string, () => void> = {
    assets: openNewAsset,
    brokers: openNewBroker,
    portfolios: openNewPortfolio,
  }
  const addLabels: Record<string, string> = {
    assets: 'Nuevo activo',
    brokers: 'Nuevo broker',
    portfolios: 'Nueva cartera',
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Configuración</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activos, brokers y carteras
          </p>
        </div>
        <Button size="sm" onClick={addButtons[tab]} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          {addLabels[tab]}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="assets">Activos</TabsTrigger>
          <TabsTrigger value="brokers">Brokers</TabsTrigger>
          <TabsTrigger value="portfolios">Carteras</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card><CardContent className="p-0 pt-0">
            <AssetTable onEdit={openEditAsset} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="brokers">
          <Card><CardContent className="p-0">
            <BrokerTable onEdit={openEditBroker} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="portfolios">
          <Card><CardContent className="p-0">
            <PortfolioTable onEdit={openEditPortfolio} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <AssetDialog
        asset={editAsset}
        open={assetDialogOpen}
        onOpenChange={setAssetDialogOpen}
      />
      <BrokerDialog
        broker={editBroker}
        open={brokerDialogOpen}
        onOpenChange={setBrokerDialogOpen}
      />
      <PortfolioDialog
        portfolio={editPortfolio}
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
      />
    </div>
  )
}
