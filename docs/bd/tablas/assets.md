# Tabla: assets

Catálogo maestro de instrumentos financieros. Incluye cryptos, acciones argentinas, Cedears, FCI, bonos y commodities.

---

## DDL

```sql
CREATE TABLE assets (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker          VARCHAR(20)  UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  asset_type      VARCHAR(20)  NOT NULL,
  currency_native VARCHAR(3)   NOT NULL,
  price_source    VARCHAR(20)  NOT NULL,
  price_source_id VARCHAR(100),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_assets_type     CHECK (asset_type      IN ('CRYPTO','ACCION_ARG','CEDEAR','FCI','BONO','COMMODITY')),
  CONSTRAINT chk_assets_currency CHECK (currency_native IN ('ARS','USD')),
  CONSTRAINT chk_assets_source   CHECK (price_source    IN ('COINGECKO','IOL','RAVA','MANUAL'))
);
```

---

## Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `ticker` | VARCHAR(20) | NO | — | Símbolo único: `BTC`, `GGAL`, `AL30` |
| `name` | VARCHAR(100) | NO | — | Nombre completo del activo |
| `asset_type` | VARCHAR(20) | NO | — | Enum: `CRYPTO`, `ACCION_ARG`, `CEDEAR`, `FCI`, `BONO`, `COMMODITY` |
| `currency_native` | VARCHAR(3) | NO | — | `ARS` o `USD` — moneda en que cotiza |
| `price_source` | VARCHAR(20) | NO | — | `COINGECKO`, `IOL`, `RAVA`, `MANUAL` |
| `price_source_id` | VARCHAR(100) | SÍ | NULL | ID en la API externa (ej: `"bitcoin"` en CoinGecko) |
| `is_active` | BOOLEAN | NO | TRUE | Para desactivar sin borrar |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp de creación |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Timestamp de última modificación |

---

## Índices

```sql
-- PK implícito
CREATE UNIQUE INDEX uq_assets_ticker ON assets(ticker);

-- Filtros frecuentes
CREATE INDEX idx_assets_type     ON assets(asset_type);
CREATE INDEX idx_assets_active   ON assets(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_assets_source   ON assets(price_source);
```

---

## Relaciones

| Tabla hija | FK | ON DELETE |
|------------|-----|-----------|
| `positions` | `asset_id` | RESTRICT |
| `dca_strategies` | `asset_id` | RESTRICT |
| `price_snapshots` | `asset_id` | CASCADE |

---

## Datos de seed

```sql
INSERT INTO assets (ticker, name, asset_type, currency_native, price_source, price_source_id) VALUES
-- Crypto
('BTC',  'Bitcoin',                 'CRYPTO',     'USD', 'COINGECKO', 'bitcoin'),
('ETH',  'Ethereum',                'CRYPTO',     'USD', 'COINGECKO', 'ethereum'),
('BNB',  'BNB',                     'CRYPTO',     'USD', 'COINGECKO', 'binancecoin'),
-- Acciones ARG
('GGAL', 'Grupo Galicia',           'ACCION_ARG', 'ARS', 'IOL',       'GGAL'),
('YPF',  'YPF S.A.',                'ACCION_ARG', 'ARS', 'IOL',       'YPF'),
('BBAR', 'Banco BBVA Argentina',    'ACCION_ARG', 'ARS', 'IOL',       'BBAR'),
-- Cedears
('MELI', 'MercadoLibre',            'CEDEAR',     'ARS', 'IOL',       'MELI'),
('NVDA', 'NVIDIA Corporation',      'CEDEAR',     'ARS', 'IOL',       'NVDA'),
-- FCI
('FIMA_AHORRO', 'Fima Ahorro',      'FCI',        'ARS', 'MANUAL',    NULL),
-- Bonos
('AL30', 'Bono AR$ 2030',           'BONO',       'ARS', 'MANUAL',    NULL);
```

---

## Notas de diseño

- **Cedears tienen `currency_native = ARS`** aunque el subyacente sea una empresa extranjera. Cotizan en pesos en el mercado argentino.
- **`price_source_id` es opcional** porque algunos activos manuales (bonos, FCI) no tienen ID externo.
- **No se borra un activo** si tiene posiciones o estrategias DCA activas (ON DELETE RESTRICT). Se desactiva con `is_active = FALSE`.
