# API — DCA: Strategies & Entries

Módulo de Dollar Cost Averaging. Modela la acumulación periódica de activos sin precio unitario obligatorio.

Pantallas: **S05** (lista estrategias), **S06** (detalle estrategia), **S07** (modal nueva entrada).

> ⚠️ DCA y Trading son modelos completamente separados. Una `DcaStrategy` no comparte datos con `Position`.

---

## Strategies

### GET /dca/strategies

Lista todas las estrategias DCA con métricas calculadas. Alimenta S05.

#### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `isActive` | boolean | — | `true` = solo activas, `false` = solo cerradas |
| `assetId` | UUID | — | Filtra por activo |
| `portfolioId` | UUID | — | Filtra por cartera |
| `page` | integer | 1 | Paginación |
| `limit` | integer | 50 | Max: 200 |
| `sort` | string | `pnlPct` | `pnlPct`, `pnlUsd`, `capitalUsd`, `startedAt` |
| `order` | string | `desc` | `asc` / `desc` |

#### Respuesta 200

```json
{
  "data": [
    {
      "id":                    "uuid",
      "isActive":              true,
      "asset": {
        "id":       "uuid",
        "ticker":   "BTC",
        "name":     "Bitcoin",
        "currency": "USD"
      },
      "portfolio": { "id": "uuid", "name": "Cryptos" },
      "broker":    { "id": "uuid", "name": "Binance" },
      "startedAt":             "2023-01-15",
      "closedAt":              null,
      "daysActive":            826,
      "entriesCount":          12,
      "accumulatedCapitalUsd": "4200.00",
      "currentValueUsd":       "5090.00",
      "pnlUsd":                "890.00",
      "pnlPct":                "21.19",
      "notes":                 null
    }
  ],
  "meta": { "total": 4, "page": 1, "limit": 50, "pages": 1 }
}
```

#### Flujo: Camino feliz
```
1. Valida query params
2. Consulta dca_strategies con filtros, JOINs a asset + portfolio + broker
3. Por cada estrategia:
   a. accumulatedCapitalUsd = Σ entry.accumulated_capital_usd de todas las entries
   b. Obtiene precio actual del asset
   c. totalUnitsAccumulated = Σ units recibidos en entries de tipo Apertura/Incremento
   d. currentValueUsd = totalUnits × precioActual (convertido si ARS)
   e. pnlUsd = currentValueUsd − accumulatedCapitalUsd
4. Ordena, pagina, devuelve
```

---

### GET /dca/strategies/:id

Detalle completo de una estrategia con todas sus entradas. Alimenta S06.

#### Respuesta 200

```json
{
  "data": {
    "id":       "uuid",
    "isActive": true,
    "asset": {
      "id": "uuid", "ticker": "BTC", "name": "Bitcoin", "currency": "USD"
    },
    "portfolio":  { "id": "uuid", "name": "Cryptos" },
    "broker":     { "id": "uuid", "name": "Binance" },
    "startedAt":  "2023-01-15",
    "closedAt":   null,
    "daysActive": 826,
    "accumulatedCapitalUsd": "4200.00",
    "currentValueUsd":       "5090.00",
    "avgDcaPrice":           "41200.00",
    "pnlUsd":                "890.00",
    "pnlPct":                "21.19",
    "entries": [
      {
        "id":                   "uuid",
        "type":                 "APERTURA",
        "entryDate":            "2023-01-15",
        "amountUsd":            "300.00",
        "accumulatedCapitalUsd": "300.00",
        "assetPriceAtEntry":    "21500.00",
        "unitsReceived":        "0.01395",
        "notes":                null,
        "createdAt":            "2023-01-15T10:00:00Z"
      }
    ]
  }
}
```

**`avgDcaPrice`:** precio promedio ponderado por monto = Σ(amountUsd) / Σ(unitsReceived). Calculado en servicio, no en DB.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Estrategia no existe |

---

### POST /dca/strategies

Crea una nueva estrategia DCA (sin entradas todavía).

#### Body

```json
{
  "portfolioId": "uuid",
  "assetId":     "uuid",
  "brokerId":    "uuid",
  "startedAt":   "2026-04-05",
  "notes":       "Acumulación mensual de BTC"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `portfolioId` | UUID | ✓ | Debe existir |
| `assetId` | UUID | ✓ | Debe existir y estar activo |
| `brokerId` | UUID | ✓ | Debe existir |
| `startedAt` | date | ✓ | No futura |
| `notes` | string | — | max 500 chars |

#### Respuesta 201

```json
{
  "data": {
    "id":        "uuid",
    "isActive":  true,
    "startedAt": "2026-04-05",
    "asset": { "..." },
    "entries": []
  }
}
```

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | FK no existe |
| `validation-error` | 422 | Campos inválidos |

---

### PATCH /dca/strategies/:id

Actualiza una estrategia (notas, broker). No permite cambiar asset ni portfolio.

#### Body (todos opcionales)

```json
{
  "brokerId": "uuid",
  "notes":    "Cambié a BingX por menor comisión"
}
```

#### Respuesta 200

Devuelve la estrategia actualizada.

---

### GET /dca/strategies/:id/summary

Resumen de métricas calculadas de una estrategia. Útil para actualizar S06 sin recargar entries.

#### Respuesta 200

```json
{
  "data": {
    "strategyId":            "uuid",
    "accumulatedCapitalUsd": "4200.00",
    "currentValueUsd":       "5090.00",
    "avgDcaPrice":           "41200.00",
    "currentPrice":          "67800.00",
    "pnlUsd":                "890.00",
    "pnlPct":                "21.19",
    "daysActive":            826,
    "entriesCount":          12,
    "priceFreshAt":          "2026-04-05T14:30:00Z"
  }
}
```

---

## Entries

### GET /dca/strategies/:strategyId/entries

Lista todas las entradas de una estrategia. Incluido en `/strategies/:id` pero disponible por separado.

#### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `type` | string | — | `APERTURA` / `INCREMENTO` / `CIERRE` |
| `sort` | string | `entryDate` | Campo de orden |
| `order` | string | `asc` | `asc` / `desc` |

#### Respuesta 200

```json
{
  "data": [
    {
      "id":                    "uuid",
      "strategyId":            "uuid",
      "type":                  "APERTURA",
      "entryDate":             "2023-01-15",
      "amountUsd":             "300.00",
      "accumulatedCapitalUsd": "300.00",
      "assetPriceAtEntry":     "21500.00",
      "unitsReceived":         "0.01395",
      "notes":                 null
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 50, "pages": 1 }
}
```

---

### POST /dca/strategies/:strategyId/entries

Registra una nueva entrada en una estrategia. Alimenta modal S07.

#### Body

```json
{
  "type":              "INCREMENTO",
  "entryDate":         "2026-04-05",
  "amountUsd":         "500.00",
  "assetPriceAtEntry": "67800.00",
  "unitsReceived":     "0.00737",
  "notes":             "Compra mensual programada"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `type` | enum | ✓ | `APERTURA` / `INCREMENTO` / `CIERRE` |
| `entryDate` | date | ✓ | No futura. ≥ strategy.startedAt |
| `amountUsd` | string | ✓ | > 0 |
| `assetPriceAtEntry` | string | — | > 0 si se provee |
| `unitsReceived` | string | — | ≥ 0 si se provee |
| `notes` | string | — | max 500 chars |

> `assetPriceAtEntry` y `unitsReceived` son opcionales porque en DCA puro no siempre se registra el precio exacto.

#### Respuesta 201

```json
{
  "data": {
    "id":                    "uuid",
    "strategyId":            "uuid",
    "type":                  "INCREMENTO",
    "entryDate":             "2026-04-05",
    "amountUsd":             "500.00",
    "accumulatedCapitalUsd": "4700.00",
    "assetPriceAtEntry":     "67800.00",
    "unitsReceived":         "0.00737",
    "notes":                 "Compra mensual programada",
    "createdAt":             "2026-04-05T14:35:00Z"
  }
}
```

**`accumulatedCapitalUsd`** se calcula automáticamente = suma de todos los `amountUsd` de la estrategia hasta esta entrada.

#### Flujo: Camino feliz
```
1. Verifica que strategyId existe
2. Verifica que estrategia isActive = true
3. Valida body (type, amountUsd, entryDate)
4. Verifica entryDate ≥ strategy.startedAt
5. Si type = APERTURA y ya existen otras entradas → advierte (no bloquea, solo log)
6. Calcula accumulatedCapitalUsd = sumaAnterior + amountUsd
7. Inserta DcaEntry
8. Devuelve 201 con la entry y accumulatedCapitalUsd actualizado
```

#### Flujos alternativos

| Condición | Error | Status |
|-----------|-------|--------|
| strategyId no existe | `not-found` | 404 |
| Estrategia cerrada | `strategy-already-closed` | 409 |
| amountUsd ≤ 0 | `validation-error` | 422 |
| entryDate anterior a startedAt | `validation-error` | 422 |
| type no es enum válido | `validation-error` | 422 |

---

### PATCH /dca/entries/:id

Corrige una entrada. Solo si la estrategia sigue activa.

#### Body (todos opcionales)

```json
{
  "entryDate":         "2026-04-04",
  "amountUsd":         "450.00",
  "assetPriceAtEntry": "67200.00",
  "unitsReceived":     "0.00670",
  "notes":             "Corrección de monto"
}
```

#### Respuesta 200

Devuelve la entry actualizada. `accumulatedCapitalUsd` se recalcula para todas las entries posteriores.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Entry no existe |
| `strategy-already-closed` | 409 | Estrategia cerrada |
| `validation-error` | 422 | Valores inválidos |

---

### DELETE /dca/entries/:id

Elimina una entrada. Solo si la estrategia sigue activa.

#### Respuesta 204

Sin body. Recalcula `accumulatedCapitalUsd` de las entries posteriores.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Entry no existe |
| `strategy-already-closed` | 409 | Estrategia cerrada |
