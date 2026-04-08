import { Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBrokers, useDeleteBroker, type Broker } from '@/api/brokers'
import { formatNumber } from '@/lib/utils'

interface BrokerTableProps {
  onEdit: (broker: Broker) => void
}

export function BrokerTable({ onEdit }: BrokerTableProps) {
  const { data: brokers = [], isLoading } = useBrokers()
  const deleteBroker = useDeleteBroker()

  const handleDelete = (broker: Broker) => {
    if (!confirm(`¿Eliminar ${broker.name}?`)) return
    deleteBroker.mutate(broker.id)
  }

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Cargando brokers…</div>
  }
  if (brokers.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Sin brokers registrados</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="text-right">Comisión</TableHead>
          <TableHead>Moneda</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {brokers.map((broker) => (
          <TableRow key={broker.id}>
            <TableCell className="font-medium text-sm">{broker.name}</TableCell>
            <TableCell className="font-mono text-sm text-right">
              {formatNumber(broker.commission_pct, 2)}%
            </TableCell>
            <TableCell className="font-mono text-xs">{broker.currency}</TableCell>
            <TableCell>
              <Badge variant={broker.active ? 'profit' : 'muted'} className="text-[10px]">
                {broker.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(broker)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-loss hover:bg-loss/10"
                  onClick={() => handleDelete(broker)}
                  disabled={deleteBroker.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
