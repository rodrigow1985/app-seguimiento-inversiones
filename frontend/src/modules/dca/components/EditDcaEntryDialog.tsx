import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateDcaEntry, type DcaEntry, type UpdateDcaEntryInput } from '@/api/dca'

interface EditDcaEntryDialogProps {
  strategyId: string
  entry: DcaEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDcaEntryDialog({ strategyId, entry, open, onOpenChange }: EditDcaEntryDialogProps) {
  const updateEntry = useUpdateDcaEntry(strategyId, entry?.id ?? '')
  const [form, setForm] = useState<UpdateDcaEntryInput>({})

  useEffect(() => {
    if (entry) {
      setForm({
        entryDate: entry.entryDate.slice(0, 10),
        amountUsd: Number(entry.amountUsd),
        amountArs: entry.amountArs != null ? Number(entry.amountArs) : undefined,
        assetPriceAtEntry: entry.assetPriceAtEntry != null ? Number(entry.assetPriceAtEntry) : undefined,
        notes: entry.notes ?? '',
      })
    }
  }, [entry])

  const set = <K extends keyof UpdateDcaEntryInput>(field: K, value: UpdateDcaEntryInput[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    updateEntry.mutate(
      {
        ...form,
        amountUsd: form.amountUsd ? Number(form.amountUsd) : undefined,
        amountArs: form.amountArs ? Number(form.amountArs) : undefined,
        assetPriceAtEntry: form.assetPriceAtEntry ? Number(form.assetPriceAtEntry) : undefined,
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
              value={form.entryDate ?? ''}
              onChange={(e) => set('entryDate', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto USD</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amountUsd ?? ''}
                onChange={(e) => set('amountUsd', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Monto ARS</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={form.amountArs ?? ''}
                onChange={(e) => set('amountArs', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Precio activo</Label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              value={form.assetPriceAtEntry ?? ''}
              onChange={(e) => set('assetPriceAtEntry', Number(e.target.value))}
            />
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
