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

## Restricciones SQL

La migración de catálogo y agenda agrega checks PostgreSQL para precios y buffers
no negativos, duraciones y cantidades positivas, horas locales `HH:mm` y rangos
UTC válidos. Prisma no representa estos checks en `schema.prisma`; toda migración
futura que toque esas tablas debe preservarlos y validarlos explícitamente.

## Exclusión de traslapes profesionales

La migración de reservas habilita la extensión PostgreSQL `btree_gist` y crea
una constraint `EXCLUDE USING gist` sobre los segmentos. Para un mismo negocio
y profesional, rechaza rangos `[startsAt, endsAt)` traslapados cuando
`blocksAvailability = true` y el segmento no está cancelado. Permite segmentos
adyacentes, cancelados o marcados para no bloquear disponibilidad.

Prisma no representa extensiones ni constraints de exclusión. Las migraciones
futuras deben preservar esta protección, y el rol que aplica migraciones necesita
permiso para instalar `btree_gist` si la extensión no existe.
