# Guía de Estrategia: AntiVitalik y AntiADA

Resumen de las reglas operativas extraídas de los videos de Criptonorber.
Estrategias de DCA en short para mercado bajista.

---

## Contexto: ¿Cuándo usar estas estrategias?

- Exclusivamente en **tendencia de ciclo bajista** (no en correcciones dentro de un bull market)
- Señal de entrada: el Oracle Numeris en weekly marca **venta**
- Duración esperada: de mediados de 2026 a mediados de 2027 (ciclo actual)
- Altcoins como ETH y ADA caen 80–90% en un bear market vs 40–50% de BTC → más recorrido para el short

---

## Setup inicial

| Parámetro | Valor |
|---|---|
| Activo AntiVitalik | ETH/USDT (perpetuo) |
| Activo AntiADA | ADA/USDT (perpetuo) |
| Dirección | SHORT |
| Apalancamiento | 5x |
| Colateral | USDT (nunca el activo subyacente) |
| Capital total | Lo que dispongas para la estrategia |
| **Bala** | Capital total ÷ 30 |
| Mínimo por bala | $20 reales → $100 de posición a 5x |

> **¿Por qué 5x?** Con 5x la liquidación queda a un 20% por arriba del precio de entrada. ETH es suficientemente estable para que eso no pase de un día para el otro en un contexto bajista.

---

## Reglas de recarga (versión actualizada — Video 2)

### Inicio del trade
Arrancar con **3 balas** (no 1 ni 2 como en versiones anteriores).

### Recargas diarias según estado del trade

| Estado del trade | Balas a agregar | Dónde cargar |
|---|---|---|
| Positivo > 5% | 1 bala | Posición |
| Positivo hasta 5% | 2 balas | Posición |
| Negativo hasta 5% | 3 balas | Posición |
| Negativo hasta 10% | 4 balas | Posición |
| Negativo hasta 15% | 5 balas | Posición |
| Negativo > 15% | 6 balas | Posición |
| **Negativo > 40%** | 6 balas (mitad en posición, mitad en margen) | Posición + Margen |
| **Negativo > 60%** | 6 balas todo en margen | Margen |

> Agregar a **margen** (no a posición) mejora el precio de liquidación sin cambiar el precio promedio.
> Agregar a **posición** baja el precio promedio de entrada.

### Cargador extra (opcional)

Reservar el 50% del capital inicial como fondo de emergencia para situaciones extremas donde el trade esté muy en pérdida y se necesite salvar la posición.

---

## Toma de ganancias

| Ganancia del trade | Acción recomendada |
|---|---|
| 15% | Empezar a considerar el cierre |
| 20% o más | **Cerrar** — reiniciar la estrategia |

Después de cada cierre con ganancias, se inicia una nueva posición con las mismas reglas desde cero.

---

## Resumen del flujo operativo

```
1. Confirmar tendencia bajista de ciclo
2. Abrir SHORT en ETH o ADA, 5x leverage, colateral USDT
3. Entrada: 3 balas
4. Cada día revisar el estado del trade
5. Aplicar tabla de recargas según % de ganancia/pérdida
6. Cuando ganancia ≥ 20% → cerrar y reiniciar
7. Si la tendencia cambia → salir de la posición
```

---

## Fuente

Extraído de los videos de **Criptonorber** (@cryptonorber en Instagram):
- `docs/videos_youtube/criptonorber/antivitalik_1.md` — Introducción a la estrategia AntiVitalik
- `docs/videos_youtube/criptonorber/antivitalik_2.md` — Reglas actualizadas AntiVitalik y AntiADA
