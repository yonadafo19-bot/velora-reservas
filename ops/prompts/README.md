# Prompts Operativos

Esta carpeta guarda prompts reutilizables para trabajar con Dafo + SaaS Factory OS en Velora Reservas.

Un prompt operativo debe permitir que otro agente ejecute o revise una tarea sin inventar contexto. Debe incluir objetivo, alcance, archivos permitidos, archivos prohibidos, criterios de aceptacion y validaciones.

## Convencion de nombres

Usar:

```text
NNN-nombre-feature-modo.md
```

Ejemplos:

```text
001-agenda-real-plan.md
001-agenda-real-ejecucion.md
001-agenda-real-qa.md
```

## Modos

### MODO PLAN

Sirve para diagnosticar, definir alcance, riesgos, archivos a tocar y validaciones. No debe modificar archivos.

### MODO EJECUCION CONTROLADA

Sirve para implementar un cambio aprobado. Debe indicar exactamente que archivos se pueden tocar y que validaciones ejecutar.

### MODO QA

Sirve para revisar una implementacion. Debe priorizar bugs, riesgos, regresiones, evidencia y smoke manual.

### MODO RELEASE

Sirve para preparar cierre. Debe resumir cambios, impacto usuario, impacto tecnico, QA ejecutado, riesgos residuales y rollback.

