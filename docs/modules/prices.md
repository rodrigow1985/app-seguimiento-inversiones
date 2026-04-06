# Módulo de Precios

## Fuentes de precios por tipo de activo

| Tipo de activo | Fuente primaria | Fuente alternativa | Notas |
|---|---|---|---|
| Cryptos (BTC, ETH, ADA...) | CoinGecko API | CoinCap | Free tier: 30 req/min |
| Acciones ARG | IOL API | Rava | Requiere cuenta IOL |
| Cedears | IOL API | Rava | IOL tiene precios en ARS |
| FCI (cuotapartes) | IOL API | Manual | |
| Bonos (Renta fija) | IOL API | Manual | |
| Oro (PAXGUSD) | CoinGecko API | — | PAXG cotiza como crypto |

## Abstracción de proveedores

El módulo de precios tiene una capa de abstracción en `backend/src/external/price-provider.ts` que define:

```typescript
interface PriceProvider {
  getPrice(assetId: string): Promise<{ price: number; currency: 'ARS' | 'USD'; timestamp: Date }>;
  getPrices(assetIds: string[]): Promise<Map<string, PriceResult>>;
}
```

Los clientes concretos implementan esta interfaz:
- `CoingeckoClient` — para cryptos
- `IolClient` — para activos argentinos (acciones, Cedears, FCI, bonos)
- `ManualPriceClient` — fallback para activos sin fuente automática

El campo `Asset.price_source` determina qué cliente se usa. El campo `Asset.price_source_id` es el identificador en esa API.

## Estrategia de caché

El backend no llama a APIs externas en cada request del frontend. En su lugar:

1. **Caché en memoria** (Map con timestamp): precios válidos por 60 segundos para crypto, 5 minutos para acciones.
2. Si el caché es válido, retorna el valor cacheado.
3. Si expiró, llama a la API externa, actualiza el caché, y persiste en `PriceSnapshot`.

El endpoint `GET /api/v1/prices/current` implementa esta lógica.

## Rate limits

| Proveedor | Límite free tier | Estrategia |
|---|---|---|
| CoinGecko | 30 req/min | Batch: pedir todos los tickers en una sola llamada |
| IOL API | Por definir | Auth con JWT, refrescar token automáticamente |
| Ambito (CCL) | Sin límite documentado | 1 vez por día hábil |

## CCL (Contado con Liquidación)

El CCL se actualiza una vez por día hábil. El servicio `CclService`:

1. Detecta si el CCL del día actual ya está en la DB.
2. Si no, llama a la API de Ambito (configurada en `config/ccl-sources.json`).
3. Persiste el valor en la tabla `CclRate`.
4. El endpoint `GET /api/v1/ccl/latest` retorna el último valor.

Para el histórico inicial, se importa desde el Excel (ver `docs/guides/data-migration.md`).

## Configuración de fuentes (`config/price-sources.json`)

```json
{
  "coingecko": {
    "baseUrl": "https://api.coingecko.com/api/v3",
    "rateLimit": 30,
    "cacheSeconds": 60,
    "assets": {
      "BTC": "bitcoin",
      "ETH": "ethereum",
      "ADA": "cardano",
      "PAXG": "pax-gold",
      "BNB": "binancecoin",
      "AVAX": "avalanche-2",
      "SOL": "solana"
    }
  },
  "iol": {
    "baseUrl": "https://api.invertironline.com",
    "cacheSeconds": 300,
    "markets": {
      "CEDEAR": "bCBA",
      "ACCION_ARG": "bCBA"
    }
  }
}
```

## Agregar un nuevo activo

1. Crear el `Asset` en la DB con `price_source` y `price_source_id` correctos.
2. Agregar el mapping en `config/price-sources.json` si el activo es crypto.
3. Si es un activo argentino, IOL lo encuentra por ticker automáticamente.
4. Si no tiene fuente automática, setear `price_source = MANUAL` y cargar precios manualmente.
