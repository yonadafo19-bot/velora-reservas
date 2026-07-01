# Evidence Index — Velora Reservas
## Dafory Launch Guard · Caso Demo 001

**Generado:** 2026-07-01T10:12:41.088Z  
**Duración:** 35.4s  
**Branch:** chore/launch-guard-velora-evidence-001  
**Veredicto preliminar:** APPROVED_WITH_WARNINGS  

> ⚠️ Demo visual, no operación comercial real. Las capturas documentan el estado actual
> del producto sin modificar funcionalidades, lógica de negocio ni configuraciones.

---

## Capturas Desktop (1440×1000)

| ID     | Ruta                                              | Viewport           | Archivo                                       | Result  | Observación |
|--------|---------------------------------------------------|--------------------|-----------------------------------------------|---------|-------------|
| 001    | `/                                               ` | Desktop 1440x1000  | `001-landing-desktop.png                      ` | **PASS** | Captura completa exitosa |
| 003    | `/reservar?negocio=barberia                      ` | Desktop 1440x1000  | `003-reservar-step-servicio.png               ` | **PASS** | Captura completa exitosa |
| 004    | `booking-flow-step2                              ` | Desktop 1440x1000  | `004-reservar-step-profesional.png            ` | **PASS** | Captura completa exitosa |
| 005    | `booking-flow-step2-filled                       ` | Desktop 1440x1000  | `005-reservar-step-fecha-hora.png             ` | **PASS** | Captura completa exitosa |
| 006    | `booking-flow-step3                              ` | Desktop 1440x1000  | `006-reservar-step-datos-cliente.png          ` | **PASS** | Captura completa exitosa |
| 007    | `/confirmacion (flujo completo)                  ` | Desktop 1440x1000  | `007-confirmacion-demo.png                    ` | **PASS** | Captura completa exitosa |
| 008    | `/admin/citas?negocio=barberia                   ` | Desktop 1440x1000  | `008-admin-citas-agenda-no-disponible.png     ` | **PASS** | Captura completa exitosa |
| 009    | `/admin/clientes?negocio=barberia                ` | Desktop 1440x1000  | `009-admin-clientes-demo.png                  ` | **PASS** | Captura completa exitosa |
| 010    | `/admin/servicios?negocio=barberia               ` | Desktop 1440x1000  | `010-admin-servicios-missing-config.png       ` | **PASS** | Captura completa exitosa |
| 011    | `/admin/profesionales?negocio=barberia           ` | Desktop 1440x1000  | `011-admin-profesionales-missing-config.png   ` | **PASS** | Captura completa exitosa |
| 012    | `/admin/horarios?negocio=barberia                ` | Desktop 1440x1000  | `012-admin-horarios-missing-config.png        ` | **PASS** | Captura completa exitosa |
| 013    | `/admin/configuracion?negocio=barberia           ` | Desktop 1440x1000  | `013-admin-configuracion-demo-disabled.png    ` | **PASS** | Captura completa exitosa |

## Capturas Mobile (390×844)

| ID     | Ruta                                              | Viewport           | Archivo                                       | Result  | Observación |
|--------|---------------------------------------------------|--------------------|-----------------------------------------------|---------|-------------|
| 002    | `/                                               ` | Mobile 390x844     | `002-landing-mobile.png                       ` | **PASS** | Captura completa exitosa |
| 003    | `/reservar?negocio=barberia                      ` | Mobile 390x844     | `mobile-003-reservar-step-servicio.png        ` | **PASS** | Captura completa exitosa |
| m-008  | `/admin/citas?negocio=barberia                   ` | Mobile 390x844     | `mobile-008-admin-citas.png                   ` | **PASS** | Captura completa exitosa |
| m-009  | `/admin/clientes?negocio=barberia                ` | Mobile 390x844     | `mobile-009-admin-clientes.png                ` | **PASS** | Captura completa exitosa |
| m-013  | `/admin/configuracion?negocio=barberia           ` | Mobile 390x844     | `mobile-013-admin-configuracion.png           ` | **PASS** | Captura completa exitosa |

---

## Totales

| Estado  | Cantidad |
|---------|----------|
| ✅ PASS   | 17 |
| ⚠️ WARNING | 0 |
| ❌ FAIL   | 0 |
| **Total** | **17** |

---

*Generado automáticamente por scripts/evidence-pack.mjs*
