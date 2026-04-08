import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAddTrade, type CreateTradeInput } from '@/api/trading'

interface AddTradeDialogProps {
  positionId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function AddTradeDialog({ positionId, open, onOpenChange }: AddTradeDialogProps) {
  const addTrade = useAddTrade(positionId)

  const [form, setForm] = useState<CreateTradeInput>({
    type: 'BUY',
    date: today(),
    price: 0,
    units: 0,
    commission: 0,
    currency: 'USD',
    ccl_rate: undefined,
    notes: '',
  })

  const set = (field: keyof CreateTradeInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    addTrade.mutate(
      {
        ...form,
        price: Number(form.price),
        units: Number(form.units),
        commission: Number(form.commission) || 0,
        ccl_rate: form.ccl_rate ? Number(form.ccl_rate) : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setForm({ type: 'BUY', date: today(), price: 0, units: 0, commission: 0, currency: 'USD' })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar trade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY — Compra</SelectItem>
                  <SelectItem value="SELL">SELL — Venta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                value={form.price || ''}
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
                value={form.units || ''}
                onChange={(e) => set('units', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Comisión</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.commission || ''}
                onChange={(e) => set('commission', e.target.value)}
              />
            </div>
            {form.currency === 'ARS' && (
              <div className="space-y-1.5">
                <Label>Tipo cambio CCL</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="CCL del día"
                  value={form.ccl_rate || ''}
                  onChange={(e) => set('ccl_rate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Input
              placeholder="Observaciones..."
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addTrade.isPending || !form.price || !form.units}
          >
            {addTrade.isPending ? 'Guardando…' : 'Guardar trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
