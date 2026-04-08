import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateBroker, useUpdateBroker, type Broker, type CreateBrokerInput } from '@/api/brokers'

interface BrokerDialogProps {
  broker: Broker | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY: CreateBrokerInput = { name: '', commission_pct: 0, currency: 'ARS' }

export function BrokerDialog({ broker, open, onOpenChange }: BrokerDialogProps) {
  const createBroker = useCreateBroker()
  const updateBroker = useUpdateBroker(broker?.id ?? 0)
  const isEdit = !!broker
  const [form, setForm] = useState<CreateBrokerInput>(EMPTY)

  useEffect(() => {
    setForm(broker
      ? { name: broker.name, commission_pct: broker.commission_pct, currency: broker.currency }
      : EMPTY)
  }, [broker, open])

  const set = <K extends keyof CreateBrokerInput>(field: K, value: CreateBrokerInput[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    const payload = { ...form, commission_pct: Number(form.commission_pct) }
    const mutation = isEdit ? updateBroker : createBroker
    mutation.mutate(payload as never, { onSuccess: () => onOpenChange(false) })
  }

  const isPending = createBroker.isPending || updateBroker.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar broker' : 'Nuevo broker'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: InvertirOnline"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Comisión %</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={form.commission_pct || ''}
                onChange={(e) => set('commission_pct', Number(e.target.value))}
              />
            </div>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear broker'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
