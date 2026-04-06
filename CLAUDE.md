# App Seguimiento de Inversiones — Guía para Agentes

App personal de seguimiento de inversiones financieras que reemplaza un Excel. Maneja carteras de trading (posiciones compra/venta) y estrategias DCA, en activos argentinos y crypto, con doble moneda ARS/USD y tipo de cambio CCL histórico.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Monorepo | pnpm workspaces | latest |
| Runtime | Node.js | 20 LTS |
| Lenguaje | TypeScript | 5.x |
| Backend | Express | 4.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 16 |
| Frontend | React + Vite | 18 / 5.x |
| Estado servidor | TanStack Query | 5.x |
| Estado cliente | Zustand | 4.x |
| UI Components | shadcn/ui | latest |
| Estilos | Tailwind CSS | 3.x |
| Gráficos | Recharts | latest |
| Testing | Vitest | latest |
| Documentación | Markdown → Docusaurus | — |

---

## Comandos Esenciales

```bash
# Desarrollo
pnpm dev:backend        # Backend en http://localhost:3001
pnpm dev:frontend       # Frontend en http://localhost:5173

# Base de datos
pnpm db:migrate         # Aplica migrations pendientes
pnpm db:seed            # Pobla datos iniciales (brokers, activos)
pnpm db:studio          # Abre Prisma Studio en http://localhost:5555
pnpm db:reset           # Resetea DB y aplica seed (DESTRUCTIVO)

# Calidad
pnpm typecheck          # Verifica tipos en todos los workspaces
pnpm test               # Corre todos los tests
pnpm lint               # ESLint en todo el proyecto

# Infra
docker-compose up -d postgres   # Solo PostgreSQL local
```

---

## Arquitectura del Proyecto

### Estructura de Workspaces

```
app-seguimiento-inversiones/
├── packages/types/         # Tipos compartidos entre backend y frontend
├── backend/                # Express API (puerto 3001)
│   ├── prisma/             # Schema, migrations, seed
│   ├── config/             # Archivos de configuración JSON
│   └── src/
│       ├── modules/        # Módulos de negocio (trading, dca, prices, etc.)
│       ├── external/       # Clientes de APIs externas
│       └── lib/            # Funciones de cálculo financiero puras
├── frontend/               # React app (puerto 5173)
│   └── src/
│       ├── design/         # Capa de diseño (componentes UI puros)
│       ├── modules/        # Módulos funcionales
│       └── api/            # Capa de llamadas al backend
└── docs/                   # Documentación técnica
```

### Reglas de Arquitectura Críticas

**1. Dos modelos distintos: Trading vs DCA**
- **Trading**: `Portfolio → Position → Trade`. Una posición agrupa múltiples trades de compra/venta del mismo activo. Ver `docs/architecture/adr/003-trading-vs-dca.md`.
- **DCA**: `Portfolio → DcaStrategy → DcaEntry`. Una estrategia acumula entradas (Apertura/Incremento/Cierre) sin precio unitario obligatorio. Ver `docs/modules/dca.md`.
- **No mezclar**: una posición de Trading nunca comparte datos con una DcaStrategy.

**2. Dual-currency con CCL histórico**
- Todos los valores se almacenan en su **moneda nativa** (ARS o USD).
- La conversión ARS→USD se hace en la capa de servicio usando `CclRate` de la fecha del trade.
- **Nunca** almacenar valores pre-convertidos en la DB (excepción: `accumulated_capital_usd` en DcaEntry es explícitamente USD).
- Ver `docs/architecture/adr/002-dual-currency.md`.

**3. Campos calculados NO van en DB**
- P&L, costo promedio ponderado, ganancia porcentual: se calculan en `backend/src/lib/calculations.ts`.
- Razón: evitar inconsistencias si el CCL histórico se corrige.

**4. APIs externas siempre abstraídas**
- Nunca llamar a CoinGecko, Rava, Ambito directamente desde routes o services.
- Usar la abstracción en `backend/src/external/price-provider.ts`.

**5. Separación de capas en frontend**
- `frontend/src/design/` = componentes UI puros sin lógica de negocio.
- `frontend/src/modules/` = lógica funcional + componentes que consumen la UI.
- No importar desde `modules/` dentro de `design/`.

---

## Módulos del Backend

| Módulo | Estado | Descripción |
|---|---|---|
| `assets` | pendiente | CRUD de activos financieros |
| `brokers` | pendiente | CRUD de brokers y comisiones |
| `portfolio` | pendiente | CRUD de carteras |
| `trading` | pendiente | Posiciones y trades de compra/venta |
| `dca` | pendiente | Estrategias DCA y sus entradas |
| `ccl` | pendiente | Historial CCL, fetch desde Ambito |
| `prices` | pendiente | Precios actuales via APIs externas |
| `dashboard` | pendiente | Resumen agregado de posiciones activas |

## Módulos del Frontend

| Módulo | Estado | Descripción |
|---|---|---|
| `dashboard` | pendiente | Vista resumen de todas las carteras |
| `trading` | pendiente | Posiciones abiertas/cerradas, formulario de trade |
| `dca` | pendiente | Estrategias DCA, gráfico de acumulación |
| `portfolio` | pendiente | Configuración de carteras |
| `config` | pendiente | Configuración de brokers, activos, APIs |

---

## Variables de Entorno (`.env`)

Ver `.env.example` para todas las variables requeridas. Las críticas:

```
DATABASE_URL              # PostgreSQL connection string
COINGECKO_API_KEY         # CoinGecko API key (free tier disponible)
IOL_USERNAME              # Usuario InvertirOnline (para precios ARG)
IOL_PASSWORD              # Contraseña IOL
AMBITO_CCL_URL            # URL de la API de CCL de Ambito (en config/ccl-sources.json)
```

**Regla**: API keys solo en `.env`, nunca en archivos `config/*.json`.

---

## Convenciones de Código

- **Archivos**: `kebab-case.ts`
- **Tipos/Clases**: `PascalCase`
- **Funciones/variables**: `camelCase`
- **Enums en DB**: `UPPER_SNAKE_CASE`
- **Routes**: `GET /api/v1/{recurso-plural}` — siempre plural, siempre versionado
- **Services**: solo lógica de negocio, nunca lógica HTTP (req/res)
- **Schemas**: solo validación de input/output, nunca lógica de negocio
- **No usar `any`** en TypeScript

---

## Decisiones de Diseño (ADRs)

Leer antes de proponer cambios estructurales:

- [`docs/architecture/adr/001-stack-selection.md`](docs/architecture/adr/001-stack-selection.md) — Por qué PostgreSQL + Express + React
- [`docs/architecture/adr/002-dual-currency.md`](docs/architecture/adr/002-dual-currency.md) — Manejo de ARS/USD con CCL histórico
- [`docs/architecture/adr/003-trading-vs-dca.md`](docs/architecture/adr/003-trading-vs-dca.md) — Por qué Trading y DCA son modelos separados

---

## Lo que NO Hacer

- No instalar librerías de cálculo financiero de terceros (la lógica es custom)
- No cambiar la estructura del monorepo sin actualizar este archivo
- No agregar lógica de negocio en routes (solo validación + llamada a service)
- No llamar APIs externas directamente desde módulos (usar `external/`)
- No almacenar API keys en `config/*.json`, solo en `.env`
- No agregar autenticación en v1 (la app es personal y local)
- No agregar campos calculados a tablas de Prisma (usar `@ignore` si es necesario como virtual)

---

## Autenticación

**Sin autenticación en v1.** La app corre localmente para uso personal.
El plugin `backend/src/plugins/auth.ts` existe pero no valida nada en v1.
Preparado para agregar JWT en v2 sin cambios estructurales.

---

## Documentación

```
docs/
├── architecture/
│   ├── domain-model.md     # Modelo de dominio completo (leer primero)
│   ├── api-design.md       # Diseño de endpoints REST
│   └── adr/                # Architecture Decision Records
├── guides/
│   ├── setup.md            # Cómo levantar el proyecto
│   └── data-migration.md   # Cómo migrar el Excel
└── modules/
    ├── trading.md          # Lógica del módulo de trading
    ├── dca.md              # Lógica del módulo DCA
    └── prices.md           # Integración con APIs de precios
```
