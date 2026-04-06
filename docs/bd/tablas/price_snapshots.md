# Tabla: price_snapshots

Caché de precios actuales e históricos de activos. Se usa para el dashboard (evitar llamadas a APIs externas en cada render) y para los gráficos de precio.

---

## DDL

```sql
CREATE TABLE price_snapshots (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID           NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  price      NUMERIC(18,4)  NOT NULL,
  currency   VARCHAR(3)     NOT NULL,
  source     VARCHAR(20)    NOT NULL,
  fetched_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_price_snapshots_currency CHECK (currency IN ('ARS','USD')),
  CONSTRAINT chk_price_snapshots_source   CHECK (source IN ('COINGECKO','IOL','RAVA','MANUAL')),
  CONSTRAINT chk_price_snapshots_pos      CHECK (price > 0)
);
```

> Sin `updated_at` — los snapshots son **inmutables**. Se insertan, nunca se actualizan.

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `asset_id` | UUID | NO | — | FK → assets |
| `price` | NUMERIC(18,4) | NO | — | Precio en la moneda nativa del activo |
| `currency` | VARCHAR(3) | NO | — | `ARS` o `USD` |
| `source` | VARCHAR(20) | NO | — | API que proveyó el precio |
| `fetched_at` | TIMESTAMPTZ | NO | `NOW()` | Momento exacto en que se obtuvo |

---

## Índices

```sql
-- Query más frecuente: último precio de un activo
CREATE INDEX idx_price_snapshots_asset_time
  ON price_snapshots(asset_id, fetched_at DESC);

-- Para gráficos históricos: todos los precios de un activo en un rango
CREATE INDEX idx_price_snapshots_asset_range
  ON price_snapshots(asset_id, fetched_at);
```

---

## Relaciones

| Dirección | Tabla | FK | ON DELETE |
|-----------|-------|-----|-----------|
| Padre | `assets` | `asset_id` | CASCADE |

---

## Query clave: último precio de un activo

```sql
SELECT price, currency, fetched_at
FROM price_snapshots
WHERE asset_id = $1
ORDER BY fetched_at DESC
LIMIT 1;
```

---

## Política de retención

Los snapshots **no son datos de negocio críticos** — se pueden regenerar desde las APIs externas.

```sql
-- Limpiar snapshots de más de 90 días (ejecutar periódicamente)
DELETE FROM price_snapshots
WHERE fetched_at < NOW() - INTERVAL '90 days';
```

**Retención sugerida:**
- Precios del día actual: frecuencia alta (cada 15 min)
- Precios históricos de los últimos 90 días: 1 snapshot diario por activo

---

## Notas de diseño

- **No reemplaza la API externa**: si se necesita precio en tiempo real, se llama a la API. Esta tabla es un caché local.
- **Datos insuficientes para P&L**: el precio más reciente disponible se usa cuando la API falla. En ese caso la API responde con `"pricesStale": true`.
- **Sin `updated_at`**: los snapshots son append-only. El precio de las 14:30 del 5/4/2026 nunca cambia — si hay un nuevo precio, se inserta una nueva fila.
