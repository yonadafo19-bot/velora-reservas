# 001-agenda-real - QA Gates

## Gate documental

- `spec.md`, `plan.md`, `tasks.md`, `qa-gates.md`, prompt, release note y smoke existen.
- La documentacion describe estado actual antes de proponer cambios.
- README/baseline desfasados quedan identificados como deuda si no se actualizan en esta feature.

## Gate tecnico

Para cambios web:

```powershell
pnpm --filter @velora/web lint
pnpm --filter @velora/web typecheck
pnpm --filter @velora/web build
git diff --check
git status --short
```

Para cambios fullstack:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
git status --short
```

## Gate visual

- `/admin/citas?negocio=barberia` mantiene UI premium y escaneable.
- Loading, vacio, error y missing-config se ven como estados controlados.
- No hay overlay rojo por errores esperados.
- Textos visibles estan en espanol Chile.
- Montos visibles usan CLP.

## Gate mobile

- Revisar `/admin/citas?negocio=barberia` en viewport movil.
- La tabla/lista no debe cortar texto critico.
- El boton `Nueva cita` debe ser visible y usable si el formulario esta listo.
- Estados de error y vacio deben leerse sin solapamientos.

## Gate seguridad/tokens

- `VELORA_ADMIN_DEV_TOKEN` solo aparece en codigo server-side.
- No hay `NEXT_PUBLIC_*` para secretos.
- No se imprimen tokens, headers sensibles ni payloads privados.
- 401/403 se manejan como estados UI limpios.
- La respuesta de calendario no expone campos sensibles.

## Gate timezone America/Santiago

- Rango de calendario inicia en dia actual del negocio segun `America/Santiago`.
- Fechas pasadas se evalua con `America/Santiago`.
- Horas visibles usan `America/Santiago`.
- Smoke manual valida al menos un dia actual y un dia futuro.

## Gate datos reales vs demo

- `/admin/citas` no vuelve a mocks para agenda real.
- Si formulario falla, agenda real sigue renderizando si calendario cargo.
- Si calendario falla, no se muestra agenda demo como fallback.
- Otras vistas admin demo quedan fuera de alcance o marcadas como demo en otra tarea.

## Gate release

- Release note completada.
- Smoke manual registrado.
- Riesgos residuales documentados.
- Rollback definido.
- `git status --short` limpio o decision explicita documentada.

