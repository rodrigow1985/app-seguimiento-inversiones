# Tabla: dca_entries

Entradas individuales de una estrategia DCA. Pueden ser de tipo Apertura, Incremento o Cierre.

---

## DDL

```sql
CREATE TABLE dca_entries (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id             UUID           NOT NULL REFERENCES dca_strategies(id) ON DELETE CASCADE,
  type                    VARCHAR(10)    NOT NULL,
  entry_date              DATE           NOT NULL,
  amount_usd              NUMERIC(18,4)  NOT NULL,
  accumulated_capital_usd NUMERIC(18,4)  NOT NULL,
  asset_price_at_entry    NUMERIC(18,4),
  units_received          NUMERIC(18,8),
  notes                   TEXT,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dca_entry_type           CHECK (type IN ('APERTURA','INCREMENTO','CIERRE')),
  CONSTRAINT chk_dca_entry_amount_pos     CHECK (amount_usd > 0),
  CONSTRAINT chk_dca_entry_acum_pos       CHECK (accumulated_capital_usd >= 0),
  CONSTRAINT chk_dca_entry_price_pos      CHECK (asset_price_at_entry IS NULL OR asset_price_at_entry > 0),
  CONSTRAINT chk_dca_entry_units_nn       CHECK (units_received IS NULL OR units_received >= 0)
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `strategy_id` | UUID | NO | — | FK → dca_strategies |
| `type` | VARCHAR(10) | NO | — | `APERTURA`, `INCREMENTO` o `CIERRE` |
| `entry_date` | DATE | NO | — | Fecha de la compra/depósito |
| `amount_usd` | NUMERIC(18,4) | NO | — | Monto invertido en esta entrada (USD) |
| `accumulated_capital_usd` | NUMERIC(18,4) | NO | — | **Suma acumulada** de capital hasta esta entrada (ver abajo) |
| `asset_price_at_entry` | NUMERIC(18,4) | SÍ | NULL | Precio del activo al momento de la compra (opcional) |
| `units_received` | NUMERIC(18,8) | SÍ | NULL | Unidades recibidas por esta entrada (opcional) |
| `notes` | TEXT | SÍ | NULL | Notas libres |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Por qué accumulated_capital_usd se persiste

Es la **única denormalización explícita** del sistema (ver [README.md](../README.md#decisiones-de-diseño)).

```
entry_1: amount=300  → accumulated=300
entry_2: amount=400  → accumulated=700
entry_3: amount=350  → accumulated=1050
...
```

**Razones:**
1. Alimenta el gráfico de acumulación de capital (S06) con una query simple ordenada por `entry_date`
2. Permite mostrar el capital acumulado en cada punto sin recalcular toda la serie
3. El valor actual de la estrategia NO se persiste (depende del precio, que cambia)

**Trade-off:** al editar o borrar una entrada, el service debe recalcular `accumulated_capital_usd` de todas las entradas posteriores en cascada.

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
