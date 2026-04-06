# Tabla: dca_strategies

Estrategias de Dollar Cost Averaging. Modelo de acumulación periódica de activos, completamente separado del modelo de Trading.

> **Importante**: Esta tabla NO está relacionada con `positions` ni `trades`. Son modelos independientes.

---

## DDL

```sql
CREATE TABLE dca_strategies (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID         NOT NULL REFERENCES portfolios(id) ON DELETE RESTRICT,
  asset_id     UUID         NOT NULL REFERENCES assets(id)     ON DELETE RESTRICT,
  broker_id    UUID         NOT NULL REFERENCES brokers(id)    ON DELETE RESTRICT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  started_at   DATE         NOT NULL,
  closed_at    DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dca_closed_after_start CHECK (
    closed_at IS NULL OR closed_at >= started_at
  ),
  CONSTRAINT chk_dca_active_consistency CHECK (
    (is_active = FALSE AND closed_at IS NOT NULL) OR
    (is_active = TRUE  AND closed_at IS NULL)
  )
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `portfolio_id` | UUID | NO | — | FK → portfolios |
| `asset_id` | UUID | NO | — | FK → assets |
| `broker_id` | UUID | NO | — | FK → brokers (exchange donde se compra) |
| `is_active` | BOOLEAN | NO | TRUE | Estrategia activa (acepta nuevas entradas) |
| `started_at` | DATE | NO | — | Fecha de la primera entrada |
| `closed_at` | DATE | SÍ | NULL | Fecha de cierre. NULL mientras esté activa |
| `notes` | TEXT | SÍ | NULL | Notas libres |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Índices

```sql
CREATE INDEX idx_dca_strategies_portfolio ON dca_strategies(portfolio_id);
CREATE INDEX idx_dca_strategies_asset     ON dca_strategies(asset_id);
CREATE INDEX idx_dca_strategies_broker    ON dca_strategies(broker_id);
CREATE INDEX idx_dca_strategies_active    ON dca_strategies(is_active) WHERE is_active = TRUE;
```

---

## Relaciones

| Dirección | Tabla | FK | ON DELETE |
|-----------|-------|-----|-----------|
| Padre | `portfolios` | `portfolio_id` | RESTRICT |
| Padre | `assets` | `asset_id` | RESTRICT |
| Padre | `brokers` | `broker_id` | RESTRICT |
| Hija | `dca_entries` | `strategy_id` | CASCADE |

---

## Campos calculados (NO en DB)

| Campo | Cálculo |
|-------|---------|
| `accumulated_capital_usd` | `Σ(entry.amount_usd)` — suma de todas las entradas |
| `total_units_accumulated` | `Σ(entry.units_received)` — suma de unidades recibidas |
| `avg_dca_price` | `accumulated_capital_usd / total_units_accumulated` |
| `current_value_usd` | `total_units × precio_actual` |
| `pnl_usd` | `current_value_usd − accumulated_capital_usd` |
| `days_active` | `CURRENT_DATE − started_at` |

> Excepción: `dca_entries.accumulated_capital_usd` SÍ se persiste. Ver [dca_entries.md](./dca_entries.md).

---

## Notas de diseño

- **CHECK de consistencia**: si `is_active = FALSE` → `closed_at` debe estar seteado, y viceversa.
- **Una estrategia por activo por cartera** (convención de negocio, no restricción técnica). El service puede validarlo.
- DCA no usa `ccl_rates` directamente — las entradas se registran siempre en USD.
