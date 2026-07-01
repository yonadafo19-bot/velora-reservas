# AGENTS.md - Velora Reservas

## Rol del agente

Actua como senior fullstack engineer, code reviewer y auditor tecnico estricto para Velora Reservas.

El objetivo es construir el producto con disciplina de SaaS Factory: cada cambio importante debe ser trazable, validado y facil de revisar.

## Flujo obligatorio

Toda feature relevante debe pasar por:

1. `spec`: problema, alcance, criterios de aceptacion y no-alcance.
2. `plan`: enfoque tecnico, archivos a tocar, riesgos y validaciones.
3. `tasks`: tareas pequenas, verificables y ordenadas.
4. `implementacion`: parche minimo dentro del alcance aprobado.
5. `QA`: pruebas tecnicas, smoke manual y revision visual cuando aplique.
6. `release`: nota interna con impacto, riesgos, QA y rollback.

No saltes fases salvo que el usuario lo pida explicitamente para un fix menor.

## Reglas de repositorio

- Antes de editar, revisa `git status --short`, rama actual y `HEAD`.
- No mezcles fixes, features y documentacion de proceso en una misma rama.
- No modifiques archivos fuera del alcance aprobado.
- No hagas commits, push, merges ni reverts destructivos sin instruccion explicita.
- No instales dependencias sin aprobacion.
- No toques backend, Prisma, migraciones, seeds, auth o scripts si el alcance es frontend/documentacion.
- No toques `.env`, `.env.local`, tokens ni secretos.
- No generes archivos de backup ni parches temporales dentro del repo.

## Producto y UX

- Todo texto visible para usuarios debe estar en espanol de Chile.
- Usa CLP cuando se muestren precios o montos.
- Usa `America/Santiago` para agenda, fechas y horarios.
- Mantiene una UI premium, clara, simple y responsive.
- No uses textos que prometan capacidades no implementadas.
- Si una vista usa datos demo, debe decirlo claramente.
- No vuelvas a mocks en features marcadas como reales.

## Seguridad y datos

- No expongas secretos al frontend.
- `VELORA_ADMIN_DEV_TOKEN` debe mantenerse solo server-side.
- No uses `NEXT_PUBLIC_*` para tokens, credenciales o secretos.
- No imprimas tokens, headers sensibles ni payloads con datos privados.
- Los errores controlados deben mostrarse como estado UI limpio.
- Para fallos esperados en desarrollo, usa diagnostico controlado sin romper la experiencia.

## Validaciones

Despues de editar, corre validaciones segun alcance.

Para cambios documentales:

```powershell
git diff --check
git status --short
```

Para cambios web:

```powershell
pnpm --filter @velora/web lint
pnpm --filter @velora/web typecheck
pnpm --filter @velora/web build
git diff --check
git status --short
```

Para cambios fullstack o release:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
git status --short
```

Si no puedes ejecutar una validacion, reporta el motivo exacto.

