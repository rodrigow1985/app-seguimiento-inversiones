import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateDcaEntry, type DcaEntry, type UpdateDcaEntryInput } from '@/api/dca'

interface EditDcaEntryDialogProps {
  strategyId: number
  entry: DcaEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDcaEntryDialog({ strategyId, entry, open, onOpenChange }: EditDcaEntryDialogProps) {
  const updateEntry = useUpdateDcaEntry(strategyId, entry?.id ?? 0)
  const [form, setForm] = useState<UpdateDcaEntryInput>({})

  useEffect(() => {
    if (entry) {
      setForm({
        date: entry.date.slice(0, 10),
        amount_usd: entry.amount_usd,
        amount_ars: entry.amount_ars ?? undefined,
        asset_price: entry.asset_price ?? undefined,
        ccl_rate: entry.ccl_rate ?? undefined,
        notes: entry.notes ?? '',
      })
    }
  }, [entry])

  const set = (field: keyof UpdateDcaEntryInput, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    updateEntry.mutate(
      {
        ...form,
        amount_usd: form.amount_usd ? Number(form.amount_usd) : undefined,
        amount_ars: form.amount_ars ? Number(form.amount_ars) : undefined,
        asset_price: form.asset_price ? Number(form.asset_price) : undefined,
        ccl_rate: form.ccl_rate ? Number(form.ccl_rate) : undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar entrada DCA</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <Label>Monto USD</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount_usd ?? ''}
                onChange={(e) => set('amount_usd', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Monto ARS</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={form.amount_ars ?? ''}
                onChange={(e) => set('amount_ars', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio activo</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.asset_price ?? ''}
                onChange={(e) => set('asset_price', e.target.value)}
              />
            </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={updateEntry.isPending}>
            {updateEntry.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
