# Velora Reservas

Workspace pnpm de Velora Reservas. La aplicación web Next.js vive en `apps/web`.

La fase actual conserva la demo visual premium y mobile-first para barberías y Beauty Studios en Chile.

## Workspace

- `apps/web`: aplicación Next.js y experiencia visual actual.
- `packages/types`: enums y contratos compartidos sin dependencias de framework.
- `packages/domain`: validaciones y reglas puras de dominio.

Los paquetes de dominio no dependen de React, Next.js, NestJS ni Prisma.

## Requisitos

- Node.js 24.
- pnpm 11 mediante Corepack.

## Desarrollo

```bash
corepack pnpm dev
```

Abrir `http://localhost:3000`.

Para ejecutar la aplicación directamente por filtro:

```bash
corepack pnpm --filter @velora/web dev
```

## Validación

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

Los mismos gates pueden ejecutarse directamente sobre la aplicación web:

```bash
corepack pnpm --filter @velora/web lint
corepack pnpm --filter @velora/web typecheck
corepack pnpm --filter @velora/web build
```

La Fase 1 funciona con datos locales ficticios. Todavía no incluye API, NestJS, Prisma, PostgreSQL, autenticación, pagos, correos ni integraciones externas.
