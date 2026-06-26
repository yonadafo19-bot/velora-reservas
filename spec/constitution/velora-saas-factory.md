# Constitucion - Dafo + SaaS Factory OS en Velora Reservas

## Proposito

Dafo + SaaS Factory OS es el sistema de trabajo para construir Velora Reservas con calidad de producto SaaS. Su funcion es convertir ideas, fixes y features en entregables controlados: especificados, planificados, implementados, validados y preparados para release.

Velora Reservas es el piloto real. Ninguna feature importante debe cerrarse "asi nomas": debe pasar por spec, plan, tasks, implementacion, QA y release.

## Principios de producto SaaS

- Cada feature debe resolver un problema claro del negocio o del usuario.
- El alcance debe ser pequeno, verificable y entregable.
- El producto debe diferenciar claramente datos reales, datos demo y estados no conectados.
- La experiencia debe ser confiable antes que amplia.
- Las decisiones comerciales visibles deben usar espanol Chile, CLP y contexto local.

## Principios tecnicos

- Preferir cambios acotados sobre refactors globales.
- Mantener contratos API claros y documentados antes de integrar UI.
- No duplicar reglas criticas de agenda sin justificarlo.
- Preservar `America/Santiago` para agenda, fechas y horarios.
- Mantener secretos server-side; nunca exponer tokens en cliente.
- No usar mocks en superficies marcadas como reales.
- No mezclar fixes, features y documentacion de proceso en una misma rama.

## Principios UX/UI premium

- La interfaz debe ser clara, sobria, escaneable y responsive.
- La agenda debe comunicar rangos, duracion, estados y errores sin ambiguedad.
- Los mensajes de error deben explicar que paso y que puede hacer el usuario.
- No usar copy que degrade la experiencia premium, prometa espera o sugiera improvisacion.
- Si una vista sigue siendo demo, debe estar marcada como demo.

## Principios QA

- Toda feature real requiere QA tecnico y smoke manual.
- Los gates deben ejecutarse y registrarse antes de release.
- QA debe cubrir estados felices, vacios, errores, carga y permisos/configuracion.
- Para agenda, QA debe cubrir fechas, zona horaria, datos reales, disponibilidad y estados de cita.
- Si una validacion no se ejecuta, debe quedar registrada como riesgo.

## Principios de seguridad

- No imprimir tokens, cookies, headers sensibles ni secretos.
- `VELORA_ADMIN_DEV_TOKEN` es server-side.
- No usar `NEXT_PUBLIC_*` para secretos.
- Los fallos 401/403 esperados deben mostrarse como estados UI limpios.
- Mantener aislamiento tenant-safe en backend y no inferir permisos desde query params de UI.

## Criterios de entrada y salida por fase

### Spec

Entrada: problema claro o necesidad priorizada.

Salida:
- objetivo;
- usuarios afectados;
- alcance y no-alcance;
- criterios de aceptacion;
- riesgos conocidos;
- archivos o areas probables.

### Plan

Entrada: spec aceptada.

Salida:
- enfoque tecnico;
- archivos a tocar;
- contratos o tipos relevantes;
- estrategia de errores;
- plan QA;
- riesgos residuales.

### Tasks

Entrada: plan aceptado.

Salida:
- tareas pequenas;
- orden sugerido;
- validacion por tarea;
- criterios para detenerse.

### Implementacion

Entrada: tasks aprobadas y arbol Git controlado.

Salida:
- patch dentro del alcance;
- sin secretos;
- sin cambios fuera de fase;
- validaciones ejecutadas.

### QA

Entrada: implementacion lista.

Salida:
- resultado de comandos;
- smoke manual documentado;
- bugs o riesgos residuales;
- decision de release o bloqueo.

### Release

Entrada: QA aprobado.

Salida:
- nota de release interna;
- impacto usuario;
- impacto tecnico;
- rollback;
- estado final de Git.

## Definition of Done

Una feature esta lista solo si:

- cumple la spec aceptada;
- no introduce cambios fuera de alcance;
- pasa los gates definidos;
- tiene smoke manual documentado cuando hay UI;
- mantiene espanol Chile, CLP y `America/Santiago` cuando aplica;
- no expone secretos;
- tiene release note interna;
- deja `git status --short` limpio o con decision explicita documentada.

## Politica de ramas

- `fix/*`: correcciones acotadas.
- `feat/*`: features funcionales.
- `chore/*`: documentacion, proceso, tooling no funcional.
- `docs/*`: documentacion pura.

No mezclar en una rama:

- fix urgente con feature nueva;
- documentacion de proceso con implementacion funcional;
- cambios backend con UI si el alcance no lo pide.

## Politica de prompts

Todo prompt operativo debe dejar claro:

- modo de trabajo;
- objetivo;
- alcance permitido;
- archivos probables;
- archivos prohibidos;
- criterios de aceptacion;
- validaciones;
- entregables esperados.

Los prompts deben guardarse en `ops/prompts` cuando sean reutilizables o parte de una feature.

## Uso de IA

### Codex

Usar para:
- implementacion;
- refactors acotados;
- integracion frontend/backend;
- fixes con validacion;
- auditorias con evidencia del repo.

### Gemini

Usar para:
- revision amplia de producto;
- segunda opinion de UX/copy;
- analisis comparativo;
- sintesis de riesgos o documentacion larga.

### IA barata

Usar para:
- borradores iniciales;
- listas de chequeo;
- reformulacion de textos no criticos;
- tareas de baja sensibilidad sin acceso a secretos.

No usar IA barata para decisiones de seguridad, auth, tenant isolation, contratos API, Prisma o releases.

## Documentacion viva

La documentacion debe actualizarse cuando cambie la realidad del producto. Si el codigo ya no coincide con README, specs, QA o release notes, la documentacion debe corregirse como parte de la misma fase o registrarse como deuda explicita.

