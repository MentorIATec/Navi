# Email Templates — faro

Templates HTML para las campañas de correo enviadas desde el panel de administración.

## Archivos

| Archivo | Campaña | Cuándo usar |
|---|---|---|
| `invitacion-diagnostico.html` | Invitación al diagnóstico | Inicio de campaña o retoma de semestre |

## Tags disponibles

Estos tags se reemplazan dinámicamente al momento de enviar:

| Tag | Valor |
|---|---|
| `{{nombre}}` | Nombre preferido del estudiante |
| `{{mentor}}` | Nombre del mentor asignado |
| `{{comunidad}}` | Nombre de la comunidad |
| `{{slogan}}` | Slogan de la comunidad (viene del Sheet de mentores) |
| `{{whatsapp}}` | Número de WhatsApp del mentor (ej. `5218001234567`) |

## Datos de mentor/comunidad/WhatsApp

La fuente de verdad es el **Sheet de mentores** en Google Sheets.
Columnas actuales: `name`, `nickname`, `email`, `community`, `hex`, `slogan`

**Pendiente:** agregar columna `whatsapp` al Sheet para habilitar el botón de contacto en los correos.
El formato recomendado es número internacional sin `+` ni espacios: `5218001234567`

## Cómo usar un template en el panel

1. Abrir el HTML en cualquier editor o navegador
2. Copiar el contenido del `<body>` (o el HTML completo)
3. Pegarlo en el campo **Cuerpo HTML** del panel de Preparar campaña
4. Los tags `{{nombre}}`, `{{mentor}}`, etc. se reemplazan automáticamente al enviar
