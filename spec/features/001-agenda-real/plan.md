# 001-agenda-real - Plan

## Estrategia tecnica

La feature debe consolidar `/admin/citas` como superficie real sin ampliar alcance a otras rutas. La implementacion futura debe apoyarse en los helpers server-side existentes y mantener separada la carga de calendario y formulario.

No se debe tocar backend, Prisma ni seeds salvo que una verificacion futura demuestre un contrato faltante. Con la evidencia actual, el backend ya expone los endpoints necesarios para v1.

## Contratos API existentes

Base desde `apps/api/src/businesses/businesses.controller.ts`:

- `GET /businesses/:businessSlug/dashboard/calendar`
- `GET /businesses/:businessSlug/services`
- `GET /businesses/:businessSlug/customers`
- `GET /businesses/:businessSlug/professionals`
- `GET /businesses/:businessSlug/professionals/:professionalId/availability`
- `POST /businesses/:businessSlug/appointments`

Evidencia de tests:

- Calendario devuelve `range`, `summary` y `appointments`.
- Appointment seguro incluye cliente, ubicacion, servicios, profesionales y segmentos.
- Creacion acepta `serviceIds`, calcula duracion/precio y crea segmentos si viene `professionalId`.
- Backend filtra por `businessId` desde `TenantContext` y evita exponer campos sensibles.

## Contratos frontend existentes

- `AdminCalendarLoadState` modela `ready`, `missing-config` y `error`.
- `AdminAppointmentFormLoadState` modela `ready`, `missing-config` y `error`.
- `admin-calendar-api.ts` arma rango por defecto de 7 dias desde inicio del dia en `America/Santiago`.
- `admin-appointments-api.ts` carga datos reales del formulario y crea cita simple enviando `serviceIds: [serviceId]`.
- `/admin/citas/page.tsx` carga calendario y formulario en paralelo y los entrega a `AdminPage`.

## Gaps conocidos

- README y baseline documental dicen que no existe API real; deben actualizarse en una tarea documental aparte.
- `/admin/horarios` y otras subrutas siguen demo.
- El flujo publico `/reservar` sigue demo y no debe entrar en esta feature.
- No existe auth productiva admin en esta spec; se mantiene token server-side de desarrollo.
- El formulario actual es simple y de un servicio; multi-servicio queda fuera si no se aprueba como feature posterior.

## Plan por fases

### Fase 1 - Baseline documental

- Confirmar estado real del repo, contratos y gaps.
- Registrar esta SDD y QA gates.
- No modificar codigo funcional.

### Fase 2 - Implementacion futura minima

- Revisar que `/admin/citas` no mezcle errores de agenda con errores de formulario.
- Mantener token server-side.
- Asegurar mensajes 401 limpios.
- Confirmar que el boton `Nueva cita` dependa de datos reales suficientes.
- Verificar que la creacion simple refresque agenda.

### Fase 3 - Claridad real/demo

- Revisar copy visible en Citas.
- Marcar cualquier dato demo visible cerca de Citas si puede confundirse con agenda real.
- No migrar otras subrutas admin salvo nueva spec.

### Fase 4 - QA y release

- Ejecutar gates tecnicos.
- Ejecutar smoke manual con token valido, sin token y token vencido.
- Registrar release note y riesgos residuales.

## Decisiones tecnicas

- Mantener `VELORA_ADMIN_DEV_TOKEN` en server-side helpers.
- Mantener `businessSlugByVertical` como puente temporal entre UI demo y tenants demo.
- Mantener `America/Santiago` como timezone operacional de agenda.
- Mantener `POST /appointments` con `serviceIds` aunque la UI v1 seleccione un servicio.
- No crear abstracciones nuevas hasta detectar duplicacion real.

## Riesgos tecnicos

- Fetch server-side puede fallar por token/configuracion y debe degradar a UI limpia.
- Cambios futuros de backend pueden romper normalizadores frontend si no hay tests de contrato web.
- El build puede pasar aunque smoke manual falle por entorno local sin API/token.
- El uso de vertical por query param no equivale a tenant isolation real.

## Rollback

- Si la implementacion futura rompe `/admin/citas`, revertir el commit de la feature y mantener el commit `fix(web): handle admin appointment 401 states without dev overlay`.
- Si solo falla la creacion de cita, deshabilitar temporalmente el boton `Nueva cita` con mensaje de datos no disponibles.
- Si falla carga de formulario, mantener agenda renderizable.
- Si falla calendario, mostrar estado de agenda no cargada sin volver a datos mock.

