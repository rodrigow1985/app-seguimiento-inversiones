# API — Assets & Prices

Catálogo maestro de activos financieros y endpoints de precios en tiempo real e histórico.

Pantalla: **S09** (Configuración — listado de activos), internamente en todos los módulos.

---

## Assets

### GET /assets

Lista todos los activos disponibles.

#### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `type` | string | — | `CRYPTO`, `ACCION_ARG`, `CEDEAR`, `FCI`, `BONO`, `COMMODITY` |
| `isActive` | boolean | `true` | Incluir activos inactivos |
| `search` | string | — | Búsqueda por ticker o nombre (case-insensitive) |
| `page` | integer | 1 | |
| `limit` | integer | 100 | Max: 500 |

#### Respuesta 200

```json
{
  "data": [
    {
      "id":             "uuid",
      "ticker":         "BTC",
      "name":           "Bitcoin",
      "assetType":      "CRYPTO",
      "currencyNative": "USD",
      "priceSource":    "COINGECKO",
      "priceSourceId":  "bitcoin",
      "isActive":       true,
      "createdAt":      "2023-01-01T00:00:00Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 100, "pages": 1 }
}
```

---

### GET /assets/:id

Detalle de un activo.

#### Respuesta 200

```json
{
  "data": {
    "id":             "uuid",
    "ticker":         "GGAL",
    "name":           "Grupo Galicia",
    "assetType":      "ACCION_ARG",
    "currencyNative": "ARS",
    "priceSource":    "IOL",
    "priceSourceId":  "GGAL",
    "isActive":       true,
    "createdAt":      "2023-01-01T00:00:00Z"
  }
}
```

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Activo no existe |

---

### POST /assets

Crea un activo nuevo. Usado en S09 (Configuración).

#### Body

```json
{
  "ticker":         "NVDA",
  "name":           "NVIDIA Corporation",
  "assetType":      "CEDEAR",
  "currencyNative": "ARS",
  "priceSource":    "IOL",
  "priceSourceId":  "NVDA"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `ticker` | string | ✓ | 1–20 chars, único |
| `name` | string | ✓ | 1–100 chars |
| `assetType` | enum | ✓ | Valor del enum |
| `currencyNative` | enum | ✓ | `ARS` / `USD` |
| `priceSource` | enum | ✓ | `COINGECKO`, `IOL`, `RAVA`, `MANUAL` |
| `priceSourceId` | string | — | ID en la API externa |

#### Respuesta 201

Devuelve el activo creado.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `validation-error` | 422 | Campos inválidos |
| `validation-error` | 422 | Ticker ya existe (único) |

---

### PATCH /assets/:id

Actualiza un activo existente.

#### Body (todos opcionales)

```json
{
  "name":          "NVIDIA Corp.",
  "priceSourceId": "nvidia",
  "isActive":      false
}
```

#### Respuesta 200

Devuelve el activo actualizado.

---

## Prices

### GET /assets/:id/price/current

Precio actual de un activo obtenido de la API externa configurada.

No cachea en DB — consulta el precio en tiempo real. Para múltiples activos usar `GET /prices/current`.

#### Respuesta 200

```json
{
  "data": {
    "assetId":     "uuid",
    "ticker":      "BTC",
    "price":       "67800.00",
    "currency":    "USD",
    "source":      "COINGECKO",
    "fetchedAt":   "2026-04-05T14:30:00Z"
  }
}
```

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Activo no existe |
| `price-unavailable` | 503 | API externa caída o timeout |

---

### GET /assets/:id/price/history

Precio histórico de un activo. Útil para el chart de S03 (posición detalle) y S06 (DCA detalle).

#### Query params

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `from` | date | ✓ | Fecha inicio |
| `to` | date | — | Default: hoy |
| `interval` | string | `1d` | `1d` / `1w` / `1M` |

#### Respuesta 200

```json
{
  "data": [
    { "date": "2026-04-01", "price": "65200.00", "currency": "USD" },
    { "date": "2026-04-02", "price": "66100.00", "currency": "USD" },
    { "date": "2026-04-03", "price": "67500.00", "currency": "USD" },
    { "date": "2026-04-04", "price": "67100.00", "currency": "USD" },
    { "date": "2026-04-05", "price": "67800.00", "currency": "USD" }
  ],
  "meta": {
    "assetId":  "uuid",
    "ticker":   "BTC",
    "from":     "2026-04-01",
    "to":       "2026-04-05",
    "interval": "1d",
    "points":   5
  }
}
```

Los datos provienen de `PriceSnapshot` (precargados) o de la API externa si el rango es corto.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Activo no existe |
| `validation-error` | 422 | `from` > `to` o intervalo inválido |
| `price-unavailable` | 503 | API externa caída |

---

## Prices (multi-asset)

### GET /prices/current

Precios actuales de múltiples activos en una sola llamada. Optimizado para el dashboard y topbar.

#### Query params

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `tickers` | string (CSV) | ✓ | `BTC,ETH,GGAL,MELI` |

#### Respuesta 200

```json
{
  "data": [
    { "ticker": "BTC",  "price": "67800.00", "currency": "USD", "fetchedAt": "2026-04-05T14:30:00Z" },
    { "ticker": "ETH",  "price": "3200.00",  "currency": "USD", "fetchedAt": "2026-04-05T14:30:00Z" },
    { "ticker": "GGAL", "price": "21580.00", "currency": "ARS", "fetchedAt": "2026-04-05T14:28:00Z" }
  ],
  "meta": {
    "requested": 3,
    "resolved":  3,
    "failed":    0
  }
}
```

Si algún ticker falla, no bloquea los demás: `"failed"` aumenta y ese ticker aparece con `"price": null`.

#### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `validation-error` | 422 | `tickers` vacío o más de 50 |

---

### POST /prices/sync

Dispara actualización de precios de todos los activos activos y los guarda como `PriceSnapshot`.

#### Respuesta 200

```json
{
  "data": {
    "synced":  38,
    "failed":   2,
    "syncedAt": "2026-04-05T14:32:00Z",
    "failedTickers": ["SOME_TICKER", "OTHER"]
  }
}
```
