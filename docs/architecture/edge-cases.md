# Edge Cases y Comportamiento en Casos Límite

Describe el comportamiento esperado del sistema ante situaciones no felices. Cada caso incluye la causa, la respuesta del servicio y cómo debe manejarlo el frontend.

---

## CCL

### Fecha sin CCL (feriado / fin de semana)

**Causa:** el usuario registra un trade con `tradeDate` en un día sin cotización CCL.

**Comportamiento:**
```sql
SELECT rate FROM ccl_rates WHERE date <= :trade_date ORDER BY date DESC LIMIT 1
```
Se usa el CCL del último día hábil anterior. Transparente — sin error ni advertencia.

**Frontend:** no requiere manejo especial.

---

### CCL no cargado (historial vacío o muy desactualizado)

**Causa:** la tabla `ccl_rates` no tiene datos para las fechas requeridas y el fallback no encuentra ningún registro anterior.

**Comportamiento:** el servicio devuelve `ccl-not-available` 422.

**Frontend:** mostrar mensaje "No hay CCL disponible para esta fecha. Cargá el historial CCL antes de registrar este trade."

---

### Edición de CCL ya usado en trades

**Causa:** el usuario modifica el valor de un CCL que ya fue usado en uno o más trades.

**Comportamiento:** se permite la edición sin restricción. Los trades existentes tienen `ccl_rate_id` como FK — al leer, usarán el nuevo valor del CCL. Todos los cálculos (P&L, PPC, etc.) se recalculan con el valor corregido en el próximo request.

**Frontend:** no requiere manejo especial. El recálculo es automático.

---

## Precios

### API de precios no disponible (con snapshots)

**Causa:** CoinGecko / IOL / RAVA no responde al intentar obtener precio actual.

**Comportamiento:** el servicio busca el último `price_snapshot` disponible para el activo y lo usa con `priceStale: true`.

**Respuesta:**
```json
{
  "currentPrice": "17.71",
  "priceStale": true,
  "priceFreshAt": "2026-04-04T10:00:00Z"
}
```

**Frontend:** mostrar el precio con indicación visual clara de desactualización (ej: color amarillo, ícono de advertencia, tooltip con `priceFreshAt`).

---

### API de precios no disponible (sin snapshots)

**Causa:** activo nuevo o recién agregado, sin historial de snapshots, y la API falla.

**Comportamiento:** campos de precio devueltos como `null`.

```json
{
  "currentPrice": null,
  "currentValueUsd": null,
  "pnlUsd": null,
  "pnlPct": null,
  "priceStale": false
}
```

**Frontend:** mostrar "—" en los campos de valuación. La posición igual se muestra con sus datos de costo.

---

## Trades

### SELL con más unidades de las disponibles

**Causa:** el usuario intenta vender más unidades de las que tiene en la posición.

**Comportamiento:** `insufficient-units` 409.

```json
{
  "error": "insufficient-units",
  "detail": "Intentás vender 150 unidades pero solo tenés 80 disponibles."
}
```

**Frontend:** validar en el formulario antes del submit mostrando las unidades disponibles actuales.

---

### Edición de trade que deja open_units negativo

**Causa:** el usuario edita un SELL aumentando sus unidades, lo que dejaría el balance negativo.

**Comportamiento:** `insufficient-units` 409 con detalle del balance resultante.

---

### Borrar trade de posición CLOSED

**Causa:** el usuario intenta borrar un trade de una posición con `open_units = 0`.

**Comportamiento:** `position-already-closed` 409.

**Frontend:** deshabilitar el botón "Borrar" en trades de posiciones CLOSED. Mostrar mensaje "No se puede borrar trades de posiciones cerradas. Podés editarlos."

---

### Agregar trade a posición CLOSED

**Causa:** el usuario intenta agregar un nuevo BUY o SELL a una posición con `open_units = 0`.

**Comportamiento:** `position-already-closed` 409.

> **Nota:** si el usuario quiere "reabrir" la posición, debe editar un SELL existente para reducir sus unidades, lo que hará que `open_units > 0` automáticamente.

---

## DCA

### Agregar entrada a estrategia con CIERRE registrado

**Causa:** la estrategia tiene `is_active = false` (se registró un CIERRE) y el usuario intenta agregar una entrada.

**Comportamiento:** `strategy-closed` 409.

**Frontend:** mostrar la estrategia como inactiva y deshabilitar el formulario de nueva entrada.

---

### DCA en activo ARS sin CCL para la fecha

**Causa:** el usuario registra una entrada DCA en un activo ARS pero no hay CCL disponible.

**Comportamiento:** `ccl-not-available` 422. Mismo fallback que trades: usa el CCL del día hábil anterior. Solo devuelve error si no existe ningún CCL anterior.

---

## Fechas y Timezone

### Política de timezone

Las fechas de negocio (`trade_date`, `entry_date`, `opened_at`) se almacenan como `DATE` (sin hora ni timezone). Representan la fecha en que ocurrió la operación según el usuario, independientemente de la hora del día o el timezone.

`created_at` y `updated_at` son `TIMESTAMPTZ` — timestamps reales del sistema en UTC.

**Regla:** nunca convertir fechas de negocio con timezone. El usuario escribe "2024-03-15" y eso es lo que se almacena y se usa para lookup de CCL.

---

## Borrado en cascada

| Entidad borrada | Efecto |
|---|---|
| Portfolio con posiciones | RESTRICT — error, no se permite |
| Portfolio con estrategias DCA | RESTRICT — error, no se permite |
| Asset con posiciones | RESTRICT — error, no se permite |
| Broker con posiciones | RESTRICT — error, no se permite |
| Position | CASCADE → borra todos sus trades |
| DcaStrategy | CASCADE → borra todas sus entradas |
| Asset sin posiciones | Permitido |
| CCL rate usado en trade | RESTRICT — error, no se permite |
| CCL rate usado en dca_entry | RESTRICT — error, no se permite |
| PriceSnapshot | CASCADE desde asset (snapshots son efímeros) |
