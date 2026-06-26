# QA

Esta carpeta guarda checklists, resultados y evidencias de QA para Velora Reservas.

QA debe confirmar que una feature funciona, que no rompe flujos existentes y que mantiene la experiencia premium del producto.

## Tipos de QA

- Smoke manual: recorrido rapido del flujo principal en navegador.
- QA tecnico: lint, typecheck, build, tests y revision de diff.
- QA visual: layout, textos, estados, espaciado, responsive y consistencia premium.
- QA mobile: revision en viewport movil y controles tactiles.
- QA permisos: sesion, token, 401/403, tenant y acceso a datos.
- QA datos reales/demo: confirmar si una vista usa API real, demo o ambos, y que lo comunique.

## Gates minimos para features reales

Para una feature real con UI web:

```powershell
pnpm --filter @velora/web lint
pnpm --filter @velora/web typecheck
pnpm --filter @velora/web build
git diff --check
git status --short
```

Para una feature fullstack:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
git status --short
```

Toda excepcion debe quedar documentada con motivo, riesgo y siguiente accion.

