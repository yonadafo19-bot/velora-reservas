# @velora/database

Paquete aislado de persistencia PostgreSQL de Velora.

## Uso local

1. Copiar `.env.example` a `.env`.
2. Ajustar `DATABASE_URL` para la instancia PostgreSQL local.
3. Ejecutar `corepack pnpm db:validate` y `corepack pnpm db:generate` desde la raíz.
4. Aplicar migraciones con `corepack pnpm db:migrate` solo sobre una base aprobada.

No existe seed en esta fase: crear negocios, usuarios o clientes ficticios no es
necesario para validar la fundación y mezclaría datos demo con persistencia real.

## Enums compartidos

Prisma genera enums propios para la capa de persistencia. `@velora/types`
mantiene enums equivalentes para contratos sin depender de Prisma. Esta duplicación
es temporal y deliberada; un test de paridad se agregará cuando la API comience a
mapear modelos persistidos a contratos.
