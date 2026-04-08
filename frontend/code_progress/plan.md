# Plan de Implementación — Frontend

Stack: React 18 + Vite + TypeScript + TanStack Query + Zustand + shadcn/ui + Tailwind CSS + Recharts

**Diseño: Mobile-first.** Tailwind base → sm → md → lg. Bottom-bar en móvil, sidebar en desktop.

**Leyenda:** ⬜ pendiente · 🔄 en progreso · ✅ implementado · 🧪 testeado visualmente

---

## Fase 0 — Setup inicial

| # | Tarea | Impl | Revisado |
|---|-------|------|---------|
| 0.1 | Scaffolding Vite + React + TypeScript (`pnpm create vite`) | ✅ | ✅ |
| 0.2 | Configurar Tailwind CSS v3 | ✅ | ✅ |
| 0.3 | Instalar y configurar shadcn/ui (manual: button, card, badge, dialog, input, label, select, table, tabs) | ✅ | ✅ |
| 0.4 | Instalar TanStack Query + Zustand + Recharts | ✅ | ✅ |
| 0.5 | Configurar `VITE_API_BASE_URL` + cliente HTTP base (`api/client.ts`) | ✅ | ✅ |
| 0.6 | Layout raíz: bottom-bar móvil + sidebar desktop | ✅ | ✅ |
| 0.7 | React Router: rutas base de cada módulo | ✅ | ✅ |
| 0.8 | Agregar workspace a pnpm + scripts en root `package.json` | ✅ | ✅ |

---

## Fase 1 — Capa API (hooks y clientes por módulo)

Cada módulo tiene su archivo en `frontend/src/api/` con las llamadas al backend y sus TanStack Query hooks.

| # | Archivo | Endpoints cubiertos | Impl | Revisado |
|---|---------|---------------------|------|---------|
| 1.1 | `api/assets.ts` | GET /assets, GET /assets/:id, POST, PATCH, DELETE | ✅ | ✅ |
| 1.2 | `api/brokers.ts` | GET /brokers, GET /brokers/:id, POST, PATCH, DELETE | ✅ | ✅ |
| 1.3 | `api/portfolios.ts` | GET /portfolios, GET /portfolios/:id, POST, PATCH, DELETE | ✅ | ✅ |
| 1.4 | `api/ccl.ts` | GET /ccl, GET /ccl/:date, GET /ccl/latest, POST /ccl/sync | ✅ | ✅ |
| 1.5 | `api/trading.ts` | Positions + Trades (GET, POST, PATCH, DELETE) + P&L | ✅ | ✅ |
| 1.6 | `api/dca.ts` | Strategies + Entries (GET, POST, PATCH, DELETE) | ✅ | ✅ |
| 1.7 | `api/prices.ts` | GET /assets/:id/price/current, POST /prices/sync | ✅ | ✅ |
| 1.8 | `api/dashboard.ts` | GET /dashboard | ✅ | ✅ |

---

## Fase 2 — Módulo: Dashboard

Vista principal. Resumen de capital, P&L total, posiciones abiertas y DCA activos.

| # | Componente / Vista | Descripción | Impl | Revisado |
|---|-------------------|-------------|------|---------|
| 2.1 | `DashboardPage` | Página raíz, grid de cards | ✅ | ✅ |
| 2.2 | `KpiCard` | Card genérica: label + valor + variación % | ✅ | ✅ |
| 2.3 | Cards: Capital total ARS/USD | Con toggle de moneda (Zustand) | ✅ | ✅ |
| 2.4 | Cards: P&L total + P&L % | Con badge profit/loss | ✅ | ✅ |
| 2.5 | Cards: Posiciones abiertas / DCA activos | Links a /trading y /dca | ✅ | ✅ |
| 2.6 | `CclBadge` | Muestra CCL del día (con botón sync) en header | ✅ | ✅ |

---

## Fase 3 — Módulo: Trading

Gestión de posiciones de compra/venta y sus trades.

| # | Componente / Vista | Descripción | Impl | Revisado |
|---|-------------------|-------------|------|---------|
| 3.1 | `TradingPage` | Lista de posiciones con tabs Abiertas/Cerradas | ⬜ | ⬜ |
| 3.2 | `PositionCard` | Card de posición: activo, P&L, % ganancia, estado | ⬜ | ⬜ |
| 3.3 | `PositionDetailPage` | Detalle con lista de trades + P&L breakdown | ⬜ | ⬜ |
| 3.4 | `TradeRow` | Fila de trade con tipo BUY/SELL, fecha, precio, unidades | ⬜ | ⬜ |
| 3.5 | `NewPositionDialog` | Form: activo + broker + primer trade BUY | ⬜ | ⬜ |
| 3.6 | `AddTradeDialog` | Form: tipo BUY/SELL, fecha, precio, unidades | ⬜ | ⬜ |
| 3.7 | `EditTradeDialog` | Editar trade existente | ⬜ | ⬜ |
| 3.8 | `PnlSummary` | Resumen P&L: costo promedio, valor actual, ganancia | ⬜ | ⬜ |

---

## Fase 4 — Módulo: DCA

Estrategias de acumulación y sus entradas.

| # | Componente / Vista | Descripción | Impl | Revisado |
|---|-------------------|-------------|------|---------|
| 4.1 | `DcaPage` | Lista de estrategias DCA activas e inactivas | ⬜ | ⬜ |
| 4.2 | `DcaStrategyCard` | Card: activo, capital acumulado USD, entradas | ⬜ | ⬜ |
| 4.3 | `DcaStrategyDetailPage` | Detalle con historial de entradas + gráfico | ⬜ | ⬜ |
| 4.4 | `DcaEntryRow` | Fila: tipo (APERTURA/INCREMENTO/CIERRE), fecha, monto USD | ⬜ | ⬜ |
| 4.5 | `AccumulationChart` | Recharts: capital acumulado en el tiempo | ⬜ | ⬜ |
| 4.6 | `NewStrategyDialog` | Form: nombre, activo, broker, fecha inicio | ⬜ | ⬜ |
| 4.7 | `AddDcaEntryDialog` | Form: tipo, fecha, monto USD, monto ARS, precio activo | ⬜ | ⬜ |
| 4.8 | `EditDcaEntryDialog` | Editar entrada existente | ⬜ | ⬜ |

---

## Fase 5 — Módulo: Config

Gestión de activos, brokers y carteras.

| # | Componente / Vista | Descripción | Impl | Revisado |
|---|-------------------|-------------|------|---------|
| 5.1 | `ConfigPage` | Tabs: Activos / Brokers / Carteras | ⬜ | ⬜ |
| 5.2 | `AssetTable` | Tabla de activos con badge de tipo, moneda, fuente precio | ⬜ | ⬜ |
| 5.3 | `AssetDialog` | Form crear/editar activo | ⬜ | ⬜ |
| 5.4 | `BrokerTable` | Tabla de brokers con comisión y moneda | ⬜ | ⬜ |
| 5.5 | `BrokerDialog` | Form crear/editar broker | ⬜ | ⬜ |
| 5.6 | `PortfolioTable` | Tabla de carteras con tipo y estrategia | ⬜ | ⬜ |
| 5.7 | `PortfolioDialog` | Form crear/editar cartera | ⬜ | ⬜ |

---

## Fase 6 — Módulo: Precios y CCL

| # | Componente / Vista | Descripción | Impl | Revisado |
|---|-------------------|-------------|------|---------|
| 6.1 | `PricesSyncButton` | Botón sync global de precios con loading/feedback | ⬜ | ⬜ |
| 6.2 | `CclHistoryPage` | Tabla CCL histórico con filtro por rango de fechas | ⬜ | ⬜ |
| 6.3 | `CclSyncButton` | Sync CCL desde Ambito con feedback de registros nuevos | ⬜ | ⬜ |
| 6.4 | `ManualCclDialog` | Cargar CCL manual para una fecha | ⬜ | ⬜ |

---

## Progreso general

| Fase | Componentes | Implementados | Revisados |
|------|-------------|---------------|-----------|
| 0 — Setup | 8 | 8 | 8 |
| 1 — Capa API | 8 | 8 | 8 |
| 2 — Dashboard | 6 | 6 | 6 |
| 3 — Trading | 8 | 0 | 0 |
| 4 — DCA | 8 | 0 | 0 |
| 5 — Config | 7 | 0 | 0 |
| 6 — Precios/CCL | 4 | 0 | 0 |
| **Total** | **49** | **22** | **22** |
