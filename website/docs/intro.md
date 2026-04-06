---
sidebar_position: 1
slug: /intro
---

# App Seguimiento Inversiones

App personal de seguimiento de inversiones financieras que reemplaza un Excel con 19 hojas. Maneja carteras de trading (compra/venta táctica) y estrategias DCA, en activos argentinos y crypto, con doble moneda ARS/USD y tipo de cambio CCL histórico.

## ¿Qué hace la app?

- **Trading**: registrar y seguir posiciones de compra/venta en Cryptos, Acciones ARG, Cedears, FCI y Renta Fija
- **DCA**: acumular posiciones periódicas en BTC, ETH, ADA, PAXG (Oro) con seguimiento de capital acumulado y P&L
- **Precios en tiempo real**: via CoinGecko (crypto) e IOL API (acciones ARG)
- **CCL automático**: historial del tipo de cambio CCL via Ambito Financiero
- **Dashboard**: resumen consolidado de toda la cartera

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Docs | Docusaurus |

## Estructura del proyecto

```
app-seguimiento-inversiones/
├── backend/          # API REST (Express)
├── frontend/         # App React
├── packages/types/   # Tipos compartidos
├── website/          # Esta documentación (Docusaurus)
└── docs/             # Documentos fuente
```

## Empezar

Ver [Setup del proyecto →](./guides/setup)

## Leer primero

Antes de contribuir o modificar:

1. [Modelo de Dominio](./architecture/domain-model) — entidades y reglas de negocio
2. [ADR 003: Trading vs DCA](./architecture/adr/003-trading-vs-dca) — por qué son modelos separados
3. [ADR 002: Dual Currency](./architecture/adr/002-dual-currency) — cómo se maneja ARS/USD con CCL

## Brokers soportados

| Broker | Comisión | Activos |
|---|---|---|
| IOL (InvertirOnline) | 0.70% | Acciones ARG, Cedears, FCI, Bonos |
| Binance | 0.726% | Crypto |
| BingX | 0.20% | Crypto |
| Balanz | 0.70% | FCI, Cedears |
