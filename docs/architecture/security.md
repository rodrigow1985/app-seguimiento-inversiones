# Seguridad — App Seguimiento de Inversiones

La app es **personal y local** (corre en `localhost`). No hay usuarios, no hay registro, no hay sesiones. Aun así, se implementa una capa mínima de seguridad para evitar que cualquier proceso o página web en la misma máquina pueda leer o modificar los datos financieros.

---

## Modelo de amenaza

| Amenaza | ¿Aplica? | Mitigación |
|---------|----------|------------|
| Acceso remoto desde internet | No (localhost) | Sin exposición de puertos al exterior |
| Otra app/script en la misma máquina | Sí | API key estática |
| Página web maliciosa (CSRF) | Sí | CORS restringido a `localhost:5173` |
| Lectura de datos en tránsito | No (localhost) | Sin TLS necesario en v1 |
| Acceso físico a la máquina | Fuera de scope | — |

---

## Backend — API Key estática

### Mecanismo

El backend requiere un header `Authorization: Bearer <API_KEY>` en **todos los requests**.

La API key es una string aleatoria definida en `.env`. Sin ella, el backend responde `401 Unauthorized`.

```
Authorization: Bearer tu-api-key-aqui
```

### Implementación

El middleware vive en `backend/src/plugins/auth.ts` (ya existe como placeholder):

```typescript
// backend/src/plugins/auth.ts
import { Request, Response, NextFunction } from 'express'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.API_KEY
  if (!apiKey) return next() // Si no hay API_KEY configurada, pasa (dev sin config)

  const authHeader = req.headers['authorization']
  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return res.status(401).json({
      type: '/errors/unauthorized',
      title: 'No autorizado',
      status: 401,
      detail: 'API key inválida o ausente'
    })
  }
  next()
}
```

Se registra globalmente en `backend/src/app.ts` antes de todas las rutas:

```typescript
app.use(authMiddleware)
```

### Variable de entorno

```env
# .env
API_KEY=genera-una-string-larga-aleatoria-aqui
```

Para generar una key segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rutas excluidas

Ninguna. Todos los endpoints requieren la key, incluyendo health checks.

---

## Frontend — Envío automático de la key

El frontend lee la API key desde una variable de entorno de Vite y la adjunta en cada request:

```env
# frontend/.env
VITE_API_KEY=la-misma-key-que-en-backend
```

La capa de API en `frontend/src/api/client.ts` la inyecta automáticamente:

```typescript
// frontend/src/api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`
  }
})
```

El usuario **no ve ni ingresa ninguna contraseña** — la key es transparente. La app simplemente funciona o no funciona (si la key no coincide, el backend rechaza y el frontend muestra un error genérico).

---

## CORS

El backend solo acepta requests del origen del frontend:

```typescript
// backend/src/app.ts
import cors from 'cors'

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

Variable de entorno:
```env
# .env
FRONTEND_URL=http://localhost:5173
```

Esto impide que páginas web abiertas en el mismo navegador hagan requests a la API (protección CSRF básica).

---

## Variables de entorno requeridas

| Variable | Dónde | Descripción |
|----------|-------|-------------|
| `API_KEY` | `backend/.env` | Key compartida para autenticar requests |
| `FRONTEND_URL` | `backend/.env` | Origen permitido por CORS |
| `VITE_API_KEY` | `frontend/.env` | Misma key que `API_KEY` |
| `VITE_API_BASE_URL` | `frontend/.env` | URL base del backend |

Ambos `.env` están en `.gitignore`. El `.env.example` del proyecto documenta los nombres sin valores.

---

## Lo que esta seguridad NO cubre

- **Múltiples usuarios**: no hay roles ni permisos. Única key = acceso total.
- **Revocación de sesiones**: cambiar la key en `.env` y reiniciar el backend invalida el acceso de inmediato.
- **HTTPS**: en localhost no es necesario. Si alguna vez se expone a una red local, agregar TLS.
- **Rate limiting**: no implementado en v1. Agregar si se expone a internet.

---

## Upgrade a v2 (JWT)

El placeholder `backend/src/plugins/auth.ts` está diseñado para ser reemplazado por JWT sin cambios en las rutas ni en los services. El upgrade implica:

1. Agregar tabla `users` a Prisma
2. Agregar endpoints `POST /auth/login` y `POST /auth/refresh`
3. Reemplazar `authMiddleware` para validar JWT en lugar de API key estática
4. Actualizar el frontend para manejar login/logout y token refresh

Las rutas de negocio (`/trading`, `/dca`, `/ccl`, etc.) no cambian.
