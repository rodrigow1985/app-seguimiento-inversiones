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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar | `GET` | `/api/v1/ccl/latest` | CCL badge en header |
| Al montar | `GET` | `/api/v1/dashboard` | Las 4 metric cards |
| Al montar | `GET` | `/api/v1/dashboard/open-positions` | Tabla de posiciones abiertas |
| Al montar | `GET` | `/api/v1/dashboard/dca-summary` | Sección DCA cards |
| Botón refresh | `POST` | `/api/v1/prices/sync` | Actualiza precios + refresca las 3 queries anteriores |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar (sidebar) | `GET` | `/api/v1/portfolios` | Lista de carteras en sidebar |
| Al seleccionar cartera | `GET` | `/api/v1/portfolios/:id` | Header badge con total USD de la cartera |
| Al seleccionar cartera | `GET` | `/api/v1/trading/positions?portfolioId=:id&status=OPEN` | Tabla filtrada por estado |
| Cambiar tab Cerradas | `GET` | `/api/v1/trading/positions?portfolioId=:id&status=CLOSED` | Tabla posiciones cerradas |
| Cambiar tab Todas | `GET` | `/api/v1/trading/positions?portfolioId=:id` | Tabla sin filtro de estado |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar | `GET` | `/api/v1/trading/positions/:id` | Toda la pantalla (métricas + tabla de trades) |
| Header precio actual | `GET` | `/api/v1/assets/:assetId/price/current` | Precio live y variación del activo |
| Botón refresh P&L | `GET` | `/api/v1/trading/positions/:id/pnl` | Actualiza las 4 metric cards sin recargar trades |
| Cerrar posición | `PATCH` | `/api/v1/trading/positions/:id/close` | Cambia status a CLOSED |
| Eliminar trade | `DELETE` | `/api/v1/trading/trades/:id` | Elimina la fila de la tabla |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al abrir (nueva posición) | `GET` | `/api/v1/portfolios` | Select de cartera |
| Al abrir (nueva posición) | `GET` | `/api/v1/assets` | Select de activo |
| Al abrir (nueva posición) | `GET` | `/api/v1/brokers` | Select de broker |
| Al seleccionar fecha | `GET` | `/api/v1/ccl/date/:date` | Auto-completa campo CCL (si activo es ARS) |
| Al cambiar fecha (edición) | `GET` | `/api/v1/ccl/date/:date` | Recalcula CCL al corregir fecha |
| Confirmar (nueva posición) | `POST` | `/api/v1/trading/positions` | Crea posición con primer trade |
| Confirmar (agregar trade) | `POST` | `/api/v1/trading/positions/:id/trades` | Agrega BUY o SELL a posición existente |
| Confirmar (editar trade) | `PATCH` | `/api/v1/trading/trades/:id` | Corrige trade existente |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar | `GET` | `/api/v1/dca/strategies` | Grid de cards |
| Tab Activas | `GET` | `/api/v1/dca/strategies?isActive=true` | Solo estrategias activas |
| Tab Cerradas | `GET` | `/api/v1/dca/strategies?isActive=false` | Solo estrategias cerradas |
| Crear estrategia | `POST` | `/api/v1/dca/strategies` | Agrega nueva card al grid |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar | `GET` | `/api/v1/dca/strategies/:id` | Toda la pantalla (métricas + tabla de entradas) |
| Botón refresh métricas | `GET` | `/api/v1/dca/strategies/:id/summary` | Actualiza las 4 metric cards sin recargar entradas |
| Gráfico de acumulación | incluido en `/strategies/:id` | — | `entries[].accumulatedCapitalUsd` ordenadas por `entryDate` |
| Precio live (header) | `GET` | `/api/v1/assets/:assetId/price/current` | Precio actual del activo |
| Historial de precios (gráfico superpuesto) | `GET` | `/api/v1/assets/:assetId/price/history?from=:startedAt` | Línea de precio del activo en el tiempo |
| Cerrar estrategia | `PATCH` | `/api/v1/dca/strategies/:id` | Setea `isActive=false` y `closedAt` |
| Eliminar entrada | `DELETE` | `/api/v1/dca/entries/:id` | Elimina la fila de la tabla |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al abrir | `GET` | `/api/v1/assets/:assetId/price/current` | Pre-carga campo "Precio al momento" (opcional) |
| Confirmar (nueva entrada) | `POST` | `/api/v1/dca/strategies/:strategyId/entries` | Agrega la entrada a la tabla |
| Confirmar (editar entrada) | `PATCH` | `/api/v1/dca/entries/:id` | Corrige entrada existente |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar | `GET` | `/api/v1/ccl/latest` | Hero con valor CCL actual |
| Al montar | `GET` | `/api/v1/ccl?from=:from&to=:to` | Tabla histórico + gráfico (rango default: 90 días) |
| Cambiar período del gráfico | `GET` | `/api/v1/ccl?from=:from&to=:to` | Recarga tabla y gráfico con el nuevo rango |
| Botón "Actualizar" | `POST` | `/api/v1/ccl/sync` | Sync desde Ambito + recarga tabla |
| Cargar manual | `POST` | `/api/v1/ccl` | Agrega fila a la tabla |

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

**Llamadas a la API**:

| Momento | Método | Endpoint | Tab | Alimenta |
|---------|--------|----------|-----|----------|
| Al abrir tab Brokers | `GET` | `/api/v1/brokers` | Brokers | Tabla de brokers |
| Editar comisión inline | `PATCH` | `/api/v1/brokers/:id` | Brokers | Actualiza fila |
| Crear broker | `POST` | `/api/v1/brokers` | Brokers | Agrega fila a tabla |
| Al abrir tab Activos | `GET` | `/api/v1/assets?isActive=true` | Activos | Tabla de activos |
| Filtrar por tipo | `GET` | `/api/v1/assets?type=CRYPTO` | Activos | Filtra tabla |
| Editar activo | `PATCH` | `/api/v1/assets/:id` | Activos | Actualiza fila |
| Crear activo | `POST` | `/api/v1/assets` | Activos | Agrega fila a tabla |
| Probar CoinGecko | `GET` | `/api/v1/assets/:anyActiveCryptoId/price/current` | Integraciones | Muestra resultado del test |
| Probar Ambito (CCL) | `GET` | `/api/v1/ccl/latest` | Integraciones | Muestra fecha y valor más reciente |

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

**Llamada global (presente en todas las pantallas)**:

| Momento | Método | Endpoint | Alimenta |
|---------|--------|----------|----------|
| Al montar cualquier pantalla | `GET` | `/api/v1/ccl/latest` | Badge CCL en el header |

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
