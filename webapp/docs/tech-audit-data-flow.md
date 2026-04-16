# Navi — Auditoría técnica: flujo de datos y grietas estructurales
**Fecha:** 2026-04-15  
**Elaborado por:** Karen Guzmán / Claude Code  
**Destinatario:** Antigravity  
**Estado del sistema auditado:** Beta piloto activa (rama `main`, commit `e534657`)

---

## Contexto

Navi es una aplicación web de mentoría estudiantil del Tecnológico de Monterrey. Los estudiantes responden un diagnóstico de trayectoria antes de su sesión de mentoría; los resultados alimentan un motor de recomendación de metas. El backend es Google Apps Script sobre Google Sheets. El frontend es React + Vite desplegado en Vercel.

Esta auditoría cubre tres capas: (1) el pipeline de deployment, (2) el modelo de datos del diagnóstico, y (3) el flujo de recuperación de respuestas en sesión presencial.

---

## I. Pipeline de deployment — incidente resuelto

### Hallazgo

Los últimos dos deployments automáticos (vía integración GitHub → Vercel) fallaron con:

```
sh: line 1: vite: command not found
Error: Command "vite build" exited with 127
```

### Causa raíz

El repositorio es un monorepo. La aplicación vive en `webapp/`. La integración de GitHub clonaba el repo completo desde la raíz, donde no existe `package.json`, por lo que `npm install` nunca se ejecutaba y `vite` no estaba disponible.

Los deployments manuales previos (`vercel deploy` desde `webapp/`) funcionaban porque subían solo los archivos del subdirectorio correcto. El problema se manifestó cuando los deploys comenzaron a activarse desde GitHub.

### Acción tomada

Se configuró `rootDirectory: webapp` en el proyecto Vercel vía API REST. Se disparó un redeploy del commit `e534657` y se reasignó el alias `faro-me.vercel.app` al nuevo deployment exitoso.

### Estado

Resuelto. Los pushes futuros a `main` desplegarán correctamente sin intervención manual.

---

## II. Modelo de datos del diagnóstico — grieta estructural

### Estado actual

La hoja `Students` en Google Sheets tiene esta estructura:

```
Matrícula | Nombre | NombrePreferido | Email | NicknameMentor | Comunidad | Status | Check-in
```

Cuando un estudiante termina el diagnóstico, el sistema:

1. Guarda las respuestas completas **solo en `localStorage`** del navegador del estudiante
2. Escribe únicamente `status = "Test Completado"` en la columna 7 de `Students`

Las respuestas reales — scores por categoría, etapa seleccionada, áreas prioritarias — **nunca llegan a Sheets**.

### Las dos fuentes de verdad desincronizadas

| Fuente | Guarda qué | Sobrevive cambio de dispositivo |
|---|---|---|
| `Students.status` en Sheets | "completó o no completó" | ✅ sí |
| `localStorage` del navegador | las respuestas reales | ❌ no |

### Banco de preguntas por etapa

El diagnóstico tiene dos etapas con preguntas distintas. Las categorías no son simétricas:

| Categoría | Exploración | Enfoque |
|---|---|---|
| Claridad de carrera | ✅ | — |
| Desempeño académico | ✅ | — |
| Prácticas profesionales | ✅ | ✅ |
| Servicio social | ✅ | ✅ |
| Semestre Tec | — | ✅ |
| Certificación de idioma | — | ✅ |

Esto tiene implicaciones directas en el esquema de almacenamiento: no puede ser una fila plana de columnas simétricas.

---

## III. Flujo Check-in × Diagnóstico — grietas detectadas

El flujo presencial introduce tres caminos posibles. Solo uno funciona correctamente de extremo a extremo.

### Camino A — mismo dispositivo (camino feliz)

```
[Remoto]   Welcome → Diagnostic → localStorage ✅ + Students.status = "Test Completado"
[Presencial] CheckIn → status detectado → quita flag missing → /pre-test → /resultados
             Results.jsx lee navi_diagnostic_payload de localStorage → ✅ scores visibles
             GoalSelection.jsx lee navi_diagnostic_payload de localStorage → ✅ metas filtradas
```

Funciona. Es el único escenario implícitamente asumido por el diseño actual.

---

### Camino B — dispositivo diferente o caché limpio ⛔ GRIETA CRÍTICA

```
[Remoto]   Estudiante completó el test en otro dispositivo o limpió caché
[Presencial] CheckIn → Students.status = "Test Completado"
             → elimina navi_missing_remote_test de localStorage
             → navega a /pre-test → /resultados

             Results.jsx:
               scoreData = [] (localStorage vacío)
               isSessionMode = true
               isMissingRemoteTest = false (fue eliminado)
               → Rama alcanzada: "No encontramos respuestas guardadas del diagnóstico.
                  Asegúrate de haber completado tu diagnóstico remoto antes de continuar."

             ⛔ Pantalla muerta. Sin botón de acción. El estudiante SÍ hizo el test
                pero el sistema le dice que no.

             GoalSelection.jsx:
               getDiagnosticPriorityAreas() → []
               → motor de recomendación trabaja sin datos de diagnóstico
               → metas no se filtran por áreas prioritarias del estudiante
```

**Impacto:** Un estudiante que hizo el test desde su computadora y llega a sesión con su celular (o viceversa) queda en un callejón sin salida durante la sesión presencial. El mentor tampoco tiene visibilidad de los scores.

---

### Camino C — estudiante no hizo el test (funciona)

```
[Presencial] CheckIn → status ≠ "Test Completado"
             → navi_missing_remote_test = 'true'
             → muestra aviso con dos opciones: "Responder ahora" o "Continuar con mentor"

             Si responde ahora:
               Diagnostic → localStorage ✅ + Students.status = "Test Completado"
               Results.jsx lee desde localStorage → ✅ funciona
```

Funciona correctamente. El mensaje y las opciones son claros.

---

## IV. Propuesta de solución: pestaña `Responses`

### Decisión de arquitectura

Agregar los scores directamente como columnas en `Students` **no resuelve la grieta** y crea problemas adicionales:

- La hoja `Students` pasaría de 8 a ~14 columnas mezclando identidad con resultados
- Las preguntas asimétricas por etapa dejarían la mitad de columnas vacías según el caso
- No soportaría múltiples intentos (el test puede repetirse)
- El motor de recomendación y el Check-in seguirían leyendo de `localStorage` de todas formas

Una pestaña separada `Responses` resuelve el problema estructuralmente.

### Estructura propuesta para `Responses`

```
Matrícula | FechaTest | Etapa | ScorePromedio | AreasPrioritarias
| Claridad_Carrera | Desempeno_Academico | Plan_Practicas
| Servicio_Social | Decision_SemestreTec | Certificacion_Idioma
```

| Campo | Tipo | Notas |
|---|---|---|
| `Matrícula` | texto | clave de relación con `Students` |
| `FechaTest` | datetime | timestamp del servidor al guardar |
| `Etapa` | texto | `exploracion` / `enfoque` |
| `ScorePromedio` | número | promedio de los scores de esa etapa |
| `AreasPrioritarias` | texto | categorías con score ≤ 2, separadas por coma |
| `Claridad_Carrera` | 1–5 | vacío si etapa = `enfoque` |
| `Desempeno_Academico` | 1–5 | vacío si etapa = `enfoque` |
| `Plan_Practicas` | 1–5 | presente en ambas etapas |
| `Servicio_Social` | 1–5 | presente en ambas etapas |
| `Decision_SemestreTec` | 1–5 | vacío si etapa = `exploracion` |
| `Certificacion_Idioma` | 1–5 | vacío si etapa = `exploracion` |

### Cómo cierra la grieta del Camino B

```
CheckIn → status = "Test Completado"
        → llama getTestResponse(matricula)
        → recibe scores desde Responses sheet
        → reconstruye navi_diagnostic_payload en localStorage
        → /pre-test → /resultados → ✅ scores disponibles sin importar el dispositivo
```

### Archivos que requieren cambio

| Archivo | Cambio | Naturaleza |
|---|---|---|
| `NaviEngine.gs` | Nueva función `saveTestResponse` | Aditivo |
| `NaviEngine.gs` | Nueva función `getTestResponse` | Aditivo |
| `NaviEngine.gs` | Inicializar pestaña `Responses` en `setup` | Aditivo |
| `Diagnostic.jsx` | Enviar scores a `saveTestResponse` al terminar | ~5 líneas adicionales |
| `CheckIn.jsx` | Llamar `getTestResponse` cuando status = "Test Completado" y reconstruir localStorage | Cambio en lógica existente |
| `client.js` | Exponer action `getTestResponse` | Aditivo |

Ningún cambio rompe funcionalidad existente. Los cambios en `Diagnostic.jsx` son aditivos (el `updateStudent` actual se mantiene). El único cambio en lógica existente es `CheckIn.jsx`.

---

## V. Campo `NombrePreferido` — estado actual

El campo ya existe en la hoja `Students` como columna 3 y se escribe correctamente desde dos puntos:

- `Welcome.jsx` — cuando el estudiante lo ingresa antes de hacer el test remoto
- `CheckIn.jsx` — cuando el estudiante lo ingresa al llegar a sesión presencial

No requiere cambios en esta iteración.

---

## VI. Oportunidades adicionales identificadas

Las siguientes no son grietas activas pero representan fragilidades o mejoras naturales al implementar `Responses`:

### 6.1 El Admin Dashboard no tiene visibilidad de scores

`AdminDashboard.jsx` lee `Students` completo pero no tiene acceso a los scores del diagnóstico. Los mentores solo ven `status: "Test Completado"` — no pueden revisar en qué áreas está cada estudiante antes de la sesión.

**Oportunidad:** exponer `Responses` opcionalmente en `doGet` para que el dashboard muestre un resumen de scores por estudiante.

### 6.2 No hay timestamp de cuándo se hizo el test

`Students.status` no tiene fecha. Si un estudiante hace el test, cambia de dispositivo y lo hace de nuevo, no hay forma de saber cuál es la respuesta más reciente.

**Solución natural:** `Responses` tiene `FechaTest` por diseño — el `getTestResponse` puede devolver la fila más reciente por matrícula.

### 6.3 El flujo no distingue "Test Completado remoto" de "Test Completado en sesión"

Actualmente ambos escriben el mismo `status`. Para análisis del piloto podría ser valioso saber si el diagnóstico fue hecho de forma autónoma (remota) o asistida (en sesión con el mentor).

**Oportunidad:** agregar un campo `Modalidad` a `Responses` con valor `remoto` / `presencial`, derivado de si `navi_session_mode` estaba activo al guardar.

### 6.4 GoalSelection también lee exclusivamente de localStorage

La función `getDiagnosticPriorityAreas()` en `GoalSelection.jsx` lee `navi_diagnostic_payload` de localStorage. En el Camino B, aunque el Check-in reconstruya el payload para Results, hay que asegurarse de que GoalSelection lo encuentre también. Esto es automático si el Camino B escribe a localStorage en CheckIn antes de navegar — pero vale documentarlo explícitamente como dependencia.

---

## VII. Resumen ejecutivo para toma de decisiones

| Área | Estado | Prioridad |
|---|---|---|
| Deployment automático desde GitHub | ✅ Resuelto | — |
| Respuestas del test no persisten en Sheets | ⛔ Grieta activa | Alta |
| Camino B (distinto dispositivo) rompe sesión presencial | ⛔ Grieta activa | Alta |
| Camino C (sin test previo) funciona | ✅ OK | — |
| NombrePreferido en Students | ✅ OK | — |
| Admin Dashboard sin visibilidad de scores | ⚠️ Oportunidad | Media |
| Sin timestamp de test | ⚠️ Oportunidad | Media |
| Sin distinción remoto/presencial en datos | ⚠️ Oportunidad | Baja |

**Decisión pendiente de confirmación:** implementar pestaña `Responses` en Google Sheets con las funciones `saveTestResponse` y `getTestResponse` en `NaviEngine.gs`, y los cambios correspondientes en `Diagnostic.jsx` y `CheckIn.jsx`.
