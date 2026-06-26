# 001-agenda-real - Spec

## Problema

Velora Reservas ya tiene backend real para agenda, servicios, profesionales, disponibilidad, clientes y creacion de citas, pero la experiencia visible todavia mezcla superficies demo y reales.

La ruta `/admin/citas` ya consume API real de agenda y formulario, pero necesita quedar formalmente especificada antes de seguir construyendo sobre ella. Sin una spec, existe riesgo de mezclar mocks, romper el token server-side, duplicar reglas de disponibilidad o avanzar a features nuevas sin QA controlado.

## Estado actual detectado

- El repo esta en monorepo pnpm con `apps/web`, `apps/api`, `packages/types`, `packages/domain` y `packages/database`.
- `apps/api/src/businesses/businesses.controller.ts` expone endpoints reales:
  - `GET /businesses/:businessSlug/services`
  - `GET /businesses/:businessSlug/professionals`
  - `GET /businesses/:businessSlug/professionals/:professionalId/availability`
  - `GET /businesses/:businessSlug/customers`
  - `GET /businesses/:businessSlug/appointments`
  - `GET /businesses/:businessSlug/dashboard/calendar`
  - `POST /businesses/:businessSlug/appointments`
- `business-calendar-dashboard.test.cjs` cubre tenant, rango, filtros, status, campos seguros, `America/Santiago` y no exposicion de datos sensibles.
- `business-appointment-create.test.cjs` cubre `serviceIds`, tenant, validaciones, duracion total, precio total, segmentos y respuesta segura.
- `/admin/citas` carga calendario y datos de formulario en paralelo con estados separados.
- `admin-calendar-api.ts` usa `VELORA_API_URL` y `VELORA_ADMIN_DEV_TOKEN` server-side para cargar `/dashboard/calendar`.
- `admin-appointments-api.ts` usa el mismo token server-side para cargar services/customers/professionals/availability y crear citas simples desde admin.
- El formulario admin actual envia un solo servicio como `serviceIds: [serviceId]`.
- El flujo publico `/reservar` sigue siendo demo: usa `apps/web/src/data/demo/index.ts`, horarios fijos y `sessionStorage`.
- `README.md` y `docs/gate-0-baseline.md` estan desfasados respecto del estado real del backend.

## Usuarios afectados

- Administrador de negocio que revisa agenda en `/admin/citas`.
- Administrador que crea una cita simple desde el panel admin.
- Equipo tecnico que necesita distinguir datos reales, demo y estados pendientes.

## Alcance v1

- Consolidar `/admin/citas` como la primera superficie admin con agenda real.
- Mantener carga real de calendario desde `/dashboard/calendar`.
- Mantener carga real de services, customers, professionals y availability para el formulario.
- Mantener creacion simple de cita admin contra `POST /appointments`.
- Mantener `VELORA_ADMIN_DEV_TOKEN` solo server-side.
- Mostrar estados limpios para loading, agenda vacia, error API, falta de configuracion y 401.
- Mantener fechas y horas en `America/Santiago`.
- Mantener texto visible en espanol Chile y precios en CLP cuando aplique.

## Fuera de alcance

- No conectar el flujo publico `/reservar` a API real.
- No crear cliente nuevo desde el formulario.
- No implementar packs reales.
- No implementar WhatsApp.
- No implementar pagos, depositos ni politicas comerciales.
- No implementar auth productiva nueva.
- No cambiar Prisma, migraciones ni seeds.
- No redisenar el panel completo.
- No convertir todas las subrutas admin a datos reales en esta feature.

## Reglas de negocio

- Una cita admin requiere cliente, servicio, profesional, ubicacion, fecha y hora.
- La fecha no puede estar en el pasado segun `America/Santiago`.
- La hora debe respetar disponibilidad real del profesional/ubicacion/dia.
- El profesional debe poder realizar el servicio seleccionado.
- El payload de creacion debe usar `serviceIds`.
- El origen de cita admin debe ser `ADMIN`.
- Canceladas, completadas y no-show no deben bloquear disponibilidad futura cuando se implemente bloqueo por ocupacion.
- Confirmadas y segmentos scheduled deben bloquear disponibilidad cuando se implemente bloqueo por ocupacion.

## Reglas UX

- Todo texto visible debe estar en espanol Chile.
- Las superficies con datos reales deben comunicar estados reales, no demo.
- Las superficies que sigan siendo demo deben estar marcadas como demo.
- No mostrar overlays rojos por errores controlados 401.
- Los errores deben ser accionables:
  - agenda: configuracion o sesion pendiente;
  - formulario: revisar sesion de administrador;
  - API generica: intentar nuevamente.
- La agenda debe ser clara en fecha, hora, cliente, servicio, profesional, ubicacion y estado.

## Reglas de seguridad

- No exponer `VELORA_ADMIN_DEV_TOKEN` al cliente.
- No usar `NEXT_PUBLIC_*` para secretos.
- No imprimir tokens ni headers sensibles.
- No depender de query params de UI como aislamiento tenant real.
- Respetar contratos seguros del backend: no exponer businessId, notas internas, tokens, requestId ni campos sensibles.

## Criterios de aceptacion funcionales

- `/admin/citas?negocio=barberia` carga agenda real si API y token estan disponibles.
- Si no hay token o el token vence, la UI muestra estado limpio sin overlay rojo.
- Si falla solo el formulario, la agenda no se oculta.
- Si falla solo calendario, recien ahi se muestra estado de agenda no cargada.
- El boton `Nueva cita` solo se habilita con datos reales suficientes.
- Crear una cita simple desde admin envia payload real al API.
- Despues de crear una cita, se refresca la agenda.
- No hay mocks nuevos en `/admin/citas`.
- No hay secretos en cliente ni en logs.

## Riesgos y supuestos

- Supuesto: `VELORA_ADMIN_DEV_TOKEN` seguira siendo mecanismo temporal de desarrollo para admin.
- Supuesto: los endpoints actuales del backend son el contrato base de v1.
- Riesgo: admin mantiene otras subrutas demo y puede confundirse con Citas real.
- Riesgo: README y baseline desfasados pueden inducir decisiones incorrectas.
- Riesgo: la UI actual crea cita simple; multi-servicio queda para feature posterior si no esta aprobado en esta rama.
- Riesgo: smoke manual requiere API local y token valido.

