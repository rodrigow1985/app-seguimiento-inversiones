-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CRYPTO', 'ACCION_ARG', 'CEDEAR', 'FCI', 'BONO', 'COMMODITY');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('COINGECKO', 'IOL', 'RAVA', 'MANUAL');

-- CreateEnum
CREATE TYPE "PortfolioType" AS ENUM ('TRADING', 'DCA');

-- CreateEnum
CREATE TYPE "PortfolioStrategy" AS ENUM ('CORTO_PLAZO', 'LARGO_PLAZO', 'JUBILACION');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "DcaEntryType" AS ENUM ('APERTURA', 'INCREMENTO', 'CIERRE');

-- CreateEnum
CREATE TYPE "CclSource" AS ENUM ('AMBITO', 'MANUAL');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "ticker" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "currency_native" "CurrencyType" NOT NULL,
    "price_source" "PriceSource" NOT NULL,
    "price_source_id" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "commission_pct" DECIMAL(6,4) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "portfolio_type" "PortfolioType" NOT NULL,
    "strategy" "PortfolioStrategy" NOT NULL,
    "currency_base" "CurrencyType" NOT NULL,
    "broker_id" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ccl_rates" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rate" DECIMAL(10,4) NOT NULL,
    "source" "CclSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ccl_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "opened_at" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "type" "TradeType" NOT NULL,
    "trade_date" DATE NOT NULL,
    "units" DECIMAL(18,8) NOT NULL,
    "price_native" DECIMAL(18,8) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "ccl_rate_id" TEXT,
    "price_usd" DECIMAL(18,8) NOT NULL,
    "total_usd" DECIMAL(18,4) NOT NULL,
    "commission_pct" DECIMAL(6,4) NOT NULL,
    "commission_amount" DECIMAL(18,4) NOT NULL,
    "broker_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dca_strategies" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "broker_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dca_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dca_entries" (
    "id" TEXT NOT NULL,
    "strategy_id" TEXT NOT NULL,
    "ccl_rate_id" TEXT,
    "type" "DcaEntryType" NOT NULL,
    "entry_date" DATE NOT NULL,
    "amount_usd" DECIMAL(18,4) NOT NULL,
    "amount_ars" DECIMAL(18,4),
    "asset_price_at_entry" DECIMAL(18,4),
    "units_received" DECIMAL(18,8),
    "profit_loss_usd" DECIMAL(18,4),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dca_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_snapshots" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "price_date" DATE NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_ticker_key" ON "assets"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_name_key" ON "brokers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ccl_rates_date_key" ON "ccl_rates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "positions_portfolio_id_asset_id_key" ON "positions"("portfolio_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_snapshots_asset_id_price_date_key" ON "price_snapshots"("asset_id", "price_date");

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_ccl_rate_id_fkey" FOREIGN KEY ("ccl_rate_id") REFERENCES "ccl_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dca_strategies" ADD CONSTRAINT "dca_strategies_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dca_strategies" ADD CONSTRAINT "dca_strategies_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dca_strategies" ADD CONSTRAINT "dca_strategies_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dca_entries" ADD CONSTRAINT "dca_entries_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "dca_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dca_entries" ADD CONSTRAINT "dca_entries_ccl_rate_id_fkey" FOREIGN KEY ("ccl_rate_id") REFERENCES "ccl_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
