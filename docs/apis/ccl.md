# API — CCL (Contado con Liquidación)

Historial del tipo de cambio CCL (ARS/USD). Usado para convertir precios de activos argentinos a dólares en la fecha exacta de cada trade.

Pantalla: **S08** (CCL Histórico). También usado internamente por Trading y DCA al registrar trades.

> **Regla crítica:** Si un activo tiene `currency_native = ARS`, todo trade necesita un registro de CCL en su `tradeDate`. Sin CCL → el trade no se puede registrar.

---

## GET /ccl/latest

Devuelve el valor de CCL más reciente disponible en la DB. Alimenta el pill de topbar en todas las pantallas.

### Respuesta 200

```json
{
  "data": {
    "id":        "uuid",
    "date":      "2026-04-05",
    "rate":      "1218.50",
    "source":    "AMBITO",
    "createdAt": "2026-04-05T14:32:00Z"
  }
}
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `date` | date | Fecha del valor |
| `rate` | string (decimal) | ARS por 1 USD |
| `source` | enum | `AMBITO` / `MANUAL` |

### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | No hay ningún registro CCL en la DB todavía |

---

## GET /ccl/date/:date

Devuelve el CCL de una fecha específica, o el más reciente anterior si no hay registro exacto.

Usado por el frontend en S04 (modal trade) para auto-completar el CCL al seleccionar una fecha.

### Path params

| Param | Tipo | Descripción |
|-------|------|-------------|
| `date` | date (ISO) | Fecha exacta buscada: `2024-07-20` |

### Respuesta 200

```json
{
  "data": {
    "id":        "uuid",
    "date":      "2024-07-19",
    "rate":      "1182.30",
    "source":    "AMBITO",
    "isExact":   false,
    "requestedDate": "2024-07-20",
    "createdAt": "2024-07-19T18:05:00Z"
  }
}
```

**`isExact: false`** indica que se devolvió el valor del día anterior (feriado, fin de semana, etc.). El frontend lo muestra con un hint: *"CCL del 19/07/2024 (más cercano disponible)"*.

### Flujo: Camino feliz
```
1. Parsea y valida :date
2. Busca CclRate WHERE date = :date
3. Si no encuentra:
   a. Busca el más reciente WHERE date < :date ORDER BY date DESC LIMIT 1
   b. Si existe → devuelve con isExact: false
   c. Si no existe → error not-found
4. Si encuentra exacto → devuelve con isExact: true
```

### Flujos alternativos

| Condición | Comportamiento |
|-----------|---------------|
| Fecha futura | Busca el más reciente disponible (hoy o anterior) |
| Sin ningún CCL anterior | `not-found` 404 |
| Fecha inválida (`2024-13-40`) | `validation-error` 422 |

---

## GET /ccl

Lista el historial de CCL con filtros de fecha. Alimenta tabla de S08.

### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `from` | date | hace 90 días | Fecha inicio (inclusive) |
| `to` | date | hoy | Fecha fin (inclusive) |
| `page` | integer | 1 | Paginación |
| `limit` | integer | 50 | Max: 200 |
| `order` | string | `desc` | `asc` / `desc` por fecha |

### Respuesta 200

```json
{
  "data": [
    {
      "id":        "uuid",
      "date":      "2026-04-05",
      "rate":      "1218.50",
      "source":    "AMBITO",
      "createdAt": "2026-04-05T14:32:00Z"
    },
    {
      "id":        "uuid",
      "date":      "2026-04-04",
      "rate":      "1215.30",
      "source":    "AMBITO",
      "createdAt": "2026-04-04T18:05:00Z"
    }
  ],
  "meta": {
    "total":  90,
    "page":   1,
    "limit":  50,
    "pages":  2,
    "from":   "2026-01-05",
    "to":     "2026-04-05",
    "minRate": "1150.00",
    "maxRate": "1220.80",
    "avgRate": "1185.40"
  }
}
```

Los campos `minRate`, `maxRate`, `avgRate` en `meta` son calculados sobre el rango filtrado.

### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `validation-error` | 422 | `from` > `to` |
| `validation-error` | 422 | Formato de fecha inválido |

---

## POST /ccl

Carga manual de un valor CCL. Útil para fechas sin sync automático (feriados, fines de semana).

### Body

```json
{
  "date": "2026-04-02",
  "rate": "1211.70"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `date` | date | ✓ | No futura |
| `rate` | string (decimal) | ✓ | > 0. Razonable: entre 100 y 100000 |

### Respuesta 201

```json
{
  "data": {
    "id":     "uuid",
    "date":   "2026-04-02",
    "rate":   "1211.70",
    "source": "MANUAL",
    "createdAt": "2026-04-05T10:00:00Z"
  }
}
```

### Flujo: Camino feliz
```
1. Valida body
2. Verifica que no existe ya un registro para esa fecha
   - Si existe: actualiza (upsert) y devuelve 200
   - Si no existe: crea y devuelve 201
3. Registra source = 'MANUAL'
```

### Flujos alternativos

| Condición | Comportamiento |
|-----------|---------------|
| Ya existe CCL para esa fecha | Upsert: actualiza `rate` y `source=MANUAL`. Responde 200 |
| `rate` ≤ 0 o > 100000 | `validation-error` 422 |
| `date` futura | `validation-error` 422 |

---

## POST /ccl/sync

Dispara la sincronización de CCL desde la API de Ambito para los últimos N días.

### Body (opcional)

```json
{
  "from": "2026-04-01",
  "to":   "2026-04-05"
}
```

Si no se envía body, sincroniza los últimos 7 días por defecto.

### Respuesta 200

```json
{
  "data": {
    "synced":   4,
    "skipped":  1,
    "errors":   0,
    "from":     "2026-04-01",
    "to":       "2026-04-05",
    "syncedAt": "2026-04-05T14:32:00Z"
  }
}
```

- **`synced`:** registros nuevos insertados
- **`skipped`:** días sin cotización (feriados, fines de semana) o que ya tenían un registro en DB
- **`errors`:** días que fallaron (se loguean internamente)

### Flujo: Camino feliz
```
1. Parsea rango from/to (default: últimos 7 días)
2. Para cada día del rango:
   a. Llama a external/ccl-provider.ts → fetch Ambito API
   b. Si hay cotización → INSERT solo si no existe ningún registro para esa fecha (ni MANUAL ni AMBITO). Si ya existe, skip.
   c. Si Ambito no tiene dato (feriado) → skip
3. Retorna resumen
```

### Flujos alternativos

| Condición | Comportamiento |
|-----------|---------------|
| Ambito API caída | `price-unavailable` 503 con detalle de qué días fallaron |
| Rango > 365 días | `validation-error` 422 (máximo 1 año por sync) |
| `from` > `to` | `validation-error` 422 |
