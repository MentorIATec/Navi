# Brujula Unificada (Apps Script + Sheets)

Sistema integrado para orientar estudiantes en dos etapas:
- Exploracion: estudiante en avenida o sin carrera de egreso consolidada.
- Enfoque: estudiante con carrera de egreso definida y decisiones de consolidacion.

## Alcance V1 (actual)
V1 se mantiene corto y accionable:
1. Seleccion de etapa.
2. Test de 4 preguntas por etapa.
3. Puntaje + perfil.
4. Correo con sugerencias y CTA de mentoria.

No incluye todavia bloque reflexivo de proposito de vida/metas (queda para fase 2).

## 1. Estructura esperada en Google Sheet

### Hoja `Students`
- Columna A: `email` (obligatoria)
- Columna B: `name` (obligatoria)
- Columna C: `link` (se genera con menu)

Columnas opcionales (preparacion fase 2, no requeridas en V1):
- `semester`
- `service_social_progress`
- `average_grade`
- `english_requirement`
- `purpose_statement`
- `historical_goals`

### Hoja `Responses_Processed`
- Se crea/usa con headers automaticos al primer envio.

## 2. Configuracion
Edita `Code.gs` en `CONFIG`:
- `SHEET_ID`
- `WEB_APP_URL`
- nombres de hojas si aplica

## 3. Despliegue
1. Crea proyecto de Apps Script desde tu Sheet.
2. Copia `Code.gs` y `index.html`.
3. Deploy > New deployment > Web app.
4. Access: Anyone with the link.
5. Copia URL generada y pegala en `CONFIG.WEB_APP_URL`.
6. Redeploy.

## 3.1 Esquema de trabajo (estandar con `clasp`)
Para siguientes iteraciones en este proyecto, usamos este flujo:
1. Editar archivos locales en `BrujulaUnificada/`.
2. Ejecutar `clasp push -f` para actualizar Apps Script remoto.
3. Si cambió UI/lógica de web app: `Deploy > Manage deployments > Edit > New version > Deploy`.

Configuración local esperada:
- `.clasp.json` con `scriptId` del proyecto.
- `.claspignore` para empujar `appsscript.json`, `Code.gs`, `index.html` y `Email*.html`.

## 3.2 Plantillas de correo (editables)
Para editar contenido/estilo de correos sin tocar bloques largos de JS:
- `EmailInvitation.html`: invitación inicial.
- `EmailReminder.html`: recordatorios.
- `EmailResult.html`: correo de resultados.

Variables principales en `Code.gs > CONFIG`:
- `WHATSAPP_LINK`
- `OPEN_OFFICE_TEXT` (actual: jueves 9:30 a 16:00)
- `EMAIL_HEADER_IMAGE_URL` (opcional, imagen de cabecera pública)

## 4. Operacion semanal
1. Actualiza lista de estudiantes en `Students`.
2. Menu `Brujula Unificada` > `Generar Enlaces Personalizados`.
3. Envia invitacion inicial.
4. Envia recordatorios a pendientes.
5. Da seguimiento a `profile_scenario`, `score_total`, `interest_topic`.

## 4.1 Prueba de correo antes de envío masivo
- Menu `Brujula Unificada` > `4. Enviar Correo de Prueba`.
- Ingresa un email destino.
- El sistema envía la invitación con subject prefijado: `[PRUEBA] ...`.
- Si el correo no existe en `Students`, envía versión de prueba con datos base vacíos.

## 5. Flujo funcional (V1)
1. Estudiante entra por enlace personalizado.
2. Selecciona etapa (`Exploracion` o `Enfoque`).
3. Responde 4 preguntas de su etapa.
4. Sistema calcula puntaje 0-100 + perfil (`Consolidado`, `Desarrollo`, `Oportunidad`).
5. Se guarda en Sheet y se envia correo con sugerencias + CTA de mentoria.

## 6. Fase 2 (cuando V1 este estable)
Objetivo: sumar reflexion guiada y datos historicos sin perder experiencia corta.

Agregar:
1. Sugerencia de etapa por semestre (1-3 exploracion, 4-6 enfoque) con override manual.
2. Bloque reflexivo final:
- vigencia de metas historicas
- vigencia de proposito de vida
3. CTA doble:
- agendar entrevista
- actualizar en Mi Vida Tec

## 7. Plan de migracion a Supabase/Vercel (futuro)
Migrar cuando se cumpla al menos 2 de 3:
1. Integraciones productivas adicionales.
2. Requerimientos de seguridad/roles mas estrictos.
3. Mayor volumen operativo y analitica en tiempo real.

## 8. Observabilidad V1
Se agrego medicion operativa minima para seguimiento semanal.

### Nuevos campos en `Responses_Processed`
- `quiz_started_ts`
- `quiz_completed_ts`
- `completion_seconds`
- `priority_click_ts`

### Menu operativo
En el menu del Sheet:
- `5. Ver Resumen Observabilidad V1`
- `6. Ver Resumen de Envíos`

`Resumen Observabilidad V1` muestra:
- estudiantes en lista
- estudiantes que respondieron
- tasa de respuesta
- distribucion por perfil
- promedio de tiempo de completado
- estudiantes con prioridad seleccionada
- clicks de prioridad desde correo

`Resumen de Envíos` muestra:
- cobertura de invitación inicial (enviados vs pendientes)
- total de recordatorios enviados
- estudiantes con recordatorios
- métricas del segmento `Interacción CRM = No`

## 9. Regla de intentos
- Cada estudiante puede responder la Brújula un maximo de 1 vez.
- El limite se valida en backend (Apps Script), no solo en frontend.
- Al llegar al limite, se bloquea nuevo envio y se muestra mensaje para contactar a su mentora.

## 10. Segmento CRM y recordatorios
En `Students` agrega/usa estas columnas operativas:
- `Interacción CRM`: valores sugeridos `Si` / `No`
- `reminder_count`: contador de recordatorios enviados (autogestionado por script)
- `invitation_sent_ts`: fecha/hora de envío de invitación inicial

Uso:
- El resumen `Observabilidad V1` ahora reporta especificamente la poblacion `Interacción CRM = No` (respondieron vs pendientes).
- Los recordatorios se envian con subject numerado: `Recordatorio #N`.

## 11. Invitación inicial (versión unificada)
`sendInitialInvitationEmails()` usa una sola versión de mensaje para todos los estudiantes.
El script registra únicamente `invitation_sent_ts` en `Students`.
