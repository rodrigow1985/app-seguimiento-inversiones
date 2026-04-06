# Catálogo de Errores — RFC 7807

Todos los errores siguen el estándar [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807).

`Content-Type: application/problem+json`

---

## Estructura base

```json
{
  "type": "/errors/{slug}",
  "title": "Descripción corta legible",
  "status": 422,
  "detail": "Explicación detallada del error específico",
  "instance": "/api/v1/ruta/que/falló"
}
```

**Extensión para errores de validación** (agrega campo `errors`):

```json
{
  "type": "/errors/validation-error",
  "title": "Error de validación",
  "status": 422,
  "detail": "Los datos enviados no son válidos",
  "instance": "/api/v1/trading/positions/uuid/trades",
  "errors": [
    { "field": "units",     "message": "Debe ser mayor a 0" },
    { "field": "tradeDate", "message": "Fecha requerida" }
  ]
}
```

---

## Catálogo

### `/errors/validation-error` — 422

**Cuándo:** El body o query params contienen datos inválidos o faltantes.

```json
{
  "type": "/errors/validation-error",
  "title": "Error de validación",
  "status": 422,
  "detail": "Los datos enviados no son válidos",
  "instance": "/api/v1/trading/positions",
  "errors": [
    { "field": "portfolioId", "message": "UUID requerido" },
    { "field": "units",       "message": "Debe ser mayor a 0" }
  ]
}
```

---

### `/errors/not-found` — 404

**Cuándo:** El recurso solicitado no existe.

```json
{
  "type": "/errors/not-found",
  "title": "Recurso no encontrado",
  "status": 404,
  "detail": "No existe una posición con ID a1b2c3d4",
  "instance": "/api/v1/trading/positions/a1b2c3d4"
}
```

---

### `/errors/position-already-closed` — 409

**Cuándo:** Se intenta agregar un trade o modificar una posición que ya fue cerrada.

```json
{
  "type": "/errors/position-already-closed",
  "title": "Posición cerrada",
  "status": 409,
  "detail": "La posición a1b2c3d4 fue cerrada el 2025-12-01 y no acepta nuevas operaciones",
  "instance": "/api/v1/trading/positions/a1b2c3d4/trades"
}
```

---

### `/errors/insufficient-units` — 409

**Cuándo:** Se intenta vender más unidades de las que tiene la posición actualmente.

```json
{
  "type": "/errors/insufficient-units",
  "title": "Unidades insuficientes",
  "status": 409,
  "detail": "La posición tiene 100 unidades disponibles, se intentaron vender 150",
  "instance": "/api/v1/trading/positions/a1b2c3d4/trades"
}
```

---

### `/errors/ccl-not-available` — 422

**Cuándo:** Se registra un trade con fecha para la cual no hay registro de CCL disponible y el activo es en ARS.

```json
{
  "type": "/errors/ccl-not-available",
  "title": "CCL no disponible",
  "status": 422,
  "detail": "No hay registro de CCL para la fecha 2024-07-20. Cargá el valor manualmente en /ccl antes de continuar.",
  "instance": "/api/v1/trading/positions/uuid/trades"
}
```

---

### `/errors/strategy-already-closed` — 409

**Cuándo:** Se intenta agregar una entrada a una estrategia DCA ya cerrada.

```json
{
  "type": "/errors/strategy-already-closed",
  "title": "Estrategia DCA cerrada",
  "status": 409,
  "detail": "La estrategia DCA b2c3d4e5 fue cerrada el 2025-06-15",
  "instance": "/api/v1/dca/strategies/b2c3d4e5/entries"
}
```

---

### `/errors/price-unavailable` — 503

**Cuándo:** La API externa de precios (CoinGecko, IOL) no está disponible o devuelve error.

```json
{
  "type": "/errors/price-unavailable",
  "title": "Precio no disponible",
  "status": 503,
  "detail": "No se pudo obtener el precio actual de BTC desde CoinGecko. Reintentá en unos minutos.",
  "instance": "/api/v1/assets/uuid/price/current"
}
```

---

### `/errors/internal-error` — 500

**Cuándo:** Error inesperado del servidor. Siempre loguear con `requestId` para trazabilidad.

```json
{
  "type": "/errors/internal-error",
  "title": "Error interno del servidor",
  "status": 500,
  "detail": "Error inesperado. Revisá los logs con el requestId.",
  "instance": "/api/v1/trading/positions",
  "requestId": "req_7f3a2b1c"
}
```

---

## Tabla resumen

| type | HTTP | Cuándo usarlo |
|------|------|--------------|
| `/errors/validation-error` | 422 | Body/params inválidos o faltantes |
| `/errors/not-found` | 404 | Recurso no existe en DB |
| `/errors/position-already-closed` | 409 | Trade sobre posición cerrada |
| `/errors/insufficient-units` | 409 | Venta supera unidades disponibles |
| `/errors/ccl-not-available` | 422 | Sin CCL para la fecha del trade ARS |
| `/errors/strategy-already-closed` | 409 | Entrada sobre estrategia DCA cerrada |
| `/errors/price-unavailable` | 503 | API externa de precios caída |
| `/errors/internal-error` | 500 | Error no manejado — con requestId |

---

## Manejo en el frontend

```typescript
// Ejemplo de handler genérico
async function handleApiError(response: Response) {
  const problem = await response.json();

  switch (problem.type) {
    case '/errors/validation-error':
      // Mostrar errores por campo en el form
      problem.errors.forEach(({ field, message }) => {
        setFieldError(field, message);
      });
      break;

    case '/errors/ccl-not-available':
      // Redirigir a pantalla CCL con hint
      toast.warning(problem.detail);
      navigate('/ccl');
      break;

    case '/errors/price-unavailable':
      // Mostrar badge "precio no disponible" en el activo
      setPriceUnavailable(true);
      break;

    default:
      toast.error(problem.detail ?? 'Error inesperado');
  }
}
```
