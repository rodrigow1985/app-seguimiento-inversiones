# API — Dashboard

Endpoints que alimentan la pantalla S01. Agregados calculados sobre todas las carteras y posiciones activas.

Base: `GET /api/v1/dashboard`

---

## GET /dashboard

Resumen general del portfolio. Alimenta las 4 metric cards de S01.

### Parámetros
Ninguno.

### Respuesta 200

```json
{
  "data": {
    "totalCapitalUsd":        "42830.00",
    "unrealizedPnlUsd":       "6241.50",
    "unrealizedPnlPct":       "17.08",
    "openPositionsCount":     14,
    "openPositionsPortfolios": 4,
    "activeDcaStrategiesCount": 4,
    "activeDcaCapitalUsd":    "11200.00",
    "lastUpdatedAt":          "2026-04-05T14:32:00Z"
  }
}
```

### Flujo: Camino feliz

```
1. GET /api/v1/dashboard
2. Service consulta todas las posiciones con status=OPEN
3. Para cada posición:
   a. Obtiene precio actual del asset (cache o API externa)
   b. Calcula valor actual = units × precio_actual
   c. Calcula P&L = valor_actual − capital_invertido_usd
4. Suma totales
5. Consulta DCA strategies con is_active=true → cuenta y suma capital
6. Devuelve agregado
```

### Flujos alternativos

| Condición | Comportamiento |
|-----------|---------------|
| API de precios caída | Calcula con último precio conocido (`priceSnapshot`). Incluye flag `"pricesStale": true` en respuesta |
| Sin posiciones abiertas | Devuelve todos los campos en `"0"` / `0` — nunca null |

---

## GET /dashboard/open-positions

Lista de posiciones activas con métricas calculadas. Alimenta la tabla principal de S01.

### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `limit` | integer | 50 | Máx resultados |
| `page` | integer | 1 | Paginación |
| `sort` | string | `pnlPct` | Campo de orden: `pnlPct`, `pnlUsd`, `capitalUsd`, `daysOpen` |
| `order` | string | `desc` | `asc` / `desc` |

### Respuesta 200

```json
{
  "data": [
    {
      "positionId":    "uuid",
      "assetTicker":   "BTC",
      "assetName":     "Bitcoin",
      "portfolioId":   "uuid",
      "portfolioName": "Cryptos",
      "brokerId":      "uuid",
      "brokerName":    "Binance",
      "daysOpen":      847,
      "openedAt":      "2024-01-05",
      "capitalUsd":    "8420.00",
      "currentValueUsd": "12340.00",
      "pnlUsd":        "3920.00",
      "pnlPct":        "46.55",
      "currentPrice":  "67800.00",
      "currency":      "USD"
    }
  ],
  "meta": { "total": 14, "page": 1, "limit": 50, "pages": 1 }
}
```

### Flujo: Camino feliz

```
1. GET /api/v1/dashboard/open-positions
2. Consulta positions WHERE status = 'OPEN'
3. Por cada posición JOIN asset, portfolio, broker
4. Calcula PPC (precio promedio ponderado de compra):
   PPC = Σ(units_i × price_usd_i) / Σ(units_i) sobre trades BUY
5. currentPrice = último precio del asset (cache)
6. currentValueUsd = units_total × currentPrice (convertido a USD si ARS)
7. pnlUsd = currentValueUsd − capitalUsd
8. pnlPct = (pnlUsd / capitalUsd) × 100
9. Ordena, pagina y devuelve
```

### Flujos alternativos

| Condición | Comportamiento |
|-----------|---------------|
| Precio no disponible | `"currentValueUsd": null`, `"pnlUsd": null`, `"pnlPct": null` |
| Sin posiciones abiertas | `data: []`, `meta.total: 0` |

---

## GET /dashboard/dca-summary

Resumen de estrategias DCA activas. Alimenta las DCA cards de S01.

### Respuesta 200

```json
{
  "data": [
    {
      "strategyId":      "uuid",
      "assetTicker":     "BTC",
      "assetName":       "Bitcoin",
      "isActive":        true,
      "entriesCount":    12,
      "accumulatedCapitalUsd": "4200.00",
      "currentValueUsd": "5090.00",
      "pnlUsd":          "890.00",
      "pnlPct":          "21.19",
      "startedAt":       "2023-01-15"
    }
  ],
  "meta": { "total": 4, "page": 1, "limit": 50, "pages": 1 }
}
```

### Flujo: Camino feliz

```
1. GET /api/v1/dashboard/dca-summary
2. Consulta dca_strategies WHERE is_active = true JOIN asset
3. Por cada estrategia:
   a. Suma accumulated_capital_usd de todas sus entries
   b. Obtiene precio actual del asset
   c. Calcula currentValueUsd (suma de activos acumulados × precio actual)
   d. pnlUsd = currentValueUsd − accumulatedCapitalUsd
4. Ordena por pnlPct desc, devuelve
```
