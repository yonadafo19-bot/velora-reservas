# 001-agenda-real - Tasks

## Documentacion

1. Crear spec de la feature.
   - Tipo: documentacion.
   - Criterio de aceptacion: `spec.md` describe problema, estado actual, alcance, no-alcance, reglas y riesgos.

2. Crear plan tecnico.
   - Tipo: documentacion.
   - Criterio de aceptacion: `plan.md` documenta contratos API/frontend, gaps, fases, decisiones, riesgos y rollback.

3. Crear tasks ordenadas.
   - Tipo: documentacion.
   - Criterio de aceptacion: `tasks.md` separa documentacion, implementacion futura, QA y release.

4. Crear QA gates.
   - Tipo: documentacion.
   - Criterio de aceptacion: `qa-gates.md` cubre documental, tecnico, visual, mobile, seguridad, timezone, datos reales/demo y release.

5. Crear prompt de implementacion futura para Codex.
   - Tipo: documentacion.
   - Criterio de aceptacion: `ops/prompts/001-agenda-real-codex.md` parte con MODO PLAN y contiene alcance, prohibiciones, validaciones y entrega.

6. Crear release note inicial.
   - Tipo: documentacion.
   - Criterio de aceptacion: `ops/release-notes/001-agenda-real.md` registra cambio esperado, impactos, QA, riesgos y rollback.

7. Crear smoke manual.
   - Tipo: documentacion.
   - Criterio de aceptacion: `qa/001-agenda-real-smoke.md` define escenarios manuales para token valido, sin token, token vencido, agenda vacia, error API, creacion simple, mobile y overlays.

## Implementacion futura

8. Auditar `/admin/citas` antes de tocar codigo.
   - Tipo: implementacion futura.
   - Criterio de aceptacion: diff inicial revisado, rama limpia y archivos permitidos definidos.

9. Verificar separacion de estados agenda/formulario.
   - Tipo: implementacion futura.
   - Criterio de aceptacion: falla de formulario no oculta agenda; falla de calendario no se confunde con falla de formulario.

10. Verificar manejo 401 sin overlay.
    - Tipo: implementacion futura.
    - Criterio de aceptacion: fallos 401 usan `console.warn` o diagnostico controlado y UI limpia.

11. Verificar creacion simple de cita.
    - Tipo: implementacion futura.
    - Criterio de aceptacion: submit envia `serviceIds: [serviceId]`, recibe resultado serializable y refresca agenda.

12. Revisar copia visible de Citas.
    - Tipo: implementacion futura.
    - Criterio de aceptacion: todo texto visible esta en espanol Chile y no promete funciones fuera de alcance.

13. Confirmar no regreso a mocks.
    - Tipo: implementacion futura.
    - Criterio de aceptacion: `/admin/citas` sigue consumiendo API real o muestra estado limpio; no usa `data/demo` para agenda real.

## QA

14. Ejecutar gate web.
    - Tipo: QA.
    - Criterio de aceptacion: lint, typecheck y build web pasan.

15. Ejecutar gate full si cambia contrato o backend.
    - Tipo: QA.
    - Criterio de aceptacion: test/typecheck/build workspace pasan o se documenta bloqueo.

16. Ejecutar smoke manual.
    - Tipo: QA.
    - Criterio de aceptacion: escenarios de `qa/001-agenda-real-smoke.md` quedan marcados PASS/FAIL.

17. Revisar seguridad.
    - Tipo: QA.
    - Criterio de aceptacion: no hay `NEXT_PUBLIC` para token, no se imprime token, no se exponen headers sensibles.

## Release

18. Completar release note.
    - Tipo: release.
    - Criterio de aceptacion: nota incluye commit, QA ejecutado, riesgos residuales y rollback.

19. Dejar Git limpio o decision explicita.
    - Tipo: release.
    - Criterio de aceptacion: `git status --short` limpio o cambios pendientes documentados.

