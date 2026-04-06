# API — Portfolios (Carteras)

Agrupadores lógicos de posiciones y estrategias DCA. Cada cartera tiene un objetivo de inversión.

Carteras actuales: Cryptos, Acciones ARG, Cedears CP, Jubilación, FCI USD, Renta Fija.

---

## GET /portfolios

Lista todas las carteras.

### Respuesta 200

```json
{
  "data": [
    {
      "id":          "uuid",
      "name":        "Cryptos",
      "description": "Portfolio de criptomonedas",
      "currency":    "USD",
      "isActive":    true,
      "createdAt":   "2023-01-01T00:00:00Z"
    }
  ],
  "meta": { "total": 6, "page": 1, "limit": 50, "pages": 1 }
}
```

---

## GET /portfolios/:id

Detalle de una cartera con métricas calculadas. Alimenta el topbar al navegar a una cartera (S02).

### Respuesta 200

```json
{
  "data": {
    "id":          "uuid",
    "name":        "Acciones ARG",
    "description": "Acciones en pesos — IOL",
    "currency":    "USD",
    "isActive":    true,
    "openPositionsCount":  8,
    "closedPositionsCount": 3,
    "activeDcaCount":      2,
    "capitalUsd":          "18400.00",
    "currentValueUsd":     "21210.00",
    "pnlUsd":              "2810.00",
    "pnlPct":              "15.27",
    "createdAt":           "2023-01-01T00:00:00Z"
  }
}
```

Los campos de métricas se calculan en servicio (no persisten en DB).

### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Cartera no existe |

---

## POST /portfolios

Crea una cartera nueva.

### Body

```json
{
  "name":        "Bonos USD",
  "description": "Renta fija en dólares",
  "currency":    "USD"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `name` | string | ✓ | 1–100 chars, único |
| `description` | string | — | max 300 chars |
| `currency` | enum | ✓ | `ARS` / `USD` |

### Respuesta 201

Devuelve la cartera creada.

---

## PATCH /portfolios/:id

Actualiza nombre o descripción.

### Body (todos opcionales)

```json
{
  "name":        "Bonos & FCI USD",
  "description": "Renta fija y fondos en dólares",
  "isActive":    false
}
```

### Respuesta 200

Devuelve la cartera actualizada.

---

## GET /portfolios/:id/summary

Resumen P&L de la cartera con apertura mensual. Alimenta S02 (metric cards).

### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `from` | date | inicio de la cartera | Para el cálculo de rentabilidad en período |
| `to` | date | hoy | Fin del período |

### Respuesta 200

```json
{
  "data": {
    "portfolioId":    "uuid",
    "portfolioName":  "Acciones ARG",
    "period": {
      "from":  "2024-01-01",
      "to":    "2026-04-05"
    },
    "openPositions": {
      "count":          8,
      "capitalUsd":     "18400.00",
      "currentValueUsd": "21210.00",
      "unrealizedPnlUsd": "2810.00",
      "unrealizedPnlPct": "15.27"
    },
    "closedPositions": {
      "count":          3,
      "realizedPnlUsd": "1240.00"
    },
    "totalPnlUsd": "4050.00"
  }
}
```
