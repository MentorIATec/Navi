# Deploy Desde Un Sheet Nuevo (Checklist Operativo)

Guía práctica para desplegar la Brújula en un Google Sheet nuevo, con estructura correcta de hojas y datos.

## 1) ¿Recomendado usar un Sheet nuevo?
Sí. Para piloto es mejor porque:
- separa esta campaña de históricos anteriores
- evita romper automatizaciones previas
- facilita medir impacto por cohorte (ej. `Interacción CRM = No`)

## 2) Estructura de hojas (obligatoria)

### Hoja `Students`
Encabezados sugeridos en fila 1 (en este orden):
1. `email` (obligatorio)
2. `name` (obligatorio)
3. `link` (se rellena con menú)
4. `matricula`
5. `promedio acumulado`
6. `horas de servicio social`
7. `nivel de inglés`
8. `Interacción CRM` (`Si` / `No`)
9. `reminder_count` (el script lo incrementa automáticamente)

Notas:
- Puedes usar `matrícula` con acento; el script reconoce ambas variantes.
- Si faltan `Interacción CRM` o `reminder_count`, el script las crea.

### Hoja `Responses_Processed`
Déjala vacía al inicio. El script crea/completa encabezados automáticamente al primer envío.

## 3) Datos mínimos de carga en `Students`
- `email` válido institucional
- `name` completo
- `Interacción CRM` con `No` para población no atendida 1:1 (segmento de seguimiento)

Plantilla lista para cargar:
- [`Students_template.csv`](/Users/karenguzman/BrujulApp/BrujulaUnificada/Students_template.csv)

Importación rápida:
1. Abre hoja `Students`.
2. `Archivo > Importar > Subir` y selecciona `Students_template.csv`.
3. En opciones de importación usa `Reemplazar datos en la hoja seleccionada`.
4. Verifica encabezados en fila 1.
5. Corre menú `Brujula Unificada > 1. Generar Enlaces Personalizados`.

## 4) Configuración en Apps Script
1. `Extensiones > Apps Script`.
2. Reemplaza `Code.gs` con [`Code.gs`](/Users/karenguzman/BrujulApp/BrujulaUnificada/Code.gs).
3. Crea archivo HTML llamado exactamente `index`.
4. Pega [`index.html`](/Users/karenguzman/BrujulApp/BrujulaUnificada/index.html).
5. Crea y pega plantillas de correo:
- [`EmailInvitation.html`](/Users/karenguzman/BrujulApp/BrujulaUnificada/EmailInvitation.html)
- [`EmailReminder.html`](/Users/karenguzman/BrujulApp/BrujulaUnificada/EmailReminder.html)
- [`EmailResult.html`](/Users/karenguzman/BrujulApp/BrujulaUnificada/EmailResult.html)
6. Verifica en `CONFIG`:
- `SHEET_ID`
- `WEB_APP_URL` (temporal hasta el primer deploy)
- `STUDENTS_SHEET_NAME = 'Students'`
- `RESPONSES_SHEET_NAME = 'Responses_Processed'`
- `WHATSAPP_LINK`
- `OPEN_OFFICE_TEXT` (jueves 9:30–16:00 por defecto)
- `EMAIL_HEADER_IMAGE_URL` (opcional, URL pública de imagen)

## 5) Deploy web app (paso a paso)
1. `Deploy > New deployment`.
2. Tipo: `Web app`.
3. `Execute as`: tu cuenta.
4. `Who has access`: `Anyone with the link`.
5. Deploy y copia URL.
6. Pega esa URL en `CONFIG.WEB_APP_URL`.
7. `Deploy > Manage deployments > Edit > New version > Deploy`.

## 6) Autorizaciones iniciales
Ejecuta manualmente una función como `onOpen` o `generateCustomLinks` para aceptar permisos.

## 7) Checklist de implementación
- [ ] Hoja `Students` creada con encabezados correctos.
- [ ] Hoja `Responses_Processed` creada (vacía).
- [ ] `SHEET_ID` actualizado en `Code.gs`.
- [ ] `WEB_APP_URL` actualizado con URL real del deployment.
- [ ] Deploy publicado y actualizado a nueva versión.
- [ ] Menú `Brujula Unificada` visible en Sheet.
- [ ] Links personalizados generados en columna `link`.
- [ ] Prueba real completada con 1 estudiante.
- [ ] Registro visible en `Responses_Processed`.
- [ ] Correo de resultado recibido (tarjeta de avance + CTA único).

## 8) QA rápido (antes de campaña)
1. Abrir enlace personalizado.
2. Seleccionar etapa y completar test.
3. Validar guardado en `Responses_Processed`:
- `stage`, `stage_label`, `score_total`, `profile_scenario`
- `attempt_number`
- `student_matricula`, `student_avg`, `student_ss_hours`, `student_english_level`, `student_interaccion_crm`
4. Confirmar límite de respuesta:
- segunda respuesta debe bloquearse (si `MAX_SUBMISSIONS_PER_EMAIL = 1`).
5. Enviar recordatorio de prueba y validar subject numerado (`Recordatorio #N`).

## 9) Operación de campaña
1. Menú `1. Generar Enlaces Personalizados`.
2. Menú `2. Enviar Invitación Inicial`.
3. A las 24–48h, menú `3. Enviar Recordatorios (Pendientes)`.
4. Menú `5. Ver Resumen Observabilidad V1`.
5. Menú `6. Ver Resumen de Envíos`.
6. Menú `7. Poblar Campos Base (Students)` para completar faltantes en:
- `semestre`
- `horas de servicio social`
- `promedio acumulado`
- `requisito de inglés`

## 10) Métricas clave para seguimiento
- total estudiantes
- respondieron / pendientes
- tasa de respuesta global
- respuesta en segmento `Interacción CRM = No`
- distribución por perfil (`Consolidado`, `Desarrollo`, `Oportunidad`)
- tiempo promedio de completado

## 11) Problemas comunes
### “No se encontró el archivo HTML llamado index”
- crea archivo HTML llamado exactamente `index` (minúsculas)

### Cambios no se reflejan
- siempre redeploy con `New version`
- probar en incógnito + hard refresh

### No se guarda respuesta
- validar `SHEET_ID`
- validar nombres de hoja
- revisar `Execution log` en Apps Script

## 12) Nota de alcance
Esta versión prioriza test corto + información accionable en minutos.
La capa reflexiva de propósito de vida y metas históricas se integra en siguiente iteración.
