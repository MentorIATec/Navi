# Modelo de Datos: Sesiones

## Propósito

Definir la estructura final de la hoja `Sesiones` y la regla de negocio para múltiples encuentros por la misma matrícula.

Este documento fija la base para:

- mantener histórico trazable;
- distinguir creación y edición de una sesión;
- evitar duplicados por llave débil;
- derivar una vista actual consistente en el tablero mentor.

## Regla de producto

El histórico de `Sesiones` existe para dar continuidad al trabajo del mentor dentro de `faro`, no para construir un sustituto del CRM institucional.

### Decisión

- `Sesiones` conserva trazabilidad y contexto de mentoría;
- el registro formal del caso sigue ocurriendo en CRM;
- cualquier vista de histórico en la webapp debe ser ligera y centrada en continuidad, no en administración pesada.

## Problema del modelo actual

La implementación actual mezcla dos funciones en la misma lógica:

1. histórico de sesiones;
2. estado actual del caso.

Eso produce inconsistencias porque:

- la llave de upsert usa `matricula + fecha_sesion`;
- `fecha_sesion` es editable;
- el tablero deriva “última sesión” por `timestamp_guardado`;
- editar una sesión antigua puede desplazar en la vista a una sesión más reciente;
- una misma sesión puede duplicarse si cambia la fecha o si el guardado no identifica correctamente si está creando o editando.

## Unidad correcta de registro

La unidad de registro debe ser `session_id`.

### Decisión

- cada sesión documentada tiene un `session_id` estable;
- `session_id` se genera al crear la sesión por primera vez;
- `session_id` nunca cambia;
- cualquier edición posterior reutiliza ese mismo identificador.

### Regla

- `matricula` no es llave de sesión;
- `matricula + fecha_sesion` tampoco es llave de sesión;
- `fecha_sesion` es dato editable, no identificador.

## Estructura final sugerida de `Sesiones`

La hoja `Sesiones` debe ser un histórico de snapshot.

Cada fila representa una sesión documentada y conserva el estado del caso tal como era al momento de guardarla.

### Campos recomendados

| Campo | Rol | Nota |
| --- | --- | --- |
| `session_id` | llave primaria estable | generado al crear la sesión |
| `matricula` | referencia a estudiante | inmutable |
| `nombre` | snapshot | nombre visible al momento de la sesión |
| `mentor` | snapshot | mentor asignado en esa sesión |
| `comunidad` | snapshot | comunidad vigente en esa sesión |
| `periodo` | snapshot opcional | útil para histórico semestre a semestre |
| `fecha_sesion` | fecha real de la sesión | editable |
| `session_index` | opcional | número de sesión por estudiante/período |
| `etapa` | snapshot del diagnóstico | no narrativa técnica; usable para sistema |
| `areas_prioritarias` | snapshot del diagnóstico | texto legible o lista interna traducible |
| `pretest_resumen` | snapshot del pre-test | contexto breve |
| `meta_prioritaria` | snapshot de metas | texto del estudiante |
| `meta_complementaria` | snapshot de metas | texto del estudiante |
| `horizonte` | snapshot de metas | acuerdo temporal |
| `obstaculo` | snapshot de metas | texto del estudiante |
| `estrategia` | snapshot de metas | acuerdo concreto |
| `notas_mentor` | campo editable | texto libre |
| `estado_documentacion` | estado operativo | `Borrador` / `Documentado` |
| `documentado_crm` | estado operativo | `Si` / `No` |
| `timestamp_creacion` | auditoría | primera creación |
| `timestamp_actualizado` | auditoría | última edición |

## Campos a deprecar

### `modalidad`

No aporta valor narrativo ni operativo real al sistema.

Decisión:

- dejar de poblarla;
- dejar de mostrarla;
- eliminarla del schema cuando la migración de hoja sea segura.

### `checkin_resumen`

Duplica el rol de `pretest_resumen`.

Decisión:

- no seguir usándolo;
- conservar compatibilidad temporal mientras se limpia la hoja.

### `seguimiento`

Hoy no está integrado en el flujo real del mentor.

Decisión:

- no mantenerlo como campo de la versión estable de `Sesiones` hasta que exista una semántica clara y una UI consistente.

## Regla de negocio para múltiples sesiones

### Nueva sesión

Se crea una nueva fila cuando:

- el mentor inicia la documentación de un encuentro nuevo;
- no existe un `session_id` previo cargado en el contexto actual.

Resultado:

- se genera `session_id`;
- se crea fila nueva;
- se fija `timestamp_creacion`;
- se inicializa `timestamp_actualizado`.

### Edición de sesión existente

Se edita la misma fila cuando:

- el contexto del frontend ya tiene `session_id`;
- el mentor corrige notas;
- cambia el estado de documentación;
- marca la sesión como documentada en CRM;
- ajusta la fecha de sesión.

Resultado:

- upsert por `session_id`;
- `timestamp_creacion` no cambia;
- `timestamp_actualizado` sí cambia.

### Regla explícita para frontend

- si hay `session_id` en el draft actual: edición;
- si no hay `session_id`: creación.

## Regla para el tablero

El tablero no debe leer la sesión “más recientemente guardada”.

Debe leer la sesión con `fecha_sesion` más reciente por matrícula.

### Decisión

- ordenar la derivación de `latestSessionsByMatricula` por `fecha_sesion DESC`;
- usar `timestamp_actualizado` sólo como metadato de auditoría, no como criterio principal de actualidad.

## Relación con otras hojas

### `Students`

Una fila por matrícula.  
Representa el estado actual del estudiante, no el histórico.

### `Responses`

Histórico de diagnósticos remotos.  
Puede haber múltiples respuestas por matrícula.  
La lectura operativa usa la más reciente.

### `GoalSelections`

Histórico de selección de metas.  
La sesión documentada toma snapshot de lo vigente al guardarse.

### `Sesiones`

Histórico de sesiones documentadas.  
No es una vista dinámica sobre las otras hojas; es un snapshot.

## Principio clave

Si el estudiante cambia su diagnóstico o sus metas después, la sesión documentada no debe mutar.

Eso no es inconsistencia.  
Es la propiedad correcta de un registro histórico.

## Recomendación principal

La siguiente implementación debería hacerse en este orden:

1. introducir `session_id`;
2. separar claramente creación vs edición;
3. ordenar la vista del tablero por `fecha_sesion`;
4. dejar de usar `modalidad`, `checkin_resumen` y `seguimiento`;
5. limpiar el schema de la hoja cuando ya exista compatibilidad estable.
