# Reglas de Negocio

Reglas que el servicio debe enforcer en cada operación. Complementa los constraints de DB — algunas son imposibles de expresar en SQL y viven exclusivamente en `backend/src/modules/`.

---

## Posiciones (Trading)

### Una posición por activo por cartera
- Constraint en DB: `UNIQUE (portfolio_id, asset_id)` en tabla `positions`
- Al crear una posición, el servicio verifica que no exista ya una para ese `(portfolio_id, asset_id)`
- Si existe, se agrega el trade a la posición existente (no se crea una nueva)

### Status calculado
- `status` y `closed_at` no se almacenan — se calculan a partir de los trades en cada request
- `status = OPEN` si `open_units > 0`, `CLOSED` si `open_units = 0`
- No hay endpoint de cierre manual

### Trades en posición CLOSED
- **Editar**: permitido. El servicio recalcula todo on-the-fly al siguiente request
- **Borrar**: prohibido — devuelve `position-already-closed` 409
- Al editar un trade de posición CLOSED, se valida que `open_units` no quede negativo

---

## Trades

### Validaciones al crear BUY
- `units > 0`
- `price_native > 0`
- `trade_date` no puede ser futura
- Si `asset.currency_native = ARS`: debe existir CCL para `trade_date` (con fallback al día hábil anterior)

### Validaciones al crear SELL
- Ídem BUY, más:
- `units ≤ open_units` actuales de la posición — devuelve `insufficient-units` 409 si se excede
- `trade_date ≥ position.opened_at`

### Editar trade
- Permitido si `open_units > 0` (OPEN) o si la posición está CLOSED (editar sí, borrar no)
- Al editar, se recalculan `price_usd`, `total_usd`, `commission_amount` en base a los nuevos valores
- Si cambia `trade_date` y el activo es ARS, se busca el nuevo CCL con fallback

### Borrar trade
- Solo permitido si la posición está OPEN (`open_units > 0`)
- Se valida que el balance resultante no quede negativo

---

## Estrategias DCA

### CIERRE total
- `type = CIERRE` siempre cierra completamente la estrategia
- El `amount_usd` de un CIERRE representa la ganancia/pérdida realizada (puede ser negativo)
- Al registrar un CIERRE, el servicio setea `dca_strategies.is_active = false` automáticamente
- No se permiten más entradas en una estrategia con `is_active = false`

### Capital acumulado
- `accumulated_capital_usd` es calculado on-the-fly como `Σ(amount_usd)` de todas las entradas ordenadas por `entry_date`
- Para entradas CIERRE, `amount_usd` es negativo — reduce el acumulado
- No se persiste ni se recalcula en cascada

### DCA en activos ARS
- Si `asset.currency_native = ARS`, la entrada requiere `amount_ars` y `ccl_rate_id`
- El servicio calcula `amount_usd = amount_ars / ccl_rate` y almacena los tres valores
- El lookup de CCL usa el mismo fallback al día hábil anterior que los trades

---

## CCL (Tipo de Cambio)

### Sync automático de Ambito
- El sync solo **inserta** si no existe ningún registro para esa fecha
- Si ya existe un registro (MANUAL o AMBITO), lo respeta — no sobreescribe
- Estrategia: "insert if not exists"

### Edición manual
- El usuario puede editar cualquier CCL via `PATCH /ccl/:date`
- Al editar, `source` pasa a `MANUAL`
- Auditoría básica via `updated_at` — sin historial de versiones en v1

### Fallback de fecha
- Si no hay CCL exacto para una fecha (feriado, fin de semana), el servicio usa:
  ```sql
  SELECT rate FROM ccl_rates WHERE date <= :fecha ORDER BY date DESC LIMIT 1
  ```
- El fallback es transparente — no genera error ni advertencia

---

## Precios

### Cache en memoria
| Tipo de activo | TTL del cache |
|---|---|
| CRYPTO | 60 segundos |
| ACCION_ARG, CEDEAR, FCI, BONO | 300 segundos |

### Resolución de precio (orden de prioridad)
1. Cache en memoria (si no expiró)
2. Fetch de API externa → actualiza cache
3. Si API falla → último `price_snapshot` disponible con `priceStale: true`
4. Si no hay snapshot → `currentPrice: null`

### priceStale
- Cuando se usa un snapshot por falla de API, la respuesta incluye:
  ```json
  { "priceStale": true, "priceFreshAt": "2026-04-04T10:00:00Z" }
  ```
- El frontend debe mostrar visualmente que el precio está desactualizado

---

## Portfolios

### currency_base
- Campo informativo únicamente — no afecta ningún cálculo
- Todos los cálculos y reportes se expresan en USD
- `currency_base` es metadata para el usuario

### Borrado
- Un portfolio no puede borrarse si tiene posiciones o estrategias DCA asociadas (`RESTRICT`)

---

## Brokers

### Comisión
- `commission_pct` del broker se usa al crear cada trade: `commission_amount = total_native × (commission_pct / 100)`
- Si el usuario edita un trade, la comisión se recalcula con el `commission_pct` actual del broker
- La comisión se almacena en moneda nativa del trade

### Borrado
- Un broker no puede borrarse si tiene posiciones o estrategias asociadas (`RESTRICT`)

---

## Migración de datos (Excel → DB)

- La importación masiva del Excel se realiza via **script Prisma directo** — no pasa por la API
- El script vive en `backend/prisma/seed/` o en un script de migración dedicado
- Los endpoints individuales de la API son para uso normal de la app post-migración
