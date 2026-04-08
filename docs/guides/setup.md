# Setup del Proyecto

## Requisitos

- Node.js 20 LTS o superior (solo para el frontend en dev)
- pnpm (`npm install -g pnpm`)
- Docker y Docker Compose

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
El `.env` se usa para los scripts locales (tests, seeds, prisma studio). En Docker las variables se pasan directamente por el `docker-compose.yml`.

## 3. Levantar la infraestructura con Docker

```bash
# Levanta postgres, backend y docs
docker-compose up -d

# Solo la base de datos (si querés correr el backend local)
docker-compose up -d postgres
```

Servicios disponibles:
| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:3001 |
| pgAdmin | http://localhost:5050 |
| Documentación | http://localhost:3002 |

> **Nota:** El backend corre dentro de Docker. Al iniciar, aplica automáticamente las migrations pendientes (`prisma migrate deploy`).

## 4. Poblar datos iniciales

```bash
# Pobla brokers y activos conocidos
pnpm db:seed

# Importar CCL histórico (opcional)
pnpm db:import-ccl

# Importar operaciones del Excel original (opcional)
pnpm db:import-excel
```

## 5. Levantar el frontend (desarrollo local)

```bash
pnpm dev:frontend   # http://localhost:5173
```

El frontend es el único servicio que corre local — el backend y la DB están en Docker.

## Verificar que todo funciona

```bash
# Health check del backend (desde Docker)
curl http://localhost:3001/health

# Prisma Studio (explorador visual de la DB)
pnpm db:studio     # http://localhost:5555
```

## Comandos útiles

```bash
pnpm typecheck          # Verificar tipos TypeScript
pnpm test               # Correr tests (requiere postgres corriendo)
pnpm lint               # Linting
pnpm db:reset           # Resetear DB completamente (DESTRUCTIVO)
```

## Desarrollo del backend (sin Docker)

Si necesitás iterar rápido en el backend sin reconstruir la imagen:

```bash
docker-compose up -d postgres      # Solo la DB en Docker
pnpm dev:backend                   # Backend local con hot-reload
```
