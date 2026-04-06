---
sidebar_position: 1
---

# Setup del Proyecto

## Requisitos

- Node.js 20 LTS o superior
- pnpm (`npm install -g pnpm`)
- Docker (para PostgreSQL) o PostgreSQL 16 instalado localmente

## 1. Clonar y preparar

```bash
git clone <repo-url>
cd app-seguimiento-inversiones
pnpm install
```

## 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env` con los valores correctos (ver comentarios en el archivo).

## 3. Levantar PostgreSQL

```bash
# Con Docker (recomendado)
docker-compose up -d postgres

# Verificar que está corriendo
docker-compose ps
```

## 4. Configurar la base de datos

```bash
# Aplica el schema (crea todas las tablas)
pnpm db:migrate

# Pobla datos iniciales (brokers, activos conocidos)
pnpm db:seed
```

## 5. Importar datos históricos

```bash
# Importar CCL histórico desde el Excel original
pnpm db:import-ccl

# Importar operaciones históricas (opcional, ver docs/guides/data-migration.md)
pnpm db:import-excel
```

## 6. Levantar en desarrollo

```bash
# En terminales separadas:
pnpm dev:backend    # http://localhost:3001
pnpm dev:frontend   # http://localhost:5173
```

## Verificar que todo funciona

```bash
# Health check del backend
curl http://localhost:3001/health

# Prisma Studio (explorador visual de la DB)
pnpm db:studio     # http://localhost:5555
```

## Comandos útiles

```bash
pnpm typecheck          # Verificar tipos TypeScript
pnpm test               # Correr tests
pnpm lint               # Linting
pnpm db:reset           # Resetear DB completamente (DESTRUCTIVO)
```
