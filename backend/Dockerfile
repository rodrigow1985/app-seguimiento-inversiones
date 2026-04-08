FROM node:20-alpine

# Prisma necesita OpenSSL en Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Instalar dependencias primero (capa cacheada si package.json no cambia)
COPY package.json ./
RUN npm install

# Generar Prisma client (requiere el schema)
COPY prisma ./prisma
RUN npx prisma generate

# Compilar TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 3001

# Aplica migrations pendientes y levanta el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
