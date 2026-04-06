# App Seguimiento de Inversiones

App personal de seguimiento de inversiones financieras. Reemplaza un Excel con carteras de trading (acciones ARG, Cedears, crypto, FCI, bonos) y estrategias DCA. Maneja doble moneda ARS/USD con tipo de cambio CCL histórico.

## Stack

- **Backend**: Node.js + Fastify + TypeScript + Prisma
- **Base de datos**: PostgreSQL 16
- **Frontend**: React + Vite + TypeScript + shadcn/ui + Tailwind
- **Monorepo**: pnpm workspaces

## Levantar en 5 pasos

```bash
pnpm install                        # 1. Instalar dependencias
cp backend/.env.example backend/.env  # 2. Configurar variables de entorno
docker-compose up -d postgres       # 3. Levantar PostgreSQL
pnpm db:migrate && pnpm db:seed     # 4. Crear tablas y datos iniciales
pnpm dev:backend & pnpm dev:frontend  # 5. Levantar app
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  
DB Studio: `pnpm db:studio` → http://localhost:5555

## Documentación

- [Setup completo](docs/guides/setup.md)
- [Modelo de dominio](docs/architecture/domain-model.md)
- [Diseño de la API](docs/architecture/api-design.md)
- [Migración desde Excel](docs/guides/data-migration.md)
- [Módulo Trading](docs/modules/trading.md)
- [Módulo DCA](docs/modules/dca.md)
- [Precios e integraciones](docs/modules/prices.md)
