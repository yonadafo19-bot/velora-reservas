# Gate 0: baseline visual, técnico y de rutas

Fecha del baseline: 20 de junio de 2026  
Rama: `feat/velora-mvp-concierge-foundation`  
Commit de referencia: `a078e5f3a26f617e667fd100e57e0b50d34ee3d7`

## Propósito

Este documento registra el estado de Velora Reservas inmediatamente anterior al reset arquitectónico controlado. Su objetivo es conservar una referencia verificable de la experiencia visual, las rutas y las capacidades técnicas actuales antes de convertir el proyecto en un monorepo SaaS.

Este baseline no declara que las funciones demostrativas estén listas para producción. Describe el comportamiento existente que debe preservarse durante el movimiento inicial de la aplicación.

## Stack actual

- Next.js `16.2.9` con App Router.
- React y React DOM `19.2.4`.
- TypeScript en modo estricto.
- Tailwind CSS 4 mediante `@tailwindcss/postcss`.
- Estilos visuales concentrados principalmente en `src/app/globals.css`.
- ESLint 9 con `eslint-config-next` `16.2.9`.
- Aplicación única administrada desde el `package.json` raíz.

Todavía no existen:

- aplicación NestJS;
- API real;
- Prisma;
- PostgreSQL;
- autenticación real;
- persistencia de reservas en servidor;
- aislamiento multi-tenant real.

Los negocios, servicios, profesionales, clientes, horarios, citas y métricas visibles provienen de datos demo centralizados en `src/data/demo/index.ts`. El flujo de reserva almacena su simulación en `sessionStorage` del navegador.

## Baseline visual y funcional

### Landing `/`

Landing comercial premium de Velora Reservas. Presenta la propuesta de valor, beneficios, las dos experiencias comerciales, el proceso de reserva, llamados a contacto y acceso al panel demo. Incluye navegación responsive y CTA de WhatsApp en modo demostrativo.

### Barberías `/barberia`

Demo comercial diferenciada para Barberías. Presenta identidad visual propia, catálogo demo en CLP, duración por servicio, profesionales ficticios y accesos al flujo `/reservar?negocio=barberia`.

### Beauty Studios `/belleza`

Demo comercial diferenciada para el vertical de belleza. Presenta identidad visual propia, catálogo demo en CLP, profesionales ficticios y accesos al flujo `/reservar?negocio=belleza`.

### Reserva `/reservar`

Ruta dinámica por uso de `searchParams`.

- Sin vertical válida muestra un selector entre las dos experiencias demo.
- Con `negocio=barberia` o `negocio=belleza` carga el flujo correspondiente.
- Permite seleccionar un servicio, un profesional compatible, fecha, hora y datos del cliente.
- Los horarios son demostrativos y están definidos localmente.
- No consulta disponibilidad real ni bloquea agenda.
- No envía información a un backend.
- La confirmación demo se guarda en `sessionStorage`.

### Confirmación `/confirmacion`

Ruta estática que renderiza un componente cliente. Lee la reserva demo desde `sessionStorage`, muestra su resumen y declara explícitamente que no se realizó una reserva, bloqueo horario ni cobro real. Si no existe información guardada, muestra un estado vacío con retorno al flujo.

### Precios `/precios`

Página estática con planes y valores referenciales en CLP. Los planes son contenido comercial demostrativo y no están conectados a contratación o pagos.

### Contacto `/contacto`

Página estática con propuesta de contacto, CTA de WhatsApp y formulario visual. El formulario no almacena ni envía datos.

### Administración `/admin` y subrutas

El panel administrativo es una demostración de solo lectura alimentada por mocks. La vertical se selecciona mediante `?negocio=barberia|belleza`; esto no constituye aislamiento multi-tenant.

- `/admin`: resumen, métricas, próximas citas, servicios destacados y clientes recientes.
- `/admin/citas`: tabla demo de citas y estados.
- `/admin/clientes`: listado demo de clientes.
- `/admin/configuracion`: configuración visible de solo lectura.
- `/admin/horarios`: jornadas demo por profesional.
- `/admin/profesionales`: catálogo demo de profesionales.
- `/admin/servicios`: catálogo demo con duración y precios CLP.

Las rutas administrativas son dinámicas por el uso de `searchParams`. No existen autenticación, permisos, edición persistente ni consultas a una API.

## Rutas reportadas por el build

El build de producción previo completó correctamente y mostró `Generating static pages (17/17)`. El manifiesto visible reportó las siguientes rutas:

| Ruta | Clasificación del build | Estado actual |
| --- | --- | --- |
| `/` | Estática | Landing comercial |
| `/_not-found` | Estática | Página de ruta no encontrada |
| `/admin` | Dinámica | Resumen administrativo demo |
| `/admin/citas` | Dinámica | Citas demo |
| `/admin/clientes` | Dinámica | Clientes demo |
| `/admin/configuracion` | Dinámica | Configuración demo |
| `/admin/horarios` | Dinámica | Horarios demo |
| `/admin/profesionales` | Dinámica | Profesionales demo |
| `/admin/servicios` | Dinámica | Servicios demo |
| `/barberia` | Estática | Demo Barberías |
| `/belleza` | Estática | Demo Beauty Studios |
| `/confirmacion` | Estática | Confirmación desde almacenamiento del navegador |
| `/contacto` | Estática | Contacto demostrativo |
| `/precios` | Estática | Planes referenciales |
| `/reservar` | Dinámica | Flujo de reserva demo según query params |

Leyenda del build de Next.js:

- Estática: prerenderizada como contenido estático.
- Dinámica: renderizada en servidor bajo demanda.

## Invariantes para el reset arquitectónico

El primer movimiento hacia el monorepo debe preservar:

- las rutas públicas y administrativas listadas;
- la landing y las dos identidades visuales;
- los estilos responsive actuales;
- el copy visible en español Chile;
- CLP en precios visibles;
- la navegación, retornos y estados demo existentes;
- fuentes, iconos y assets;
- las advertencias explícitas de datos ficticios y acciones no reales.

La sustitución de mocks, `sessionStorage` y selección de vertical por query params corresponde a fases posteriores. No forma parte del commit documental de Gate 0.

## Validación del baseline

Comandos requeridos para cerrar este documento:

```powershell
corepack pnpm lint
corepack pnpm build
git diff --check
git status --short
```

El resultado de estos comandos debe registrarse en el cierre de la tarea; no se almacenan artefactos generados dentro de Git.
