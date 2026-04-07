# Módulo Trading

## ¿Qué es el módulo de Trading?

Gestiona carteras de inversión donde el objetivo es comprar activos y venderlos con ganancia. Cubre las siguientes carteras del Excel:

- **Cryptos** — operaciones en Binance y BingX (USD)
- **Acciones ARG** — acciones argentinas via IOL (ARS)
- **Cartera corto plazo** — Cedears via IOL (ARS con CCL)
- **Cartera Jubilación** — Cedears a largo plazo via IOL (ARS con CCL)
- **FCI_USD** — Fondos de inversión USD via IOL y Balanz
- **Renta fija** — Bonos via IOL (ARS)

## Flujo de una operación típica

### 1. Abrir posición

El usuario compra un activo por primera vez. Esto crea:
- Una `Position` con `status = ABIERTA`
- Un `Trade` de tipo `BUY`

### 2. Incrementar posición (compra adicional)

El usuario compra más unidades del mismo activo (para promediar o ampliar). Esto agrega:
- Un `Trade` de tipo `BUY` a la misma `Position`
- El precio promedio ponderado (PPC) se recalcula: `sum(units * price) / sum(units)`

### 3. Vender parcialmente

El usuario vende una parte de sus unidades. Esto agrega:
- Un `Trade` de tipo `SELL` a la misma `Position`
- La posición sigue `ABIERTA` si quedan unidades sin vender

### 4. Cerrar posición (implícito)

El usuario vende todas las unidades restantes. Esto:
- Agrega el último `Trade` de tipo `SELL`
- La posición pasa automáticamente a `status = CLOSED` (calculado: `open_units = 0`)
- No hay acción manual de cierre — el estado es siempre derivado de los trades

## Cálculos financieros

Todos los cálculos viven en `backend/src/lib/calculations.ts`.

### Precio Promedio Ponderado (PPC)

```
PPC = sum(units_BUY[i] * price_BUY[i]) / sum(units_BUY[i])
```

### P&L no realizado (posición abierta)

```
Unidades en cartera = sum(units_BUY) - sum(units_SELL)
Costo total = unidades_en_cartera * PPC
Valor actual = unidades_en_cartera * precio_actual
P&L no realizado = valor_actual - costo_total
P&L% = P&L_no_realizado / costo_total
```

### P&L realizado (al vender)

```
P&L_realizado = sum(total_SELL_USD) - (unidades_vendidas * PPC_USD)
```

### Conversión ARS → USD

Para activos en ARS, se usa el CCL del día de la operación:
```
total_USD = total_ARS / ccl_rate
```

## Estructura de datos en la API

### Crear posición con primer trade

```json
POST /api/v1/trading/positions
{
  "portfolioId": "uuid",
  "assetId": "uuid",
  "brokerId": "uuid",
  "openedAt": "2025-06-15",
  "trade": {
    "tradeType": "BUY",
    "units": "10.5",
    "priceNative": "150.00",
    "priceCurrency": "ARS",
    "commissionPct": "0.7"
  }
}
```

### Agregar trade a posición existente

```json
POST /api/v1/trading/positions/:id/trades
{
  "tradeType": "BUY",
  "tradeDate": "2025-07-01",
  "units": "5.0",
  "priceNative": "140.00",
  "priceCurrency": "ARS",
  "commissionPct": "0.7",
  "notes": "Promediando a la baja"
}
```

## Vista en el frontend

El módulo de trading tiene estas páginas:

1. **Lista de posiciones** — tabla con todas las posiciones de una cartera, filtrable por estado (ABIERTA/CERRADA)
2. **Detalle de posición** — historial de trades, P&L calculado, gráfico de precio vs PPC
3. **Formulario de trade** — registrar compra o venta
4. **Resumen de cartera** — capital total invertido, P&L total, distribución por activo
