# @velora/database

Paquete aislado de persistencia PostgreSQL de Velora.

## Uso local

1. Copiar `.env.example` a `.env`.
2. Ajustar `DATABASE_URL` para la instancia PostgreSQL local.
3. Ejecutar `corepack pnpm db:validate` y `corepack pnpm db:generate` desde la raíz.
4. Aplicar migraciones con `corepack pnpm db:migrate` solo sobre una base aprobada.

## Seeds demo por vertical

El seed crea dos tenants totalmente separados: `velora-barberia-demo` y
`velora-beauty-studio-demo`. Incluye catálogo, profesionales, horarios, packs,
clientes ficticios, productos, inventario, recomendaciones y recursos.

Solo debe ejecutarse sobre una base de desarrollo aprobada. Requiere una
`DATABASE_URL` explícita y la confirmación `VELORA_SEED_CONFIRM=SEED_VELORA_DEMOS`:

```powershell
$env:DATABASE_URL = "postgresql://..."
$env:VELORA_SEED_CONFIRM = "SEED_VELORA_DEMOS"
corepack pnpm db:seed
```

El usuario `owner.demo@velora.invalid` y su `authSubject` de desarrollo no
representan una cuenta Supabase real y deben reemplazarse al integrar Auth.
El seed usa upserts e IDs determinísticos, por lo que puede repetirse sin duplicar
filas. Una nueva ejecución restablece los valores demo administrados por el seed.
No genera `AuditLog`: la carga inicial demo queda deliberadamente fuera de la
trazabilidad operativa.

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

Las pruebas de Gate 0 verifican estáticamente esta constraint. La prueba real de
dos reservas concurrentes queda pendiente para una instancia PostgreSQL vacía y
aprobada.

## Lista de espera y políticas

La intención de lista de espera conserva preferencias, contacto y snapshots de
servicios. Los cupos liberados y candidatos solo preparan matching futuro; no
ejecutan disponibilidad ni contacto automático.

Las políticas de seña son configuración y no representan pagos. La migración
exige monto fijo o porcentaje, nunca ambos, y limita porcentajes a 0-10000 puntos
base. Las reglas no-show solo almacenan ventana y seguimiento; no cobran ni
aplican sanciones automáticas.

## Retail y recursos

`Product` y `Service` son entidades separadas: los productos no tienen duración,
profesional ni bloques de agenda. El inventario se registra por location y aplica
la invariante `0 <= reserved <= onHand`; productos sin tracking no necesitan
filas operativas de inventario.

Las órdenes retail solo preparan venta asistida con snapshots. No implementan
checkout, pagos, boleta ni facturación. Los tipos, recursos y requisitos por
servicio preparan disponibilidad futura, pero no reservan recursos ni se conectan
a `AppointmentSegment` en esta fase.

## Trazabilidad

`AuditLog`, `AppointmentStatusHistory` e `InventoryMovement` son registros
append-only por contrato: no tienen `updatedAt` y la futura capa de repositorio
solo debe permitir inserciones. No se agregan triggers de auditoría en esta fase.

Los JSON de auditoría deben construirse con allowlists y redacción antes de
persistirlos. Nunca deben contener secretos, tokens, passwords, credenciales ni
PII innecesaria. `ipAddress` y `userAgent` son opcionales y tienen longitud
limitada. Cada movimiento conserva estados anterior y siguiente de stock y
reserva, además de una clave de idempotencia opcional por tenant.

Las pruebas estáticas verifican checks e idempotencia del inventario. El bloqueo
transaccional de stock queda pendiente para el servicio real de inventario.
