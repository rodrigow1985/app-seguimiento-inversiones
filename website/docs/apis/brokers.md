# API — Brokers

CRUD de brokers. Usados en S09 (Configuración) para gestionar comisiones.

---

## GET /brokers

Lista todos los brokers.

### Query params

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `isActive` | boolean | — | Filtra activos/inactivos |

### Respuesta 200

```json
{
  "data": [
    {
      "id":            "uuid",
      "name":          "IOL",
      "commissionPct": "0.7000",
      "currency":      "ARS",
      "config":        {},
      "createdAt":     "2023-01-01T00:00:00Z"
    },
    {
      "id":            "uuid",
      "name":          "Binance",
      "commissionPct": "0.7260",
      "currency":      "USD",
      "config":        {},
      "createdAt":     "2023-01-01T00:00:00Z"
    }
  ],
  "meta": { "total": 4, "page": 1, "limit": 50, "pages": 1 }
}
```

---

## GET /brokers/:id

Detalle de un broker.

### Respuesta 200

```json
{
  "data": {
    "id":            "uuid",
    "name":          "IOL",
    "commissionPct": "0.7000",
    "currency":      "ARS",
    "config":        {}
  }
}
```

### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Broker no existe |

---

## POST /brokers

Crea un broker nuevo.

### Body

```json
{
  "name":          "Balanz",
  "commissionPct": "0.5000",
  "currency":      "ARS"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| `name` | string | ✓ | 1–50 chars, único |
| `commissionPct` | string (decimal) | ✓ | ≥ 0 y ≤ 100 |
| `currency` | enum | ✓ | `ARS` / `USD` |

### Respuesta 201

Devuelve el broker creado.

### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `validation-error` | 422 | Campos inválidos |
| `validation-error` | 422 | Nombre ya existe |

---

## PATCH /brokers/:id

Actualiza un broker (principalmente para actualizar la comisión desde S09).

### Body (todos opcionales)

```json
{
  "commissionPct": "0.6000",
  "config": { "apiEndpoint": "https://..." }
}
```

> `name` y `currency` no se pueden cambiar una vez creado el broker (hay trades referenciando el broker).

### Respuesta 200

Devuelve el broker actualizado.

### Errores posibles

| Error | Status | Cuándo |
|-------|--------|--------|
| `not-found` | 404 | Broker no existe |
| `validation-error` | 422 | `commissionPct` fuera de rango |
