# Dafory Launch Guard
## Deck de presentación v0.1

**Fecha:** Julio 2026  
**Versión:** v0.1 — Uso interno / fondos / aliados  
**Preparado por:** Dafory

---

---

## SLIDE 01 — PORTADA

# Dafory Launch Guard

**Auditoría pre-lanzamiento para SaaS y productos digitales.**

Evidencia. Score. Veredicto. Backlog.

> *"Antes de lanzar, valida si está realmente listo."*

---

**Dafory** · Julio 2026 · v0.1  
Uso confidencial — material de presentación

---

---

## SLIDE 02 — EL PROBLEMA

# Los SaaS se lanzan sin QA profesional.

Hoy, un equipo pequeño —o incluso una sola persona— puede construir una app completa en semanas usando inteligencia artificial. Eso es poderoso. Y también es arriesgado.

**El patrón se repite:**

- El producto se ve impresionante.
- El fundador lo presenta con confianza.
- Pero nadie verificó si realmente funciona en condiciones reales.
- Nadie documentó los riesgos.
- Nadie emitió un veredicto honesto.

**Las consecuencias:**

| Situación | Impacto |
|-----------|---------|
| Presentación a fondo con bugs no documentados | Pérdida de credibilidad |
| Primer cliente real encuentra fallo crítico | Daño a la relación comercial |
| Equipo lanza sin lista de riesgos | Deuda técnica invisible |
| Demo muestra más de lo que el producto puede | Promesas incumplibles |

**El problema no es que el producto esté incompleto. Es que nadie lo verificó antes de mostrarlo.**

---

---

## SLIDE 03 — POR QUÉ AHORA

# Más software con IA. Más riesgo de lanzar mal.

La barrera de entrada para construir software bajó drásticamente. Eso democratiza la creación —y multiplica los lanzamientos sin validación.

**El contexto actual:**

- Herramientas de IA generativa permiten construir productos complejos en días.
- Los no-programadores y equipos pequeños lanzan productos que compiten visualmente con startups consolidadas.
- Los fondos de etapa temprana reciben cada vez más decks de proyectos con demos impresionantes pero sin evidencia técnica.
- Los compradores B2B preguntan más sobre confiabilidad, seguridad y estabilidad.

**La brecha que se abre:**

```
Velocidad de construcción ──────────────► muy alta
Madurez del proceso de QA ──────────────► muy baja
```

**La oportunidad:**  
Existe un espacio entre "construí algo" y "estoy listo para lanzarlo" que hoy nadie cubre de forma sistemática, documentada y profesional para equipos pequeños.

Ese espacio es Dafory Launch Guard.

---

---

## SLIDE 04 — LA SOLUCIÓN

# Dafory Launch Guard

**Auditoría pre-lanzamiento que convierte una revisión técnica en una decisión clara de negocio.**

### Qué entregamos:

| Entregable | Descripción |
|------------|-------------|
| **Evidence Pack** | Capturas automatizadas de todas las rutas y flujos críticos |
| **Score de preparación** | Métricas verificables: capturas PASS / WARNING / FAIL |
| **Veredicto Launch Guard** | Veredicto diferenciado: demo visual vs. operación comercial real |
| **Backlog priorizado** | Lista de riesgos ordenados por impacto antes del go-live |
| **Reporte profesional** | Documento entregable para fundadores, inversores o equipos |

### Lo que nos diferencia:

- **No es testing barato.** Es auditoría con criterio comercial.
- **No opiniones.** Evidencia visual trazable en repositorio.
- **No veredicto único.** Separamos preparación para demo de readiness comercial real.
- **No solo errores.** También documentamos fortalezas y lo que ya está listo.

### El resultado que buscamos:

> El fundador sabe exactamente qué puede mostrar, qué no puede prometer, y qué debe corregir antes de lanzar.

---

---

## SLIDE 05 — CÓMO FUNCIONA

# El proceso Launch Guard en 5 etapas

```
INTAKE ──► REVISIÓN ──► EVIDENCIA ──► REPORTE ──► BACKLOG
```

### Etapa 1 — Intake

- Formulario de ingreso con datos del producto, rutas, flujos críticos y contexto de lanzamiento.
- Definición del alcance: ¿demo controlada?, ¿presentación a fondo?, ¿go-live comercial?

### Etapa 2 — Revisión técnica y visual

- Navegación completa del producto.
- Verificación de flujos funcionales (registro, reserva, pago, confirmación, admin).
- Detección de estados MISSING_CONFIG, errores visuales, inconsistencias UX.
- Análisis de rutas, viewports y comportamiento responsive.

### Etapa 3 — Evidence Pack

- Capturas automatizadas con Playwright en viewports desktop (1440×1000) y mobile (390×844).
- Registro de cada ruta: ID, URL, viewport, archivo, resultado, observación.
- Generación de `evidence-index.md` y `playwright-notes.md`.

### Etapa 4 — Reporte Launch Guard

- Score numérico de preparación.
- Veredicto diferenciado:
  - `APPROVED_WITH_WARNINGS` → apto para demo con condiciones.
  - `NEEDS_FIXES` → requiere correcciones antes de operar comercialmente.
  - `APPROVED` → listo para go-live.
- Hallazgos organizados en fortalezas y advertencias.

### Etapa 5 — Backlog priorizado

- Lista de correcciones ordenadas por impacto y urgencia.
- Diferenciación entre "bloqueante para go-live" y "mejora recomendada".
- Documento accionable, no un informe que se archiva.

---

---

## SLIDE 06 — CASO DEMO 001

# Velora Reservas — Primer caso real

**Producto:** Velora Reservas — plataforma de reservas online para barberías y estudios de belleza.  
**Stack:** Next.js 16, React 19, TypeScript, monorepo pnpm.  
**Estado al momento de la auditoría:** Producto visualmente premium, sin backend operativo real.

### Contexto de la auditoría

Velora Reservas fue usado como primer piloto interno para validar la metodología de Dafory Launch Guard. El objetivo: verificar si el proceso generaba evidencia útil, veredicto honesto y backlog accionable sobre un producto real en desarrollo.

### Alcance auditado

| Área | Estado |
|------|--------|
| Landing pública (`/`) | ✅ Revisada |
| Flujo de reserva completo (4 pasos) | ✅ Revisado |
| Confirmación de reserva | ✅ Revisada |
| Panel admin — Citas | ✅ Revisado |
| Panel admin — Clientes | ✅ Revisado |
| Panel admin — Servicios | ✅ Revisado |
| Panel admin — Profesionales | ✅ Revisado |
| Panel admin — Horarios | ✅ Revisado |
| Panel admin — Configuración | ✅ Revisado |
| Desktop 1440×1000 | ✅ Capturado |
| Mobile 390×844 | ✅ Capturado |

### Datos de ejecución

- Herramienta: Playwright v1.60.0 (Chromium headless)
- Duración total: 35.4 segundos
- Capturas generadas: 17 (12 desktop + 5 mobile)
- Branch de evidencia: `chore/launch-guard-velora-evidence-001`

---

---

## SLIDE 07 — EVIDENCE PACK

# 17/17 capturas PASS

El Evidence Pack es el entregable central de Dafory Launch Guard. No es un reporte de opinión. Es evidencia visual verificable y reproducible.

### Resultados del Evidence Pack — Velora Reservas Demo 001

| ID | Ruta | Viewport | Resultado |
|----|------|----------|-----------|
| 001 | `/` | Desktop 1440×1000 | ✅ PASS |
| 002 | `/` | Mobile 390×844 | ✅ PASS |
| 003 | `/reservar?negocio=barberia` | Desktop | ✅ PASS |
| 003 | `/reservar?negocio=barberia` | Mobile | ✅ PASS |
| 004 | Flujo reserva → Paso profesional | Desktop | ✅ PASS |
| 005 | Flujo reserva → Paso fecha/hora | Desktop | ✅ PASS |
| 006 | Flujo reserva → Paso datos cliente | Desktop | ✅ PASS |
| 007 | `/confirmacion` (flujo completo) | Desktop | ✅ PASS |
| 008 | `/admin/citas?negocio=barberia` | Desktop + Mobile | ✅ PASS |
| 009 | `/admin/clientes?negocio=barberia` | Desktop + Mobile | ✅ PASS |
| 010 | `/admin/servicios?negocio=barberia` | Desktop | ✅ PASS |
| 011 | `/admin/profesionales?negocio=barberia` | Desktop | ✅ PASS |
| 012 | `/admin/horarios?negocio=barberia` | Desktop | ✅ PASS |
| 013 | `/admin/configuracion?negocio=barberia` | Desktop + Mobile | ✅ PASS |

**Total: 17/17 PASS · 0 WARNING · 0 FAIL**

### Documentos generados

- `evidence-index.md` — tabla completa con ID, ruta, viewport, resultado y observación
- `playwright-notes.md` — resumen de ejecución, hallazgos y recomendaciones
- Capturas almacenadas en `docs/launch-guard-evidence/velora-reservas/screenshots/`

---

---

## SLIDE 08 — VEREDICTO

# Veredicto diferenciado — lo que otros no hacen

La distinción clave de Dafory Launch Guard es que **no emite un único veredicto**. Separa dos preguntas que suelen confundirse:

> **¿Está listo para mostrar?** y **¿Está listo para operar comercialmente?**

Son preguntas distintas. Y merecen respuestas distintas.

---

### ✅ APPROVED_WITH_WARNINGS
**Demo visual controlada**

Velora Reservas está listo para presentarse a clientes, fondos y stakeholders en formato de demo controlada. La experiencia visual es premium, el flujo de reserva funciona y la confirmación cierra el ciclo correctamente.

**Condiciones:**
- Presentar con guion claro.
- No afirmar que las reservas se almacenan en servidor.
- No mostrar el panel admin como si estuviera conectado a datos reales.

---

### ⚠️ NEEDS_FIXES
**Operación comercial real**

Velora Reservas **no está listo** para recibir clientes reales sin corregir primero:

- Configuración de API y credenciales reales.
- Persistencia de reservas en base de datos.
- Autenticación real en panel admin.
- Agenda en tiempo real verificable.
- Datos demo reemplazados por datos reales del negocio.

---

### Por qué este veredicto tiene valor

| Sin Launch Guard | Con Launch Guard |
|-----------------|------------------|
| El fundador no sabe qué puede mostrar | Sabe exactamente qué puede mostrar y con qué condiciones |
| El inversor recibe una demo sin contexto | Recibe evidencia trazable y veredicto profesional |
| El primer cliente descubre los límites solo | Los límites están documentados antes del primer contacto |
| La deuda técnica es invisible | El backlog la hace visible y priorizable |

---

---

## SLIDE 09 — MODELO DE NEGOCIO

# Servicio asistido primero. Plataforma después.

### Fase actual — Servicio profesional asistido

Dafory Launch Guard opera como servicio de revisión manual + automatización para cada cliente.

**Estructura de precios referencial (en validación):**

| Tier | Alcance | Precio referencial |
|------|---------|-------------------|
| **Guard Básico** | Landing + flujo principal + reporte | CLP $180.000 – $250.000 |
| **Guard Completo** | App completa + admin + Evidence Pack + backlog | CLP $350.000 – $550.000 |
| **Guard Pro** | Revisión + retest post-correcciones + certificado | CLP $700.000 – $1.200.000 |

> Los precios son referenciales y están en proceso de validación con prospectos.

### Fase siguiente — Producto SaaS

Una vez validado el modelo de servicio:

- Plataforma de autoservicio para revisión guiada.
- Integración con repositorios (GitHub / GitLab).
- Dashboard de scores y verdicts por proyecto.
- Revisiones recurrentes por suscripción.

### Modelo de ingresos a largo plazo

```
Servicio asistido (ahora)  ──►  SaaS con revisión asistida  ──►  SaaS puro
      Margen alto                     Escalabilidad media               Escala total
```

---

---

## SLIDE 10 — FONDOS OBJETIVO

# Postulaciones en evaluación

Dafory Launch Guard está evaluando postulación a los siguientes instrumentos de financiamiento para la fase de validación comercial y desarrollo de producto:

### Sercotec — Capital Semilla Emprende

- **Foco:** Emprendimientos en etapa temprana con validación inicial.
- **Por qué aplica:** Launch Guard tiene un primer caso demo documentado y una metodología reproducible.
- **Uso estimado:** Validación comercial, herramientas, operación inicial.

### Start-Up Chile — Build Stage

- **Foco:** Startups tech con potencial de escala.
- **Por qué aplica:** Modelo SaaS escalable con fase de servicio validada.
- **Uso estimado:** Desarrollo de plataforma, marketing, internacionalización inicial.

### CORFO Semilla Inicia

- **Foco:** Startups con prototipo funcional y primeros usuarios/clientes.
- **Por qué aplica:** Evidence Pack y caso demo sirven como prototipo documentado.
- **Uso estimado:** Equipo, producto, primeros clientes pagados.

### Estado actual de postulaciones

> Ninguna postulación ha sido enviada a la fecha de este documento. Esta sección refleja los instrumentos en evaluación para la hoja de ruta de financiamiento.

---

---

## SLIDE 11 — ROADMAP

# De validación a plataforma — 0 a 9 meses

```
MES 0-2          MES 3-4          MES 5-6          MES 7-9
Validación  ──►  Primeros      ──►  Producto     ──►  Escala
Comercial        Clientes           SaaS v1            Inicial
```

### Mes 0–2 — Validación comercial

- [ ] Presentar el caso Velora a 10–15 prospectos calificados.
- [ ] Realizar 3–5 auditorías reales (pagadas o a precio validación).
- [ ] Afinar precio, alcance y proceso de entrega.
- [ ] Documentar feedback y ajustar metodología.
- [ ] Postular a instrumento de fondo seleccionado.

### Mes 3–4 — Primeros clientes reales

- [ ] Cerrar primeros 5 clientes pagados.
- [ ] Sistematizar el proceso de revisión (playbook).
- [ ] Desarrollar plantillas de Evidence Pack y reporte.
- [ ] Incorporar primer colaborador o partner de revisión.
- [ ] Lanzar lista de espera para versión SaaS.

### Mes 5–6 — Producto SaaS v1

- [ ] MVP de plataforma con intake, dashboard y entrega de reporte.
- [ ] Integración con GitHub para revisión automatizada de PRs.
- [ ] Sistema de scoring y veredictos automatizados parcialmente.
- [ ] Beta cerrada con clientes actuales.

### Mes 7–9 — Escala inicial

- [ ] Lanzamiento público de la plataforma SaaS.
- [ ] Modelo freemium + planes pagados.
- [ ] Expansion a agencias y equipos de desarrollo.
- [ ] Primeros ingresos recurrentes (MRR).

---

---

## SLIDE 12 — USO DE FONDOS

# Asignación de recursos — primer fondo

*Proyección referencial para fondo de CLP $15.000.000 – $25.000.000*

| Categoría | % | Descripción |
|-----------|---|-------------|
| **Desarrollo de producto** | 35% | Plataforma SaaS v1, automatización de Evidence Pack, dashboard |
| **Validación comercial** | 25% | Auditorías piloto, feedback de prospectos, ajuste de precio |
| **Marketing y presencia** | 20% | Landing de Dafory, contenido, redes, casos de éxito |
| **Operación** | 12% | Infraestructura, herramientas, software |
| **Diseño y UX** | 8% | Materiales de presentación, plantillas de reporte, identidad |

### Uso de fondos por fase

**Fase 1 (primeros 3 meses):**  
Prioridad en validación comercial y marketing. El producto se entrega como servicio asistido, sin inversión técnica en plataforma.

**Fase 2 (meses 4–6):**  
Mayor inversión en desarrollo de plataforma SaaS. Marketing se sostiene con casos documentados.

**Fase 3 (meses 7–9):**  
Escala de operación. Incorporación de equipo. Foco en MRR.

> Esta distribución es orientativa y se ajustará según el fondo específico y las condiciones de desembolso.

---

---

## SLIDE 13 — GO-TO-MARKET

# Quién necesita Launch Guard y cómo los alcanzamos

### Segmentos objetivo

**Segmento 1 — Fundadores de SaaS en etapa temprana**
- Construyeron con IA o con equipo pequeño.
- Están a punto de presentar a un fondo, mostrar a un primer cliente o lanzar públicamente.
- No tienen proceso formal de QA.
- **Dolor:** miedo a que algo falle en la demo o el lanzamiento.

**Segmento 2 — Agencias de desarrollo digital**
- Entregan productos a clientes finales.
- Necesitan evidencia de calidad para respaldar sus entregas.
- Launch Guard como garantía de entrega profesional.
- **Dolor:** cliente que detecta errores después de la entrega.

**Segmento 3 — Freelancers premium**
- Construyen productos completos para un solo cliente.
- Quieren diferenciarse con un proceso más profesional.
- **Dolor:** entregar sin documentación formal de lo que está y no está listo.

**Segmento 4 — Equipos con productos asistidos por IA**
- Plataformas construidas con Cursor, Bolt, v0, Lovable u otras herramientas.
- Alta velocidad de construcción, baja verificación de calidad.
- **Dolor:** no saber qué tan confiable es lo que construyeron.

### Canales de adquisición

| Canal | Estrategia |
|-------|-----------|
| **LinkedIn** | Contenido sobre lanzamientos fallidos, casos documentados, veredictos |
| **Comunidades de fundadores** | Slack, Discord, grupos locales de startups tech Chile |
| **Referidos de agencias** | Partnership con agencias que quieran ofrecer Launch Guard a sus clientes |
| **Contenido técnico** | Artículos sobre Playwright, QA automatizado y procesos pre-lanzamiento |
| **Cold outreach calificado** | Fundadores que lanzan productos visualmente listos pero técnicamente incompletos |

### Mensaje de posicionamiento

> "Dafory Launch Guard no es un servicio de testing. Es una auditoría de preparación de lanzamiento que convierte una revisión técnica en una decisión clara de negocio."

---

---

## SLIDE 14 — CIERRE

# Antes de lanzar, valida si está realmente listo.

Dafory Launch Guard existe porque los productos digitales de hoy se construyen más rápido que nunca —y se validan menos que nunca antes de salir al mundo.

**Lo que ofrecemos no es testing.** Es claridad.

- Claridad sobre qué está realmente listo.
- Claridad sobre qué puede fallar.
- Claridad sobre qué hay que corregir primero.
- Claridad para el fundador, el inversor y el primer cliente.

---

### Ya tenemos evidencia real.

El Caso Demo 001 — Velora Reservas demostró que la metodología funciona:

- **17/17 capturas PASS.**
- **Evidence Pack generado y trazable.**
- **Veredicto honesto emitido** — sin inflar ni ocultar el estado real del producto.
- **Backlog entregado** — con acciones concretas hacia el go-live.

---

### El próximo paso es tuyo.

Si tienes un SaaS, app o producto digital que estás a punto de presentar, lanzar o entregar —y quieres saber si realmente está listo— **hablemos.**

---

**Dafory Launch Guard**  
Auditoría pre-lanzamiento para productos digitales

*Julio 2026 · v0.1*

---

---

*Documento confidencial. Material de presentación interna / fondos / aliados.*  
*No reproducir sin autorización.*  
*Demo visual, no operación comercial real — Caso Velora Reservas Demo 001.*
