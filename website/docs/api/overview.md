---
sidebar_position: 1
---

# API — Visión General

Base URL: `http://localhost:3001/api/v1`

Ver el documento completo de endpoints en [api-design](../architecture/api-design).

## Formato de respuesta

```json
// Éxito
{ "data": { ... }, "meta": { "total": 100, "page": 1 } }

// Error
{ "error": { "code": "POSITION_NOT_FOUND", "message": "Posición no encontrada" } }
```

## Recursos principales

| Recurso | Descripción |
|---|---|
| `/assets` | Catálogo de activos financieros |
| `/brokers` | Brokers y comisiones |
| `/portfolios` | Carteras de inversión |
| `/trading/positions` | Posiciones de trading |
| `/trading/trades` | Operaciones individuales |
| `/dca/strategies` | Estrategias DCA |
| `/dca/entries` | Entradas DCA |
| `/ccl` | Historial CCL |
| `/prices/current` | Precios actuales (tiempo real) |
| `/dashboard` | Resumen consolidado |

## Convenciones

- Montos numéricos devueltos como **strings** (preservar precisión decimal)
- Fechas en **ISO 8601**: `"2026-04-05"`
- Enums en **UPPER_SNAKE_CASE**: `"ABIERTA"`, `"BUY"`, `"APERTURA"`
- Paginación: `?page=1&limit=50`
- Filtros de fecha: `?from=2025-01-01&to=2025-12-31`
