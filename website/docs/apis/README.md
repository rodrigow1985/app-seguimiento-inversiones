# API — Referencia General

Base URL: `http://localhost:3001/api/v1`

---

## Índice de recursos

| Módulo | Archivo | Endpoints |
|--------|---------|-----------|
| Dashboard | [dashboard.md](./dashboard.md) | 3 |
| Portfolios | [portfolios.md](./portfolios.md) | 5 |
| Assets | [assets.md](./assets.md) | 6 |
| Brokers | [brokers.md](./brokers.md) | 4 |
| Trading — Positions | [trading.md](./trading.md) | 5 |
| Trading — Trades | [trading.md](./trading.md) | 4 |
| DCA — Strategies | [dca.md](./dca.md) | 5 |
| DCA — Entries | [dca.md](./dca.md) | 4 |
| CCL | [ccl.md](./ccl.md) | 5 |
| Prices | [assets.md](./assets.md) | 3 |
| Errores | [errors.md](./errors.md) | — |
| OpenAPI spec | [openapi.yaml](./openapi.yaml) | — |

---

## Versioning

La API usa **URL versioning**: `/api/v1/...`

**Política:**
- Cambios backwards-compatible → misma versión, documentado en changelog
- Breaking changes (campos eliminados, tipos cambiados) → nueva versión `/api/v2/...`
- Versiones deprecadas se mantienen **6 meses** con header `Deprecation: true`

```
GET /api/v1/trading/positions   → activo
GET /api/v2/trading/positions   → futuro (si hay breaking change)
```

**Headers de versión en respuesta:**
```
API-Version: 1.0.0
```

---

## Formato de respuestas

### Recurso único
```json
{
  "data": { "id": "uuid", "ticker": "BTC", "..." }
}
```

### Colección paginada
```json
{
  "data": [ { "..." }, { "..." } ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

### Campos calculados
Los campos calculados (P&L, precio promedio, etc.) se incluyen en la respuesta pero **no se persisten en la DB**. Se calculan en la capa de servicio en cada request.

---

## Convenciones

| Convención | Regla |
|-----------|-------|
| Montos numéricos | Strings en JSON (`"42830.50"`) para preservar precisión decimal |
| Fechas | ISO 8601: `"2026-04-05"` (date) / `"2026-04-05T14:32:00Z"` (timestamp) |
| Enums | `UPPER_SNAKE_CASE` igual que en DB |
| IDs | UUID v4 |
| Paginación | `?page=1&limit=50` (default limit: 50, max: 200) |
| Filtros de fecha | `?from=2025-01-01&to=2025-12-31` |
| Ordenamiento | `?sort=created_at&order=desc` |
| Nulls | Campos opcionales ausentes devuelven `null`, no se omiten |

---

## Errores — RFC 7807

Todos los errores devuelven `Content-Type: application/problem+json`.

Ver catálogo completo en [errors.md](./errors.md).

```json
{
  "type": "/errors/validation-error",
  "title": "Error de validación",
  "status": 422,
  "detail": "Los datos enviados no son válidos",
  "instance": "/api/v1/trading/positions",
  "errors": [
    { "field": "units", "message": "Debe ser mayor a 0" }
  ]
}
```

---

## Sin autenticación en v1

La app es personal y corre localmente. No hay JWT ni API keys en v1.
El middleware de auth existe pero es pass-through, preparado para v2.
