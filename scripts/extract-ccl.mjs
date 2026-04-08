// Script para extraer CCL histórico del Excel y generar SQL seed
// Uso: node scripts/extract-ccl.mjs
// Requiere: npm install xlsx (en el directorio del script o globalmente)

import { createRequire } from 'module'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

// Instalar xlsx si no está disponible
try {
  const require = createRequire(import.meta.url)
  require.resolve('xlsx')
} catch {
  console.log('Instalando xlsx...')
  execSync('npm install xlsx', { cwd: __dirname, stdio: 'inherit' })
}

const { createRequire: cr } = await import('module')
const require = cr(import.meta.url)
const XLSX = require('xlsx')

const filePath = resolve(rootDir, 'docs/copia_original/Inversiones.xlsx')
console.log('Leyendo:', filePath)

const wb = XLSX.readFile(filePath)
const ws = wb.Sheets['CCL']

if (!ws) {
  console.error('No se encontró la hoja "CCL"')
  process.exit(1)
}

const range = XLSX.utils.decode_range(ws['!ref'])
console.log(`Rango de la hoja: ${ws['!ref']}`)

// Columnas: M=12, N=13, P=15, Q=16 (0-indexed)
const COL_M = 12  // fechas grupo 1
const COL_N = 13  // valores grupo 1
const COL_P = 15  // fechas grupo 2
const COL_Q = 16  // valores grupo 2

const rows = []

for (let r = range.s.r; r <= range.e.r; r++) {
  // Grupo 1: columnas M y N
  const cellM = ws[XLSX.utils.encode_cell({ r, c: COL_M })]
  const cellN = ws[XLSX.utils.encode_cell({ r, c: COL_N })]

  if (cellM && cellN) {
    const date = parseDate(cellM)
    const value = parseValue(cellN)
    if (date && value) rows.push({ date, value })
  }

  // Grupo 2: columnas P y Q
  const cellP = ws[XLSX.utils.encode_cell({ r, c: COL_P })]
  const cellQ = ws[XLSX.utils.encode_cell({ r, c: COL_Q })]

  if (cellP && cellQ) {
    const date = parseDate(cellP)
    const value = parseValue(cellQ)
    if (date && value) rows.push({ date, value })
  }
}

function parseDate(cell) {
  if (!cell) return null
  if (cell.t === 'n') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(cell.v)
    if (!d) return null
    const month = String(d.m).padStart(2, '0')
    const day   = String(d.d).padStart(2, '0')
    return `${d.y}-${month}-${day}`
  }
  if (cell.t === 's') {
    // String date — try DD/MM/YYYY or YYYY-MM-DD
    const raw = cell.v.trim()
    const dmY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dmY) return `${dmY[3]}-${dmY[2].padStart(2,'0')}-${dmY[1].padStart(2,'0')}`
    const Ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (Ymd) return raw
  }
  return null
}

function parseValue(cell) {
  if (!cell) return null
  const n = Number(cell.v)
  if (isNaN(n) || n <= 0) return null
  return n
}

// Deduplicar y ordenar
const unique = new Map()
for (const row of rows) {
  if (!unique.has(row.date)) unique.set(row.date, row.value)
}
const sorted = [...unique.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, value]) => ({ date, value }))

console.log(`\nRegistros encontrados: ${sorted.length}`)
if (sorted.length > 0) {
  console.log(`Rango: ${sorted[0].date} → ${sorted[sorted.length - 1].date}`)
  console.log('Primeros 3:', sorted.slice(0, 3))
  console.log('Últimos 3:', sorted.slice(-3))
}

// Generar SQL
const values = sorted
  .map(({ date, value }) => `  ('${date}', ${value.toFixed(4)}, 'EXCEL_SEED')`)
  .join(',\n')

const sql = `-- CCL histórico extraído de Inversiones.xlsx
-- Generado: ${new Date().toISOString()}
-- Total registros: ${sorted.length}

INSERT INTO "CclRate" (date, rate, source)
VALUES
${values}
ON CONFLICT (date) DO NOTHING;
`

const outPath = resolve(rootDir, 'backend/prisma/seeds/ccl-historico.sql')
writeFileSync(outPath, sql, 'utf-8')
console.log(`\nSQL generado en: ${outPath}`)

// También guardar JSON para referencia
const jsonPath = resolve(rootDir, 'backend/prisma/seeds/ccl-historico.json')
writeFileSync(jsonPath, JSON.stringify(sorted, null, 2), 'utf-8')
console.log(`JSON guardado en: ${jsonPath}`)
