# Migración desde el Excel

Este documento describe cómo importar los datos históricos del archivo `docs/copia_original/Inversiones.xlsx` a la base de datos.

## Hoja → Tabla de DB

| Hoja Excel | Entidad DB | Script |
|---|---|---|
| CCL (columnas A y B) | `CclRate` | `pnpm db:import-ccl` |
| Config (brokers) | `Broker` (seed) | `pnpm db:seed` |
| Cryptos | `Portfolio` + `Position` + `Trade` | `pnpm db:import-trading cryptos` |
| Acciones ARG | `Portfolio` + `Position` + `Trade` | `pnpm db:import-trading acciones-arg` |
| Cartera corto plazo | `Portfolio` + `Position` + `Trade` | `pnpm db:import-trading corto-plazo` |
| Cartera Jubilación | `Portfolio` + `Position` + `Trade` | `pnpm db:import-trading jubilacion` |
| FCI_USD | `Portfolio` + `Position` + `Trade` | `pnpm db:import-trading fci` |
| Renta fija | `Portfolio` + `Position` + `Trade` | `pnpm db:import-trading renta-fija` |
| BTC | `DcaStrategy` + `DcaEntry` | `pnpm db:import-dca btc` |
| ETH | `DcaStrategy` + `DcaEntry` | `pnpm db:import-dca eth` |
| ADA | `DcaStrategy` + `DcaEntry` | `pnpm db:import-dca ada` |
| PAXGUSD | `DcaStrategy` + `DcaEntry` | `pnpm db:import-dca paxgusd` |
| Estrategia Michel Saylor | `DcaStrategy` + `DcaEntry` | `pnpm db:import-dca saylor` |

## Mapeo de columnas: Hoja Cryptos → Trade

| Columna Excel | Campo DB | Notas |
|---|---|---|
| ID | `broker_id` | Lookup por nombre en tabla Broker |
| Ticker | `asset_id` | Lookup por ticker en tabla Asset |
| Apertura | `position.opened_at` | Fecha de apertura de la posición |
| Estado | `position.status` | ABIERTA → `ABIERTA`, CERRADA → `CERRADA` |
| Cierre | `position.closed_at` | Nullable |
| Unidades | `trade.units` | |
| Valor Compra | `trade.price_native` | En USD para crypto |
| Valor Venta | Genera Trade tipo SELL | Solo si Estado = CERRADA |

## Mapeo de columnas: Hojas Cedears/Acciones (ARS)

| Columna Excel | Campo DB | Notas |
|---|---|---|
| Valor Compra ARS | `trade.price_native` + `trade.price_currency = ARS` | |
| CCL día compra | `trade.ccl_rate_id` | Lookup en CclRate por fecha de apertura |
| Valor Compra USD | — | Campo calculado, NO se importa |

## Mapeo de columnas: Hojas DCA (BTC, ETH, ADA, PAXGUSD)

| Columna Excel | Campo DB | Notas |
|---|---|---|
| Fecha | `entry.entry_date` | |
| Tipo | `entry.entry_type` | Apertura/Incremento/Cierre |
| Importe ($USD) | `entry.amount_usd` | |
| Capital Acum. ($USD) | `entry.accumulated_capital_usd` | Se persiste tal como está |
| Ganancia / Pérdida ($USD) | `entry.profit_loss_usd` | Solo para Cierre |
| Notas | `entry.notes` | |

## Mapeo de columnas: Estrategia Michel Saylor

| Columna Excel | Campo DB | Notas |
|---|---|---|
| Fecha | `entry.entry_date` | |
| Dólares agregados | `entry.amount_usd` | |

## Orden de importación (importante)

1. **Primero**: CCL histórico (es dependencia de todos los trades ARS)
2. **Segundo**: Brokers y Assets (seed)
3. **Tercero**: Trading portfolios (en cualquier orden entre sí)
4. **Cuarto**: DCA strategies

## Notas sobre el Excel

- Las columnas de fórmulas (VLOOKUP, IF, etc.) se leen como `None` en openpyxl — el script de importación debe manejar este caso y solo importar valores crudos.
- La hoja `CCL` tiene el histórico en las columnas A y B (Fecha y CCL), y datos adicionales en columnas H en adelante que pueden ignorarse.
- Las hojas `Copia de Cedears` y `Copia de Cedears 1` son borradores/pruebas y no se importan.
- Las hojas `PRECIOS ACCIONES` e `Info Cedears` son tablas de referencia que se reemplazan por las APIs externas — no se importan.
