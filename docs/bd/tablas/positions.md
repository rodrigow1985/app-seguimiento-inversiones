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
  opened_at    DATE         NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_positions_portfolio_asset UNIQUE (portfolio_id, asset_id)
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
| `opened_at` | DATE | NO | — | Fecha del primer trade (negocio, no sistema) |
| `notes` | TEXT | SÍ | NULL | Notas libres sobre la posición |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp de registro en el sistema |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Índices

```sql
-- Una sola posición por activo por cartera
CREATE UNIQUE INDEX idx_positions_portfolio_asset ON positions(portfolio_id, asset_id);

-- FKs (siempre)
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);
CREATE INDEX idx_positions_asset     ON positions(asset_id);
CREATE INDEX idx_positions_broker    ON positions(broker_id);
```

> `status` y `closed_at` son calculados en el servicio a partir de los trades — no hay índices sobre ellos.

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
| `open_units` | `Σ(units BUY) − Σ(units SELL)` |
| `status` | `open_units > 0 ? 'OPEN' : 'CLOSED'` |
| `closed_at` | `max(trade_date de SELLs)` si `status = CLOSED`, `null` si `OPEN` |
| `avg_price_ppc` | `Σ(units_buy × price_usd) / Σ(units_buy)` — precio promedio ponderado |
| `capital_usd` | `open_units × avg_price_ppc` |
| `current_value_usd` | `open_units × precio_actual_del_asset` |
| `pnl_usd` | `current_value_usd − capital_usd` |
| `pnl_pct` | `(pnl_usd / capital_usd) × 100` |
| `days_open` | `CURRENT_DATE − opened_at` |

**Razón**: si el CCL histórico se corrige, todos los cálculos siguen siendo reproducibles.

---

## Notas de diseño

- **Una posición por activo por cartera**: enforced via `UNIQUE (portfolio_id, asset_id)`. Una posición acumula todos los trades históricos del activo — no hay ciclos ni reaperturas. El estado OPEN/CLOSED es siempre calculado a partir del balance de trades.
- **RESTRICT en FK de brokers**: el broker determina la comisión histórica. No se puede borrar un broker con posiciones aunque no esté activo.
- **`opened_at` = fecha del primer trade**: se setea en el service al crear la posición, no con `NOW()`.
