-- Migration: 001_initial_schema
-- Descripción: Schema inicial completo para la app de seguimiento de inversiones
-- Motor: PostgreSQL 16
-- Creado: 2026-04-05
--
-- UP: Crea todas las tablas, enums, índices y constraints
-- DOWN: Al final del archivo

-- ═══════════════════════════════════════════
-- UP
-- ═══════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────
-- EXTENSIONES
-- ─────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- Para gen_random_uuid()

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

CREATE TYPE asset_type_enum AS ENUM (
  'CRYPTO', 'ACCION_ARG', 'CEDEAR', 'FCI', 'BONO', 'COMMODITY'
);

CREATE TYPE currency_enum AS ENUM ('ARS', 'USD');

CREATE TYPE price_source_enum AS ENUM ('COINGECKO', 'IOL', 'RAVA', 'MANUAL');

CREATE TYPE position_status_enum AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE trade_type_enum AS ENUM ('BUY', 'SELL');

CREATE TYPE dca_entry_type_enum AS ENUM ('APERTURA', 'INCREMENTO', 'CIERRE');

CREATE TYPE ccl_source_enum AS ENUM ('AMBITO', 'MANUAL');

-- ─────────────────────────────────────────
-- ASSETS
-- ─────────────────────────────────────────

CREATE TABLE assets (
  id              UUID                NOT NULL DEFAULT gen_random_uuid(),
  ticker          VARCHAR(20)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  asset_type      asset_type_enum     NOT NULL,
  currency_native currency_enum       NOT NULL,
  price_source    price_source_enum   NOT NULL,
  price_source_id VARCHAR(100),
  is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_assets     PRIMARY KEY (id),
  CONSTRAINT uq_assets_ticker UNIQUE (ticker)
);

CREATE INDEX idx_assets_type   ON assets(asset_type);
CREATE INDEX idx_assets_active ON assets(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE  assets                  IS 'Catálogo maestro de activos financieros';
COMMENT ON COLUMN assets.ticker           IS 'Símbolo único del activo (BTC, GGAL, AL30)';
COMMENT ON COLUMN assets.currency_native  IS 'Moneda en que cotiza. Cedears = ARS aunque el subyacente sea USD';
COMMENT ON COLUMN assets.price_source_id  IS 'ID en la API externa (ej: "bitcoin" en CoinGecko)';

-- ─────────────────────────────────────────
-- BROKERS
-- ─────────────────────────────────────────

CREATE TABLE brokers (
  id             UUID          NOT NULL DEFAULT gen_random_uuid(),
  name           VARCHAR(50)   NOT NULL,
  commission_pct NUMERIC(6,4)  NOT NULL,
  currency       currency_enum NOT NULL,
  config         JSONB         NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_brokers          PRIMARY KEY (id),
  CONSTRAINT uq_brokers_name     UNIQUE (name),
  CONSTRAINT chk_commission_pos  CHECK (commission_pct >= 0),
  CONSTRAINT chk_commission_max  CHECK (commission_pct <= 100)
);

COMMENT ON TABLE  brokers                IS 'Brokers y exchanges que ejecutan operaciones';
COMMENT ON COLUMN brokers.commission_pct IS '0.7000 = 0.70%. DECIMAL para evitar errores de redondeo';
COMMENT ON COLUMN brokers.config         IS 'Config adicional en JSON. Sin API keys (van en .env)';

-- ─────────────────────────────────────────
-- PORTFOLIOS
-- ─────────────────────────────────────────

CREATE TABLE portfolios (
  id          UUID          NOT NULL DEFAULT gen_random_uuid(),
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  currency    currency_enum NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_portfolios      PRIMARY KEY (id),
  CONSTRAINT uq_portfolios_name UNIQUE (name)
);

CREATE INDEX idx_portfolios_active ON portfolios(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE  portfolios          IS 'Carteras de inversión (agrupa posiciones y estrategias DCA)';
COMMENT ON COLUMN portfolios.currency IS 'Moneda de reporte del P&L de la cartera (casi siempre USD)';

-- ─────────────────────────────────────────
-- CCL RATES
-- ─────────────────────────────────────────

CREATE TABLE ccl_rates (
  id         UUID            NOT NULL DEFAULT gen_random_uuid(),
  date       DATE            NOT NULL,
  rate       NUMERIC(12,4)   NOT NULL,
  source     ccl_source_enum NOT NULL DEFAULT 'AMBITO',
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_ccl_rates       PRIMARY KEY (id),
  CONSTRAINT uq_ccl_rates_date  UNIQUE (date),
  CONSTRAINT chk_ccl_rate_pos   CHECK (rate > 0),
  CONSTRAINT chk_ccl_rate_sane  CHECK (rate BETWEEN 100 AND 100000)
);

CREATE INDEX idx_ccl_rates_date_desc ON ccl_rates(date DESC);

COMMENT ON TABLE  ccl_rates      IS 'Historial del tipo de cambio CCL (ARS/USD). Una fila por día hábil';
COMMENT ON COLUMN ccl_rates.rate IS 'Pesos argentinos por 1 dólar. Ej: 1218.5000';
COMMENT ON COLUMN ccl_rates.date IS 'Días sin cotización (fines de semana, feriados) no tienen fila';

-- ─────────────────────────────────────────
-- POSITIONS (Trading)
-- ─────────────────────────────────────────

CREATE TABLE positions (
  id           UUID                   NOT NULL DEFAULT gen_random_uuid(),
  portfolio_id UUID                   NOT NULL,
  asset_id     UUID                   NOT NULL,
  broker_id    UUID                   NOT NULL,
  status       position_status_enum   NOT NULL DEFAULT 'OPEN',
  opened_at    DATE                   NOT NULL,
  closed_at    DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_positions                   PRIMARY KEY (id),
  CONSTRAINT fk_positions_portfolio         FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_positions_asset             FOREIGN KEY (asset_id)     REFERENCES assets(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_positions_broker            FOREIGN KEY (broker_id)    REFERENCES brokers(id)    ON DELETE RESTRICT,
  CONSTRAINT chk_positions_closed_after_open CHECK (closed_at IS NULL OR closed_at >= opened_at),
  CONSTRAINT chk_positions_status_consistency CHECK (
    (status = 'CLOSED' AND closed_at IS NOT NULL) OR
    (status = 'OPEN'   AND closed_at IS NULL)
  )
);

CREATE INDEX idx_positions_portfolio        ON positions(portfolio_id);
CREATE INDEX idx_positions_asset            ON positions(asset_id);
CREATE INDEX idx_positions_broker           ON positions(broker_id);
CREATE INDEX idx_positions_status           ON positions(status) WHERE status = 'OPEN';
CREATE INDEX idx_positions_portfolio_status ON positions(portfolio_id, status);

COMMENT ON TABLE  positions          IS 'Posiciones de trading: agrupan trades BUY/SELL del mismo activo en una cartera';
COMMENT ON COLUMN positions.opened_at IS 'Fecha del primer trade (campo de negocio, no timestamp del sistema)';

-- ─────────────────────────────────────────
-- TRADES
-- ─────────────────────────────────────────

CREATE TABLE trades (
  id           UUID             NOT NULL DEFAULT gen_random_uuid(),
  position_id  UUID             NOT NULL,
  ccl_rate_id  UUID,
  type         trade_type_enum  NOT NULL,
  trade_date   DATE             NOT NULL,
  units        NUMERIC(18,8)    NOT NULL,
  price_native NUMERIC(18,4)    NOT NULL,
  currency     currency_enum    NOT NULL,
  price_usd    NUMERIC(18,4)    NOT NULL,
  total_usd    NUMERIC(18,4)    NOT NULL,
  commission   NUMERIC(18,4)    NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_trades                 PRIMARY KEY (id),
  CONSTRAINT fk_trades_position        FOREIGN KEY (position_id) REFERENCES positions(id)  ON DELETE CASCADE,
  CONSTRAINT fk_trades_ccl_rate        FOREIGN KEY (ccl_rate_id) REFERENCES ccl_rates(id)  ON DELETE RESTRICT,
  CONSTRAINT chk_trades_units_pos      CHECK (units        > 0),
  CONSTRAINT chk_trades_price_pos      CHECK (price_native > 0),
  CONSTRAINT chk_trades_price_usd_pos  CHECK (price_usd    > 0),
  CONSTRAINT chk_trades_total_usd_pos  CHECK (total_usd    > 0),
  CONSTRAINT chk_trades_commission_nn  CHECK (commission  >= 0),
  CONSTRAINT chk_trades_ccl_required   CHECK (
    currency = 'USD' OR ccl_rate_id IS NOT NULL
  )
);

CREATE INDEX idx_trades_position      ON trades(position_id);
CREATE INDEX idx_trades_ccl_rate      ON trades(ccl_rate_id);
CREATE INDEX idx_trades_date          ON trades(trade_date);
CREATE INDEX idx_trades_pos_type      ON trades(position_id, type);
CREATE INDEX idx_trades_pos_date      ON trades(position_id, trade_date);

COMMENT ON TABLE  trades              IS 'Trades individuales BUY/SELL dentro de una posición de trading';
COMMENT ON COLUMN trades.price_native IS 'Precio en moneda nativa del activo (ARS o USD)';
COMMENT ON COLUMN trades.price_usd    IS 'Snapshot de la conversión USD aplicada. Se persiste para trazabilidad histórica';
COMMENT ON COLUMN trades.total_usd    IS 'units × price_usd. Snapshot histórico';
COMMENT ON COLUMN trades.ccl_rate_id  IS 'FK a ccl_rates. NULL solo si currency = USD';

-- ─────────────────────────────────────────
-- DCA STRATEGIES
-- ─────────────────────────────────────────

CREATE TABLE dca_strategies (
  id           UUID          NOT NULL DEFAULT gen_random_uuid(),
  portfolio_id UUID          NOT NULL,
  asset_id     UUID          NOT NULL,
  broker_id    UUID          NOT NULL,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  started_at   DATE          NOT NULL,
  closed_at    DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dca_strategies                  PRIMARY KEY (id),
  CONSTRAINT fk_dca_strategies_portfolio        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_dca_strategies_asset            FOREIGN KEY (asset_id)     REFERENCES assets(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_dca_strategies_broker           FOREIGN KEY (broker_id)    REFERENCES brokers(id)    ON DELETE RESTRICT,
  CONSTRAINT chk_dca_closed_after_start         CHECK (closed_at IS NULL OR closed_at >= started_at),
  CONSTRAINT chk_dca_active_consistency         CHECK (
    (is_active = FALSE AND closed_at IS NOT NULL) OR
    (is_active = TRUE  AND closed_at IS NULL)
  )
);

CREATE INDEX idx_dca_strategies_portfolio ON dca_strategies(portfolio_id);
CREATE INDEX idx_dca_strategies_asset     ON dca_strategies(asset_id);
CREATE INDEX idx_dca_strategies_broker    ON dca_strategies(broker_id);
CREATE INDEX idx_dca_strategies_active    ON dca_strategies(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE dca_strategies IS 'Estrategias DCA: completamente separadas del modelo de Trading (no comparten tablas)';

-- ─────────────────────────────────────────
-- DCA ENTRIES
-- ─────────────────────────────────────────

CREATE TABLE dca_entries (
  id                      UUID                  NOT NULL DEFAULT gen_random_uuid(),
  strategy_id             UUID                  NOT NULL,
  type                    dca_entry_type_enum   NOT NULL,
  entry_date              DATE                  NOT NULL,
  amount_usd              NUMERIC(18,4)         NOT NULL,
  accumulated_capital_usd NUMERIC(18,4)         NOT NULL,
  asset_price_at_entry    NUMERIC(18,4),
  units_received          NUMERIC(18,8),
  notes                   TEXT,
  created_at              TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dca_entries               PRIMARY KEY (id),
  CONSTRAINT fk_dca_entries_strategy      FOREIGN KEY (strategy_id) REFERENCES dca_strategies(id) ON DELETE CASCADE,
  CONSTRAINT chk_dca_entry_amount_pos     CHECK (amount_usd              >  0),
  CONSTRAINT chk_dca_entry_acum_pos       CHECK (accumulated_capital_usd >= 0),
  CONSTRAINT chk_dca_entry_price_pos      CHECK (asset_price_at_entry IS NULL OR asset_price_at_entry > 0),
  CONSTRAINT chk_dca_entry_units_nn       CHECK (units_received       IS NULL OR units_received       >= 0)
);

CREATE INDEX idx_dca_entries_strategy      ON dca_entries(strategy_id);
CREATE INDEX idx_dca_entries_strategy_date ON dca_entries(strategy_id, entry_date);

COMMENT ON TABLE  dca_entries                      IS 'Entradas individuales de una estrategia DCA';
COMMENT ON COLUMN dca_entries.accumulated_capital_usd IS 'Denorm. explícita: suma acumulada de capital hasta esta entrada. Recalcular en cascada al editar/borrar';
COMMENT ON COLUMN dca_entries.asset_price_at_entry IS 'Opcional: precio del activo al momento de la compra';
COMMENT ON COLUMN dca_entries.units_received       IS 'Opcional: unidades de activo recibidas';

-- ─────────────────────────────────────────
-- PRICE SNAPSHOTS
-- ─────────────────────────────────────────

CREATE TABLE price_snapshots (
  id         UUID              NOT NULL DEFAULT gen_random_uuid(),
  asset_id   UUID              NOT NULL,
  price      NUMERIC(18,4)     NOT NULL,
  currency   currency_enum     NOT NULL,
  source     VARCHAR(20)       NOT NULL,
  fetched_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_price_snapshots       PRIMARY KEY (id),
  CONSTRAINT fk_price_snapshots_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  CONSTRAINT chk_price_pos            CHECK (price > 0)
);

CREATE INDEX idx_price_snapshots_asset_time
  ON price_snapshots(asset_id, fetched_at DESC);

COMMENT ON TABLE  price_snapshots           IS 'Caché de precios de activos. Retención: 90 días. Append-only';
COMMENT ON COLUMN price_snapshots.fetched_at IS 'Momento exacto de obtención del precio';

-- ─────────────────────────────────────────
-- FUNCIÓN: updated_at automático
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_dca_strategies_updated_at
  BEFORE UPDATE ON dca_strategies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_dca_entries_updated_at
  BEFORE UPDATE ON dca_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;


-- ═══════════════════════════════════════════
-- SEED: datos iniciales
-- ═══════════════════════════════════════════
-- Ejecutar después del UP para desarrollo

BEGIN;

INSERT INTO brokers (name, commission_pct, currency) VALUES
  ('IOL',     0.7000, 'ARS'),
  ('Binance',  0.7260, 'USD'),
  ('BingX',   0.2000, 'USD'),
  ('Balanz',  0.7000, 'ARS')
ON CONFLICT (name) DO NOTHING;

INSERT INTO portfolios (name, description, currency) VALUES
  ('Cryptos',      'Criptomonedas. Brokers: Binance, BingX',     'USD'),
  ('Acciones ARG', 'Acciones argentinas en pesos. Broker: IOL',  'USD'),
  ('Cedears CP',   'Cedears de corto plazo. Broker: IOL',        'USD'),
  ('Jubilación',   'Inversiones de largo plazo para jubilación', 'USD'),
  ('FCI USD',      'Fondos comunes de inversión en dólares',     'USD'),
  ('Renta Fija',   'Bonos y letras. Broker: IOL, Balanz',       'USD')
ON CONFLICT (name) DO NOTHING;

INSERT INTO assets (ticker, name, asset_type, currency_native, price_source, price_source_id) VALUES
  ('BTC',  'Bitcoin',             'CRYPTO',     'USD', 'COINGECKO', 'bitcoin'),
  ('ETH',  'Ethereum',            'CRYPTO',     'USD', 'COINGECKO', 'ethereum'),
  ('BNB',  'BNB',                 'CRYPTO',     'USD', 'COINGECKO', 'binancecoin'),
  ('GGAL', 'Grupo Galicia',       'ACCION_ARG', 'ARS', 'IOL',       'GGAL'),
  ('YPF',  'YPF S.A.',            'ACCION_ARG', 'ARS', 'IOL',       'YPF'),
  ('BBAR', 'Banco BBVA Argentina','ACCION_ARG', 'ARS', 'IOL',       'BBAR'),
  ('MELI', 'MercadoLibre Inc.',   'CEDEAR',     'ARS', 'IOL',       'MELI'),
  ('NVDA', 'NVIDIA Corporation',  'CEDEAR',     'ARS', 'IOL',       'NVDA'),
  ('AAPL', 'Apple Inc.',          'CEDEAR',     'ARS', 'IOL',       'AAPL'),
  ('AL30', 'Bono AR$ 2030',       'BONO',       'ARS', 'MANUAL',    NULL)
ON CONFLICT (ticker) DO NOTHING;

COMMIT;


-- ═══════════════════════════════════════════
-- DOWN (rollback)
-- ═══════════════════════════════════════════

/*
BEGIN;

DROP TABLE IF EXISTS price_snapshots  CASCADE;
DROP TABLE IF EXISTS dca_entries      CASCADE;
DROP TABLE IF EXISTS dca_strategies   CASCADE;
DROP TABLE IF EXISTS trades           CASCADE;
DROP TABLE IF EXISTS positions        CASCADE;
DROP TABLE IF EXISTS ccl_rates        CASCADE;
DROP TABLE IF EXISTS portfolios       CASCADE;
DROP TABLE IF EXISTS brokers          CASCADE;
DROP TABLE IF EXISTS assets           CASCADE;

DROP FUNCTION IF EXISTS set_updated_at CASCADE;

DROP TYPE IF EXISTS dca_entry_type_enum  CASCADE;
DROP TYPE IF EXISTS trade_type_enum      CASCADE;
DROP TYPE IF EXISTS position_status_enum CASCADE;
DROP TYPE IF EXISTS ccl_source_enum      CASCADE;
DROP TYPE IF EXISTS price_source_enum    CASCADE;
DROP TYPE IF EXISTS currency_enum        CASCADE;
DROP TYPE IF EXISTS asset_type_enum      CASCADE;

COMMIT;
*/
