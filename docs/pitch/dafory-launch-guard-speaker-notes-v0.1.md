# Dafory Launch Guard — Speaker Notes v0.1
## Guion de apoyo para presentador

**Versión:** v0.1  
**Fecha:** Julio 2026  
**Uso:** Notas internas para quien presenta el deck — no se proyectan

---

> **Instrucción general:**  
> Estas notas son un apoyo, no un guion que se lee palabra a palabra. Conoce el material, interioriza el mensaje de cada slide y usa tus propias palabras. El deck es un soporte visual — tú eres la presentación.

---

---

## SLIDE 01 — PORTADA

**Lo que dices mientras aparece el slide:**

"Gracias por el tiempo. Voy a presentarles Dafory Launch Guard — un servicio de auditoría pre-lanzamiento para SaaS y productos digitales.

La idea central es simple: hoy se construye software más rápido que nunca, pero la mayoría de los productos digitales llegan al mercado sin haber sido verificados formalmente. Dafory Launch Guard existe para cubrir ese espacio."

**Tiempo objetivo:** 25–30 segundos.  
**Transición:** "Empecemos por el problema que queremos resolver."

---

---

## SLIDE 02 — EL PROBLEMA

**Lo que dices:**

"Hoy, con herramientas de inteligencia artificial, un equipo pequeño puede construir una aplicación completa en días o semanas. Eso es poderoso — democratiza el software.

Pero hay un patrón que se repite constantemente: el producto se ve impresionante en la demo. El fundador lo presenta con confianza. Y nadie —ni el fundador, ni el equipo, ni el inversor— verificó si realmente funciona en condiciones reales.

Las consecuencias son concretas: un fondo que ve una demo con bugs que nadie documentó pierde confianza. Un primer cliente que descubre un fallo crítico después del lanzamiento daña la relación desde el primer día.

El problema no es que el producto esté incompleto. Todos los productos en etapa temprana están incompletos. El problema es que nadie lo verificó antes de mostrarlo."

**Tiempo objetivo:** 80–90 segundos.  
**Pausa sugerida:** Después de "nadie lo verificó antes de mostrarlo." Dejar respirar el mensaje.  
**Transición:** "¿Por qué es el momento correcto para resolver esto?"

---

---

## SLIDE 03 — POR QUÉ AHORA

**Lo que dices:**

"El contexto que hace urgente este problema es claro: la velocidad de construcción de software aumentó de forma exponencial en los últimos dos años. Herramientas como Cursor, Bolt, v0 o Lovable permiten a personas sin experiencia técnica construir apps que compiten visualmente con startups consolidadas.

Eso genera una brecha: la velocidad de construcción va para arriba, pero la madurez de los procesos de validación sigue siendo muy baja — especialmente en equipos pequeños y emprendimientos tempranos.

No existe hoy un servicio profesional, sistemático y accesible que cubra ese espacio para equipos pequeños antes de que salgan al mercado. Ese espacio es Dafory Launch Guard."

**Tiempo objetivo:** 55–65 segundos.  
**Alerta:** No inventar cifras de mercado. Si te preguntan por datos, sé honesto: "Estamos en proceso de investigación de mercado formal."  
**Transición:** "Entonces, ¿cuál es la solución?"

---

---

## SLIDE 04 — LA SOLUCIÓN

**Lo que dices:**

"Dafory Launch Guard es una auditoría pre-lanzamiento. No es un servicio de testing automatizado. Es una revisión profesional con criterio comercial.

Lo que entregamos es concreto: un Evidence Pack con capturas verificables, un score de preparación, un veredicto de lanzamiento —diferenciado entre demo y operación comercial real— y un backlog priorizado con lo que hay que corregir antes del go-live.

El diferenciador más importante es este: no entregamos opiniones. Entregamos evidencia. La diferencia entre decirle a alguien 'tu producto tiene problemas' y mostrarle 17 capturas verificadas con resultado PASS, WARNING o FAIL — es enorme."

**Tiempo objetivo:** 80–90 segundos.  
**Énfasis:** Hacer pausa en "no entregamos opiniones — entregamos evidencia."  
**Transición:** "¿Cómo funciona el proceso?"

---

---

## SLIDE 05 — CÓMO FUNCIONA

**Lo que dices:**

"El proceso tiene cinco etapas.

Primero, el intake: entendemos el producto, definimos el alcance y establecemos qué significa 'listo' para este cliente en particular.

Segundo, la revisión: navegamos el producto completo, verificamos flujos críticos, detectamos estados de configuración pendiente, inconsistencias visuales y problemas de UX.

Tercero, la evidencia: generamos capturas automatizadas con Playwright en desktop y mobile. Cada ruta queda documentada con ID, resultado y observación.

Cuarto, el reporte: emitimos el score y el veredicto diferenciado.

Y quinto, el backlog: entregamos una lista de correcciones ordenadas por impacto. No un informe que se archiva — un plan de acción.

El proceso completo puede ejecutarse en 48 a 72 horas para un producto de tamaño estándar."

**Tiempo objetivo:** 80–90 segundos.  
**Nota:** Si te preguntan por el tiempo de entrega, ser honesto: depende del alcance del producto.  
**Transición:** "Veamos cómo funcionó esto en la práctica."

---

---

## SLIDE 06 — CASO DEMO 001

**Lo que dices:**

"Para validar la metodología, la aplicamos sobre un producto real: Velora Reservas, una plataforma de reservas online para barberías y estudios de belleza.

Velora es un producto visualmente premium, construido sobre Next.js y React, con panel de administración completo. Al momento de la auditoría, tenía una experiencia visual lista para demo — pero sin backend operativo real.

Ese es exactamente el tipo de producto que necesita Launch Guard: visualmente listo, técnicamente incompleto, a punto de ser presentado.

Auditamos 9 rutas, capturamos 17 pantallas en desktop y mobile, y completamos el proceso en 35 segundos de ejecución automatizada."

**Tiempo objetivo:** 55–65 segundos.  
**Alerta crítica:** Si alguien pregunta si Velora es un cliente pagado, responder con claridad: "Es un piloto interno que usamos para validar nuestra propia metodología. No es un cliente pagado."  
**Transición:** "El resultado fue el Evidence Pack."

---

---

## SLIDE 07 — EVIDENCE PACK

**Lo que dices:**

"El resultado fue este: 17 capturas, 17 PASS, 0 warnings, 0 fallos.

Cada una de estas capturas está almacenada en el repositorio con su ID, ruta, viewport y resultado. Cualquiera puede verificarlas. No es un reporte de opinión — es evidencia trazable.

Los documentos generados son el evidence-index con la tabla completa, y las playwright-notes con el resumen de ejecución y las recomendaciones.

Este es el activo que diferencia a Launch Guard de una revisión manual sin documentación."

**Tiempo objetivo:** 55–65 segundos.  
**Si tienes el repositorio disponible:** Ofrecer mostrarlo en vivo. "Si quieren, puedo mostrarles las capturas reales en el repositorio."  
**Transición:** "¿Y cuál fue el veredicto?"

---

---

## SLIDE 08 — VEREDICTO

**Lo que dices:**

"Este es el slide más importante del deck. Por favor léanlo.

[Pausa. Dejar que la audiencia lea.]

La mayoría de los servicios de QA dan un único veredicto: funciona o no funciona. Nosotros separamos dos preguntas que son completamente distintas.

La primera: ¿está listo para mostrarlo? La respuesta para Velora es APPROVED_WITH_WARNINGS. La landing es premium, el flujo de reserva funciona, la confirmación cierra el ciclo. Está listo para presentarse con un guion claro.

La segunda: ¿está listo para operar comercialmente con clientes reales? La respuesta es NEEDS_FIXES. El backend no existe, las reservas no persisten en servidor, el admin no tiene autenticación real.

Esa distinción —entre preparación visual y readiness comercial— es lo que permite a un fundador no sobreprometer. Es lo que permite a un inversor entender exactamente qué está viendo. Y es lo que hace a Launch Guard diferente."

**Tiempo objetivo:** 70–80 segundos.  
**Énfasis:** La pausa al inicio. Dejar que lean. Es el slide que más impacto tiene si se deja respirar.  
**Transición:** "¿Cómo generamos ingresos con esto?"

---

---

## SLIDE 09 — MODELO DE NEGOCIO

**Lo que dices:**

"El modelo es simple: comenzamos como servicio asistido y evolucionamos hacia una plataforma SaaS.

Hoy, cada revisión se entrega manualmente con el apoyo de automatización. Tenemos tres niveles de servicio: básico, completo y pro. Los precios que ven son referenciales — estamos en proceso de validación con prospectos.

El camino hacia el SaaS está claro: una vez que tengamos el proceso sistematizado y un número suficiente de casos, construimos la plataforma que permite a un cliente ingresar su producto y recibir el reporte de forma parcialmente automatizada.

El margen es alto en la etapa de servicio. La escala viene con el SaaS."

**Tiempo objetivo:** 70–75 segundos.  
**Alerta:** Si te preguntan por MRR o ingresos actuales, ser honesto: "Estamos en etapa de validación. No tenemos ingresos recurrentes aún."  
**Transición:** "Para financiar esta validación, estamos evaluando instrumentos de fondos."

---

---

## SLIDE 10 — FONDOS OBJETIVO

**Lo que dices:**

"Estamos evaluando tres instrumentos de financiamiento: Sercotec Capital Semilla, Start-Up Chile Build y CORFO Semilla Inicia.

Cada uno tiene un encaje distinto con nuestra etapa actual. Sercotec para validación comercial. Start-Up Chile para el salto hacia el SaaS. CORFO para cuando tengamos los primeros clientes pagados.

Quiero ser explícito: ninguna postulación ha sido enviada aún. Este es el mapa de financiamiento que estamos construyendo."

**Tiempo objetivo:** 40–50 segundos.  
**Nota:** La honestidad sobre el estado de postulaciones es un activo, no una debilidad. Los fondos valoran la claridad.  
**Transición:** "¿Cómo se ve la hoja de ruta?"

---

---

## SLIDE 11 — ROADMAP

**Lo que dices:**

"El roadmap es de nueve meses en cuatro fases.

Los primeros dos meses son de validación comercial: presentar el caso a 10 a 15 prospectos, realizar las primeras auditorías reales, ajustar precio y proceso.

Los meses tres y cuatro: cerrar los primeros cinco clientes pagados, sistematizar el proceso, desarrollar plantillas de reporte.

Los meses cinco y seis: construir el MVP de la plataforma SaaS con intake, dashboard y entrega de reporte automatizada.

Los meses siete a nueve: lanzamiento público, modelo freemium, escala a agencias y equipos.

Lo que ya está hecho: el Evidence Pack de Velora, el caso demo documentado, la sección de Launch Guard en la landing de Velora. Esos son hitos reales."

**Tiempo objetivo:** 70–80 segundos.  
**Énfasis:** Los hitos ya completados son evidencia de que el equipo ejecuta.  
**Transición:** "¿Cómo usamos los fondos?"

---

---

## SLIDE 12 — USO DE FONDOS

**Lo que dices:**

"La distribución es clara: 35% para desarrollo de producto, 25% para validación comercial, 20% para marketing y presencia, 12% para operación y 8% para diseño.

En los primeros tres meses, la prioridad es la validación — sin inversión técnica en plataforma. En la segunda fase, invertimos en el producto. En la tercera, escalamos operación.

Esta distribución es orientativa y se ajusta según el instrumento específico."

**Tiempo objetivo:** 40–50 segundos.  
**Transición:** "¿A quién le vendemos?"

---

---

## SLIDE 13 — GO-TO-MARKET

**Lo que dices:**

"Tenemos cuatro segmentos claros.

El primero y más urgente: fundadores de SaaS en etapa temprana que construyeron con IA y están a punto de presentar a un fondo o lanzar su primer producto. Su dolor es el miedo a que algo falle en la demo.

El segundo: agencias de desarrollo que entregan productos a clientes finales y quieren un proceso más formal de entrega. Su dolor es el cliente que detecta errores después.

El tercero: freelancers premium que quieren diferenciarse. Y el cuarto: equipos con productos construidos con herramientas de IA que no saben qué tan confiable es lo que tienen.

Los canales son LinkedIn, comunidades de fundadores, referidos de agencias y contenido técnico. El mensaje de posicionamiento lo tienen en el slide: Launch Guard no es testing, es una auditoría de preparación de lanzamiento."

**Tiempo objetivo:** 70–80 segundos.  
**Transición:** "Para cerrar."

---

---

## SLIDE 14 — CIERRE

**Lo que dices:**

"Dafory Launch Guard existe porque hay un espacio enorme entre 'construí algo' y 'estoy listo para lanzarlo' — y nadie lo cubre hoy de forma sistemática y profesional para equipos pequeños.

Ya tenemos evidencia de que la metodología funciona. 17 capturas verificadas. Un veredicto honesto. Un backlog accionable. Todo documentado y trazable.

Si están construyendo o invirtiendo en productos digitales — y quieren saber cómo acompañamos el proceso de validación pre-lanzamiento — hablemos.

Gracias."

**Tiempo objetivo:** 40–45 segundos.  
**Cierre limpio:** No extender. Dejar silencio después de "gracias" antes de abrir a preguntas.

---

---

## Preguntas frecuentes y cómo responderlas

### "¿Tienen clientes pagados?"
"No aún. Velora Reservas fue un piloto interno para validar nuestra metodología. Estamos en etapa de validación comercial y buscamos los primeros clientes pagados."

### "¿Cuánto vale el servicio?"
"Los precios que mostramos son referenciales. Estamos ajustándolos en conversaciones con prospectos. El rango para una auditoría completa está entre CLP 350.000 y 550.000."

### "¿Por qué no usar simplemente Playwright directo?"
"Playwright es la herramienta de captura. Launch Guard es el proceso, el criterio comercial, el veredicto diferenciado y el backlog priorizado. Cualquiera puede correr capturas — nosotros entregamos una decisión."

### "¿Qué diferencia a Launch Guard de un QA manual?"
"El QA manual verifica que algo funciona. Launch Guard verifica que algo está listo para ser presentado, vendido o lanzado — y documenta qué condiciones deben cumplirse para cada nivel."

### "¿Velora ya está operativo comercialmente?"
"No. Velora tiene veredicto NEEDS_FIXES para operación comercial real. Está listo para demo controlada, no para recibir clientes reales sin corregir primero el backend, la autenticación y la persistencia de reservas."

### "¿Cuánto tiempo toma una revisión?"
"Depende del alcance. Para un producto de tamaño estándar, entre 48 y 72 horas de proceso completo."

### "¿Tienen equipo?"
"Por ahora es un equipo muy pequeño con apoyo de herramientas de automatización. La escala de equipo viene con el financiamiento y los primeros clientes."

---

*Documento interno — no distribuir a audiencia.*
