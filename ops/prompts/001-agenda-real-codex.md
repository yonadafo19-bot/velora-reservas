MODO PLAN

# Prompt Codex - 001-agenda-real

Repo:
`C:\Users\EQUIPO\Desktop\Velora Reservas\velora-reservas`

Objetivo:
Preparar la implementacion controlada de `001-agenda-real` para consolidar `/admin/citas` como agenda real del panel admin, sin tocar el flujo publico `/reservar`.

Antes de proponer cambios:

1. Revisa `git status --short`, rama y `HEAD`.
2. Lee:
   - `AGENTS.md`
   - `spec/constitution/velora-saas-factory.md`
   - `spec/features/001-agenda-real/spec.md`
   - `spec/features/001-agenda-real/plan.md`
   - `spec/features/001-agenda-real/tasks.md`
   - `spec/features/001-agenda-real/qa-gates.md`
   - `apps/web/src/app/admin/citas/page.tsx`
   - `apps/web/src/components/admin/admin-page.tsx`
   - `apps/web/src/components/admin/admin-new-appointment-panel.tsx`
   - `apps/web/src/lib/admin-calendar-api.ts`
   - `apps/web/src/lib/admin-appointments-api.ts`
   - `apps/web/src/types/admin-calendar.ts`
   - `apps/web/src/types/admin-appointment-form.ts`
3. Revisa contratos backend solo en lectura:
   - `apps/api/src/businesses/businesses.controller.ts`
   - `apps/api/test/business-calendar-dashboard.test.cjs`
   - `apps/api/test/business-appointment-create.test.cjs`

Alcance permitido para implementacion futura:

- `apps/web/src/app/admin/citas/page.tsx`
- `apps/web/src/components/admin/admin-page.tsx`
- `apps/web/src/components/admin/admin-new-appointment-panel.tsx`
- `apps/web/src/lib/admin-calendar-api.ts`
- `apps/web/src/lib/admin-appointments-api.ts`
- `apps/web/src/types/admin-calendar.ts`
- `apps/web/src/types/admin-appointment-form.ts`
- Documentos de `spec/features/001-agenda-real`, `qa` y `ops/release-notes` si hay que registrar QA/release.

Archivos prohibidos:

- `apps/api/**`, salvo lectura.
- `packages/**`
- Prisma, migraciones y seeds.
- `.env`, `.env.local`, tokens y secretos.
- `package.json`
- `pnpm-lock.yaml`
- Flujo publico `/reservar`.

Reglas:

- No crear auth real nueva.
- No usar `NEXT_PUBLIC_*` para tokens sensibles.
- Mantener `VELORA_ADMIN_DEV_TOKEN` server-side.
- No volver a mocks en `/admin/citas`.
- Todo texto visible debe estar en espanol Chile.
- Usar CLP cuando aplique.
- Usar `America/Santiago` para agenda, fechas y horarios.
- Separar error/carga de agenda y formulario.
- Si falta informacion, detenerse y listar dudas concretas.

Validaciones requeridas para implementacion futura:

```powershell
pnpm --filter @velora/web lint
pnpm --filter @velora/web typecheck
pnpm --filter @velora/web build
git diff --check
git status --short
```

Si se toca backend por contrato faltante, detenerse antes y pedir aprobacion.

Entrega esperada:

- Diagnostico del estado actual.
- Plan de cambios por archivo.
- Riesgos.
- Validaciones a ejecutar.
- Criterios de aceptacion.
