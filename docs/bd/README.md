# Base de Datos — Diseño

Motor: **PostgreSQL 16** · ORM: **Prisma 5** · IDs: **UUID v4**

---

## Tablas

| Tabla | Archivo | Filas esperadas |
|-------|---------|----------------|
| `assets` | [tablas/assets.md](./tablas/assets.md) | ~50 activos |
| `brokers` | [tablas/brokers.md](./tablas/brokers.md) | ~5 brokers |
| `portfolios` | [tablas/portfolios.md](./tablas/portfolios.md) | ~6–10 carteras |
| `ccl_rates` | [tablas/ccl_rates.md](./tablas/ccl_rates.md) | ~1.500 (5 años de días hábiles) |
| `positions` | [tablas/positions.md](./tablas/positions.md) | ~50–200 posiciones |
| `trades` | [tablas/trades.md](./tablas/trades.md) | ~200–1.000 trades |
| `dca_strategies` | [tablas/dca_strategies.md](./tablas/dca_strategies.md) | ~10–20 estrategias |
| `dca_entries` | [tablas/dca_entries.md](./tablas/dca_entries.md) | ~100–500 entradas |
| `price_snapshots` | [tablas/price_snapshots.md](./tablas/price_snapshots.md) | rolling 90 días × activos |

Schema Prisma completo: [schema.prisma](./schema.prisma)
Migración inicial: [migrations/001_initial_schema.sql](./migrations/001_initial_schema.sql)

---

## ERD (Entity Relationship Diagram)

```
portfolios ──────────────────────────────────────────────┐
     │                                                    │
     │ 1:N                                                │ 1:N
     ▼                                                    ▼
positions ──── N:1 ── assets ──── 1:N ── dca_strategies
     │                  │                       │
     │ 1:N              │ 1:N                   │ 1:N
     ▼                  ▼                       ▼
  trades           price_snapshots          dca_entries
     │
     │ N:1 (nullable si USD)
     ▼
  ccl_rates

brokers ── 1:N ── positions
brokers ── 1:N ── dca_strategies
```

**Separación total Trading / DCA:**
- `positions → trades` (modelo compra/venta)
- `dca_strategies → dca_entries` (modelo acumulación)
- Nunca comparten tablas

---

## Decisiones de diseño

### 1. UUIDs como PK (no BIGINT)
App personal — no hay ventaja en BIGINT. UUID permite seed determinístico y evita colisiones en imports de datos históricos del Excel.

### 2. DECIMAL para todos los montos monetarios
`NUMERIC(18,4)` para precios y `NUMERIC(18,8)` para unidades de crypto.  
**Nunca FLOAT/DOUBLE**: rounding errors en cálculos financieros son inaceptables.

### 3. DATE para fechas de operaciones (no TIMESTAMP)
`trade_date`, `opened_at`, `entry_date` son fechas de negocio, no timestamps del sistema. Guardar solo la fecha evita ambigüedades de timezone.  
`created_at` / `updated_at` son timestamps reales del sistema → `TIMESTAMPTZ`.

### 4. Moneda nativa almacenada, conversión en servicio
`trades.price_native` + `trades.currency` + `trades.ccl_rate_id` → la conversión a USD se reproduce siempre desde los datos originales.  
`trades.price_usd` y `trades.total_usd` se almacenan como snapshot de la conversión aplicada (trazabilidad histórica).

### 5. accumulated_capital_usd en dca_entries (denormalización explícita)
Es el único campo "calculado" que sí se persiste: la suma acumulada de capital DCA hasta esa entrada.  
**Razón**: necesario para ordenamiento cronológico y performance del gráfico de acumulación. Se recalcula en cascada al editar/borrar entradas.

### 6. ON DELETE strategies
| FK | Strategy | Razón |
|----|----------|-------|
| `positions → portfolios` | RESTRICT | No borrar cartera con posiciones |
| `positions → assets` | RESTRICT | No borrar activo con posiciones |
| `positions → brokers` | RESTRICT | No borrar broker con posiciones |
| `trades → positions` | CASCADE | Trade sin posición no tiene sentido |
| `trades → ccl_rates` | RESTRICT | No borrar CCL usado en un trade |
| `dca_strategies → portfolios` | RESTRICT | No borrar cartera con estrategias |
| `dca_entries → dca_strategies` | CASCADE | Entrada sin estrategia no tiene sentido |
| `price_snapshots → assets` | CASCADE | Snapshots son efímeros |

### 7. price_snapshots: retención 90 días
No son datos de negocio críticos — se pueden regenerar. Retener 90 días es suficiente para el gráfico histórico de precio. Limpiar con job o trigger periódico.

### 8. Sin tablas de autenticación en v1
App personal y local. Si se agrega auth en v2, se agrega `users` y `sessions` sin cambios a las tablas existentes.
