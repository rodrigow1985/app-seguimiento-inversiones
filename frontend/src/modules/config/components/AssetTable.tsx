import { Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAssets, useDeleteAsset, type Asset } from '@/api/assets'

const TYPE_VARIANT: Record<Asset['type'], 'profit' | 'loss' | 'warn' | 'muted' | 'outline'> = {
  ACCION: 'profit', CEDEAR: 'warn', CRYPTO: 'loss', FCI: 'muted', BONO: 'outline', OTRO: 'muted',
}

interface AssetTableProps {
  onEdit: (asset: Asset) => void
}

export function AssetTable({ onEdit }: AssetTableProps) {
  const { data: assets = [], isLoading } = useAssets()
  const deleteAsset = useDeleteAsset()

  const handleDelete = (asset: Asset) => {
    if (!confirm(`¿Eliminar ${asset.ticker}?`)) return
    deleteAsset.mutate(asset.id)
  }

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Cargando activos…</div>
  }

  if (assets.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Sin activos registrados</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead>Fuente precio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-mono font-semibold text-sm">{asset.ticker}</TableCell>
            <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
              {asset.name}
            </TableCell>
            <TableCell>
              <Badge variant={TYPE_VARIANT[asset.type]} className="text-[10px]">
                {asset.type}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{asset.currency}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {asset.price_source ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant={asset.active ? 'profit' : 'muted'} className="text-[10px]">
                {asset.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(asset)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-loss hover:bg-loss/10"
                  onClick={() => handleDelete(asset)}
                  disabled={deleteAsset.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
