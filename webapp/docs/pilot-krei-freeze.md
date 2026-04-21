# faro: Krei Pilot Freeze

## Estado

Esta nota marca el cierre técnico de la versión base para la prueba piloto con la comunidad Krei.

- fecha de congelamiento: `2026-04-21 16:08 CST`
- commit de referencia: `8ab0fb2`
- entorno productivo: `https://faro-me.vercel.app`

## Alcance congelado

La versión congelada incluye:

- flujo estudiante:
  - ingreso por matrícula
  - diagnóstico
  - resultados
  - selección de metas
  - plan de acción
- flujo mentor:
  - acceso a `/admin`
  - directorio de progreso
  - apertura de sesión
  - copia de resumen para CRM
  - guardado de sesión
- campañas controladas:
  - invitación al diagnóstico
  - convocatoria a sesión
  - seguimiento a ausencias
- registro histórico de sesiones en `Sesiones`
- chip visible de estado `CRM documentado` / `Pendiente CRM`
- materiales de transferencia:
  - `transferencia-krei-guia.html`
  - `transferencia-krei-piloto.html`

## Validaciones completadas

Se consideran validadas para el piloto las siguientes capacidades:

- almacenamiento de respuestas y sesiones en Google Sheets
- recuperación de diagnóstico previo
- continuidad entre check-in, pre-test, metas y plan de acción
- campañas con filtro correcto por mentor asignado
- personalización de comunidad en CRM y tarjeta del plan
- estabilidad del modal de sesión después de guardar
- visualización móvil razonablemente estable en encabezado y plan de acción

## Decisiones de producto vigentes

- `faro` no sustituye el CRM institucional
- el CRM sigue siendo el registro formal del caso
- `faro` funciona como facilitador de contexto, acuerdos y documentación
- no se abre para el piloto una vista histórica pesada tipo Airtable
- no se abre para el piloto un editor libre de HTML en campañas
- no se abre para el piloto un selector de múltiples plantillas por campaña

## Diferidos fuera del piloto

Quedan explícitamente fuera de esta fase:

- histórico ligero por estudiante dentro del caso
- selector de plantillas en campañas
- revisión o simplificación futura del preview de campañas
- escalamiento del selector visual de mentores para operación campus completa
- búsqueda por palabra clave o filtros avanzados en metas
- `Goal Manager` como herramienta separada
- nuevos ajustes de UI que no respondan a bug crítico

## Regla operativa durante el piloto

Durante la prueba con Krei:

- no abrir desarrollo nuevo por mejoras menores de copy o layout
- registrar hallazgos operativos y clasificarlos en:
  - bug crítico
  - mejora futura
  - observación de uso
- solo corregir durante el piloto aquello que:
  - rompa el flujo principal
  - afecte almacenamiento
  - impida campañas
  - impida documentación de sesión

## Archivos de apoyo del piloto

- `/Users/karenguzman/BrujulApp/webapp/docs/krei-pilot-students.csv`
- `/Users/karenguzman/BrujulApp/webapp/docs/transferencia-krei-guia.html`
- `/Users/karenguzman/BrujulApp/webapp/docs/transferencia-krei-piloto.html`

## Nota de disciplina de repo

Este congelamiento no incluye otros frentes activos o materiales ajenos al piloto, aunque existan cambios locales no comprometidos en el workspace.
