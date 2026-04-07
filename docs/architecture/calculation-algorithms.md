# Algoritmos de Cálculo

Todos los cálculos financieros viven en `backend/src/lib/calculations.ts`. Nunca se persisten valores calculados en la DB (excepción: `trades.price_usd` y `trades.total_usd` como snapshot de trazabilidad).

---

## 1. Conversión ARS → USD

Para cualquier operación en un activo con `currency_native = ARS`, la conversión usa el CCL de la **fecha del trade** (no del día actual, no de la apertura de la posición).

```
price_usd = price_native / ccl_rate
total_usd = (units × price_native) / ccl_rate
```

**Lookup del CCL:**
```sql
SELECT rate FROM ccl_rates
WHERE date <= :trade_date
ORDER BY date DESC
LIMIT 1
```

Si no hay CCL para la fecha exacta (feriado, fin de semana), se usa automáticamente el del día hábil anterior. No hay error — el fallback es transparente.

---

## 2. Comisión

```
commission_amount = total_native × (commission_pct / 100)
```

La comisión se calcula sobre el total en moneda nativa del trade. Se almacena en `trades.commission_amount` (en moneda nativa) y se convierte a USD on-the-fly si es ARS.

```
commission_usd = commission_amount / ccl_rate   -- si ARS
commission_usd = commission_amount              -- si USD
```

La comisión **no** afecta `price_usd` ni `total_usd` — se reporta separada para transparencia.

---

## 3. Campos calculados de Position

Calculados al leer, nunca almacenados:

```
open_units   = Σ(units donde type = BUY) − Σ(units donde type = SELL)
status       = open_units > 0 ? 'OPEN' : 'CLOSED'
closed_at    = status = 'CLOSED' ? max(trade_date de SELLs) : null
days_open    = CURRENT_DATE − opened_at
```

---

## 4. Precio Promedio Ponderado de Compra (PPC)

El PPC solo considera los trades BUY. Representa el costo promedio por unidad en USD.

```
ppc_usd = Σ(units_BUY[i] × price_usd[i]) / Σ(units_BUY[i])
```

El PPC no cambia cuando se vende — refleja el costo histórico de compra.

---

## 5. P&L no realizado (posición OPEN)

```
capital_usd       = open_units × ppc_usd
current_value_usd = open_units × current_price_usd
pnl_usd           = current_value_usd − capital_usd
pnl_pct           = (pnl_usd / capital_usd) × 100
```

`current_price_usd` viene del cache de precios (TTL: 60s crypto, 300s acciones ARG). Si el precio está vencido pero hay snapshot disponible, se usa el snapshot con `priceStale: true`.

---

## 6. P&L realizado (trades SELL)

Cada SELL realiza ganancia/pérdida sobre las unidades vendidas al PPC vigente en ese momento.

```
pnl_realizado_usd = total_sell_usd − (units_sell × ppc_usd)
```

El P&L realizado acumulado de una posición:
```
pnl_realizado_total = Σ(total_sell_usd[i] − units_sell[i] × ppc_usd)
```

> El PPC usado en cada venta es el PPC calculado con todos los BUYs hasta ese momento — no el PPC final de la posición.

---

## 7. Campos calculados de DCA

### Capital acumulado

```
accumulated_capital_usd(entry_n) = Σ(amount_usd[1..n])
```

Calculado on-the-fly ordenando las entradas por `entry_date ASC`. Para entradas de tipo `CIERRE`, `amount_usd` es negativo — reduce el acumulado.

### Capital actual de la estrategia

```
capital_actual_usd = Σ(amount_usd de todas las entradas)
```

### Valor actual de la estrategia (si hay precio)

```
current_value_usd = total_units_acquired × current_price_usd
pnl_usd           = current_value_usd − capital_actual_usd
pnl_pct           = (pnl_usd / capital_actual_usd) × 100
```

---

## 8. Conversión DCA en ARS

Para estrategias DCA sobre activos con `currency_native = ARS`:

```
amount_usd = amount_ars / ccl_rate_at_entry_date
```

Se almacenan `amount_ars`, `ccl_rate_id` y `amount_usd`. El lookup de CCL usa la misma regla de fallback que los trades (día hábil anterior si no hay CCL exacto).

---

## 9. Precio con flag stale

Al resolver el precio actual de un activo:

```
1. Buscar en cache en memoria:
   - crypto:     TTL = 60s
   - acciones ARG: TTL = 300s
2. Si cache miss o expirado:
   a. Intentar fetch de API externa (CoinGecko / IOL / RAVA)
   b. Si OK → actualizar cache, priceStale = false
   c. Si falla → buscar último price_snapshot disponible
      - Si existe → priceStale = true, priceFreshAt = snapshot.created_at
      - Si no existe → currentPrice = null (activo sin historial de precios)
```
