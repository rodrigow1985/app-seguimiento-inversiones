import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateAsset, useUpdateAsset, type Asset, type CreateAssetInput } from '@/api/assets'

interface AssetDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY: CreateAssetInput = {
  ticker: '', name: '', type: 'ACCION', currency: 'ARS',
  price_source: null, coingecko_id: '', iol_symbol: '',
}

export function AssetDialog({ asset, open, onOpenChange }: AssetDialogProps) {
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset(asset?.id ?? 0)
  const isEdit = !!asset

  const [form, setForm] = useState<CreateAssetInput>(EMPTY)

  useEffect(() => {
    if (asset) {
      setForm({
        ticker: asset.ticker,
        name: asset.name,
        type: asset.type,
        currency: asset.currency,
        price_source: asset.price_source,
        coingecko_id: asset.coingecko_id ?? '',
        iol_symbol: asset.iol_symbol ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [asset, open])

  const set = <K extends keyof CreateAssetInput>(field: K, value: CreateAssetInput[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    const payload: CreateAssetInput = {
      ...form,
      coingecko_id: form.coingecko_id || undefined,
      iol_symbol: form.iol_symbol || undefined,
    }
    const mutation = isEdit ? updateAsset : createAsset
    mutation.mutate(payload as never, { onSuccess: () => onOpenChange(false) })
  }

  const isPending = createAsset.isPending || updateAsset.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar activo' : 'Nuevo activo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ticker</Label>
              <Input
                placeholder="Ej: GGAL"
                value={form.ticker}
                onChange={(e) => set('ticker', e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v as Asset['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['ACCION', 'CEDEAR', 'CRYPTO', 'FCI', 'BONO', 'OTRO'] as const).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              placeholder="Nombre completo del activo"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(v) => set('currency', v as 'ARS' | 'USD')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuente precio</Label>
              <Select
                value={form.price_source ?? 'none'}
                onValueChange={(v) => set('price_source', v === 'none' ? null : v as Asset['price_source'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin fuente</SelectItem>
                  <SelectItem value="IOL">IOL</SelectItem>
                  <SelectItem value="COINGECKO">CoinGecko</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.price_source === 'COINGECKO' && (
            <div className="space-y-1.5">
              <Label>CoinGecko ID</Label>
              <Input
                placeholder="Ej: bitcoin"
                value={form.coingecko_id ?? ''}
                onChange={(e) => set('coingecko_id', e.target.value)}
              />
            </div>
          )}
          {form.price_source === 'IOL' && (
            <div className="space-y-1.5">
              <Label>IOL Symbol</Label>
              <Input
                placeholder="Ej: GGAL"
                value={form.iol_symbol ?? ''}
                onChange={(e) => set('iol_symbol', e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.ticker || !form.name}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear activo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
