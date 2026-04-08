import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreatePortfolio, useUpdatePortfolio, type Portfolio, type CreatePortfolioInput } from '@/api/portfolios'

interface PortfolioDialogProps {
  portfolio: Portfolio | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY: CreatePortfolioInput = { name: '', type: 'TRADING', description: '' }

export function PortfolioDialog({ portfolio, open, onOpenChange }: PortfolioDialogProps) {
  const createPortfolio = useCreatePortfolio()
  const updatePortfolio = useUpdatePortfolio(portfolio?.id ?? 0)
  const isEdit = !!portfolio
  const [form, setForm] = useState<CreatePortfolioInput>(EMPTY)

  useEffect(() => {
    setForm(portfolio
      ? { name: portfolio.name, type: portfolio.type, description: portfolio.description ?? '' }
      : EMPTY)
  }, [portfolio, open])

  const set = <K extends keyof CreatePortfolioInput>(field: K, value: CreatePortfolioInput[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    const payload = { ...form, description: form.description || undefined }
    const mutation = isEdit ? updatePortfolio : createPortfolio
    mutation.mutate(payload as never, { onSuccess: () => onOpenChange(false) })
  }

  const isPending = createPortfolio.isPending || updatePortfolio.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cartera' : 'Nueva cartera'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: Cartera principal"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v as Portfolio['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TRADING">TRADING</SelectItem>
                <SelectItem value="DCA">DCA</SelectItem>
                <SelectItem value="MIXTO">MIXTO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input
              placeholder="Descripción breve..."
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cartera'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
