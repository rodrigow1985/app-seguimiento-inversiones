# Módulo DCA (Dollar Cost Averaging)

## ¿Qué es el módulo DCA?

Gestiona estrategias de acumulación periódica de activos en USD. La idea es invertir una cantidad fija regularmente, sin importar el precio del activo, promediando el costo de entrada a lo largo del tiempo.

Cubre estas estrategias del Excel:

| Estrategia | Activo | Entradas |
|---|---|---|
| Estrategia BTC | Bitcoin (BTC) | Apertura/Incremento/Cierre |
| Estrategia ETH | Ethereum (ETH) | Apertura/Incremento/Cierre (la más activa: ~1096 entradas) |
| Estrategia ADA | Cardano (ADA) | Apertura/Incremento/Cierre |
| Estrategia PAXGUSD | Oro tokenizado (PAXG) | Apertura/Incremento/Cierre |
| Estrategia Michel Saylor | Bitcoin (BTC) | Solo monto en USD (sin precio/unidades) |

## Tipos de entrada

### Apertura

Crea una nueva "ronda" de inversión en la estrategia. Una estrategia puede tener múltiples aperturas si se cierra y se vuelve a abrir.

### Incremento

Aporta más capital a la posición abierta actual. El capital acumulado crece.

### Cierre

Vende la posición. Se registra el P&L de esa ronda. El capital acumulado vuelve a cero (o baja según la venta parcial).

## Diferencia con Trading

| | Trading | DCA |
|---|---|---|
| Registra precio unitario | Siempre | Opcional |
| Registra unidades | Siempre | Opcional |
| Múltiples activos por cartera | Sí | No (1 activo por estrategia) |
| P&L por operación individual | Sí | Por cierre de estrategia |
| Objetivo | Compra/venta táctica | Acumulación de largo plazo |

## Estrategia Michel Saylor

Es un caso especial de DCA simplificado: solo registra fecha y dólares aportados, sin rastrear precio ni unidades. Es un DCA "ciego" donde no importa el precio de entrada, solo el capital total invertido.

Campos usados: `entry_date`, `amount_usd`, `accumulated_capital_usd`
Campos no usados: `units_acquired`, `price_usd_at_entry`, `profit_loss_usd`

## Cálculo del capital acumulado

```
Para cada entrada de una estrategia, en orden cronológico:
- APERTURA: accumulated = amount_usd
- INCREMENTO: accumulated = accumulated_anterior + amount_usd
- CIERRE: accumulated = accumulated_anterior + amount_usd
          (amount_usd es negativo si es una salida)
          profit_loss_usd = amount_usd - costo_proporcional
```

## Vista en el frontend

1. **Lista de estrategias** — cards con estado (activa/cerrada), capital acumulado, P&L si está cerrada
2. **Detalle de estrategia** — timeline de entradas, gráfico de capital acumulado vs valor actual, P&L en tiempo real
3. **Formulario de entrada** — tipo de entrada (Apertura/Incremento/Cierre), monto USD, fecha, notas
4. **Comparativa** — evolución de todas las estrategias DCA en un mismo gráfico (USD acumulado por estrategia)
