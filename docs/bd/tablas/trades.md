# Tabla: trades

Trades individuales de compra (BUY) o venta (SELL) dentro de una posición. Son la fuente de verdad para todos los cálculos de P&L y precio promedio ponderado.

---

## DDL

```sql
CREATE TABLE trades (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id  UUID           NOT NULL REFERENCES positions(id)  ON DELETE CASCADE,
  ccl_rate_id  UUID           REFERENCES ccl_rates(id)           ON DELETE RESTRICT,
  type         VARCHAR(4)     NOT NULL,
  trade_date   DATE           NOT NULL,
  units        NUMERIC(18,8)  NOT NULL,
  price_native NUMERIC(18,4)  NOT NULL,
  currency     VARCHAR(3)     NOT NULL,
  price_usd    NUMERIC(18,4)  NOT NULL,
  total_usd    NUMERIC(18,4)  NOT NULL,
  commission   NUMERIC(18,4)  NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_trades_type            CHECK (type       IN ('BUY','SELL')),
  CONSTRAINT chk_trades_currency        CHECK (currency   IN ('ARS','USD')),
  CONSTRAINT chk_trades_units_pos       CHECK (units       > 0),
  CONSTRAINT chk_trades_price_pos       CHECK (price_native > 0),
  CONSTRAINT chk_trades_price_usd_pos   CHECK (price_usd   > 0),
  CONSTRAINT chk_trades_total_usd_pos   CHECK (total_usd   > 0),
  CONSTRAINT chk_trades_commission_nn   CHECK (commission  >= 0),
  -- Si currency = ARS, debe tener ccl_rate_id
  CONSTRAINT chk_trades_ccl_required    CHECK (
    currency = 'USD' OR ccl_rate_id IS NOT NULL
  )
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `position_id` | UUID | NO | — | FK → positions |
| `ccl_rate_id` | UUID | SÍ | NULL | FK → ccl_rates. Requerido si `currency = ARS` |
| `type` | VARCHAR(4) | NO | — | `BUY` o `SELL` |
| `trade_date` | DATE | NO | — | Fecha de la operación (negocio) |
| `units` | NUMERIC(18,8) | NO | — | Cantidad de unidades. 8 decimales para crypto |
| `price_native` | NUMERIC(18,4) | NO | — | Precio en moneda nativa del activo |
| `currency` | VARCHAR(3) | NO | — | `ARS` o `USD` — moneda de `price_native` |
| `price_usd` | NUMERIC(18,4) | NO | — | Precio convertido a USD (snapshot histórico) |
| `total_usd` | NUMERIC(18,4) | NO | — | `units × price_usd` (snapshot histórico) |
| `commission` | NUMERIC(18,4) | NO | `0` | Comisión aplicada en USD |
| `notes` | TEXT | SÍ | NULL | Notas libres |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Índices

```sql
-- FK (siempre)
CREATE INDEX idx_trades_position   ON trades(position_id);
CREATE INDEX idx_trades_ccl_rate   ON trades(ccl_rate_id);

-- Ordenamiento cronológico
CREATE INDEX idx_trades_date       ON trades(trade_date);

-- Para calcular PPC y unidades totales de una posición
CREATE INDEX idx_trades_pos_type   ON trades(position_id, type);
CREATE INDEX idx_trades_pos_date   ON trades(position_id, trade_date);
```

---

## Relaciones

| Dirección | Tabla | FK | ON DELETE |
|-----------|-------|-----|-----------|
| Padre | `positions` | `position_id` | CASCADE |
| Padre | `ccl_rates` | `ccl_rate_id` | RESTRICT |

---

## Por qué almacenar price_usd y total_usd

Son datos calculados pero se persisten porque representan el **snapshot de la conversión aplicada en el momento del trade**.

```
price_usd = price_native / ccl_rate (si ARS)
price_usd = price_native            (si USD)
total_usd = units × price_usd
```

**Razón de persistir**:
- Trazabilidad auditora: "¿qué precio USD se aplicó en ese trade?"
- Si el CCL se corrige posteriormente, el trade histórico NO cambia
- Permite reconstruir el P&L exactamente igual que al momento de la operación

El P&L, PPC y otras métricas agregadas **no se persisten** — se calculan en el servicio.

---

## Query clave: calcular PPC y unidades de una posición

```sql
SELECT
  type,
  SUM(units)       AS total_units,
  SUM(total_usd)   AS total_invested_usd
FROM trades
WHERE position_id = $1
GROUP BY type;

-- PPC = SUM(total_usd WHERE type=BUY) / SUM(units WHERE type=BUY)
-- total_units = SUM(units WHERE type=BUY) - SUM(units WHERE type=SELL)
```

---

## Notas de diseño

- **`NUMERIC(18,8)` para units**: crypto puede tener 8 decimales de precisión (satoshis, gwei, etc.)
- **`NUMERIC(18,4)` para precios**: 4 decimales son suficientes para precios en ARS y USD
- **CHECK ccl_required**: garantiza integridad en DB — imposible tener un trade ARS sin CCL
- **CASCADE desde positions**: si se borra una posición (no ocurre por RESTRICT desde portfolios, pero como protección), los trades se eliminan también
