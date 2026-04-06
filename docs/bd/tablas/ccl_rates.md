# Tabla: ccl_rates

Historial del tipo de cambio CCL (Contado con Liquidación). Una fila por día hábil. Es la fuente de verdad para convertir precios ARS → USD en la fecha exacta de cada trade.

---

## DDL

```sql
CREATE TABLE ccl_rates (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  date       DATE          UNIQUE NOT NULL,
  rate       NUMERIC(12,4) NOT NULL,
  source     VARCHAR(10)   NOT NULL DEFAULT 'AMBITO',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_ccl_rate_positive CHECK (rate > 0),
  CONSTRAINT chk_ccl_rate_sane     CHECK (rate BETWEEN 100 AND 100000),
  CONSTRAINT chk_ccl_source        CHECK (source IN ('AMBITO', 'MANUAL'))
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `date` | DATE | NO | — | Fecha del valor CCL (UNIQUE — un solo valor por día) |
| `rate` | NUMERIC(12,4) | NO | — | Pesos argentinos por 1 dólar. Ej: `1218.5000` |
| `source` | VARCHAR(10) | NO | `AMBITO` | `AMBITO` = obtenido vía API · `MANUAL` = cargado a mano |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp de inserción en la DB |

> **Sin `updated_at`**: la política es upsert (no update). Si se corrige un valor, se sobreescribe y se registra la nueva `created_at`.

---

## Índices

```sql
CREATE UNIQUE INDEX uq_ccl_rates_date ON ccl_rates(date);
CREATE INDEX idx_ccl_rates_date_desc  ON ccl_rates(date DESC);
```

El índice `date DESC` optimiza la consulta más frecuente: "dame el CCL más reciente o el más cercano a X fecha".

---

## Relaciones

| Tabla hija | FK | ON DELETE |
|------------|-----|-----------|
| `trades` | `ccl_rate_id` | RESTRICT |

> No se puede borrar un registro CCL que esté siendo usado por un trade. Si se quiere "corregir" un CCL, se hace upsert del valor, no delete.

---

## Query clave: CCL de una fecha o el más cercano anterior

```sql
-- Usado por GET /ccl/date/:date y por el service de trades
SELECT *
FROM ccl_rates
WHERE date <= :target_date
ORDER BY date DESC
LIMIT 1;
```

---

## Notas de diseño

- **CHECK `rate BETWEEN 100 AND 100000`**: protege contra errores de carga (ej: ingresar `1.2185` en vez de `1218.5`).
- **Fines de semana y feriados**: no tienen registro. El service busca "el más cercano anterior", que es el del viernes o el día hábil previo al feriado.
- **Upsert policy**: `INSERT ... ON CONFLICT (date) DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source`. Los datos manuales tienen prioridad sobre Ambito (no se sobreescriben en el sync automático si `source = 'MANUAL'`).
