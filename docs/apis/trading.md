# API — Trading: Positions & Trades

Módulo central de trading. Gestiona posiciones (grupos de trades del mismo activo en una cartera) y los trades individuales de compra/venta.

Pantallas: **S02** (lista posiciones), **S03** (detalle posición), **S04** (modal trade).

---

## Positions

### GET /trading/positions

Lista posiciones con filtros. Alimenta S02.

#### Query params

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `portfolioId` | UUID | No | Filtra por cartera |
| `status` | string | No | `OPEN` / `CLOSED` / omitir = todas |
| `assetId` | UUID | No | Filtra por activo |
| `page` | integer | No | Default: 1 |
| `limit` | integer | No | Default: 50, max: 200 |
| `sort` | string | No | `pnlPct`, `pnlUsd`, `capitalUsd`, `daysOpen`, `openedAt` |
| `order` | string | No | `asc` / `desc` (default: `desc`) |

#### Respuesta 200

```json
{
  "data": [
    {
      "id":             "uuid",
      "status":         "OPEN",
      "assetId":        "uuid",
      "assetTicker":    "GGAL",
      "assetName":      "Grupo Galicia",
      "portfolioId":    "uuid",
      "portfolioName":  "Acciones ARG",
      "brokerId":       "uuid",
      "brokerName":     "IOL",
      "openedAt":       "2024-03-12",
      "closedAt":       null,
      "daysOpen":       312,
      "totalUnits":     "240",
      "avgPricePpc":    "12.92",
      "capitalUsd":     "3100.00",
      "currentPrice":   "17.71",
      "currentValueUsd": "4250.40",
      "pnlUsd":         "1150.40",
      "pnlPct":         "37.11",
      "tradesCount":    3
    }
  ],
  "meta": { "total": 8, "page": 1, "limit": 50, "pages": 1 }
}
```

#### Flujo: Camino feliz
```
1. Valida query params (tipos, valores permitidos)
2. Consulta positions con JOINs a asset, portfolio, broker
3. Para cada posición:
   - Calcula PPC = Σ(units_buy × price_usd) / Σ(units_buy)
   - totalUnits = Σunits_buy − Σunits_sell
   - capitalUsd = totalUnits × PPC
   - currentValueUsd = totalUnits × precio_actual (convertido si ARS)
   - pnlUsd = currentValueUsd − capitalUsd
4. Aplica sort, pagina, devuelve
```

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `validation-error` | 422 | `portfolioId` no es UUID válido |
| `not-found` | 404 | `portfolioId` no existe |

---

### GET /trading/positions/:id

Detalle de una posición con todos sus trades. Alimenta S03.

#### Path params

| Param | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID de la posición |

#### Respuesta 200

```json
{
  "data": {
    "id":            "uuid",
    "status":        "OPEN",
    "asset": {
      "id":       "uuid",
      "ticker":   "GGAL",
      "name":     "Grupo Galicia",
      "type":     "ACCION_ARG",
      "currency": "ARS"
    },
    "portfolio": { "id": "uuid", "name": "Acciones ARG" },
    "broker":    { "id": "uuid", "name": "IOL", "commissionPct": "0.7000" },
    "openedAt":  "2024-03-12",
    "closedAt":  null,
    "daysOpen":  312,
    "totalUnits":      "240",
    "avgPricePpc":     "12.92",
    "capitalUsd":      "3100.00",
    "currentPrice":    "17.71",
    "currentValueUsd": "4250.40",
    "pnlUsd":          "1150.40",
    "pnlPct":          "37.11",
    "trades": [
      {
        "id":          "uuid",
        "type":        "BUY",
        "tradeDate":   "2024-03-12",
        "units":       "100",
        "priceNative": "14890.00",
        "currency":    "ARS",
        "cclRate":     "1150.20",
        "priceUsd":    "12.95",
        "totalUsd":    "1295.00",
        "commission":  "9.07",
        "notes":       null,
        "createdAt":   "2024-03-12T10:00:00Z"
      }
    ]
  }
}
```

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Posición no existe |

---

### POST /trading/positions

Crea una posición nueva con su primer trade (BUY obligatorio).

#### Body

```json
{
  "portfolioId": "uuid",
  "assetId":     "uuid",
  "brokerId":    "uuid",
  "trade": {
    "tradeDate":   "2026-04-05",
    "units":       "100",
    "priceNative": "21580.00",
    "notes":       "Compra inicial"
  }
}
```

**Campos del body:**

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `portfolioId` | UUID | ✓ | Debe existir |
| `assetId` | UUID | ✓ | Debe existir y estar activo |
| `brokerId` | UUID | ✓ | Debe existir |
| `trade.tradeDate` | date (ISO) | ✓ | No puede ser futura |
| `trade.units` | string (decimal) | ✓ | > 0 |
| `trade.priceNative` | string (decimal) | ✓ | > 0, en moneda nativa del asset |
| `trade.notes` | string | — | max 500 chars |

#### Respuesta 201

```json
{
  "data": {
    "id":        "uuid",
    "status":    "OPEN",
    "openedAt":  "2026-04-05",
    "assetId":   "uuid",
    "portfolioId": "uuid",
    "brokerId":  "uuid",
    "trades": [{ "...primer trade..." }]
  }
}
```

#### Flujo: Camino feliz
```
1. Valida body (campos requeridos, tipos, rangos)
2. Verifica que portfolioId, assetId, brokerId existen
3. Si asset.currency = ARS:
   a. Busca CclRate para trade.tradeDate
   b. Si no existe → error ccl-not-available
   c. priceUsd = priceNative / cclRate
4. Si asset.currency = USD:
   a. priceUsd = priceNative
5. Crea Position (status=OPEN, openedAt=trade.tradeDate)
6. Crea Trade (type=BUY, vinculado a la posición)
7. Devuelve 201 con la posición y el trade
```

#### Flujos alternativos

| Condición | Error | Cuándo |
|-----------|-------|--------|
| portfolioId/assetId/brokerId no existe | `not-found` 404 | FK inválida |
| units ≤ 0 o priceNative ≤ 0 | `validation-error` 422 | Valores inválidos |
| tradeDate en el futuro | `validation-error` 422 | Fecha futura |
| Sin CCL para la fecha (asset ARS) | `ccl-not-available` 422 | CCL no cargado |

---

### PATCH /trading/positions/:id/close

Cierra una posición. No se pueden agregar más trades después.

#### Body

```json
{
  "closedAt": "2026-04-05",
  "notes":    "Toma de ganancias"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `closedAt` | date | ✓ | Fecha de cierre |
| `notes` | string | — | Nota opcional |

#### Respuesta 200

```json
{
  "data": {
    "id":       "uuid",
    "status":   "CLOSED",
    "closedAt": "2026-04-05",
    "pnlRealizedUsd": "1150.40"
  }
}
```

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Posición no existe |
| `position-already-closed` | 409 | Ya estaba cerrada |
| `validation-error` | 422 | `closedAt` anterior a `openedAt` |

---

### GET /trading/positions/:id/pnl

P&L calculado en tiempo real. Útil para actualizar S03 sin recargar los trades.

#### Respuesta 200

```json
{
  "data": {
    "positionId":      "uuid",
    "totalUnits":      "240",
    "capitalUsd":      "3100.00",
    "currentPrice":    "17.71",
    "currentValueUsd": "4250.40",
    "pnlUsd":          "1150.40",
    "pnlPct":          "37.11",
    "priceFreshAt":    "2026-04-05T14:30:00Z"
  }
}
```

---

## Trades

### GET /trading/positions/:positionId/trades

Lista todos los trades de una posición. Incluido en `GET /positions/:id` pero disponible por separado para actualizaciones parciales.

#### Respuesta 200

```json
{
  "data": [
    {
      "id":          "uuid",
      "type":        "BUY",
      "tradeDate":   "2024-03-12",
      "units":       "100",
      "priceNative": "14890.00",
      "currency":    "ARS",
      "cclRate":     "1150.20",
      "priceUsd":    "12.95",
      "totalUsd":    "1295.00",
      "commission":  "9.07",
      "notes":       null,
      "createdAt":   "2024-03-12T10:00:00Z"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 50, "pages": 1 }
}
```

---

### POST /trading/positions/:positionId/trades

Agrega un trade (BUY o SELL) a una posición existente. Alimenta modal S04.

#### Body

```json
{
  "type":        "BUY",
  "tradeDate":   "2026-04-05",
  "units":       "50",
  "priceNative": "21580.00",
  "notes":       "Promediando a la baja"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `type` | enum | ✓ | `BUY` / `SELL` |
| `tradeDate` | date | ✓ | No futura. Si SELL: ≥ `openedAt` de la posición |
| `units` | string | ✓ | > 0. Si SELL: ≤ unidades disponibles |
| `priceNative` | string | ✓ | > 0 |
| `notes` | string | — | max 500 chars |

#### Respuesta 201

```json
{
  "data": {
    "id":          "uuid",
    "positionId":  "uuid",
    "type":        "BUY",
    "tradeDate":   "2026-04-05",
    "units":       "50",
    "priceNative": "21580.00",
    "cclRate":     "1218.50",
    "priceUsd":    "17.71",
    "totalUsd":    "885.50",
    "commission":  "6.20"
  }
}
```

#### Flujo: Camino feliz
```
1. Verifica que positionId existe
2. Verifica que posición está OPEN
3. Valida body
4. Resuelve CCL si asset.currency = ARS:
   - Busca CclRate exacto para tradeDate
   - Si no existe → error ccl-not-available
5. Si type = SELL:
   - Calcula unidades disponibles actuales
   - Si units > disponibles → error insufficient-units
6. Calcula priceUsd, totalUsd, commission = totalUsd × broker.commissionPct
7. Inserta Trade
8. Devuelve 201
```

#### Flujos alternativos

| Condición | Error | Status |
|-----------|-------|--------|
| positionId no existe | `not-found` | 404 |
| Posición cerrada | `position-already-closed` | 409 |
| SELL con más unidades de las disponibles | `insufficient-units` | 409 |
| Sin CCL para la fecha | `ccl-not-available` | 422 |
| units ≤ 0 o priceNative ≤ 0 | `validation-error` | 422 |
| type inválido | `validation-error` | 422 |

---

### PATCH /trading/trades/:id

Corrige un trade existente (fecha, precio, unidades). Solo si la posición sigue OPEN.

#### Body (todos opcionales)

```json
{
  "tradeDate":   "2024-03-13",
  "units":       "90",
  "priceNative": "14950.00",
  "notes":       "Corrección de fecha"
}
```

#### Respuesta 200

Devuelve el trade actualizado con los campos recalculados (`priceUsd`, `totalUsd`, `commission`).

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Trade no existe |
| `position-already-closed` | 409 | La posición ya está cerrada |
| `validation-error` | 422 | Valores inválidos |
| `ccl-not-available` | 422 | Nueva fecha sin CCL (si ARS) |
| `insufficient-units` | 409 | Corrección de SELL deja balance negativo |

---

### DELETE /trading/trades/:id

Elimina un trade. Solo si la posición sigue OPEN y el balance resultante no queda negativo.

#### Respuesta 204

Sin body.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Trade no existe |
| `position-already-closed` | 409 | Posición cerrada |
| `validation-error` | 422 | Eliminar el trade dejaría unidades negativas |
