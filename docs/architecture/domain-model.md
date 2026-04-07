# Modelo de Dominio

Este documento describe las entidades del dominio, sus atributos y relaciones. Es la referencia central para el diseño de la base de datos y los servicios del backend.

---

## Conceptos Fundamentales

### Trading vs DCA: dos modelos distintos

El sistema maneja dos paradigmas de inversión radicalmente diferentes:

**Trading** es una lógica de **posiciones**: se compra un activo con intención de venderlo cuando suba. Una *posición* agrupa múltiples órdenes de compra y venta del mismo activo en una cartera. Su estado (OPEN/CLOSED) es calculado: si `Σ(units BUY) > Σ(units SELL)` está OPEN; si son iguales, CLOSED. No hay acción manual de cierre. Métricas clave: P&L realizado/no realizado, precio promedio ponderado de compra (PPC).

**DCA (Dollar Cost Averaging)** es una lógica de **acumulación estratégica**: se invierte periódicamente sin importar el precio, construyendo una posición promediando el costo. Una *estrategia DCA* tiene entradas de tipo Apertura, Incremento o Cierre. No hay precio unitario obligatorio — lo relevante es el capital invertido acumulado y el P&L total al cierre.

Estos dos modelos **no comparten tablas**. Mezclarlos generaría complejidad innecesaria y lógica de negocio contradictoria.

### Dual-Currency con CCL Histórico

El sistema opera en dos monedas: **ARS** (pesos argentinos) y **USD**. Los activos argentinos (acciones, Cedears, FCI, bonos) se transan en ARS pero se quiere ver el valor en USD usando el tipo de cambio **CCL** (Contado con Liquidación).

**Regla central**: todos los valores se almacenan en la **moneda nativa** del activo. La conversión se hace en la capa de servicio usando el `CclRate` del día de la operación.

Esto garantiza que si el CCL histórico se corrige, todos los cálculos siguen siendo reproducibles sin necesidad de actualizar datos en la DB.

---

## Entidades

### Asset (Activo)

Catálogo maestro de instrumentos financieros. Incluye cryptos, acciones argentinas, Cedears, FCI, bonos y commodities.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `ticker` | VARCHAR(20) | Símbolo del activo: "BTC", "GGAL", "AAPL", "AL30" |
| `name` | VARCHAR(100) | Nombre completo |
| `asset_type` | ENUM | `CRYPTO`, `ACCION_ARG`, `CEDEAR`, `FCI`, `BONO`, `COMMODITY` |
| `currency_native` | ENUM | `ARS` o `USD` — moneda en la que cotiza |
| `price_source` | ENUM | `COINGECKO`, `IOL`, `RAVA`, `MANUAL` |
| `price_source_id` | VARCHAR(100) | ID del activo en la API externa (ej: "bitcoin" en CoinGecko) |
| `is_active` | BOOLEAN | Para desactivar sin borrar |
| `created_at` | TIMESTAMP | |

**Notas:**
- Los Cedears (acciones extranjeras en pesos) tienen `currency_native = ARS` aunque el subyacente sea USD.
- `price_source_id` permite que "AAPL" en la app se mapee a "apple-inc" en CoinGecko o al ticker correcto en IOL.

---

### Broker

Entidades que ejecutan las operaciones. Cada uno tiene su propia comisión y moneda operativa.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `name` | VARCHAR(50) | "IOL", "Binance", "BingX", "Balanz" |
| `commission_pct` | NUMERIC(6,4) | Comisión en porcentaje: 0.7000 = 0.7% |
| `currency` | ENUM | `ARS` o `USD` — moneda operativa del broker |
| `config` | JSONB | Configuración adicional (no API keys — esas van en .env) |

**Brokers actuales:**

| Broker | Comisión | Moneda |
|---|---|---|
| IOL (InvertirOnline) | 0.70% | ARS |
| Binance | 0.726% | USD |
| BingX | 0.20% | USD |
| Balanz | 0.70% | ARS |

---

### Portfolio (Cartera)

Agrupa posiciones o estrategias con un objetivo de inversión común.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `name` | VARCHAR(100) | "Cryptos", "Acciones ARG", "Cartera Jubilación" |
| `portfolio_type` | ENUM | `TRADING` o `DCA` |
| `strategy` | ENUM | `CORTO_PLAZO`, `LARGO_PLAZO`, `JUBILACION` |
| `currency_base` | ENUM | `ARS` o `USD` — moneda de reporte |
| `broker_id` | UUID | FK → Broker principal |
| `description` | TEXT | |
| `is_active` | BOOLEAN | |

**Carteras actuales (del Excel):**

| Cartera | Tipo | Moneda base |
|---|---|---|
| Cryptos | TRADING | USD |
| Acciones ARG | TRADING | ARS |
| Cartera corto plazo (Cedears) | TRADING | ARS |
| Cartera Jubilación | TRADING | ARS |
| FCI_USD | TRADING | USD |
| Renta fija | TRADING | ARS |
| DCA BTC | DCA | USD |
| DCA ETH | DCA | USD |
| DCA ADA | DCA | USD |
| DCA PAXGUSD (Oro) | DCA | USD |
| Estrategia Michel Saylor | DCA | USD |

---

### CclRate (Tipo de Cambio CCL)

Serie histórica diaria del tipo de cambio Contado con Liquidación.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `date` | DATE | Fecha (única) |
| `rate` | NUMERIC(10,4) | Valor del CCL ese día |
| `source` | VARCHAR(50) | "AMBITO" o "MANUAL" |
| `created_at` | TIMESTAMP | |

**Índice único**: `(date)`

La consulta más común es `WHERE date <= $fecha ORDER BY date DESC LIMIT 1` para obtener el CCL del día de una operación, incluso si ese día no hubo cotización (feriado/fin de semana).

---

## Sub-modelo: Trading

### Position (Posición)

Agrupación de trades del mismo activo en una cartera de trading.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `portfolio_id` | UUID | FK → Portfolio |
| `asset_id` | UUID | FK → Asset |
| `opened_at` | DATE | Fecha del primer trade |
| `notes` | TEXT | Notas generales de la posición |

**Campos calculados (no en DB):**
- `open_units = Σ(units BUY) − Σ(units SELL)`
- `status = open_units > 0 ? 'OPEN' : 'CLOSED'`
- `closed_at = max(trade_date de SELLs)` cuando `status = CLOSED`

**Regla de negocio**: el cierre es automático e implícito — ocurre cuando `open_units = 0`. No hay endpoint de cierre manual.

Una posición puede tener múltiples trades de compra (promediando a la baja/alza) y múltiples trades de venta parcial.

### Trade (Orden)

Cada operación individual de compra o venta dentro de una posición.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `position_id` | UUID | FK → Position |
| `trade_type` | ENUM | `BUY` o `SELL` |
| `trade_date` | DATE | Fecha de la operación |
| `units` | NUMERIC(18,8) | Cantidad de unidades (siempre positivo) |
| `price_native` | NUMERIC(18,8) | Precio unitario en moneda nativa del activo |
| `price_currency` | ENUM | `ARS` o `USD` |
| `ccl_rate_id` | UUID | FK → CclRate — nullable si la operación es en USD puro |
| `commission_pct` | NUMERIC(6,4) | Comisión aplicada en este trade |
| `commission_amount` | NUMERIC(18,4) | Monto de comisión |
| `broker_id` | UUID | FK → Broker |
| `notes` | TEXT | |
| `created_at` | TIMESTAMP | |

**Campos calculados (NO en DB, en `lib/calculations.ts`):**
- `total_native`: `units * price_native`
- `total_usd`: `total_native / ccl_rate` (si ARS) o `total_native` (si USD)
- `commission_usd`: `commission_amount / ccl_rate` (si ARS)

---

## Sub-modelo: DCA

### DcaStrategy (Estrategia DCA)

Una estrategia de acumulación para un activo específico.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `portfolio_id` | UUID | FK → Portfolio |
| `asset_id` | UUID | FK → Asset |
| `name` | VARCHAR(100) | "Estrategia BTC DCA", "Michel Saylor" |
| `is_active` | BOOLEAN | Si la estrategia sigue abierta |
| `started_at` | DATE | Fecha de la primera entrada |
| `notes` | TEXT | |

### DcaEntry (Entrada DCA)

Cada movimiento dentro de una estrategia DCA.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `strategy_id` | UUID | FK → DcaStrategy |
| `entry_date` | DATE | Fecha de la entrada |
| `entry_type` | ENUM | `APERTURA`, `INCREMENTO`, `CIERRE` |
| `amount_usd` | NUMERIC(12,4) | Dólares aportados. Si ARS: `amount_ars / ccl_rate` |
| `amount_ars` | NUMERIC(12,4) | Monto original en ARS — nullable, solo activos ARS |
| `ccl_rate_id` | UUID | FK → CclRate — requerido si `amount_ars` presente |
| `units_acquired` | NUMERIC(18,8) | Unidades del activo — nullable (Michel Saylor no las registra) |
| `price_usd_at_entry` | NUMERIC(18,8) | Precio del activo al momento de la entrada — nullable |
| `profit_loss_usd` | NUMERIC(12,4) | Ganancia/pérdida realizada — solo para `entry_type = CIERRE` |
| `notes` | TEXT | |

**`accumulated_capital_usd` es calculado (no en DB)**: se obtiene on-the-fly como `Σ(amount_usd)` de todas las entradas anteriores ordenadas por `entry_date`.

---

## Sub-modelo: Precios

### PriceSnapshot (Precio Histórico)

Precios de cierre diarios de activos, para cálculos históricos de P&L.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria |
| `asset_id` | UUID | FK → Asset |
| `price_date` | DATE | Fecha del precio |
| `price` | NUMERIC(18,8) | Precio de cierre en la moneda nativa |
| `currency` | ENUM | `ARS` o `USD` |
| `source` | VARCHAR(50) | "COINGECKO", "IOL", "MANUAL" |
| `created_at` | TIMESTAMP | |

**Índice único**: `(asset_id, price_date)`

---

## Diagrama de Relaciones

```
Broker ──────────────────────────────────────┐
  │                                           │
  └──(N) Portfolio ──────────┐               │
              │              │               │
       (TRADING type)   (DCA type)           │
              │              │               │
              ▼              ▼               │
          Position       DcaStrategy         │
              │              │               │
              ▼              ▼               │
           Trade          DcaEntry           │
              │                              │
              └──────────── Broker ◄─────────┘
              │
              └──────────── CclRate (por fecha)

Asset ────────────────────────────────────────┐
  │                                           │
  ├──(N) Position                             │
  ├──(N) DcaStrategy                          │
  └──(N) PriceSnapshot                       │
```

---

## Reglas de Negocio Clave

1. `status` de una posición es calculado: `OPEN` si `Σ(units BUY) > Σ(units SELL)`, `CLOSED` si son iguales.
2. `closed_at` de una posición es calculado: `max(trade_date)` de los trades SELL cuando `status = CLOSED`.
3. El `ccl_rate_id` en un Trade es obligatorio si `price_currency = ARS`.
4. El `ccl_rate_id` en un Trade puede ser NULL si `price_currency = USD` y el activo opera nativamente en USD.
5. `DcaEntry.entry_type = CIERRE` debe tener `profit_loss_usd` no nulo.
6. `DcaEntry.accumulated_capital_usd` es calculado on-the-fly: `Σ(amount_usd)` de todas las entradas anteriores ordenadas por `entry_date`. No se persiste.
7. Una `DcaStrategy` con `is_active = false` no debe tener entradas posteriores a la fecha de la última entrada de tipo `CIERRE`.
