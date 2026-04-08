import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateManualCcl } from '@/api/ccl'

interface ManualCclDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function ManualCclDialog({ open, onOpenChange }: ManualCclDialogProps) {
  const createCcl = useCreateManualCcl()
  const [date, setDate] = useState(today())
  const [rate, setRate] = useState('')

  const handleSubmit = () => {
    createCcl.mutate(
      { date, rate: Number(rate) },
      {
        onSuccess: () => {
          onOpenChange(false)
          setRate('')
          setDate(today())
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cargar CCL manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de cambio CCL</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 1250.50"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!rate || !date || createCcl.isPending}>
            {createCcl.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
