import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useUpdateTrade, type Trade, type UpdateTradeInput } from '@/api/trading'

interface EditTradeDialogProps {
  positionId: number
  trade: Trade | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTradeDialog({ positionId, trade, open, onOpenChange }: EditTradeDialogProps) {
  const updateTrade = useUpdateTrade(positionId, trade?.id ?? 0)

  const [form, setForm] = useState<UpdateTradeInput>({})

  useEffect(() => {
    if (trade) {
      setForm({
        date: trade.date.slice(0, 10),
        price: trade.price,
        units: trade.units,
        commission: trade.commission,
        currency: trade.currency,
        ccl_rate: trade.ccl_rate ?? undefined,
        notes: trade.notes ?? '',
      })
    }
  }, [trade])

  const set = (field: keyof UpdateTradeInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    updateTrade.mutate(
      {
        ...form,
        price: Number(form.price),
        units: Number(form.units),
        commission: Number(form.commission) || 0,
        ccl_rate: form.ccl_rate ? Number(form.ccl_rate) : undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar trade</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select value={form.currency ?? 'USD'} onValueChange={(v) => set('currency', v)}>
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
              value={form.date ?? ''}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.price ?? ''}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidades</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.units ?? ''}
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
                value={form.commission ?? ''}
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
                  value={form.ccl_rate ?? ''}
                  onChange={(e) => set('ccl_rate', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
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
          <Button onClick={handleSubmit} disabled={updateTrade.isPending}>
            {updateTrade.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
