# Playwright Notes — Evidence Pack
## Dafory Launch Guard · Velora Reservas · Caso Demo 001

> **NOTA EXPLÍCITA:** Demo visual, no operación comercial real.  
> Todas las capturas documentan el estado actual del producto sin transacciones,
> datos reales de clientes ni conexiones a APIs de producción.

---

## Resumen de Ejecución

| Campo             | Valor |
|-------------------|-------|
| Fecha             | 2026-07-01T10:12:41.091Z |
| Duración total    | 35.4s |
| Browser           | Chromium (Playwright v1.60.0) |
| Base URL          | http://localhost:3000 |
| Branch            | chore/launch-guard-velora-evidence-001 |
| Veredicto previo  | APPROVED_WITH_WARNINGS |
| Total capturas    | 17 |
| ✅ PASS            | 17 |
| ⚠️ WARNING         | 0 |
| ❌ FAIL            | 0 |

---

## Rutas Capturadas Exitosamente

- ✅ `/` → `001-landing-desktop.png`
- ✅ `/reservar?negocio=barberia` → `003-reservar-step-servicio.png`
- ✅ `booking-flow-step2` → `004-reservar-step-profesional.png`
- ✅ `booking-flow-step2-filled` → `005-reservar-step-fecha-hora.png`
- ✅ `booking-flow-step3` → `006-reservar-step-datos-cliente.png`
- ✅ `/confirmacion (flujo completo)` → `007-confirmacion-demo.png`
- ✅ `/admin/citas?negocio=barberia` → `008-admin-citas-agenda-no-disponible.png`
- ✅ `/admin/clientes?negocio=barberia` → `009-admin-clientes-demo.png`
- ✅ `/admin/servicios?negocio=barberia` → `010-admin-servicios-missing-config.png`
- ✅ `/admin/profesionales?negocio=barberia` → `011-admin-profesionales-missing-config.png`
- ✅ `/admin/horarios?negocio=barberia` → `012-admin-horarios-missing-config.png`
- ✅ `/admin/configuracion?negocio=barberia` → `013-admin-configuracion-demo-disabled.png`
- ✅ `/` → `002-landing-mobile.png`
- ✅ `/reservar?negocio=barberia` → `mobile-003-reservar-step-servicio.png`
- ✅ `/admin/citas?negocio=barberia` → `mobile-008-admin-citas.png`
- ✅ `/admin/clientes?negocio=barberia` → `mobile-009-admin-clientes.png`
- ✅ `/admin/configuracion?negocio=barberia` → `mobile-013-admin-configuracion.png`

---

## Rutas con MISSING_CONFIG

Las siguientes rutas contienen indicadores de configuración pendiente, documentados
sin modificación como parte de la evidencia para Launch Guard:

- `/admin/servicios?negocio=barberia` → `010-admin-servicios-missing-config.png` (PASS)
- `/admin/profesionales?negocio=barberia` → `011-admin-profesionales-missing-config.png` (PASS)
- `/admin/horarios?negocio=barberia` → `012-admin-horarios-missing-config.png` (PASS)
- `/admin/configuracion?negocio=barberia` → `013-admin-configuracion-demo-disabled.png` (PASS)
- `/admin/configuracion?negocio=barberia` → `mobile-013-admin-configuracion.png` (PASS)

> Estos estados son esperados en la fase de demo controlada y ya forman parte
> del veredicto APPROVED_WITH_WARNINGS. No son bugs bloqueantes para la evidencia visual.

---

## Warnings

_Sin warnings_

---

## Errores Registrados

_Sin errores_

---

## Recomendaciones para Launch Guard Report

1. **Verificar rutas MISSING_CONFIG** antes del lanzamiento comercial real.
   Las páginas de administración que muestran configuración pendiente deben
   resolver sus dependencias de datos antes de operar con clientes reales.

2. **El flujo de reserva es funcional en modo demo.** Los pasos 1→2→3→confirmación
   funcionan correctamente con datos ficticios y sessionStorage local.

3. **La landing page y páginas de marketing** están en estado PASS y son aptas
   para presentación a stakeholders.

4. **Validar en producción** que las variables de entorno necesarias para las
   páginas admin estén configuradas correctamente antes del go-live.

5. **Mobile experience:** Las capturas mobile confirman que el diseño responsive
   está implementado correctamente en las rutas principales.

---

## Metodología

- Viewport desktop: 1440×1000px
- Viewport mobile: 390×844px (iPhone 14 Pro approx.)
- Capturas: `fullPage: true` cuando aplica
- Espera de carga: `networkidle` + fallback `domcontentloaded` + 800ms buffer
- Flujo de reserva: completado con datos de demo ficticios
  - Servicio: primer servicio disponible en barbería demo
  - Profesional: primer profesional disponible
  - Fecha: día siguiente a la ejecución
  - Hora: primer slot disponible
  - Cliente: "Demo Cliente Velora" / +56 9 8765 4321 / demo@velora.cl
- Si una captura falla, el script continúa con la siguiente (no bloquea)

---

*Generado automáticamente por `scripts/evidence-pack.mjs`*  
*Antigravity AI · Dafory Launch Guard Evidence System*
