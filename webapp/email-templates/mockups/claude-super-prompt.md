# Prompt maestro para Claude

```text
Diseña una batería de correos HTML para mentoría estudiantil del Tec de Monterrey.

No quiero una sola plantilla aislada. Quiero propuestas de campaña que luego puedan entrar al catálogo oficial del producto.

Contexto:
- El estudiante todavía no necesariamente conoce el nombre `faro`.
- Por eso el correo no debe asumir familiaridad con la herramienta.
- El mensaje debe comunicar primero el valor del diagnóstico y de la pausa para revisar su trayectoria estudiantil.
- La campaña busca mover al estudiante a una acción concreta.
- El tono debe transmitir oportunidad y cierto sentido de momento importante, sin sonar alarmista ni coercitivo.
- Este correo será usado en mentoría estudiantil institucional.
- No estamos vendiendo un producto.
- No queremos lenguaje marketinero, grandilocuente ni excesivamente emocional.

Restricciones editoriales:
- Evitar guiones medios.
- Evitar toda mención o insinuación de AI.
- Evitar frases vacías o genéricas como:
  - "más claridad"
  - "ruta guiada"
  - "acompañamiento personalizado"
  si no aportan contenido real
- No sobrecargar con texto.
- El estudiante debe entender rápido:
  1. por qué recibió el correo
  2. qué tiene que hacer
  3. por qué importa hacerlo ahora

Restricciones de implementación:
- Entregar HTML completo.
- Mantener una sola columna.
- Compatibilidad razonable con clientes de correo.
- No usar JavaScript.
- No depender de fuentes externas.
- Usar solo estos placeholders:
  - {{nombre}}
  - {{mentor}}
  - {{comunidad}}
  - {{app_url}} si el CTA es entrar al diagnóstico
  - {{booking_url}} si el CTA es agendar o reagendar

Campañas a trabajar:
1. Invitación al diagnóstico
2. Convocatoria a sesión
3. Seguimiento a ausencias

Objetivo editorial específico por campaña:

1. Invitación al diagnóstico
- Comunicar que este es un buen momento para detenerse y revisar cómo va su trayectoria estudiantil.
- Explicar que el diagnóstico servirá para aprovechar mejor la conversación con mentoría.
- No centrar el mensaje en el nombre de la herramienta.

2. Convocatoria a sesión
- Comunicar que ya existe información suficiente para pasar a una conversación útil.
- Explicar que la sesión ayudará a aterrizar prioridades, metas y próximos pasos.

3. Seguimiento a ausencias
- Reconocer que no pudo asistir, sin tono de reclamo.
- Facilitar el regreso y recuperar continuidad.

Entrega esperada:
Para cada campaña:
1. asunto sugerido
2. intención editorial en 2 o 3 líneas
3. HTML completo
4. breve nota de por qué esta versión podría funcionar mejor que una versión genérica

Criterio de calidad:
- Si el correo se entiende solo porque menciona `faro`, está mal resuelto.
- Si el CTA está claro pero el contexto no justifica la acción, está incompleto.
- Si el diseño es atractivo pero el mensaje sigue siendo genérico, no sirve.

No escribas explicación general sobre email marketing.
No des teoría.
Quiero propuestas concretas, listas para revisar y guardar como mockups.
```
