# faro: Mentor Dashboard Implementation Backlog

## Objetivo

Traducir el roadmap del tablero mentor a una secuencia concreta de implementación.

Este documento no redefine producto. Baja a tareas concretas:

- archivos a tocar
- cambios en Sheets
- cambios en Apps Script
- decisiones de UI mínimas
- orden recomendado

## Principios de implementación

- no tocar rutas ni nombres internos `navi_*`
- no hacer refactor visual amplio
- mantener Google Sheets como fuente de verdad
- reducir duplicidad entre lo que se administra en Sheets y lo que se intenta administrar en la webapp
- priorizar la utilidad real del mentor sobre la sofisticación del panel
- no convertir el tablero en un reemplazo del CRM ni en una consola pesada de gestión de casos

## Estado actual relevante

### Frontend

Archivo principal:

- [AdminDashboard.jsx](/Users/karenguzman/BrujulApp/webapp/src/pages/AdminDashboard.jsx)

Puntos actuales:

- header con `Traer de Sheets` y `Guardar en Sheets`
- tabs:
  - `dashboard`
  - `upload`
  - `goals`
  - `settings`
- campañas dentro de `dashboard`
- modal `Ver Diagnóstico`
- `GoalManager` embebido en la tab `goals`
- envío de campañas vía `apiClient.post('sendCampaign', ...)`

### API client

Archivo:

- [client.js](/Users/karenguzman/BrujulApp/webapp/src/api/client.js)

Puntos actuales:

- persiste parte del estado en `localStorage`
- soporta `sendCampaign`
- soporta `syncBulk`
- soporta `saveGoalsCatalog`
- soporta `saveMetasConfig`

### Apps Script

Archivo:

- [NaviEngine.gs](/Users/karenguzman/BrujulApp/webapp/google-apps-script/NaviEngine.gs)

Puntos actuales:

- `doGet` entrega `students`, `staff`, `responses`
- `syncBulk` actualiza `Students`
- `saveGoalsCatalog` y `saveMetasConfig` siguen activos
- `sendCampaignHandler` envía campañas reales
- lectura de `Staff` y `Students` ya está centralizada del lado backend

## Fase 1: poda del tablero

### Objetivo

Reducir el tablero a lo que sí tiene valor operativo cotidiano.

### Cambios de frontend

#### [AdminDashboard.jsx](/Users/karenguzman/BrujulApp/webapp/src/pages/AdminDashboard.jsx)

1. Cambiar copy del header:
   - `Traer de Sheets` -> `Actualizar directorio`
   - ícono `Activity` -> ícono de refresh o sync

2. Agregar marca temporal de sincronización:
   - nuevo estado local: `lastSyncAt`
   - actualizarlo cuando `handleFetchFromSheets` termine bien
   - renderizarlo cerca del botón de actualización

3. Simplificar tabs para admin:
   - mantener `dashboard`
   - mantener `settings` solo si sigue siendo necesaria
   - retirar del flujo visible:
     - `upload`
     - `goals`

4. Ajustar subtítulo del panel admin:
   - quitar énfasis en campañas y catálogo
   - enfocar en seguimiento y documentación de mentoría

### Qué no se implementa aún

- borrar código de `upload` o `goals`
- eliminar `GoalManager`
- quitar `saveGoalsCatalog` del backend

Primero se desactiva del flujo visible. La eliminación técnica puede ir después.

### Criterio de aceptación

- el tablero ya no se presenta como consola de administración general
- el foco visual y funcional queda en seguimiento de estudiantes
- el equipo entiende que el directorio se refresca manualmente desde Sheets

## Fase 2: resultado de mentoría

### Objetivo

Expandir el modal `Ver Diagnóstico` hasta convertirlo en una herramienta de documentación de sesión.

### Cambios en Sheets

Nueva hoja:

- `Sesiones`

### Esquema propuesto

Headers:

- `session_id`
- `matricula`
- `nombre`
- `mentor`
- `comunidad`
- `periodo`
- `fecha_sesion`
- `etapa`
- `areas_prioritarias`
- `pretest_resumen`
- `meta_prioritaria`
- `meta_complementaria`
- `horizonte`
- `obstaculo`
- `estrategia`
- `notas_mentor`
- `estado_documentacion`
- `documentado_crm`
- `timestamp_creacion`
- `timestamp_actualizado`

### Cambios en Apps Script

#### [NaviEngine.gs](/Users/karenguzman/BrujulApp/webapp/google-apps-script/NaviEngine.gs)

Agregar:

1. `SESSIONS_HEADERS`
2. `ensureSheetWithHeaders_(ss, 'Sesiones', SESSIONS_HEADERS)`
3. acción nueva en `doPost`:
   - `saveMentoringSession`
4. función:
   - `saveMentoringSession(ss, data)`

Reglas:

- guardar snapshot, no referencias dinámicas
- validar `matricula`
- validar `fecha_sesion`
- permitir guardar borrador/documentado
- distinguir creación vs edición por `session_id`
- hacer upsert por `session_id`, no por `matricula + fecha_sesion`

### Cambios de frontend

#### [AdminDashboard.jsx](/Users/karenguzman/BrujulApp/webapp/src/pages/AdminDashboard.jsx)

Ampliar el modal `selectedStudentForDiagnostic`:

1. bloque `Contexto del estudiante`
   - reutilizar lo que ya existe

2. bloque `Metas acordadas`
   - leer desde los datos actuales del estudiante si ya están disponibles
   - si faltan en payload actual, definir qué fuente falta exponer

3. bloque `Documentación del mentor`
   - textarea `notas_mentor`
   - selector `estado_documentacion`

4. acciones:
   - `Copiar resumen para CRM`
   - `Guardar en Sheets`

### Cambios de API client

#### [client.js](/Users/karenguzman/BrujulApp/webapp/src/api/client.js)

Agregar soporte para:

- `saveMentoringSession`

### Criterio de aceptación

- el mentor puede abrir un estudiante
- leer contexto consolidado
- agregar notas
- copiar un resumen usable
- guardar la sesión en `Sesiones`
- editar una sesión existente sin crear duplicado
- crear una sesión nueva sin sobrescribir una anterior
- el tablero muestra la sesión con `fecha_sesion` más reciente, no la última editada

## Fase 3: campañas sostenibles

### Objetivo

Reemplazar edición libre de HTML por plantillas controladas.

### Alcance del piloto

- mantener tres campañas oficiales activas
- usar el modal para preparar, probar y enviar
- no abrir todavía selector de múltiples plantillas por campaña
- dejar el modelo de preview sujeto a revisión después del piloto

### Cambios en frontend

#### [AdminDashboard.jsx](/Users/karenguzman/BrujulApp/webapp/src/pages/AdminDashboard.jsx)

Eliminar o desactivar:

- textarea de `htmlBody`

Reemplazar por:

1. selector de plantilla
2. preview no editable
3. subject editable solo si se aprueba esa flexibilidad
4. lista explícita de variables disponibles

### Trabajo diferido

No entra en esta fase:

- selector de múltiples plantillas HTML por campaña
- catálogo navegable de campañas aprobadas
- grilla escalable de mentores para operación campus completa
- búsqueda o filtros de metas en `/seleccion-metas`
- historial completo de sesiones como vista principal

Sí queda documentado para una siguiente fase:

1. agregar chip de `Documentado en CRM` en el directorio
2. permitir búsqueda por palabra clave de metas
3. sustituir la selección visual simple de mentores por búsqueda o filtro por comunidad
4. reevaluar si el preview de campañas debe mantenerse o reducirse a ficha de campaña + versión activa

### Cambios en plantillas

Carpeta:

- [email-templates](/Users/karenguzman/BrujulApp/webapp/email-templates)

Acciones:

1. revisar [invitacion-diagnostico.html](/Users/karenguzman/BrujulApp/webapp/email-templates/invitacion-diagnostico.html)
2. convertirla en plantilla canónica reusable
3. crear luego:
   - `invitacion-sesion.html`
   - `invitacion-noshow.html`

### Cambios en Apps Script

#### [NaviEngine.gs](/Users/karenguzman/BrujulApp/webapp/google-apps-script/NaviEngine.gs)

Decidir una de estas dos rutas:

1. plantillas almacenadas en código o archivos exportados
2. plantillas almacenadas en hoja `CampaignTemplates`

Mi recomendación:

- `CampaignTemplates` en Sheets, con estructura rígida

Headers sugeridos:

- `tipo`
- `version`
- `activo`
- `subject`
- `htmlBody`
- `variables_permitidas`
- `descripcion`
- `updated_at`
- `updated_by`

### Variables permitidas

Mínimas:

- `{{nombre}}`
- `{{mentor}}`
- `{{comunidad}}`
- `{{diagnostico_url}}`

Opcionales:

- `{{whatsapp}}`
- `{{slogan}}`
- `{{fecha_sesion}}`

### Reglas de implementación

- no leer `whatsapp` por columna fija
- leer `Staff` por header
- validar que una variable usada tenga dato disponible antes de enviar

### Criterio de aceptación

- el panel no permite HTML arbitrario
- el admin selecciona una plantilla aprobada
- ve preview
- envía con variables soportadas y validadas

## Fase 4: consolidación

### Objetivo

Reducir riesgos operativos y endurecer el modelo.

### Cambios posibles

1. evaluar auto-refresh suave en dashboard
2. marcar `documentado_crm`
3. mejorar búsqueda y filtros del directorio
4. archivar o remover código ya retirado de tabs inactivas
5. mover gestión de metas a proyecto separado `Goal Manager`

### Adición futura fuera del piloto

Historial ligero de sesiones por estudiante:

- visible dentro del contexto del estudiante, no como nueva pantalla principal;
- mostrar últimas sesiones con:
  - fecha
  - estado
  - meta prioritaria
  - acción para ver resumen o retomar

No incluye:

- grilla administrativa completa;
- vista tipo Airtable;
- reemplazo del CRM institucional.

## Dependencias y riesgos

### Dependencias

- acceso a la hoja `Sesiones`
- definición final de headers en `Staff`
- confirmación de qué datos de metas ya están disponibles en frontend/backend

### Riesgos

1. intentar resolver campañas antes de cerrar `Resultado de mentoría`
2. seguir manteniendo demasiada configuración en el tablero
3. mezclar esta fase con rebranding o rediseño visual
4. depender de índices de columna en Sheets
5. intentar abrir una vista histórica pesada antes del piloto

## Orden recomendado de ejecución

1. Fase 1: poda del tablero
2. Fase 2: `Resultado de mentoría`
3. Fase 3: campañas sostenibles
4. Fase 4: consolidación
5. después del piloto: evaluar historial ligero por estudiante

## Definición de listo por fase

### Fase 1 lista si:

- tabs visibles ya están simplificadas
- botón de sync ya dice `Actualizar directorio`
- se muestra última sincronización

### Fase 2 lista si:

- existe hoja `Sesiones`
- el modal guarda sesión
- el mentor puede copiar resumen para CRM

### Fase 3 lista si:

- no existe textarea libre de HTML
- hay plantillas aprobadas
- el envío usa variables validadas

### Fase 4 lista si:

- el tablero quedó enfocado en operación real
- el resto de la deuda ya está acotada o movida fuera del panel
