# Velora Reservas

Workspace pnpm de Velora Reservas. La aplicación web Next.js vive en `apps/web`.

La fase actual conserva la demo visual premium y mobile-first para barberías y Beauty Studios en Chile.

## Workspace

- `apps/web`: aplicación Next.js y experiencia visual actual.
- `apps/api`: API NestJS versionada y fundamentos HTTP compartidos.
- `packages/types`: enums y contratos compartidos sin dependencias de framework.
- `packages/domain`: validaciones y reglas puras de dominio.
- `packages/database`: schema, migraciones y cliente generado de Prisma para PostgreSQL.

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

La API se ejecuta por separado en `http://localhost:3001/api/v1`:

```bash
corepack pnpm dev:api
```

Health checks disponibles:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

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

Para validar solamente la API:

```bash
corepack pnpm --filter @velora/api lint
corepack pnpm --filter @velora/api typecheck
corepack pnpm --filter @velora/api build
```

## Base de datos

La configuración de Prisma vive en `packages/database`. Copiar su `.env.example`
a `.env` y reemplazar la URL local antes de ejecutar migraciones.

```bash
corepack pnpm db:format
corepack pnpm db:validate
corepack pnpm db:generate
corepack pnpm db:migrate
```

La migración inicial incluida puede aplicarse sobre una base PostgreSQL vacía.
El paquete no crea una instancia global de `PrismaClient` y no está expuesto a
`apps/web`.

La Fase 1 web funciona con datos locales ficticios. La API solo expone health checks y fundamentos HTTP; todavía no incluye endpoints de negocio, Prisma, PostgreSQL, autenticación, pagos, correos ni integraciones externas.
