# Resumen CRM de Mentoría

## Propósito

El resumen sugerido para CRM en `faro` no debe ser un volcado técnico del sistema ni una interpretación diagnóstica del estudiante.

Su función es:

- traducir datos del flujo de mentoría a una descripción breve y legible;
- ayudar al mentor o mentora a documentar la sesión con menos fricción;
- preservar acuerdos y contexto útil sin convertir la herramienta en un evaluador del estudiante.

## Regla de producto

`faro` no sustituye el CRM institucional ni debe convertirse en un tablero de gestión integral de casos.

Su papel es más acotado:

- consolidar contexto útil antes de la conversación;
- facilitar la documentación posterior;
- reducir el tiempo que el mentor invierte en reconstruir lo que pasó.

### Decisión

- el registro oficial del caso sigue viviendo en el CRM institucional;
- `faro` actúa como facilitador de captura y síntesis;
- no se debe ampliar el tablero hasta volverlo una consola pesada de seguimiento administrativo.

## Riesgo principal

El mayor riesgo es presentar datos crudos con apariencia de resumen humano.

Eso ocurre cuando el sistema concatena:

- códigos internos;
- nombres técnicos de categorías;
- estados booleanos;
- metadatos de operación;

en un texto que parece narrativo, pero no comunica de forma útil a un lector institucional.

El segundo riesgo es interpretar de más:

- un puntaje bajo no autoriza a afirmar que el estudiante “tiene un problema”;
- el pre-test presencial no autoriza etiquetas emocionales fuertes;
- la herramienta no debe diagnosticar ni producir alertas implícitas.

## Qué sí debe entrar al resumen

### Datos estructurados

- nombre preferido y matrícula;
- mentor o mentora;
- comunidad;
- fecha de sesión.

### Contexto de la sesión

- síntesis breve del pre-test presencial;
- áreas del diagnóstico nombradas en lenguaje humano;
- metas y acuerdos tomados durante la sesión.

### Texto atribuible al mentor

- notas adicionales del mentor o mentora, solo si fueron escritas.

## Qué no debe entrar de forma literal

- scores numéricos;
- keys técnicas del diagnóstico como `claridad_carrera` o `desempeno_academico`;
- claves internas del pre-test;
- estados del sistema como `documentadoCrm`;
- la etiqueta `modalidad`.

## Regla sobre modalidad

`Modalidad` no es una categoría que aporte valor narrativo en este sistema.

Por regla de negocio:

- el diagnóstico se realiza de forma remota, salvo excepción;
- el check-in corresponde a la sesión presencial;
- no hace falta reiterar esa distinción en texto visible ni en el resumen sugerido para CRM.

### Decisión

- no mostrar `modalidad` en el resumen narrativo;
- no destacarla en la vista mentor;
- mantener compatibilidad temporal del schema mientras se poda progresivamente del registro.

## Estructura recomendada del resumen

El resumen sugerido para CRM debe seguir esta secuencia:

1. identificación;
2. contexto breve de llegada;
3. áreas prioritarias del diagnóstico;
4. compromisos acordados;
5. notas del mentor o mentora, si existen.

## Principios editoriales

### 1. Traducción, no transcripción

Todo dato que no sea legible fuera del modelo de `faro` debe traducirse antes de entrar al CRM.

### 2. Tono de oportunidad, no de déficit

Las áreas del diagnóstico se describen como áreas de trabajo prioritario, no como fallas del estudiante.

### 3. La voz del estudiante se preserva en compromisos

Las metas, el obstáculo y la estrategia deben respetar la formulación elegida por el estudiante siempre que sea posible.

### 4. El juicio pertenece al mentor, no a la herramienta

La inferencia cualitativa no la produce `faro`. Solo aparece en el campo de notas del mentor o mentora.

### 5. Brevedad útil

El resumen debe ser claro y pegable. No necesita exponer todos los metadatos del sistema.

## Checklist para knowledge metodológico

### Sobre datos

- usar etiquetas humanas canónicas para categorías del diagnóstico;
- no mostrar scores en texto visible ni en CRM;
- no traducir el pre-test a etiquetas de riesgo;
- no incluir modalidad como descriptor narrativo;
- mantener metas, obstáculo y estrategia como compromisos del estudiante.

### Sobre tono

- describir la sesión, no evaluar al estudiante;
- evitar lenguaje clínico, alarmista o correctivo;
- nombrar áreas como prioridades de trabajo, no como debilidades;
- dejar la interpretación cualitativa al mentor.

### Sobre estructura

- identificación;
- llegada;
- diagnóstico;
- compromisos;
- notas del mentor.

### Sobre herramienta

- `faro` sugiere un resumen; no genera un informe definitivo;
- el mentor revisa y ajusta antes de documentar en CRM;
- `Documentado en CRM` es estado operativo, no parte del texto narrativo.
- el tablero no reemplaza el seguimiento formal del CRM;
- cualquier acceso a histórico dentro de `faro` debe servir a la continuidad de la mentoría, no a crear una segunda herramienta de gestión de casos.
