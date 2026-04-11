// Importa estrategias DCA desde el Excel (hojas ETH y ADA) a la base de datos.
// Idempotente: no re-crea estrategias ni entradas que ya existan.
// Uso: pnpm db:import-excel

import { PrismaClient, DcaEntryType } from '@prisma/client'
import * as XLSX from 'xlsx'
import { join } from 'path'

const prisma = new PrismaClient()

// ─── Helpers de fecha ────────────────────────────────────────────────────────

function excelSerialToDate(serial: number): Date {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400 * 1000)
}

function parseExcelDate(raw: unknown, fallback?: Date): Date | null {
  if (typeof raw === 'number' && raw > 40000) {
    return excelSerialToDate(raw)
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const normalized = raw.replace(/\*/g, '/').trim()
    const dmY = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (dmY) {
      return new Date(Date.UTC(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1])))
    }
  }
  return fallback ?? null
}

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface ExcelRow {
  strategyNum: number
  date: Date | null
  type: DcaEntryType
  amountUsd: number | null
  profitLossUsd: number | null
}

// ─── Parseo de hoja ──────────────────────────────────────────────────────────

function parseSheet(wb: XLSX.WorkBook, sheetName: string): Map<number, ExcelRow[]> {
  const ws = wb.Sheets[sheetName]
  if (!ws) throw new Error(`Hoja "${sheetName}" no encontrada`)

  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  // Datos empiezan en fila índice 4 (después de título, resumen, vacía, encabezados)
  const strategies = new Map<number, ExcelRow[]>()
  let lastValidDate: Date | undefined

  for (const row of raw.slice(4)) {
    if (!Array.isArray(row)) continue

    const stratNum = typeof row[0] === 'number' ? row[0] : null
    if (!stratNum || stratNum <= 0) continue

    const rawType = String(row[2]).trim()
    if (!['Apertura', 'Incremento', 'Cierre'].includes(rawType)) continue
    const entryType = rawType.toUpperCase() as DcaEntryType

    const date = parseExcelDate(row[1], lastValidDate)
    if (date) lastValidDate = date

    const amountUsd = typeof row[3] === 'number' ? row[3] : null
    const profitLossUsd = typeof row[7] === 'number' && row[7] !== 0 ? row[7] : null

    if (!strategies.has(stratNum)) strategies.set(stratNum, [])
    strategies.get(stratNum)!.push({ strategyNum: stratNum, date, type: entryType, amountUsd, profitLossUsd })
  }

  return strategies
}

// ─── Main ────────────────────────────────────────────────────────────────────

const EXCEL_PATH = join(__dirname, '../../../docs/copia_original/Inversiones.xlsx')

const SHEETS: Array<{ name: string; ticker: string }> = [
  { name: 'ETH', ticker: 'ETH' },
  { name: 'ADA', ticker: 'ADA' },
]

async function main() {
  console.log('Leyendo:', EXCEL_PATH)
  const wb = XLSX.readFile(EXCEL_PATH)

  // ── Lookup de broker y activos ─────────────────────────────────────────────
  const broker = await prisma.broker.findFirst({ where: { name: 'BingX' } })
  if (!broker) throw new Error('Broker "BingX" no encontrado. Ejecutá pnpm db:seed primero.')

  const assetIds = new Map<string, string>()
  for (const { ticker } of SHEETS) {
    const asset = await prisma.asset.findUnique({ where: { ticker } })
    if (!asset) throw new Error(`Asset "${ticker}" no encontrado. Ejecutá pnpm db:seed primero.`)
    assetIds.set(ticker, asset.id)
  }

  // ── Portfolio DCA ──────────────────────────────────────────────────────────
  let portfolio = await prisma.portfolio.findFirst({ where: { name: 'DCA Crypto' } })
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        name: 'DCA Crypto',
        portfolioType: 'DCA',
        strategy: 'LARGO_PLAZO',
        currencyBase: 'USD',
        brokerId: broker.id,
        description: 'Estrategias DCA de criptomonedas importadas desde Excel',
      },
    })
    console.log('  Portfolio "DCA Crypto" creado')
  } else {
    console.log('  Portfolio "DCA Crypto" ya existe')
  }

  // ── Procesar cada hoja ─────────────────────────────────────────────────────
  let strategiesCreated = 0
  let strategiesSkipped = 0
  let entriesCreated = 0

  for (const { name: sheetName, ticker } of SHEETS) {
    console.log(`\nProcesando hoja: ${sheetName}`)
    const assetId = assetIds.get(ticker)!
    const strategies = parseSheet(wb, sheetName)

    for (const [stratNum, entries] of strategies) {
      const stratName = `${sheetName} #${stratNum}`
      const hasCierre = entries.some(e => e.type === 'CIERRE')
      const startedAt = entries[0].date ?? new Date('2024-01-01')

      // Verificar si ya existe (idempotencia)
      const existing = await prisma.dcaStrategy.findFirst({
        where: { portfolioId: portfolio.id, name: stratName },
      })

      if (existing) {
        console.log(`  ${stratName}: ya existe, omitida`)
        strategiesSkipped++
        continue
      }

      const strategy = await prisma.dcaStrategy.create({
        data: {
          portfolioId: portfolio.id,
          assetId,
          brokerId: broker.id,
          name: stratName,
          isActive: !hasCierre,
          startedAt,
        },
      })

      let count = 0
      for (const entry of entries) {
        if (!entry.date) {
          console.warn(`    ⚠ ${stratName} - ${entry.type}: fecha inválida, omitida`)
          continue
        }
        if (entry.amountUsd === null && entry.type !== 'CIERRE') {
          console.warn(`    ⚠ ${stratName} - ${entry.type} (${entry.date.toISOString().slice(0, 10)}): importe vacío, omitida`)
          continue
        }

        await prisma.dcaEntry.create({
          data: {
            strategyId: strategy.id,
            type: entry.type,
            entryDate: entry.date,
            amountUsd: entry.amountUsd ?? 0,
            profitLossUsd: entry.profitLossUsd ?? null,
          },
        })
        count++
      }

      console.log(`  ${stratName}: ${count} entradas | ${hasCierre ? 'CERRADA' : 'ABIERTA'}`)
      strategiesCreated++
      entriesCreated += count
    }
  }

  console.log(`\n✅ Resultado:`)
  console.log(`   Estrategias creadas:  ${strategiesCreated}`)
  console.log(`   Estrategias omitidas: ${strategiesSkipped} (ya existían)`)
  console.log(`   Entradas creadas:     ${entriesCreated}`)
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
