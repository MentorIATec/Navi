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

## Prompt maestro para diseñar nuevas plantillas

```text
Diseña una plantilla HTML de correo para faro, ruta guiada de acompañamiento.

Contexto:
- La plantilla será usada en campañas institucionales de mentoría estudiantil.
- Debe verse bien en correo, no en web.
- Debe ser clara, sobria y útil.
- No usar tono promocional ni grandilocuente.
- La audiencia son estudiantes del Tec.
- El objetivo es mover al estudiante a una acción concreta.

Restricciones:
- Entregar HTML completo.
- Usar solo estos placeholders:
  - {{nombre}}
  - {{mentor}}
  - {{comunidad}}
  - {{app_url}} o {{booking_url}} si aplica
- No usar JavaScript.
- No depender de fuentes externas.
- Mantener compatibilidad razonable con clientes de correo.
- Usar una sola columna y CTA claro.

La plantilla debe incluir:
- encabezado con identidad de faro
- saludo
- contexto breve
- CTA principal
- cierre breve institucional

El tono debe ser:
- humano
- claro
- orientado a acción
- institucionalmente usable

Entrega:
1. asunto sugerido
2. HTML completo
3. nota breve de cuándo usar esta plantilla
```

## Criterio editorial

- cada campaña debe explicar por qué llega ese correo
- el CTA debe ser único y evidente
- el mensaje debe conectar el diagnóstico o la sesión con el siguiente paso
- si la plantilla no aporta contexto suficiente, no entra al catálogo
