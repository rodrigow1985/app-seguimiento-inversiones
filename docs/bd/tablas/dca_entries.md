# Tabla: dca_entries

Entradas individuales de una estrategia DCA. Pueden ser de tipo Apertura, Incremento o Cierre.

---

## DDL

```sql
CREATE TABLE dca_entries (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id          UUID           NOT NULL REFERENCES dca_strategies(id) ON DELETE CASCADE,
  ccl_rate_id          UUID           REFERENCES ccl_rates(id) ON DELETE RESTRICT,
  type                 VARCHAR(10)    NOT NULL,
  entry_date           DATE           NOT NULL,
  amount_usd           NUMERIC(18,4)  NOT NULL,
  amount_ars           NUMERIC(18,4),
  asset_price_at_entry NUMERIC(18,4),
  units_received       NUMERIC(18,8),
  notes                TEXT,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dca_entry_type        CHECK (type IN ('APERTURA','INCREMENTO','CIERRE')),
  CONSTRAINT chk_dca_entry_amount_pos  CHECK (amount_usd > 0),
  CONSTRAINT chk_dca_entry_amount_ars  CHECK (amount_ars IS NULL OR amount_ars > 0),
  CONSTRAINT chk_dca_entry_price_pos   CHECK (asset_price_at_entry IS NULL OR asset_price_at_entry > 0),
  CONSTRAINT chk_dca_entry_units_nn    CHECK (units_received IS NULL OR units_received >= 0),
  CONSTRAINT chk_dca_entry_ars_ccl     CHECK (amount_ars IS NULL OR ccl_rate_id IS NOT NULL)
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `strategy_id` | UUID | NO | — | FK → dca_strategies |
| `ccl_rate_id` | UUID | SÍ | NULL | FK → ccl_rates. Requerido si `amount_ars` está presente |
| `type` | VARCHAR(10) | NO | — | `APERTURA`, `INCREMENTO` o `CIERRE` |
| `entry_date` | DATE | NO | — | Fecha de la compra/depósito |
| `amount_usd` | NUMERIC(18,4) | NO | — | Monto invertido en USD. Si ARS: `amount_ars / ccl_rate` |
| `amount_ars` | NUMERIC(18,4) | SÍ | NULL | Monto original en ARS (solo activos con `currency_native = ARS`) |
| `asset_price_at_entry` | NUMERIC(18,4) | SÍ | NULL | Precio del activo al momento de la compra (opcional) |
| `units_received` | NUMERIC(18,8) | SÍ | NULL | Unidades recibidas por esta entrada (opcional) |
| `notes` | TEXT | SÍ | NULL | Notas libres |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Campos calculados (NO en DB)

| Campo | Cálculo |
|-------|---------|
| `accumulated_capital_usd` | `Σ(amount_usd de todas las entradas anteriores + esta, ordenadas por entry_date)` |

`accumulated_capital_usd` se calcula on-the-fly en el servicio al leer las entradas de una estrategia. Al editar o borrar cualquier entrada, no se requiere recálculo en cascada porque el valor nunca se almacena.

---

## Índices

```sql
CREATE INDEX idx_dca_entries_strategy       ON dca_entries(strategy_id);
CREATE INDEX idx_dca_entries_strategy_date  ON dca_entries(strategy_id, entry_date);
CREATE INDEX idx_dca_entries_type           ON dca_entries(strategy_id, type);
```

---

## Relaciones

| Dirección | Tabla | FK | ON DELETE |
|-----------|-------|-----|-----------|
| Padre | `dca_strategies` | `strategy_id` | CASCADE |
| Padre | `ccl_rates` | `ccl_rate_id` | RESTRICT |

---

## Diferencia con trades (Trading)

| | `trades` | `dca_entries` |
|---|----------|---------------|
| Modelo | Compra/venta | Acumulación |
| Precio unitario | Obligatorio | Opcional |
| Moneda | ARS o USD | Siempre USD |
| CCL | Requerido si ARS | No aplica |
| Tipo | BUY / SELL | APERTURA / INCREMENTO / CIERRE |
| Relación | → positions | → dca_strategies |

---

## Notas de diseño

- `asset_price_at_entry` y `units_received` son **opcionales** porque en DCA puro el foco es el monto invertido. Muchos inversores DCA no registran el precio exacto de cada compra.
- `type = CIERRE` es para registrar retiros parciales de la estrategia (se desinvierte parte del capital). No cierra la estrategia — eso se hace con `dca_strategies.is_active = FALSE`.
