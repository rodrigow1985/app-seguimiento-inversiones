import { createApp } from './app'
import { prisma } from './lib/prisma'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

const app = createApp()

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
})

// Cierre limpio
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
