import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateStrategy, type CreateStrategyInput } from '@/api/dca'
import { useAssets } from '@/api/assets'
import { useBrokers } from '@/api/brokers'
import { usePortfolios } from '@/api/portfolios'

interface NewStrategyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

interface FormState {
  name: string
  portfolioId: string
  assetId: string
  brokerId: string
  startedAt: string
  notes: string
}

const EMPTY: FormState = {
  name: '',
  portfolioId: '',
  assetId: '',
  brokerId: '',
  startedAt: today(),
  notes: '',
}

export function NewStrategyDialog({ open, onOpenChange }: NewStrategyDialogProps) {
  const createStrategy = useCreateStrategy()
  const { data: assets = [] } = useAssets()
  const { data: brokers = [] } = useBrokers()
  const { data: portfolios = [] } = usePortfolios()
  const [form, setForm] = useState<FormState>(EMPTY)

  const set = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const canSubmit = form.name && form.portfolioId && form.assetId && form.brokerId

  const handleSubmit = () => {
    const input: CreateStrategyInput = {
      name: form.name,
      portfolioId: form.portfolioId,
      assetId: form.assetId,
      brokerId: form.brokerId,
      startedAt: form.startedAt,
      notes: form.notes || undefined,
    }
    createStrategy.mutate(input, {
      onSuccess: () => {
        onOpenChange(false)
        setForm(EMPTY)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva estrategia DCA</DialogTitle>
          <DialogDescription>
            Creá una estrategia de acumulación para un activo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre de la estrategia</Label>
            <Input
              placeholder="Ej: Acumulación BTC 2024"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Activo</Label>
            <Select value={form.assetId} onValueChange={(v) => set('assetId', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccioná un activo" /></SelectTrigger>
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
              <Select value={form.brokerId} onValueChange={(v) => set('brokerId', v)}>
                <SelectTrigger><SelectValue placeholder="Broker" /></SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cartera</Label>
              <Select value={form.portfolioId} onValueChange={(v) => set('portfolioId', v)}>
                <SelectTrigger><SelectValue placeholder="Cartera" /></SelectTrigger>
                <SelectContent>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              value={form.startedAt}
              onChange={(e) => set('startedAt', e.target.value)}
            />
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createStrategy.isPending}>
            {createStrategy.isPending ? 'Creando…' : 'Crear estrategia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
