# Diseño de la REST API

Base URL: `http://localhost:3001/api/v1`

---

## Formato de respuestas

### Éxito

```json
// Recurso único
{
  "data": { "id": "uuid", "ticker": "BTC", ... }
}

// Colección
{
  "data": [ { ... }, { ... } ],
  "meta": { "total": 42, "page": 1, "limit": 50 }
}
```

### Error — RFC 7807 Problem Details

Todos los errores siguen el estándar **RFC 7807** con `Content-Type: application/problem+json`.

```json
{
  "type": "/errors/position-not-found",
  "title": "Posición no encontrada",
  "status": 404,
  "detail": "No existe una posición con ID a1b2c3d4 en la cartera Cryptos",
  "instance": "/api/v1/trading/positions/a1b2c3d4"
}
```

Los errores de validación extienden el formato con un campo `errors`:

```json
{
  "type": "/errors/validation-error",
  "title": "Error de validación",
  "status": 422,
  "detail": "Los datos enviados no son válidos",
  "instance": "/api/v1/trading/positions/uuid/trades",
  "errors": [
    { "field": "units",     "message": "Debe ser mayor a 0" },
    { "field": "tradeDate", "message": "Fecha requerida" }
  ]
}
```

### Tipos de error definidos (`type`)

| type | status | Descripción |
|---|---|---|
| `/errors/validation-error` | 422 | Input inválido (campos faltantes o mal formateados) |
| `/errors/not-found` | 404 | Recurso no encontrado |
| `/errors/position-already-closed` | 409 | Se intenta operar sobre una posición cerrada |
| `/errors/insufficient-units` | 409 | Se intenta vender más unidades de las disponibles |
| `/errors/ccl-not-available` | 422 | No hay CCL disponible para la fecha del trade |
| `/errors/price-unavailable` | 503 | La API externa de precios no está disponible |
| `/errors/internal-error` | 500 | Error interno del servidor |

---

## Assets

```
GET    /assets                    Lista todos los activos
GET    /assets/:id                Detalle de un activo
POST   /assets                    Crea un activo nuevo
PATCH  /assets/:id                Actualiza un activo
GET    /assets/:id/price/current  Precio actual (vía API externa)
GET    /assets/:id/price/history  Precio histórico (query: from, to)
```

## Brokers

```
GET    /brokers                   Lista todos los brokers
GET    /brokers/:id               Detalle de un broker
POST   /brokers                   Crea un broker
PATCH  /brokers/:id               Actualiza comisión u otros datos
```

## Portfolios (Carteras)

```
GET    /portfolios                Lista todas las carteras
GET    /portfolios/:id            Detalle con métricas calculadas
POST   /portfolios                Crea una cartera
PATCH  /portfolios/:id            Actualiza una cartera
GET    /portfolios/:id/summary    Resumen P&L de la cartera
```

## Trading — Positions

```
GET    /trading/positions                   Lista posiciones (query: portfolioId, status)
GET    /trading/positions/:id              Detalle con todos sus trades
POST   /trading/positions                  Abre una posición nueva (con su primer trade)
PATCH  /trading/positions/:id/close        Cierra una posición
GET    /trading/positions/:id/pnl          P&L calculado de la posición
```

## Trading — Trades

```
GET    /trading/positions/:positionId/trades        Lista trades de una posición
POST   /trading/positions/:positionId/trades        Agrega un trade (BUY o SELL)
PATCH  /trading/trades/:id                          Corrige un trade
DELETE /trading/trades/:id                          Elimina un trade (solo si no afecta posición cerrada)
```

## DCA — Strategies

```
GET    /dca/strategies                      Lista estrategias (query: assetId, isActive)
GET    /dca/strategies/:id                  Detalle con todas las entradas
POST   /dca/strategies                      Crea una estrategia DCA
PATCH  /dca/strategies/:id                  Actualiza una estrategia
GET    /dca/strategies/:id/summary          Capital acumulado, P&L total, días activo
```

## DCA — Entries

```
GET    /dca/strategies/:strategyId/entries  Lista entradas de una estrategia
POST   /dca/strategies/:strategyId/entries  Agrega una entrada (Apertura/Incremento/Cierre)
PATCH  /dca/entries/:id                     Corrige una entrada
DELETE /dca/entries/:id                     Elimina una entrada
```

## CCL

```
GET    /ccl                         Lista histórico de CCL (query: from, to)
GET    /ccl/latest                  Último valor disponible
GET    /ccl/date/:date              CCL de una fecha específica (o el más cercano anterior)
POST   /ccl                         Carga manual de un valor CCL
POST   /ccl/sync                    Dispara sync desde la API de Ambito
```

## Prices

```
GET    /prices/current?tickers=BTC,ETH,GGAL   Precios actuales de múltiples activos
GET    /prices/history/:assetId               Histórico de precios (query: from, to)
POST   /prices/sync                           Dispara actualización de todos los precios
```

## Dashboard

```
GET    /dashboard                   Resumen general: posiciones abiertas, capital total, P&L
GET    /dashboard/open-positions    Lista de posiciones activas con métricas clave
GET    /dashboard/dca-summary       Resumen de todas las estrategias DCA activas
```

---

## Convenciones

- Todos los montos numéricos se devuelven como **strings** en el JSON para preservar precisión decimal (evitar pérdida en float de JavaScript).
- Las fechas se devuelven en formato **ISO 8601**: `"2026-04-05"` para fechas, `"2026-04-05T15:30:00Z"` para timestamps.
- Los enums se devuelven en **UPPER_SNAKE_CASE** tal como están en la DB.
- Paginación: `?page=1&limit=50` cuando aplica.
- Filtros de fecha: `?from=2025-01-01&to=2025-12-31`.
