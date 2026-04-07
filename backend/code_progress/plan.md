# Plan de Implementación — Backend API

Cada módulo se implementa en este orden: `schema.ts` → `service.ts` → `router.ts` → `tests`.
Estructura por módulo: `src/modules/{módulo}/{router,service,schema}.ts` + `src/modules/{módulo}/__tests__/*.test.ts`

**Leyenda:** ⬜ pendiente · 🔄 en progreso · ✅ implementado y testeado

---

## Módulo: assets (`/api/v1/assets`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 1 | `GET /assets` | Listar activos (filtro por tipo, isActive) | ✅ | ✅ |
| 2 | `GET /assets/:id` | Detalle de un activo | ✅ | ✅ |
| 3 | `POST /assets` | Crear activo | ✅ | ✅ |
| 4 | `PATCH /assets/:id` | Editar activo | ✅ | ✅ |
| 5 | `DELETE /assets/:id` | Desactivar activo (soft delete via isActive) | ✅ | ✅ |

---

## Módulo: brokers (`/api/v1/brokers`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 6 | `GET /brokers` | Listar brokers | ⬜ | ⬜ |
| 7 | `GET /brokers/:id` | Detalle de un broker | ⬜ | ⬜ |
| 8 | `POST /brokers` | Crear broker | ⬜ | ⬜ |
| 9 | `PATCH /brokers/:id` | Editar broker | ⬜ | ⬜ |
| 10 | `DELETE /brokers/:id` | Eliminar broker (RESTRICT si tiene posiciones) | ⬜ | ⬜ |

---

## Módulo: portfolios (`/api/v1/portfolios`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 11 | `GET /portfolios` | Listar carteras | ⬜ | ⬜ |
| 12 | `GET /portfolios/:id` | Detalle de cartera | ⬜ | ⬜ |
| 13 | `POST /portfolios` | Crear cartera | ⬜ | ⬜ |
| 14 | `PATCH /portfolios/:id` | Editar cartera | ⬜ | ⬜ |
| 15 | `DELETE /portfolios/:id` | Eliminar cartera (RESTRICT si tiene posiciones/estrategias) | ⬜ | ⬜ |

---

## Módulo: ccl (`/api/v1/ccl`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 16 | `GET /ccl` | Listar historial CCL (rango de fechas) | ⬜ | ⬜ |
| 17 | `GET /ccl/:date` | CCL de una fecha específica (con fallback día hábil anterior) | ⬜ | ⬜ |
| 18 | `POST /ccl` | Cargar CCL manual | ⬜ | ⬜ |
| 19 | `PATCH /ccl/:date` | Editar CCL existente (source → MANUAL) | ⬜ | ⬜ |
| 20 | `POST /ccl/sync` | Sincronizar CCL desde Ambito (insert-only) | ⬜ | ⬜ |

---

## Módulo: trading — positions (`/api/v1/trading/positions`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 21 | `GET /trading/positions` | Listar posiciones (filtros: portfolio, status, asset) | ⬜ | ⬜ |
| 22 | `GET /trading/positions/:id` | Detalle posición con trades | ⬜ | ⬜ |
| 23 | `GET /trading/positions/:id/pnl` | P&L calculado en tiempo real | ⬜ | ⬜ |
| 24 | `POST /trading/positions` | Crear posición con primer trade BUY | ⬜ | ⬜ |

---

## Módulo: trading — trades (`/api/v1/trading/positions/:id/trades`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 25 | `GET /trading/positions/:id/trades` | Listar trades de una posición | ⬜ | ⬜ |
| 26 | `POST /trading/positions/:id/trades` | Agregar trade BUY o SELL | ⬜ | ⬜ |
| 27 | `PATCH /trading/trades/:id` | Editar trade (abierta o cerrada) | ⬜ | ⬜ |
| 28 | `DELETE /trading/trades/:id` | Eliminar trade (solo posición abierta) | ⬜ | ⬜ |

---

## Módulo: dca — strategies (`/api/v1/dca/strategies`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 29 | `GET /dca/strategies` | Listar estrategias DCA | ⬜ | ⬜ |
| 30 | `GET /dca/strategies/:id` | Detalle estrategia con entradas | ⬜ | ⬜ |
| 31 | `POST /dca/strategies` | Crear estrategia | ⬜ | ⬜ |
| 32 | `PATCH /dca/strategies/:id` | Editar estrategia | ⬜ | ⬜ |

---

## Módulo: dca — entries (`/api/v1/dca/strategies/:id/entries`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 33 | `GET /dca/strategies/:id/entries` | Listar entradas de una estrategia | ⬜ | ⬜ |
| 34 | `POST /dca/strategies/:id/entries` | Agregar entrada (APERTURA/INCREMENTO/CIERRE) | ⬜ | ⬜ |
| 35 | `PATCH /dca/entries/:id` | Editar entrada | ⬜ | ⬜ |
| 36 | `DELETE /dca/entries/:id` | Eliminar entrada | ⬜ | ⬜ |

---

## Módulo: prices (`/api/v1/assets/:id/price`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 37 | `GET /assets/:id/price/current` | Precio actual (cache → API → snapshot stale) | ⬜ | ⬜ |
| 38 | `POST /prices/sync` | Sincronizar precios de todos los activos activos | ⬜ | ⬜ |

---

## Módulo: dashboard (`/api/v1/dashboard`)

| # | Endpoint | Descripción | Impl | Test |
|---|----------|-------------|------|------|
| 39 | `GET /dashboard` | Resumen agregado: capital, P&L, posiciones abiertas, DCA | ⬜ | ⬜ |

---

## Progreso general

| Módulo | Endpoints | Implementados | Testeados |
|--------|-----------|---------------|-----------|
| assets | 5 | 5 | 5 |
| brokers | 5 | 0 | 0 |
| portfolios | 5 | 0 | 0 |
| ccl | 5 | 0 | 0 |
| trading/positions | 4 | 0 | 0 |
| trading/trades | 4 | 0 | 0 |
| dca/strategies | 4 | 0 | 0 |
| dca/entries | 4 | 0 | 0 |
| prices | 2 | 0 | 0 |
| dashboard | 1 | 0 | 0 |
| **Total** | **39** | **5** | **5** |
