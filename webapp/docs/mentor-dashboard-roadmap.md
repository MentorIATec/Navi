# faro: Mentor Dashboard Roadmap

## Propósito

Definir la siguiente fase del tablero de mentoría con foco en sostenibilidad operativa.

La prioridad ya no es agregar más branding ni destrabar campañas puntuales. La prioridad es convertir el tablero en una herramienta útil para:

- revisar el contexto del estudiante
- documentar la sesión de mentoría
- preparar un resumen listo para CRM institucional
- mantener a Google Sheets como fuente de verdad operativa

## Regla de negocio

Este tablero no pretende sustituir el CRM institucional ni transformarse en la herramienta principal de gestión de casos del mentor o mentora.

Su papel es:

- reunir el contexto mínimo útil para la sesión;
- facilitar acuerdos y documentación;
- acelerar el paso de la conversación al registro formal en CRM.

### Implicación de diseño

- evitar vistas pesadas tipo Airtable como centro del producto;
- priorizar una vista clara del caso actual y un histórico ligero por estudiante;
- no agregar carga administrativa paralela a la documentación oficial.

## Decisiones base

### Fuente de verdad

Google Sheets + Apps Script siguen siendo la fuente de verdad para:

- directorio de estudiantes
- asignación de mentoría
- campañas
- catálogo de metas
- registros de sesión

La webapp debe funcionar como capa operativa y de visualización, no como segundo sistema con estado propio persistente.

### Sincronización

No se elimina el botón manual de actualización.

Decisión:

- mantener la actualización manual
- renombrar `Traer de Sheets` a `Actualizar directorio`
- mostrar la marca de tiempo de la última sincronización

Razonamiento:

- una sola persona administra el panel
- Apps Script y Sheets tienen latencia y cuotas variables
- el control manual es más honesto y menos frágil que polling continuo

Opcional después:

- auto-refresh suave al iniciar sesión
- no reemplaza el botón manual

### Campañas

No se debe mantener un editor libre de HTML en el panel.

Decisión:

- eliminar edición libre de HTML
- usar plantillas aprobadas
- limitar variables permitidas
- mostrar preview antes de enviar

El panel no debe ser un editor técnico. Debe ser un flujo controlado de selección, revisión y envío.

### Poda del tablero actual

No todo lo que hoy aparece en el panel justifica seguir viviendo en la webapp.

Decisión:

- mantener en la webapp solo lo que aporta valor operativo cotidiano al mentor o al admin
- mover a Sheets lo que hoy se administra mejor ahí
- dejar abierta una futura herramienta separada para gobierno del catálogo de metas

#### Se queda en el tablero actual

- directorio de estudiantes
- métricas agregadas
- acceso a diagnóstico y resultado de mentoría
- campañas, si se formalizan con plantillas controladas
- sincronización manual y estado de última actualización

#### Candidato a salir del tablero actual

- `Catálogo de metas`
- `Configuración`, salvo lo estrictamente operativo

Razonamiento:

- el catálogo de metas hoy se administra mejor en Sheets
- solo una persona tiene atribución efectiva de editarlo
- sostener una UI paralela agrega sincronización, mantenimiento y riesgo de inconsistencia

### Catálogo de metas a futuro

La evolución deseable no es enriquecer la tab actual, sino mover este problema a una herramienta separada.

Nombre de trabajo:

- `Goal Manager`

Capacidades deseables de esa herramienta:

- proponer nuevas metas
- editar metas existentes
- registrar `updated_by`
- registrar `updated_at`
- manejar estados como `propuesta`, `aprobada`, `archivada`

Esa herramienta no entra en esta fase.

## Problema que resuelve esta fase

Hoy el tablero sirve mejor para coordinación que para mentoría.

Permite:

- ver estados
- revisar directorio
- disparar campañas

Pero no resuelve bien:

- documentar qué pasó en la sesión
- consolidar datos de test, pre-test, check-in y metas
- generar un texto listo para pegar en el CRM institucional

Ese es el hueco principal del producto.

## Poda del tablero actual: tabs y componentes

La siguiente tabla traduce la poda en decisiones concretas de interfaz.

### Tab `Vista general`

Se mantiene y se convierte en el centro operativo del tablero.

#### Se conserva

- encabezado del panel
- directorio de progreso
- búsqueda
- métricas agregadas
- bloque de check-in con enlace y QR
- acceso a `Ver Diagnóstico`

#### Se ajusta

- `Traer de Sheets` pasa a `Actualizar directorio`
- se agrega texto de última sincronización
- el copy de la cabecera debe dejar de hablar de `gestión de campañas y catálogo de metas` como promesa principal
- `Ver Diagnóstico` evoluciona hacia `Resultado de mentoría`

#### Se mueve de prioridad

- las campañas dejan de ser el componente principal de cierre del tablero
- pasan a una función secundaria, no al centro conceptual de la vista

### Tab `Carga de estudiantes`

Es candidata fuerte a salir del tablero operativo.

#### Razón

- la carga masiva ya mostró fragilidad
- la administración real del directorio vive mejor en Sheets
- mantener una UI paralela obliga a sincronización, parsing y validación adicional

#### Decisión recomendada

- sacar esta tab del flujo normal del tablero
- manejar la carga y edición de estudiantes directamente en Sheets
- si se necesita, dejarla solo como herramienta temporal o de migración, no como parte del producto cotidiano

### Tab `Catálogo de metas`

Es candidata a salir del tablero actual.

#### Razón

- solo admin la usa
- la operación ya vive mejor en Sheets
- mantener GoalManager dentro del tablero mezcla trabajo operativo del mentor con gobierno del catálogo

#### Decisión recomendada

- retirar esta tab del tablero mentor/admin actual
- mantener temporalmente la edición en Sheets
- más adelante mover el problema a una herramienta separada:
  - `Goal Manager`

### Tab `Configuración`

Debe reducirse.

#### Secciones actuales

- vista por rol en demo
- mentores y comunidades
- modo demo
- correo de prueba
- conexión con Google Sheets
- agenda de mentoría

#### Evaluación

No todas estas secciones pertenecen al tablero operativo.

##### Mantener solo si siguen siendo necesarias en la operación actual

- conexión con Google Sheets
- agenda de mentoría, si realmente sigue siendo una decisión activa del programa

##### Mover fuera del tablero o degradar a consola técnica

- vista por rol demo
- mentores y comunidades por textarea
- correo de prueba suelto
- modo demo en producción

#### Decisión recomendada

- dejar `Configuración` como una consola mínima de administración técnica
- no como una tab central del producto

### Modal `Ver Diagnóstico`

No debe eliminarse. Debe evolucionar.

#### Se conserva

- etapa
- modalidad
- termómetro emocional
- áreas prioritarias
- métricas

#### Se agrega

- observaciones del mentor
- notas adicionales
- estado de documentación
- acciones o seguimiento
- `Copiar resumen para CRM`
- `Guardar en Sheets`

#### Decisión recomendada

Este modal es el punto natural para construir `Resultado de mentoría`.

### Módulo de campañas

Se conserva solo si cambia de modelo.

#### Se elimina

- edición libre de HTML

#### Se mantiene

- selección de tipo de campaña
- selección de mentores
- preview
- prueba y envío

#### Se redefine

- la fuente de la campaña debe ser una plantilla controlada
- no un textarea editable

### Botones globales del header

#### Mantener

- `Actualizar directorio`
- `Guardar en Sheets`, si sigue habiendo acciones explícitas de escritura desde la webapp
- `Cerrar sesión`

#### Ajustar

- cambiar icono de `Activity` por uno semántico de refresh
- agregar `Última actualización: ...`

## Nuevo módulo: Resultado de mentoría

### Objetivo

Dar al mentor una vista única para cerrar la sesión en 3 a 5 minutos.

Debe permitir:

- leer el contexto del estudiante ya precargado
- registrar notas breves de la sesión
- marcar seguimiento
- copiar un resumen listo para CRM
- guardar el resultado en Sheets

### Punto de entrada

La base correcta ya existe: el modal `Ver Diagnóstico`.

La siguiente fase no debe crear una pantalla completamente nueva. Debe expandir ese modal en dos capas:

1. lectura del contexto
2. documentación del encuentro

### Estructura funcional propuesta

#### Encabezado de sesión

- estudiante
- matrícula
- mentor o mentora
- comunidad
- fecha de sesión

#### Contexto precargado, solo lectura

- resumen del pre-test
- áreas prioritarias del diagnóstico
- termómetro emocional o check-in
- etapa
- métricas por categoría

#### Metas acordadas, solo lectura

- meta prioritaria
- meta complementaria
- horizonte
- obstáculo principal
- estrategia si-entonces

#### Documentación del mentor, editable

- observaciones de la sesión
- acciones de seguimiento
- notas adicionales
- estado de documentación

Ejemplo de nota adicional:

`Invité a sesión 1 a 1 para seguimiento particular de un tema.`

#### Salida operativa

- `Copiar resumen para CRM`
- `Guardar en Sheets`

## Modelo de datos propuesto

Nueva hoja:

- `Sesiones`

Una fila por sesión documentada.

### Criterio estructural

`Sesiones` debe funcionar como bitácora histórica, no como estado actual del caso.

Reglas:

- permitir múltiples sesiones por matrícula;
- usar `session_id` como llave estable;
- distinguir creación de edición;
- derivar la vista actual del tablero a partir de la sesión con `fecha_sesion` más reciente;
- no usar `timestamp_guardado` como señal de “última sesión”.

### Estructura sugerida

| Campo | Fuente | Editable |
| --- | --- | --- |
| `session_id` | sistema / frontend | no |
| `matricula` | directorio | no |
| `nombre` | directorio | no |
| `mentor` | directorio | no |
| `comunidad` | directorio | no |
| `periodo` | sistema / operación | no |
| `fecha_sesion` | módulo mentor | sí |
| `etapa` | diagnóstico | no |
| `areas_prioritarias` | diagnóstico | no |
| `pretest_resumen` | pre-test | no |
| `meta_prioritaria` | selección de metas | no |
| `meta_complementaria` | selección de metas | no |
| `horizonte` | plan | no |
| `obstaculo` | plan | no |
| `estrategia` | plan | no |
| `notas_mentor` | módulo mentor | sí |
| `estado_documentacion` | módulo mentor | sí |
| `documentado_crm` | módulo mentor | sí |
| `timestamp_creacion` | sistema | no |
| `timestamp_actualizado` | sistema | no |

### Regla de snapshot

Los campos de contexto deben copiarse como foto fija al guardar la sesión.

No deben apuntar dinámicamente al estado actual del estudiante.

Razonamiento:

- el registro de sesión debe conservar lo que estaba vigente en ese momento
- si el estudiante actualiza metas después, el histórico de la sesión no debe mutar

## Resumen para CRM

El botón `Copiar resumen para CRM` debe generar texto plano, no HTML.

Formato sugerido:

```text
Sesión de mentoría faro — [fecha]
Estudiante: [nombre] ([matrícula]) — Comunidad [X]
Mentor/a: [nombre mentor]

Diagnóstico: [etapa]
Áreas prioritarias: [lista]
Metas acordadas: [lista]

Notas del mentor: [texto libre]
Seguimiento: [seguimiento]
Estado: [estado_documentacion]
```

Esto evita que el mentor tenga que reconstruir manualmente el caso antes de pegarlo en el CRM institucional.

## Regla de vista actual en tablero

El tablero mentor no debe usar “último guardado” como criterio principal.

Decisión:

- mostrar la sesión con `fecha_sesion` más reciente por matrícula;
- usar `timestamp_actualizado` solo para auditoría;
- tratar `Sesiones` como histórico y no como tabla de estado actual.

## Campañas y plantillas

### Qué se elimina

- textarea libre para HTML

### Qué se introduce

- selector de plantilla
- preview
- variables permitidas
- validación antes de enviar

### Plantillas recomendadas

| Tipo | Plantilla | Estado |
| --- | --- | --- |
| invitación al diagnóstico | `invitacion-diagnostico.html` | ajustar y dejar canónica |
| convocatoria a sesión | `invitacion-sesion.html` | crear |
| seguimiento a ausencias | `invitacion-noshow.html` | crear |

### Variables permitidas mínimas

- `{{nombre}}`
- `{{mentor}}`
- `{{comunidad}}`
- `{{diagnostico_url}}`

Variables opcionales a futuro:

- `{{whatsapp}}`
- `{{slogan}}`
- `{{fecha_sesion}}`

### Regla para variables de staff

Si se agrega `whatsapp` u otros datos al staff en Sheets, el backend debe leerlos por encabezado, no por índice de columna.

Razonamiento:

- depender de "columna 10" es frágil
- reordenar columnas rompería el sistema silenciosamente
- la lectura por header es más sostenible y auditable

### Gobernanza recomendada

Cada plantilla debe tener:

- tipo
- versión
- subject
- htmlBody
- variablesPermitidas
- activo
- updatedAt
- updatedBy

## Hoja sugerida para plantillas

Si se quiere mantener la operación en Sheets, agregar:

- `CampaignTemplates`

Columnas:

- `tipo`
- `version`
- `activo`
- `subject`
- `htmlBody`
- `variables_permitidas`
- `descripcion`
- `updated_at`
- `updated_by`

## Fases de implementación

### Fase 1: poda y simplificación del tablero

- mantener `Vista general` como tab principal
- renombrar `Traer de Sheets` a `Actualizar directorio`
- mostrar timestamp de última sincronización
- mantener fetch al iniciar sesión
- retirar del foco operativo `Catálogo de metas`
- reducir `Configuración` a lo mínimo necesario

### Fase 2: mentoría documentable

- expandir `Ver Diagnóstico` con bloque de documentación
- agregar `notas_mentor`
- agregar `estado_documentacion`
- agregar `Copiar resumen para CRM`
- agregar guardado en hoja `Sesiones`

### Fase 3: campañas sostenibles

- quitar edición libre de HTML
- cambiar campañas a selector de plantilla + preview
- formalizar `CampaignTemplates`
- soportar variables permitidas y validación previa al envío

### Fase 4: consolidación

- checkboxes o tipificación de seguimiento
- marca de `documentado_crm`
- mayor trazabilidad histórica por sesión
- refinamiento de preview y validación de campañas
- evaluación posterior de auto-refresh suave, sin eliminar control manual

## Qué no entra en esta fase

- integración directa con CRM
- refactor de rutas o nombres internos `navi_*`
- rebranding visual amplio
- dark mode
- automatización agresiva de sincronización
- edición libre de HTML en frontend
- Goal Manager separado para gobierno del catálogo de metas

## Recomendación principal

El tablero debe evolucionar de un panel de seguimiento a una herramienta de cierre de mentoría.

Eso implica:

- mantener Sheets como fuente de verdad
- podar tabs que duplican operación ya resuelta en Sheets
- sostener el botón manual de actualización
- añadir un módulo de `Resultado de mentoría` con salida lista para CRM
- y después formalizar campañas mediante plantillas controladas

Ese es el siguiente cambio con mayor impacto estructural.

## Documento complementario

Para bajar este roadmap a tareas concretas de archivos, Apps Script y Sheets:

- `webapp/docs/mentor-dashboard-implementation-backlog.md`
