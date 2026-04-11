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
  strategyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY: CreateDcaEntryInput = {
  type: 'INCREMENTO',
  entryDate: today(),
  amountUsd: 0,
  amountArs: undefined,
  assetPriceAtEntry: undefined,
  notes: '',
}

export function AddDcaEntryDialog({ strategyId, open, onOpenChange }: AddDcaEntryDialogProps) {
  const addEntry = useAddDcaEntry(strategyId)
  const [form, setForm] = useState<CreateDcaEntryInput>(EMPTY)

  const set = <K extends keyof CreateDcaEntryInput>(field: K, value: CreateDcaEntryInput[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    addEntry.mutate(
      {
        ...form,
        amountUsd: Number(form.amountUsd),
        amountArs: form.amountArs ? Number(form.amountArs) : undefined,
        assetPriceAtEntry: form.assetPriceAtEntry ? Number(form.assetPriceAtEntry) : undefined,
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
              <Input type="date" value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} />
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
                value={form.amountUsd || ''}
                onChange={(e) => set('amountUsd', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Monto ARS (opcional)</Label>
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={form.amountArs || ''}
                onChange={(e) => set('amountArs', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Precio activo (opcional)</Label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.0000"
              value={form.assetPriceAtEntry || ''}
              onChange={(e) => set('assetPriceAtEntry', Number(e.target.value))}
            />
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
            disabled={addEntry.isPending || !form.amountUsd}
          >
            {addEntry.isPending ? 'Guardando…' : 'Guardar entrada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
