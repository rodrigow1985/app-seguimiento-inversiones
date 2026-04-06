# Tabla: brokers

Entidades que ejecutan las operaciones. Cada broker tiene su propia comisión y moneda operativa.

---

## DDL

```sql
CREATE TABLE brokers (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(50)   UNIQUE NOT NULL,
  commission_pct NUMERIC(6,4)  NOT NULL,
  currency       VARCHAR(3)    NOT NULL,
  config         JSONB         NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_brokers_currency       CHECK (currency       IN ('ARS','USD')),
  CONSTRAINT chk_brokers_commission_pos CHECK (commission_pct >= 0),
  CONSTRAINT chk_brokers_commission_max CHECK (commission_pct <= 100)
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | VARCHAR(50) | NO | — | Nombre único: `IOL`, `Binance`, `BingX`, `Balanz` |
| `commission_pct` | NUMERIC(6,4) | NO | — | Comisión en porcentaje. `0.7000` = 0.70% |
| `currency` | VARCHAR(3) | NO | — | Moneda operativa del broker: `ARS` o `USD` |
| `config` | JSONB | NO | `{}` | Configuración adicional libre. Sin API keys (van en `.env`) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Índices

```sql
CREATE UNIQUE INDEX uq_brokers_name ON brokers(name);
```

---

## Relaciones

| Tabla hija | FK | ON DELETE |
|------------|-----|-----------|
| `positions` | `broker_id` | RESTRICT |
| `dca_strategies` | `broker_id` | RESTRICT |

---

## Datos de seed

```sql
INSERT INTO brokers (name, commission_pct, currency) VALUES
('IOL',     0.7000, 'ARS'),
('Binance',  0.7260, 'USD'),
('BingX',   0.2000, 'USD'),
('Balanz',  0.7000, 'ARS');
```

**Comisiones actuales (2026):**

| Broker | Comisión | Base de cálculo |
|--------|----------|----------------|
| IOL | 0.70% | Sobre el total ARS de la operación |
| Binance | 0.726% | Sobre el total USD (incluye spread) |
| BingX | 0.20% | Sobre el total USD |
| Balanz | 0.70% | Sobre el total ARS de la operación |

---

## Notas de diseño

- `commission_pct` usa `NUMERIC(6,4)` → máx. valor `99.9999%`. Suficiente para cualquier comisión real.
- `config JSONB` guarda datos opcionales de cada broker (URL base, alias, configuración de API) pero **nunca credenciales** — esas van en `.env`.
- `name` y `currency` son inmutables post-creación (hay trades referenciando el broker). Solo `commission_pct` y `config` son editables.
