# Smoke Manual - 001-agenda-real

Ruta principal:

```text
/admin/citas?negocio=barberia
```

## Preparacion

- Confirmar que la web corre localmente.
- Confirmar si la API esta disponible.
- Confirmar si `VELORA_API_URL` esta configurada.
- Confirmar escenario de token: valido, ausente o vencido.
- No imprimir tokens en terminal, navegador ni capturas.

## Token valido

1. Abrir `/admin/citas?negocio=barberia`.
2. Confirmar que no aparece overlay rojo.
3. Confirmar que la agenda real carga desde API.
4. Confirmar que el rango visible usa `America/Santiago`.
5. Confirmar que los estados de cita se muestran en espanol Chile.
6. Confirmar que montos visibles usan CLP.
7. Confirmar que el boton `Nueva cita` se habilita si hay datos reales suficientes.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Sin token

1. Levantar web sin `VELORA_ADMIN_DEV_TOKEN`.
2. Abrir `/admin/citas?negocio=barberia`.
3. Confirmar que no aparece overlay rojo.
4. Confirmar que la agenda muestra estado de configuracion o sesion pendiente.
5. Confirmar que `Nueva cita` queda deshabilitado o muestra mensaje claro.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Token vencido

1. Usar token invalido o vencido.
2. Abrir `/admin/citas?negocio=barberia`.
3. Confirmar que no aparece overlay rojo.
4. Confirmar que errores 401 se muestran como estado UI limpio.
5. Confirmar que no se imprime token ni header sensible.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Agenda vacia

1. Usar rango o datos donde no existan citas.
2. Confirmar que aparece estado vacio claro.
3. Confirmar que no se usa agenda demo como fallback.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Error API

1. Simular API apagada o endpoint no disponible.
2. Abrir `/admin/citas?negocio=barberia`.
3. Confirmar estado de error controlado.
4. Confirmar que no hay overlay rojo por error esperado.
5. Confirmar que el mensaje visible esta en espanol Chile.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Creacion simple

1. Con token valido, abrir `Nueva cita`.
2. Seleccionar cliente, servicio, profesional, ubicacion, fecha y hora disponible.
3. Crear cita.
4. Confirmar mensaje de exito.
5. Confirmar que la agenda se refresca.
6. Confirmar que la cita aparece en agenda real.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Mobile basico

1. Abrir `/admin/citas?negocio=barberia` en viewport movil.
2. Confirmar que navegacion, agenda y estados se leen sin solapamientos.
3. Confirmar que `Nueva cita` es usable cuando esta habilitado.
4. Confirmar que mensajes largos no rompen layout.

Resultado:

```text
PASS/FAIL:
Notas:
```

## Revision final

- No hay overlays rojos por 401 controlado.
- No hay tokens en consola visible.
- Textos visibles en espanol Chile.
- Horarios y fechas en `America/Santiago`.
- `/admin/citas` no vuelve a mocks.

Resultado general:

```text
PASS/FAIL:
Riesgos residuales:
```

