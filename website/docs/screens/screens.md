---
sidebar_position: 1
---

# Pantallas de la App

## Mapa de Navegación

```
App
├── 🏠 Dashboard
├── 📈 Trading
│   ├── Cryptos
│   │   ├── Lista de posiciones
│   │   └── [posición] Detalle
│   ├── Acciones ARG
│   │   ├── Lista de posiciones
│   │   └── [posición] Detalle
│   ├── Cartera Corto Plazo (Cedears)
│   │   ├── Lista de posiciones
│   │   └── [posición] Detalle
│   ├── Cartera Jubilación
│   │   ├── Lista de posiciones
│   │   └── [posición] Detalle
│   ├── FCI USD
│   │   ├── Lista de posiciones
│   │   └── [posición] Detalle
│   └── Renta Fija
│       ├── Lista de posiciones
│       └── [posición] Detalle
├── 🔄 DCA
│   ├── Lista de estrategias
│   └── [estrategia] Detalle
│       ├── BTC
│       ├── ETH
│       ├── ADA
│       ├── PAXGUSD (Oro)
│       └── Michel Saylor
├── 💱 CCL
└── ⚙️ Configuración
    ├── Brokers
    ├── Activos
    └── Integraciones
```

---

## Flujo de Pantallas

```
[Dashboard] ──► [Trading > Posiciones] ──► [Posición Detalle]
                                                   │
                                    ┌──────────────┼──────────────┐
                                    ▼              ▼              ▼
                              [Modal BUY]    [Modal SELL]  [Cerrar posición]

[Dashboard] ──► [DCA > Estrategias] ──► [Estrategia Detalle]
                                                │
                                        [Modal Nueva entrada]
```

---

## Pantallas

### S01 — Dashboard

**Descripción**: Vista general del portfolio. Primera pantalla al abrir la app. Muestra el estado consolidado de todas las inversiones.

**Layout**: Header global + 4 metric cards + tabla posiciones abiertas + sección DCA

**Componentes**:

| Zona | Elemento | Detalle |
|---|---|---|
| Header | Logo + nombre app | |
| Header | CCL actual badge | Valor del CCL + variación del día |
| Header | Fecha y hora | Última actualización de precios |
| Cards row | Capital Total (USD) | Suma de todas las carteras en USD |
| Cards row | P&L Total (USD) | Ganancia/pérdida total no realizada |
| Cards row | Posiciones abiertas | Número de posiciones activas |
| Cards row | Estrategias DCA activas | Número de estrategias DCA |
| Tabla | Posiciones abiertas | Ver columnas abajo |
| Sección | DCA Resumen | Cards por estrategia: capital acumulado, P&L% |

**Columnas tabla posiciones abiertas**:
`Activo | Cartera | Broker | Días abierto | Capital USD | Valor actual USD | P&L USD | P&L%`

**Botones y acciones**:
- Click en fila de posición → navega a `Trading > [cartera] > Posición Detalle`
- Click en card DCA → navega a `DCA > Estrategia Detalle`
- Ícono refresh en header → actualiza precios (llama a `POST /api/v1/prices/sync`)

---

### S02 — Trading: Lista de Posiciones

**Descripción**: Tabla de posiciones de UNA cartera específica (ej: Cryptos). El layout es el mismo para todas las carteras, solo cambia el contenido.

**Layout**: Sidebar de carteras (izquierda) + contenido principal (derecha)

**Componentes**:

| Zona | Elemento | Detalle |
|---|---|---|
| Sidebar | Lista de carteras | Links: Cryptos, Acciones ARG, Cedears CP, Jubilación, FCI, Renta fija |
| Header | Nombre de la cartera | Ej: "Cryptos" |
| Header | Badge total USD | Capital total en esa cartera |
| Filtros | Estado | Tabs: Todas / Abiertas / Cerradas |
| Stats bar | 3 métricas | Total invertido | Total actual | P&L total |
| Tabla | Posiciones | Ver columnas abajo |
| Footer | Paginación | Si hay muchas posiciones cerradas |

**Columnas tabla**:
`Ticker | Broker | Fecha apertura | Días | Unidades | PPC | Precio actual | Total compra | Total actual | P&L% | P&L USD | Estado | Acciones`

**Botones y acciones**:
- `+ Nueva posición` (botón primario, arriba derecha) → abre Modal Nueva Posición
- Click en fila → navega a `Posición Detalle`
- Ícono de `⋯` en columna Acciones → menú contextual: Ver detalle / Agregar compra / Cerrar posición

---

### S03 — Trading: Detalle de Posición

**Descripción**: Vista completa de una posición individual con todos sus trades y métricas calculadas.

**Layout**: Breadcrumb + header con métricas + tabla de trades

**Componentes**:

| Zona | Elemento | Detalle |
|---|---|---|
| Breadcrumb | Navegación | `Trading > Cryptos > BTC` |
| Header | Ticker + badge estado | "BTC" + badge verde "ABIERTA" |
| Header | Precio actual + variación | Precio live del activo |
| Métricas (4 cards) | Unidades en cartera | Sum(BUY) - Sum(SELL) |
| Métricas (4 cards) | PPC (precio promedio ponderado) | Costo promedio de las unidades actuales |
| Métricas (4 cards) | Capital invertido USD | Units × PPC |
| Métricas (4 cards) | P&L no realizado | Valor actual - Capital invertido |
| Tabla trades | Historial de operaciones | Ver columnas abajo |

**Columnas tabla trades**:
`# | Tipo (BUY/SELL) | Fecha | Unidades | Precio | CCL | Total (moneda nativa) | Total USD | Comisión | Notas | Acciones`

**Botones y acciones**:
- `+ Compra` → abre Modal Trade (tipo BUY pre-seleccionado)
- `+ Venta` → abre Modal Trade (tipo SELL pre-seleccionado)
- `Cerrar posición` (solo si está abierta) → abre Modal Cierre (con P&L estimado)
- Ícono editar en fila → Modal edición de trade
- Ícono eliminar en fila → Confirmación + delete

---

### S04 — Modal: Nuevo Trade (BUY / SELL)

**Descripción**: Modal overlay para registrar una compra o venta. Se abre desde Posición Detalle o desde el menú contextual de la lista.

**Layout**: Modal centrado con formulario

**Campos del formulario**:

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Tipo | Select: BUY / SELL | Sí | Pre-seleccionado según el botón |
| Fecha | Date picker | Sí | Default: hoy |
| Unidades | Number input | Sí | Decimales según tipo de activo |
| Precio | Number input | Sí | En moneda del activo |
| Moneda | Select: ARS / USD | Sí | Auto-seleccionado según activo |
| CCL del día | Read-only + editable | Si moneda = ARS | Auto-cargado, editable manual |
| Comisión % | Number input | No | Pre-cargado con la del broker |
| Broker | Select | Sí | Pre-cargado con el de la posición |
| Notas | Textarea | No | |

**Preview calculado** (debajo del formulario):
- Total en moneda nativa: `unidades × precio`
- Total en USD: `total_nativo / CCL`
- Comisión: `total × comisión%`
- Nuevo PPC (si BUY): recálculo del precio promedio

**Botones**:
- `Confirmar` → POST `/api/v1/trading/positions/:id/trades`
- `Cancelar` → cierra modal sin guardar

---

### S05 — DCA: Lista de Estrategias

**Descripción**: Vista de todas las estrategias DCA activas y cerradas.

**Layout**: Grid de cards

**Componentes**:

| Zona | Elemento | Detalle |
|---|---|---|
| Header | Título + botón | "Estrategias DCA" + `+ Nueva estrategia` |
| Filtros | Estado | Tabs: Todas / Activas / Cerradas |
| Grid | Cards de estrategias | Una card por estrategia |

**Contenido de cada card**:
- Ícono del activo (logo BTC, ETH, etc.)
- Nombre de la estrategia
- Badge: ACTIVA (verde) / CERRADA (gris)
- Capital acumulado USD
- # de entradas
- Días activo (desde primera apertura)
- P&L% (si está cerrada o con precio actual si está abierta)

**Botones y acciones**:
- `+ Nueva estrategia` → Modal Nueva Estrategia
- Click en card → navega a `Estrategia Detalle`

---

### S06 — DCA: Detalle de Estrategia

**Descripción**: Vista completa de una estrategia DCA. Similar al Excel de BTC/ETH/ADA/PAXG.

**Layout**: Header con métricas + gráfico + tabla de entradas

**Componentes**:

| Zona | Elemento | Detalle |
|---|---|---|
| Breadcrumb | `DCA > ETH` | |
| Header | Nombre estrategia + activo | "Estrategia ETH" + badge ACTIVA |
| Métricas (4 cards) | Capital acumulado USD | Suma de todos los aportes menos cierres |
| Métricas (4 cards) | # Entradas | Total de entradas registradas |
| Métricas (4 cards) | Días activo | Desde primera apertura |
| Métricas (4 cards) | P&L actual | (precio_actual × units) - capital_invertido |
| Gráfico | Línea de capital acumulado | Eje X: tiempo, Eje Y: USD acumulado |
| Tabla | Historial de entradas | Ver columnas abajo |

**Columnas tabla entradas**:
`# | Fecha | Tipo | Monto USD | Capital Acum. | Units (opt) | Precio (opt) | Estado | P&L (si cierre) | Notas | Acciones`

**Botones y acciones**:
- `+ Agregar entrada` → Modal Nueva Entrada
- Ícono editar en fila → Modal edición
- Ícono eliminar en fila → Confirmación + delete

---

### S07 — Modal: Nueva Entrada DCA

**Descripción**: Formulario para agregar Apertura, Incremento o Cierre a una estrategia DCA.

**Campos del formulario**:

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Tipo | Select: Apertura / Incremento / Cierre | Sí | |
| Fecha | Date picker | Sí | Default: hoy |
| Monto USD | Number input | Sí | Positivo para entrada, negativo para cierre |
| Unidades adquiridas | Number input | No | Opcional para Michel Saylor |
| Precio al momento | Number input | No | Auto-cargado si activo tiene precio live |
| Notas | Textarea | No | |

**Preview calculado**:
- Nuevo capital acumulado: `actual + monto`
- Si es Cierre: P&L estimado

**Botones**:
- `Confirmar`
- `Cancelar`

---

### S08 — CCL Histórico

**Descripción**: Histórico del tipo de cambio CCL y herramientas de actualización.

**Layout**: Header + valor actual destacado + gráfico + tabla

**Componentes**:

| Zona | Elemento | Detalle |
|---|---|---|
| Header | Título + botón sync | "Tipo de Cambio CCL" + `Actualizar` |
| Hero | Valor CCL actual | Grande, con variación del día en % |
| Filtro período | Selector | 7D / 1M / 3M / 6M / 1A / Todo |
| Gráfico | Línea histórica CCL | Según período seleccionado |
| Tabla | Histórico diario | Fecha | CCL | Variación% | Fuente |

**Botones y acciones**:
- `Actualizar` → POST `/api/v1/ccl/sync` (trae el CCL de hoy desde Ambito)
- `+ Cargar manual` → Mini formulario: Fecha + Valor (para días sin datos)

---

### S09 — Configuración

**Descripción**: Configuración general de la app. Tres tabs: Brokers, Activos, Integraciones.

**Layout**: Tabs horizontales + contenido de cada tab

#### Tab: Brokers

Tabla editable de brokers con sus comisiones.

| Columna | Detalle |
|---|---|
| Nombre | IOL, Binance, BingX, Balanz |
| Comisión % | Editable inline |
| Moneda | ARS / USD |
| Acciones | Editar / Desactivar |

Botón: `+ Nuevo broker`

#### Tab: Activos

Tabla de activos registrados.

| Columna | Detalle |
|---|---|
| Ticker | BTC, ETH, GGAL, etc. |
| Nombre | Bitcoin, Ethereum, etc. |
| Tipo | CRYPTO / ACCION_ARG / CEDEAR / FCI / BONO |
| Fuente de precio | COINGECKO / IOL / MANUAL |
| ID en fuente | "bitcoin" para CoinGecko |
| Estado | Activo / Inactivo |
| Acciones | Editar / Desactivar |

Botón: `+ Nuevo activo`

#### Tab: Integraciones

Estado de cada integración con API externa.

| Integración | Estado | Última sync | Acciones |
|---|---|---|---|
| CoinGecko | 🟢 Conectado | hace 45s | Probar / Desconectar |
| IOL (InvertirOnline) | 🟢 Conectado | hace 2m | Probar / Cerrar sesión |
| Ambito (CCL) | 🟢 Conectado | hace 3h | Probar |

Cada integración tiene un botón `Probar conexión` que llama al backend y muestra resultado.

---

## Componentes Globales

### Sidebar de navegación
- Fija a la izquierda
- Items: Dashboard, Trading (con sub-items expandibles), DCA, CCL, Configuración
- El item activo está resaltado
- En trading, la cartera activa está sub-resaltada

### Header global
- En todas las pantallas
- Muestra: nombre de la sección + CCL actual (badge) + botón refresh
- En mobile: hamburger menu (v2)

### Badges de estado
- `ABIERTA` → verde
- `CERRADA` → gris
- `ACTIVA` (DCA) → azul
- Valores positivos → verde
- Valores negativos → rojo

### Formato de números
- USD: `$1,234.56`
- ARS: `$1.234.567,89`
- Porcentaje: `+12.34%` / `-5.67%`
- Crypto: hasta 8 decimales según el activo
