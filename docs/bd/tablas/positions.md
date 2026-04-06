# Tabla: positions

Posiciones de trading. Una posición agrupa múltiples trades (compras y ventas) del mismo activo dentro de una cartera.

---

## DDL

```sql
CREATE TABLE positions (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID         NOT NULL REFERENCES portfolios(id) ON DELETE RESTRICT,
  asset_id     UUID         NOT NULL REFERENCES assets(id)     ON DELETE RESTRICT,
  broker_id    UUID         NOT NULL REFERENCES brokers(id)    ON DELETE RESTRICT,
  status       VARCHAR(10)  NOT NULL DEFAULT 'OPEN',
  opened_at    DATE         NOT NULL,
  closed_at    DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_positions_status
    CHECK (status IN ('OPEN', 'CLOSED')),
  CONSTRAINT chk_positions_closed_after_open
    CHECK (closed_at IS NULL OR closed_at >= opened_at),
  CONSTRAINT chk_positions_closed_requires_status
    CHECK (
      (status = 'CLOSED' AND closed_at IS NOT NULL) OR
      (status = 'OPEN'   AND closed_at IS NULL)
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
| `broker_id` | UUID | NO | — | FK → brokers |
| `status` | VARCHAR(10) | NO | `OPEN` | `OPEN` o `CLOSED` |
| `opened_at` | DATE | NO | — | Fecha del primer trade (negocio, no sistema) |
| `closed_at` | DATE | SÍ | NULL | Fecha de cierre. NULL si `status = OPEN` |
| `notes` | TEXT | SÍ | NULL | Notas libres sobre la posición |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp de registro en el sistema |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Índices

```sql
-- FKs (siempre)
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_asset     ON positions(asset_id);
CREATE INDEX idx_positions_broker    ON positions(broker_id);

-- Filtro más frecuente: posiciones abiertas de una cartera
CREATE INDEX idx_positions_portfolio_status ON positions(portfolio_id, status);

-- Para el dashboard: todas las posiciones abiertas
CREATE INDEX idx_positions_status ON positions(status) WHERE status = 'OPEN';
```

---

## Relaciones

| Dirección | Tabla | FK | ON DELETE |
|-----------|-------|-----|-----------|
| Padre | `portfolios` | `portfolio_id` | RESTRICT |
| Padre | `assets` | `asset_id` | RESTRICT |
| Padre | `brokers` | `broker_id` | RESTRICT |
| Hija | `trades` | `position_id` | CASCADE |

---

## Campos calculados (NO en DB)

Estos valores se calculan en `backend/src/lib/calculations.ts` en cada request. Nunca se persisten:

| Campo | Cálculo |
|-------|---------|
| `total_units` | `Σ(units donde type=BUY) − Σ(units donde type=SELL)` |
| `avg_price_ppc` | `Σ(units_buy × price_usd) / Σ(units_buy)` — precio promedio ponderado |
| `capital_usd` | `total_units × avg_price_ppc` |
| `current_value_usd` | `total_units × precio_actual_del_asset` |
| `pnl_usd` | `current_value_usd − capital_usd` |
| `pnl_pct` | `(pnl_usd / capital_usd) × 100` |
| `days_open` | `CURRENT_DATE − opened_at` |

**Razón**: si el CCL histórico se corrige, todos los cálculos siguen siendo reproducibles.

---

## Notas de diseño

- **Una posición por activo por cartera**: no hay restricción técnica que impida abrir dos posiciones de BTC en Cryptos, pero el flujo de negocio asume una posición activa por activo. El service puede validarlo opcionalmente.
- **RESTRICT en FK de brokers**: el broker determina la comisión histórica. No se puede borrar un broker con posiciones aunque no esté activo.
- **`opened_at` = fecha del primer trade**: se setea en el service al crear la posición, no con `NOW()`.
