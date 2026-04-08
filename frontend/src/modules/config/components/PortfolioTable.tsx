import { Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePortfolios, useDeletePortfolio, type Portfolio } from '@/api/portfolios'

const TYPE_VARIANT: Record<Portfolio['type'], 'profit' | 'warn' | 'muted'> = {
  TRADING: 'profit', DCA: 'warn', MIXTO: 'muted',
}

interface PortfolioTableProps {
  onEdit: (portfolio: Portfolio) => void
}

export function PortfolioTable({ onEdit }: PortfolioTableProps) {
  const { data: portfolios = [], isLoading } = usePortfolios()
  const deletePortfolio = useDeletePortfolio()

  const handleDelete = (portfolio: Portfolio) => {
    if (!confirm(`¿Eliminar cartera "${portfolio.name}"?`)) return
    deletePortfolio.mutate(portfolio.id)
  }

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Cargando carteras…</div>
  }
  if (portfolios.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Sin carteras registradas</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {portfolios.map((portfolio) => (
          <TableRow key={portfolio.id}>
            <TableCell className="font-medium text-sm">{portfolio.name}</TableCell>
            <TableCell>
              <Badge variant={TYPE_VARIANT[portfolio.type]} className="text-[10px]">
                {portfolio.type}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
              {portfolio.description ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant={portfolio.active ? 'profit' : 'muted'} className="text-[10px]">
                {portfolio.active ? 'Activa' : 'Inactiva'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(portfolio)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-loss hover:bg-loss/10"
                  onClick={() => handleDelete(portfolio)}
                  disabled={deletePortfolio.isPending}
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
