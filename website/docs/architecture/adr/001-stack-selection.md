---
sidebar_position: 1
---

# ADR 001 — Selección de Stack Tecnológico

**Estado**: Aceptado  
**Fecha**: 2026-04-05

---

## Contexto

Se necesita un stack 100% gratuito y open source para una app personal de seguimiento de inversiones con backend REST API separado del frontend React.

## Decisiones

### Base de datos: PostgreSQL 16

**Alternativas consideradas**: SQLite, MongoDB.

**Por qué PostgreSQL**:
- `NUMERIC(18,8)` para precisión exacta en precios de crypto — crítico para no perder centavos en cálculos de P&L.
- JOINs temporales eficientes para conversiones CCL históricas: `WHERE date <= $fecha ORDER BY date DESC LIMIT 1`.
- JSONB para campos de configuración flexible (comisiones variables por broker).
- Concurrencia real para uso futuro multi-dispositivo.

**Por qué no SQLite**: no soporta concurrencia, tipos de fecha limitados, no escala si se agrega sync en la nube.

**Por qué no MongoDB**: los datos de inversiones son inherentemente relacionales. Un Trade pertenece a una Position, que pertenece a un Portfolio, que tiene un Broker y un CCL histórico. Modelar esto como documentos introduce inconsistencia y makes queries complejas.

### Backend: Node.js + Express + TypeScript

**Por qué Express**: framework conocido por el equipo. Ecosistema maduro, middleware abundante, sin curva de aprendizaje. Para una API personal la diferencia de performance con Fastify es irrelevante.

**Por qué TypeScript**: el modelo de dominio tiene enums complejos (AssetType, PositionStatus, TradeType, DcaEntryType), monedas, y conversiones. TypeScript previene bugs en cálculos financieros que pueden ser costosos.

**Por qué Prisma**: genera tipos TypeScript desde el schema — el tipo `Position` en el servicio es el mismo que en la DB. Migrations automáticas. Alternativa válida: Drizzle (más liviano, igualmente válido).

**Por qué no NestJS**: demasiado boilerplate para un proyecto personal. Express con organización manual de módulos es más transparente y más fácil de entender para agentes de IA.

### Frontend: React + Vite + TypeScript

**Por qué Vite sobre CRA**: significativamente más rápido en development, sin configuración compleja, HMR casi instantáneo.

**Por qué TanStack Query**: el frontend necesita caché de precios en tiempo real con re-fetch automático. React Query maneja loading/error states, cache invalidation, y background updates — exactamente lo que se necesita para datos financieros.

**Por qué shadcn/ui + Tailwind**: los componentes de shadcn/ui son código copiable (no una librería instalada), lo que permite modificar el diseño sin tocar la lógica de negocio. Satisface el requisito de "capa de diseño separada de la funcional".

### Monorepo: pnpm workspaces

**Por qué monorepo**: el paquete `packages/types` define los tipos compartidos una sola vez (AssetType, Trade, Position, etc.) — el backend y el frontend usan los mismos tipos sin duplicación.

**Por qué pnpm**: más rápido que npm, mejor manejo de dependencias en workspaces, sin duplicación de `node_modules`.

## Consecuencias

- El stack completo es JavaScript/TypeScript, reduciendo context-switching.
- PostgreSQL requiere tener el servidor levantado (Docker Compose provee esto con un comando).
- No hay deployment en v1 — todo corre localmente.
