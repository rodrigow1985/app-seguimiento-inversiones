// Cliente para obtener el tipo de cambio CCL (Contado con Liquidación) desde Ambito.
// Nunca llamar directamente desde services — usar el sync endpoint de CCL.

export interface AmbitoCclResponse {
  fecha: string   // "DD/MM/YYYY"
  venta: string   // price string
}

export async function fetchAmbitoCcl(): Promise<AmbitoCclResponse[]> {
  const url =
    process.env.AMBITO_CCL_URL ??
    'https://mercados.ambito.com/dolarrava/con-liquidacion/historico-general'

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: 'https://www.ambito.com/',
      Origin: 'https://www.ambito.com',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) throw new Error(`Ambito HTTP ${res.status}`)

  const data = await res.json()

  // Ambito returns [["DD/MM/YYYY", "sell", "buy"], ...]
  if (Array.isArray(data)) {
    return (data as string[][]).slice(1).map(([fecha, venta]) => ({ fecha, venta }))
  }

  throw new Error('Unexpected Ambito CCL response format')
}
