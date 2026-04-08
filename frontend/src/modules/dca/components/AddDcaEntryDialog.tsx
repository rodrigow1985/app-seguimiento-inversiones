import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAddDcaEntry, type CreateDcaEntryInput, type DcaEntry } from '@/api/dca'

interface AddDcaEntryDialogProps {
  strategyId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY: CreateDcaEntryInput = {
  type: 'INCREMENTO',
  date: today(),
  amount_usd: 0,
  amount_ars: undefined,
  asset_price: undefined,
  ccl_rate: undefined,
  notes: '',
}

export function AddDcaEntryDialog({ strategyId, open, onOpenChange }: AddDcaEntryDialogProps) {
  const addEntry = useAddDcaEntry(strategyId)
  const [form, setForm] = useState<CreateDcaEntryInput>(EMPTY)

  const set = (field: keyof CreateDcaEntryInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    addEntry.mutate(
      {
        ...form,
        amount_usd: Number(form.amount_usd),
        amount_ars: form.amount_ars ? Number(form.amount_ars) : undefined,
        asset_price: form.asset_price ? Number(form.asset_price) : undefined,
        ccl_rate: form.ccl_rate ? Number(form.ccl_rate) : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setForm(EMPTY)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva entrada DCA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => set('type', v as DcaEntry['type'])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APERTURA">APERTURA</SelectItem>
                  <SelectItem value="INCREMENTO">INCREMENTO</SelectItem>
                  <SelectItem value="CIERRE">CIERRE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto USD</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount_usd || ''}
                onChange={(e) => set('amount_usd', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Monto ARS (opcional)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={form.amount_ars || ''}
                onChange={(e) => set('amount_ars', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio activo (opcional)</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                value={form.asset_price || ''}
                onChange={(e) => set('asset_price', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>CCL (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="CCL del día"
                value={form.ccl_rate || ''}
                onChange={(e) => set('ccl_rate', e.target.value)}
              />
            </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={addEntry.isPending || !form.amount_usd}
          >
            {addEntry.isPending ? 'Guardando…' : 'Guardar entrada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
