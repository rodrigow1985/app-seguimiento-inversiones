# Tabla: portfolios

Agrupadores lógicos de posiciones y estrategias DCA. Cada cartera tiene un objetivo de inversión común.

---

## DDL

```sql
CREATE TABLE portfolios (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  currency    VARCHAR(3)   NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_portfolios_currency CHECK (currency IN ('ARS','USD'))
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | VARCHAR(100) | NO | — | Nombre único de la cartera |
| `description` | TEXT | SÍ | NULL | Descripción del objetivo de inversión |
| `currency` | VARCHAR(3) | NO | — | Moneda de referencia para el P&L de la cartera |
| `is_active` | BOOLEAN | NO | TRUE | Ocultar cartera sin borrarla |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | |

---

## Índices

```sql
CREATE UNIQUE INDEX uq_portfolios_name ON portfolios(name);
CREATE INDEX idx_portfolios_active ON portfolios(is_active) WHERE is_active = TRUE;
```

---

## Relaciones

| Tabla hija | FK | ON DELETE |
|------------|-----|-----------|
| `positions` | `portfolio_id` | RESTRICT |
| `dca_strategies` | `portfolio_id` | RESTRICT |

---

## Datos de seed

```sql
INSERT INTO portfolios (name, description, currency) VALUES
('Cryptos',      'Criptomonedas. Brokers: Binance, BingX',       'USD'),
('Acciones ARG', 'Acciones argentinas en pesos. Broker: IOL',    'USD'),
('Cedears CP',   'Cedears de corto plazo. Broker: IOL',          'USD'),
('Jubilación',   'Inversiones de largo plazo para jubilación',   'USD'),
('FCI USD',      'Fondos comunes de inversión en dólares',       'USD'),
('Renta Fija',   'Bonos y letras. Broker: IOL, Balanz',         'USD');
```

---

## Notas de diseño

- `currency` es la moneda de **reporte** de la cartera (casi siempre USD para ver el valor real). No afecta cómo se almacenan los trades — eso depende del activo.
- El sidebar de la app genera dinámicamente un item por cada `portfolio WHERE is_active = TRUE`.
- `name` es inmutable post-creación si hay posiciones activas (para preservar la navegación).
