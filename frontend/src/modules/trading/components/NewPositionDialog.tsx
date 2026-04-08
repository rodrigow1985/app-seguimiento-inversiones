import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreatePosition, type CreatePositionInput } from '@/api/trading'
import { useAssets } from '@/api/assets'
import { useBrokers } from '@/api/brokers'
import { usePortfolios } from '@/api/portfolios'

interface NewPositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

interface FormState {
  portfolio_id: string
  asset_id: string
  broker_id: string
  date: string
  price: string
  units: string
  commission: string
  currency: 'ARS' | 'USD'
  ccl_rate: string
  notes: string
}

const EMPTY: FormState = {
  portfolio_id: '',
  asset_id: '',
  broker_id: '',
  date: today(),
  price: '',
  units: '',
  commission: '',
  currency: 'USD',
  ccl_rate: '',
  notes: '',
}

export function NewPositionDialog({ open, onOpenChange }: NewPositionDialogProps) {
  const createPosition = useCreatePosition()
  const { data: assets = [] } = useAssets()
  const { data: brokers = [] } = useBrokers()
  const { data: portfolios = [] } = usePortfolios()

  const [form, setForm] = useState<FormState>(EMPTY)

  const set = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const canSubmit =
    form.portfolio_id && form.asset_id && form.broker_id && form.price && form.units

  const handleSubmit = () => {
    const input: CreatePositionInput = {
      portfolio_id: Number(form.portfolio_id),
      asset_id: Number(form.asset_id),
      broker_id: Number(form.broker_id),
      notes: form.notes || undefined,
      first_trade: {
        date: form.date,
        price: Number(form.price),
        units: Number(form.units),
        commission: Number(form.commission) || 0,
        currency: form.currency,
        ccl_rate: form.ccl_rate ? Number(form.ccl_rate) : undefined,
      },
    }

    createPosition.mutate(input, {
      onSuccess: () => {
        onOpenChange(false)
        setForm(EMPTY)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva posición</DialogTitle>
          <DialogDescription>
            Creá una posición con su primer trade de compra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset / broker / portfolio */}
          <div className="space-y-1.5">
            <Label>Activo</Label>
            <Select value={form.asset_id} onValueChange={(v) => set('asset_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un activo" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.ticker} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Broker</Label>
              <Select value={form.broker_id} onValueChange={(v) => set('broker_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Broker" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cartera</Label>
              <Select value={form.portfolio_id} onValueChange={(v) => set('portfolio_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Cartera" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Primer trade (compra)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Moneda</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => set('currency', v as 'ARS' | 'USD')}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5">
                <Label>Precio</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidades</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.0000"
                  value={form.units}
                  onChange={(e) => set('units', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5">
                <Label>Comisión</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.commission}
                  onChange={(e) => set('commission', e.target.value)}
                />
              </div>
              {form.currency === 'ARS' && (
                <div className="space-y-1.5">
                  <Label>CCL</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="CCL del día"
                    value={form.ccl_rate}
                    onChange={(e) => set('ccl_rate', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createPosition.isPending}>
            {createPosition.isPending ? 'Creando…' : 'Crear posición'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
