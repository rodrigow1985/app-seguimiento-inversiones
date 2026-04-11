import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

// ─── Tabla de recargas ────────────────────────────────────────────────────────

const RELOAD_RULES = [
  { condition: 'Positivo > 5%',   bullets: 1, where: 'Posición' },
  { condition: 'Positivo ≤ 5%',   bullets: 2, where: 'Posición' },
  { condition: 'Negativo ≤ 5%',   bullets: 3, where: 'Posición' },
  { condition: 'Negativo ≤ 10%',  bullets: 4, where: 'Posición' },
  { condition: 'Negativo ≤ 15%',  bullets: 5, where: 'Posición' },
  { condition: 'Negativo > 15%',  bullets: 6, where: 'Posición' },
  { condition: 'Negativo > 40%',  bullets: 6, where: '½ Posición + ½ Margen', warn: true },
  { condition: 'Negativo > 60%',  bullets: 6, where: 'Todo a Margen', danger: true },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function DcaStrategyGuideSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Ver guía
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Guía — AntiVitalik &amp; AntiADA
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Estrategias DCA en short para mercado bajista · Fuente: Criptonorber
          </p>
        </SheetHeader>

        <div className="space-y-6 text-sm">

          {/* Contexto */}
          <section className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Contexto
            </h3>
            <ul className="space-y-1 text-muted-foreground text-xs leading-relaxed list-disc list-inside">
              <li>Usar solo en <span className="text-foreground font-medium">tendencia de ciclo bajista</span> confirmada</li>
              <li>Señal de entrada: Oracle Numeris en weekly marca <span className="text-foreground font-medium">venta</span></li>
              <li>ETH y ADA caen 80–90% en bear market vs 40–50% de BTC → más recorrido en short</li>
              <li>Duración estimada del ciclo actual: mediados 2026 → mediados 2027</li>
            </ul>
          </section>

          {/* Setup */}
          <section className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Setup inicial
            </h3>
            <div className="rounded-md border divide-y divide-border text-xs">
              {[
                ['Activo',        'ETH/USDT o ADA/USDT (perpetuo)'],
                ['Dirección',     'SHORT'],
                ['Apalancamiento','5x'],
                ['Colateral',     'USDT (no el activo)'],
                ['Bala',          'Capital total ÷ 30'],
                ['Mínimo/bala',   '$20 reales → $100 posición a 5x'],
                ['Inicio',        '3 balas'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recargas */}
          <section className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Recargas diarias
            </h3>
            <div className="rounded-md border overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-muted/50 px-3 py-2 font-medium text-muted-foreground">
                <span>Estado</span>
                <span className="text-center">Balas</span>
                <span className="text-right">Dónde</span>
              </div>
              {RELOAD_RULES.map((r) => (
                <div
                  key={r.condition}
                  className={`grid grid-cols-3 px-3 py-2 border-t border-border items-center
                    ${r.danger ? 'bg-loss/5' : r.warn ? 'bg-yellow-500/5' : ''}`}
                >
                  <span className={r.danger ? 'text-loss font-medium' : r.warn ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''}>
                    {r.condition}
                  </span>
                  <span className="text-center font-mono font-bold">{r.bullets}</span>
                  <span className={`text-right ${r.danger ? 'text-loss' : r.warn ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                    {r.where}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Margen</span> mejora el precio de liquidación.{' '}
              <span className="font-medium text-foreground">Posición</span> baja el precio promedio de entrada.
            </p>
          </section>

          {/* Toma de ganancias */}
          <section className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Toma de ganancias
            </h3>
            <div className="rounded-md border divide-y divide-border text-xs">
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-muted-foreground">Ganancia ≥ 15%</span>
                <Badge variant="warn" className="text-[10px]">Considerar cierre</Badge>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-muted-foreground">Ganancia ≥ 20%</span>
                <Badge variant="profit" className="text-[10px]">Cerrar y reiniciar</Badge>
              </div>
            </div>
          </section>

          {/* Cargador extra */}
          <section className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Cargador extra (opcional)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reservar el <span className="text-foreground font-medium">50% del capital inicial</span> como
              fondo de emergencia para salvar trades muy negativos. Solo usar cuando la tendencia bajista siga activa.
            </p>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  )
}
