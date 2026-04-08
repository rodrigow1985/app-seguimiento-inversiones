// Importa el historial CCL desde prisma/seeds/ccl-historico.json a la BD.
// Usa upsert para ser idempotente (safe re-run).
// Uso: pnpm db:import-ccl

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface CclEntry {
  date: string   // "YYYY-MM-DD"
  value: number
}

async function main() {
  const filePath = join(__dirname, '../seeds/ccl-historico.json')
  const raw = readFileSync(filePath, 'utf-8')
  const entries: CclEntry[] = JSON.parse(raw)

  console.log(`Importando ${entries.length} registros CCL...`)

  let imported = 0
  let skipped = 0

  // Procesamos en batches para no saturar la conexión
  const BATCH = 100
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (entry) => {
        const date = new Date(entry.date)
        const result = await prisma.cclRate.upsert({
          where: { date },
          update: {},   // no sobreescribir si ya existe
          create: {
            date,
            rate: entry.value,
            source: 'AMBITO',
          },
        })
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          imported++
        } else {
          skipped++
        }
      })
    )

    if ((i / BATCH) % 5 === 0) {
      process.stdout.write(`  ${Math.min(i + BATCH, entries.length)}/${entries.length}\r`)
    }
  }

  console.log(`\nImportados: ${imported} | Ya existían: ${skipped}`)
  console.log('Import CCL completo.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
