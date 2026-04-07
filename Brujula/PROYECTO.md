# Brújula de Avance Estudiantil — Resumen del Proyecto

## Objetivo
Sistema breve (2 minutos) para que estudiantes se autoevalúen en su avance académico, reciban recomendaciones accionables y activen una conversación con su mentora.

## Arquitectura actual (V1)
- Frontend: `index.html` (web app de Google Apps Script).
- Backend: `Code.gs` (lógica, scoring, persistencia y envío de correos).
- Base de datos: Google Sheets (`Students` + `Responses_Processed`).
- Correo HTML desacoplado en plantillas:
  - `EmailInvitation.html`
  - `EmailReminder.html`
  - `EmailResult.html`

## Flujo funcional
1. Estudiante recibe enlace personalizado.
2. Selecciona etapa (`Exploracion` o `Enfoque`).
3. Responde 4 preguntas (sin avance automático).
4. Se calcula puntaje (0-100) y perfil (`Consolidado`, `Desarrollo`, `Oportunidad`).
5. Se guarda registro en `Responses_Processed`.
6. Se envía correo de resultado con CTA a WhatsApp.

## Reglas operativas activas
- Máximo de respuestas por estudiante: `1` (backend).
- Recordatorios solo para estudiantes pendientes.
- Conteo de recordatorios por estudiante (`reminder_count`).
- Segmentación CRM por columna `Interacción CRM`.

## Configuración central (`Code.gs > CONFIG`)
- `SHEET_ID`
- `WEB_APP_URL`
- `WHATSAPP_LINK`
- `OPEN_OFFICE_TEXT`
- `EMAIL_HEADER_IMAGE_URL`

## Asset de correo
- Header image: `assets/Codigo-1-1024x631.jpg`
- URL pública configurada para correos:
  - `https://cdn.jsdelivr.net/gh/MentorIATec/Brujula@main/assets/Codigo-1-1024x631.jpg`

## Documentación operativa incluida
- `README.md` (setup, flujo `clasp`, operación).
- `DEPLOY_SHEETS.md` (checklist de despliegue desde sheet nuevo).
- `PRODUCT_CONTEXT.md` (contexto de producto y lineamientos).
- `Students_template.csv` (plantilla de carga).
