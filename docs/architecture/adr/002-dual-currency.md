# ADR 002 — Manejo de Doble Moneda (ARS/USD) con CCL Histórico

**Estado**: Aceptado  
**Fecha**: 2026-04-05

---

## Contexto

La app maneja activos en dos monedas: ARS (pesos argentinos) y USD. Los Cedears, acciones argentinas, FCI y bonos se transan en ARS pero el usuario quiere ver el valor en USD usando el tipo de cambio CCL (Contado con Liquidación), que varía diariamente.

El problema central: si se pre-convierte y guarda el valor en USD al momento de la operación, y luego el CCL histórico se corrige (error de carga, ajuste retroactivo), todos los cálculos históricos quedan inconsistentes.

## Decisión

**Almacenar siempre en moneda nativa. Convertir en la capa de servicio usando CclRate histórico.**

### Regla para Trades

Un `Trade` almacena:
- `price_native`: precio en la moneda del activo
- `price_currency`: ARS o USD
- `ccl_rate_id`: FK a la tabla `CclRate` con el CCL del día de la operación

La conversión a USD se calcula en `backend/src/lib/calculations.ts`:

```typescript
function toUsd(amount: number, currency: 'ARS' | 'USD', cclRate?: number): number {
  if (currency === 'USD') return amount;
  if (!cclRate) throw new Error('CCL rate required for ARS conversion');
  return amount / cclRate;
}
```

### Regla para PriceSnapshot

Los snapshots de precio se almacenan en la moneda nativa del activo. Al calcular P&L de una posición, se busca el snapshot + el CCL del mismo día para convertir.

### Excepción: DcaEntry.accumulated_capital_usd

Las estrategias DCA son explícitamente en USD (el Excel las registra en USD). El campo `accumulated_capital_usd` se persiste en USD porque:
1. Es el valor que el usuario ingresa directamente (no se deriva de precio × unidades).
2. Tiene semántica propia: "cuánto capital total tengo en esta estrategia ahora mismo".
3. Las estrategias DCA del Excel ya tienen este campo calculado y persistido.

## Consecuencias

- **Beneficio**: los datos históricos son siempre reproducibles. Si se corrige un CCL, solo se actualiza la fila de `CclRate` y todos los cálculos se actualizan automáticamente.
- **Beneficio**: el valor en ARS original se preserva (útil para auditoría fiscal).
- **Costo**: las queries de P&L requieren un JOIN con `CclRate`, levemente más complejas.
- **Costo**: hay que mantener el histórico de CCL completo (desde la primera operación). La tabla `CclRate` se importa desde el Excel (1288 registros) y se actualiza diariamente.

## Fuente del CCL

La API de Ambito Financiero provee el CCL histórico. La URL se configura en `config/ccl-sources.json`. El servicio de CCL hace fetch una vez por día hábil y persiste el valor en `CclRate`.

Para días sin cotización (feriados, fin de semana), se usa el último CCL disponible anterior: `WHERE date <= $fecha ORDER BY date DESC LIMIT 1`.
