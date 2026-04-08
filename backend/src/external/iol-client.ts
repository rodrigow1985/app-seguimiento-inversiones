// Cliente para InvertirOnline (IOL) API.
// Maneja el flujo OAuth2 (password grant) y cachea el token en memoria.
// Docs: https://api.invertironline.com

const IOL_BASE = 'https://api.invertironline.com'

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number   // segundos
  token_type: string
}

interface IolQuote {
  simbolo: string
  ultimoPrecio: number
  moneda: string
  variacion: number
  apertura: number
  maximo: number
  minimo: number
  volumen: number
  cantidadOperaciones: number
  fechaHora: string
}

// ── Token cache ────────────────────────────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0
let cachedRefreshToken: string | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  // Intentar refresh si tenemos refresh token
  if (cachedRefreshToken && Date.now() < tokenExpiresAt + 86_400_000) {
    try {
      return await refreshToken()
    } catch {
      // Si falla el refresh, hacer login completo
    }
  }

  return login()
}

async function login(): Promise<string> {
  const username = process.env.IOL_USERNAME
  const password = process.env.IOL_PASSWORD

  if (!username || !password) {
    throw new Error('IOL_USERNAME e IOL_PASSWORD son requeridos en las variables de entorno')
  }

  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
  })

  const res = await fetch(`${IOL_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`IOL login failed: HTTP ${res.status} — ${text}`)
  }

  const data = (await res.json()) as TokenResponse
  setToken(data)
  return data.access_token
}

async function refreshToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cachedRefreshToken!,
  })

  const res = await fetch(`${IOL_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`IOL refresh failed: HTTP ${res.status}`)

  const data = (await res.json()) as TokenResponse
  setToken(data)
  return data.access_token
}

function setToken(data: TokenResponse) {
  cachedToken = data.access_token
  cachedRefreshToken = data.refresh_token
  // Renovar 60s antes de que expire para evitar race conditions
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
}

// ── Quote API ──────────────────────────────────────────────────────────────────

export async function fetchIolQuote(ticker: string): Promise<{ priceArs: number }> {
  const token = await getAccessToken()

  // Mercado: bCBA cubre acciones ARG, CEDEARs, bonos y FCI
  const url = `${IOL_BASE}/api/v2/bCBA/Titulos/${encodeURIComponent(ticker)}/Cotizacion`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (res.status === 401) {
    // Token inválido — forzar nuevo login
    cachedToken = null
    cachedRefreshToken = null
    throw new Error('IOL: token expirado, reintentando en el próximo request')
  }

  if (!res.ok) {
    throw new Error(`IOL cotización HTTP ${res.status} para ${ticker}`)
  }

  const data = (await res.json()) as IolQuote

  if (!data.ultimoPrecio) {
    throw new Error(`IOL: sin precio para ${ticker}`)
  }

  return { priceArs: data.ultimoPrecio }
}
