# Micro Pre-test Presencial

## Propósito

El micro pre-test presencial de `faro` no es un instrumento diagnóstico ni de tamizaje. Su función es breve y operativa:

1. validar y empatizar con el estado actual del estudiante antes de iniciar la conversación;
2. orientar a la persona mentora sobre el tono o tipo de intervención que conviene adoptar en esa sesión.

No busca etiquetar, alertar ni clasificar riesgo. Tampoco sustituye la escucha del mentor o mentora.

## Decisión metodológica

Se mantienen **2 preguntas**, pero deben medir dimensiones distintas.

La versión anterior repetía casi la misma dimensión dos veces:

- cómo llega el estudiante;
- qué tan claro ve su siguiente paso.

Eso producía redundancia y poca señal nueva para mentoría. La revisión editorial y pedagógica concluyó que era mejor conservar dos preguntas **ortogonales**:

1. **Estado de llegada**
2. **Intención de la sesión**

La combinación `estado x intención` aporta más valor que cualquiera de las dos por separado.

## Estructura vigente

### Pregunta 1

`Hoy llego a esta sesión...`

Opciones:

- `Con energía y ganas de avanzar`
- `Con algo de carga o cansancio`
- `Con muchas cosas en la cabeza`
- `Con incertidumbre sobre mis siguientes pasos`

### Pregunta 2

`Lo que más me gustaría que pasara en esta sesión es...`

Opciones:

- `Revisar mis avances y ajustar lo que sigue`
- `Ordenar mis prioridades y saber por dónde empezar`
- `Entender algo que me tiene confundido/a`
- `Salir con un paso concreto, aunque sea pequeño`

## Dimensiones que mide

### Estado de llegada

No diagnostica emocionalmente al estudiante. Solo captura el tono de entrada con el que llega a la conversación:

- energía disponible
- carga o cansancio
- dispersión
- incertidumbre sobre dirección

Esta señal ayuda a calibrar ritmo, paciencia, apertura y nivel de estructura durante la sesión.

### Intención de la sesión

No mide “agencia” en sentido psicológico. Mide qué espera obtener la persona estudiante en ese momento.

Captura una intención concreta de la conversación:

- revisar avances
- ordenar prioridades
- entender algo que hoy no ve claro
- salir con un paso concreto

Esta dimensión ayuda al mentor o mentora a ajustar la conversación al resultado que más valor tendría para el estudiante hoy.

## Uso dentro del producto

El resultado se resume después en el bloque `Cómo llegas hoy` dentro de la vista de resultados presencial.

Ese bloque no pretende ser un reporte exhaustivo. Debe funcionar como contexto breve para la sesión:

- legible en pocos segundos
- útil para abrir conversación
- sin lenguaje clínico
- sin sensación de urgencia

## Implicaciones estructurales en código

### Frontend

El micro pre-test usa:

- `arrival` para estado de llegada
- `intent` para intención de la sesión

El nombre anterior `agency` quedó descartado por no corresponder a lo que realmente medía la pregunta.

### Compatibilidad transitoria

Se mantiene compatibilidad con sesiones viejas en `localStorage` que aún tengan la key `agency`.

La app hace fallback de lectura para no romper sesiones guardadas antes del cambio.

### Backend / Sheets

Hoy el resumen sigue escribiéndose en el campo legacy `AgenciaCheckIn`, aunque conceptualmente ya no representa “agencia”.

No es bloqueante en esta fase, pero el nombre del campo debería revisarse más adelante. Un nombre más correcto sería:

- `PreTestResumen`
- o `PreTestLlegadaSesion`

## Criterios editoriales

El micro pre-test debe:

- sonar humano y claro;
- evitar tono clínico;
- evitar lenguaje alarmista;
- evitar repetir la misma dimensión en dos preguntas;
- ofrecer al mentor o mentora una señal útil sin sobredimensionar el resultado.

## Razón para publicación futura

Si en una fase posterior se documenta el sustento metodológico de `faro` o se explica al equipo de mentoría la lógica del instrumento, esta decisión debe presentarse como:

- una herramienta breve de contextualización conversacional;
- no un instrumento diagnóstico;
- con dos dimensiones complementarias: **cómo llega** y **qué necesita hoy de la sesión**.
