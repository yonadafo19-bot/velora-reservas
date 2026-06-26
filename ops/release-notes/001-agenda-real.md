# Release Note Interna - 001-agenda-real

## Estado

Implementacion frontend lista para revision y smoke manual.

## Cambio esperado

Consolidar `/admin/citas` como agenda real del panel admin:

- cargar agenda desde API real;
- cargar datos reales para crear cita simple;
- crear cita admin simple contra `POST /appointments`;
- mantener estados limpios para carga, vacio, error, falta de configuracion y 401;
- mantener token admin solo server-side.
- comunicar `Citas` como `AGENDA REAL`, no como vista demo;
- mostrar rango inicio-termino, servicios completos, duracion total y CLP en agenda real.

## Impacto usuario

- El administrador ve citas reales en el panel.
- El administrador puede crear una cita simple desde el panel si hay datos reales suficientes.
- Los errores de sesion/configuracion no generan overlay rojo ni experiencia rota.
- La UI distingue mejor entre datos reales y estados no disponibles.
- La agenda muestra mejor el bloque de tiempo reservado y todos los servicios asociados.

## Impacto tecnico

- `/admin/citas` queda como primera superficie admin conectada a API real.
- Se mantiene `VELORA_ADMIN_DEV_TOKEN` server-side.
- No se modifica backend ni Prisma si los contratos actuales se mantienen suficientes.
- El flujo publico `/reservar` sigue demo.
- Los mensajes visibles de falta de configuracion o 401 no exponen nombres de variables de entorno.

## QA tecnico ejecutado

- `pnpm --filter @velora/web lint`: PASS.
- `pnpm --filter @velora/web typecheck`: PASS.
- `pnpm --filter @velora/web build`: PASS.
- `pnpm typecheck`: PASS.
- `git diff --check`: PASS.

## QA pendiente

- Smoke manual con token valido.
- Smoke manual sin token.
- Smoke manual con token vencido.
- Smoke de agenda vacia y error API.
- Smoke de creacion simple.
- Revision mobile basica.
- Revision de ausencia de overlays rojos.

## Riesgos residuales

- Otras vistas admin pueden seguir usando datos demo.
- Token admin es mecanismo de desarrollo, no auth productiva final.
- README y baseline pueden requerir actualizacion posterior.
- Flujo publico todavia no crea reservas reales.
- Smoke manual sigue pendiente hasta probar con API local y token real.

## Rollback

- Revertir el commit de implementacion de `001-agenda-real`.
- Mantener el fix de 401 sin overlay.
- No volver a mocks en `/admin/citas`; si la API no esta disponible, mostrar estado limpio.
