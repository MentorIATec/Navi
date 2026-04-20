# Email Templates — faro

Plantillas HTML controladas para campañas enviadas desde administración.

## Regla de producto

- las plantillas viven versionadas en el repo
- el panel de admin no permite HTML libre
- las campañas se prueban desde admin y luego se envían
- `faro` no expone a mentores la gestión técnica de plantillas

## Catálogo actual

| Archivo | Campaña | Estado |
|---|---|---|
| `campaign-invitation-v1.html` | Invitación al diagnóstico | Activa |
| `campaign-session-v1.html` | Convocatoria a sesión | Activa |
| `campaign-noshow-v1.html` | Seguimiento a ausencias | Activa |
| `invitacion-diagnostico.html` | Referencia editorial anterior | Archivo legado |

## Placeholders soportados

### Reemplazados por el backend al enviar

| Placeholder | Fuente |
|---|---|
| `{{nombre}}` | Nombre preferido del estudiante |
| `{{mentor}}` | Mentor/a asignado |
| `{{comunidad}}` | Comunidad derivada del estudiante/mentor |

### Reemplazados por el frontend al preparar la campaña

| Placeholder | Fuente |
|---|---|
| `{{app_url}}` | URL base pública de `faro` |
| `{{booking_url}}` | URL activa de agenda |

## Pipeline para nuevas plantillas

1. Definir el brief de campaña.
   - objetivo
   - audiencia
   - momento del flujo
   - CTA esperado

2. Aprobar copy base.
   - asunto
   - título
   - contexto
   - CTA
   - placeholders

3. Diseñar la plantilla como archivo nuevo.
   - nombrar con versión: `campaign-<tipo>-vN.html`
   - mantener solo placeholders soportados
   - no introducir HTML libre en runtime

4. Conectar la plantilla al catálogo controlado del producto.
   - subject por defecto
   - helper de admin
   - preview local
   - prueba de envío

5. Validar.
   - preview en modal
   - correo de prueba
   - revisión editorial
   - aprobación final

## Criterio editorial

- cada campaña debe explicar por qué llega ese correo
- el CTA debe ser único y evidente
- el mensaje debe conectar el diagnóstico o la sesión con el siguiente paso
- si la plantilla no aporta contexto suficiente, no entra al catálogo
- no asumir hechos no confirmados, salvo en la convocatoria a sesión
- la voz visible del correo representa a `Mentoría Estudiantil`
- el cuerpo puede aclarar quién acompaña el proceso mediante nombre y comunidad
