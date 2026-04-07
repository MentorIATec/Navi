# Plan De Ejecución — Generador De Metas Unificado

Fecha base: 2026-03-02  
Objetivo: unificar Enfoque + Especialización sin romper operación actual de sesiones guiadas.

## 1) Alcance y criterios de éxito
- Corregir bugs críticos de Especialización (confirmación y métricas).
- Unificar modelo de datos (`GoalBank`, `GoalSelections`) y API Apps Script.
- Mantener experiencia guiada para mentoría 1:1.
- Dejar prompts cortos para delegar tareas a Claude sin saturación.

Criterios de salida:
- `confirmarRegistro` funciona y actualiza columnas correctas.
- métricas (`total/completados/pendientes/porArea`) coherentes.
- no duplicados por `matricula + modulo + periodo`.
- UAT mínimo aprobado (10 casos).

## 2) Fases y calendario sugerido

## Fase 0 — Hotfix Crítico (1-2 días)
Objetivo: estabilizar Especialización hoy.

Tareas:
1. Corregir índices de columnas en `confirmarRegistroMiVidaTecEspecializacion`.
2. Corregir llamada frontend para enviar `email` (no `matricula`).
3. Validar `response.success` en UI antes de mostrar éxito.
4. Corregir `obtenerEstadisticasEspecializacion` (estado y `areas_criticas`).
5. Quitar auto-check en Enfoque (`abrirMiTec`) para no simular evidencia.

Salida esperada:
- confirmación real en hoja.
- estadísticas dejan de salir en cero.

## Fase 1 — Hardening Operativo (3-5 días)
Objetivo: evitar errores silenciosos y contaminación de datos.

Tareas:
1. Sanitizar render de metas (evitar `innerHTML` con datos de Sheets).
2. Limitar polling de carga de metas (máximo 10 intentos + error visible).
3. Bloquear doble submit en `confirmarMetas`.
4. Validar matrícula en Enfoque (`/^A[0-9]{8}$/i`).
5. Ocultar métricas globales en vista estudiante.

Salida esperada:
- flujo estable en sesiones guiadas.
- menos riesgo de XSS y duplicados.

## Fase 2 — Unificación Backend (1-2 semanas)
Objetivo: un solo backend con API y hojas comunes.

Tareas:
1. Crear hoja `GoalBank` unificada (con `modulo`, `tipo`, `categoria`, `dimension`, `activo`).
2. Crear hoja `GoalSelections` unificada.
3. Implementar API única:
   - `obtenerDiagnostico(matricula, modulo)`
   - `obtenerMetas(modulo)`
   - `guardarSeleccion(payload)`
   - `confirmarRegistro(matriculaOrEmail, modulo)`
   - `obtenerEstadisticas(modulo)`
4. Migrar históricos de `Sesion_Mentoria*` a `GoalSelections`.
5. Activar deduplicación por llave lógica.

Salida esperada:
- una sola fuente de verdad para metas y sesiones.

## Fase 3 — Integración con Brújula (1 semana)
Objetivo: conectar resultados de test con plan de metas.

Tareas:
1. Join por `matricula/email` con `Responses_Processed`.
2. Preselección de categorías de metas según scores/escenario.
3. Estandarizar campos de tracking por periodo.
4. Reporte mentor (separado de la vista estudiante).

Salida esperada:
- continuidad natural: brújula -> metas -> seguimiento.

## 3) RACI simple (recomendado)
- Codex: arquitectura, refactor crítico, validación técnica final.
- Claude: implementación por bloques, UI microcopy, pruebas unitarias/manuales guiadas.
- Mentora (tú): validación funcional y de tono, UAT final.

## 4) Backlog de tareas delegables (tickets)

1. `HOTFIX-ESP-COLUMNAS`  
Corrige índices de columnas y confirmación en Especialización.

2. `HOTFIX-ESP-FRONT-CONFIRM`  
Enviar email correcto y validar `response.success`.

3. `SEC-XSS-CARDS`  
Reemplazar `innerHTML` por construcción DOM segura.

4. `RESILIENCIA-POLLING`  
Límite de reintentos y mensajes de error.

5. `DATA-DEDUP`  
Prevenir inserción duplicada por llave lógica.

6. `UNIFY-SCHEMA`  
Crear `GoalBank` y `GoalSelections` unificados.

7. `UNIFY-API`  
Consolidar funciones backend y contrato de payload.

8. `MIGRACION-HISTORICO`  
Script de migración de sesiones previas.

9. `INTEGRACION-BRUJULA`  
Mapeo de scores a categorías de metas.

10. `UAT-REGRESION`  
Ejecutar checklist de pruebas y evidencias.

## 5) Prompts cortos para Claude (copiar/pegar)

## Prompt 1 — Hotfix columnas Especialización
```text
Aplica solo hotfix en Especialización:
1) corregir índices en confirmarRegistroMiVidaTecEspecializacion
2) corregir índices en obtenerEstadisticasEspecializacion
3) no tocar estilos ni copy.
Entrega: diff + explicación de 5 líneas + riesgos.
```

## Prompt 2 — Front confirmación Especialización
```text
En Especialización/Index.html corrige:
1) llamar confirmarRegistroMiVidaTecEspecializacion con estudianteActual.email
2) validar response.success antes de mostrar éxito
3) mostrar error amigable si falla.
No cambies diseño. Entrega diff mínimo.
```

## Prompt 3 — Seguridad XSS
```text
Reemplaza render de metas con DOM API segura (sin innerHTML con datos de sheet)
en Enfoque y Especialización.
No cambies layout visual.
Entrega: diff + breve explicación de sanitización.
```

## Prompt 4 — Polling robusto
```text
Agrega límite de polling para carga de metas:
max 10 intentos, luego mensaje de error y botón reintentar.
Aplicar en ambos módulos.
No introducir librerías.
```

## Prompt 5 — Dedupe guardado
```text
Implementa deduplicación al guardar selección:
llave = matricula + modulo + periodo_actual.
Si existe, actualizar fila en vez de append.
Entrega: diff + cómo valida periodo.
```

## Prompt 6 — Unificar esquema de hojas
```text
Propón e implementa helpers para esquema unificado:
GoalBank y GoalSelections.
No migres datos aún.
Incluye ensureHeaders_ y mapeo de columnas por nombre.
```

## Prompt 7 — API unificada
```text
Crear capa API unificada en Apps Script:
obtenerDiagnostico, obtenerMetas, guardarSeleccion, confirmarRegistro, obtenerEstadisticas.
Mantener compatibilidad temporal con funciones anteriores.
Entrega: funciones nuevas + adaptadores legacy.
```

## Prompt 8 — Migración histórica
```text
Construye script de migración:
Sesion_Mentoria + Sesion_Mentoria_Especializacion -> GoalSelections.
Incluir dry-run y reporte final (migradas, omitidas, errores).
No ejecutar migración, solo crear función.
```

## Prompt 9 — Integración Brújula
```text
Agregar mapeo de resultados de Responses_Processed a recomendaciones de metas
por modulo/escenario.
No modificar banco de preguntas.
Entrega: función de mapeo + pruebas de ejemplo.
```

## Prompt 10 — UAT
```text
Genera checklist UAT ejecutable (10 casos) para módulos unificados,
con precondición, pasos, resultado esperado y evidencia a capturar.
Formato tabla markdown.
```

## 6) Checklist de control semanal
- Día 1: cerrar Fase 0 y validar 3 casos reales.
- Día 2-3: hardening (XSS, polling, doble submit, validaciones).
- Día 4-5: esquema + API unificada (sin migrar).
- Semana 2: migración histórica + integración Brújula.
- Go-live: solo con UAT completo firmado.

## 7) Qué NO hacer en esta etapa
- No mover a Vercel antes de cerrar Fase 0 y Fase 1.
- No mezclar rediseño UI con refactor de datos.
- No ejecutar migración sin dry-run y respaldo.
