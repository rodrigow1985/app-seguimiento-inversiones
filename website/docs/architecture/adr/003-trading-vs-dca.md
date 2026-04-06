---
sidebar_position: 3
---

# ADR 003 — Modelos Separados para Trading y DCA

**Estado**: Aceptado  
**Fecha**: 2026-04-05

---

## Contexto

El Excel tiene dos tipos de hojas con lógicas completamente distintas:

**Hojas de trading** (Cryptos, Acciones ARG, Cartera corto plazo, Cartera Jubilación, FCI_USD, Renta fija): registran operaciones de compra y venta, con precio unitario, unidades, y P&L por diferencia de precio.

**Hojas de DCA** (BTC, ETH, ADA, PAXGUSD, Estrategia Michel Saylor): registran aportes de capital en USD a lo largo del tiempo, sin necesariamente rastrear precio unitario. Lo importante es el capital acumulado y la ganancia total al cerrar.

## Decisión

**Usar modelos de datos separados para Trading y DCA.**

Trading usa: `Portfolio → Position → Trade`
DCA usa: `Portfolio → DcaStrategy → DcaEntry`

### Criterio para decidir cuál usar

| Característica | Trading | DCA |
|---|---|---|
| Se registra precio unitario | Siempre | Opcional |
| Se registra cantidad de unidades | Siempre | Opcional |
| El objetivo es comprar barato y vender caro | Sí | No necesariamente |
| Los aportes son periódicos y continuos | No | Sí |
| El P&L se mide por trade | Sí | Por estrategia completa |
| Puede tener posiciones parcialmente vendidas | Sí | No aplica |

### Por qué no un modelo unificado

Se intentó modelar ambos con una tabla `Operation` con campos opcionales, pero generó:
- Validaciones complejas con muchos campos nullable según el tipo.
- Lógica de P&L distinta que no se puede expresar limpiamente en una sola función.
- Confusión semántica: una "posición" de trading (agrupación de trades por activo) no es lo mismo que una "estrategia" DCA.

## Consecuencias

- **Beneficio**: cada módulo tiene su propia lógica de negocio limpia y tenable independientemente.
- **Beneficio**: los formularios de entrada de datos son distintos (trading pide precio + unidades; DCA pide solo monto USD).
- **Beneficio**: los reportes son distintos (trading muestra P&L por posición; DCA muestra evolución del capital acumulado).
- **Costo**: hay algo de duplicación en la estructura (ambos tienen `portfolio_id`, `asset_id`, fechas, notas).
- **Regla**: si alguien pregunta si debería unificar los modelos, la respuesta es no. Ver este ADR.
