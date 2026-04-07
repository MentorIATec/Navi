# Contexto de Producto: Brújula de Mentoría

## Objetivo del sistema
Construir un diagnóstico accionable para estudiantes que derive en decisiones concretas y seguimiento de mentoría.

## Reglas de negocio (prioridad máxima)
Toda interacción del sistema debe empujar estrategias que se concreten en:
1. Entrevistas con estudiantes.
2. Creación/ajuste de metas.
3. Actualización de propósito de vida en Mi Vida Tec.

## Datos históricos disponibles (fuente institucional)
Se cuenta con información histórica por estudiante, como:
- avance en servicio social
- promedio
- semestre actual
- requisito de inglés
- propósito de vida
- metas guardadas

## Uso recomendado de datos históricos en el flujo
1. Mostrar resumen de datos relevantes al inicio o al cierre (según experiencia de usuario).
2. Preguntar explícitamente:
- con qué metas históricas sigue resonando el estudiante
- si sigue identificándose con su propósito de vida actual
3. Cerrar con CTA operativa:
- actualizar propósito y/o metas en Mi Vida Tec
- agendar entrevista con mentora

## Segmentación por semestre y etapa
### Etapa Exploración
- Semestres objetivo: 1, 2 y 3
- Contexto: estudiante en avenida o en transición hacia carrera de egreso
- Necesidad: afianzar estrategias para bienestar, claridad de decisión y hábitos de avance

### Etapa Enfoque
- Semestres objetivo: 4, 5 y 6
- Contexto: estudiante con programa/carrera de egreso definida
- Hitos: decisión de Semestre Tec (intercambio, concentraciones, estancias, prácticas)
- Necesidades frecuentes:
  - inserción laboral temprana
  - cumplimiento de servicio social
  - requisito de inglés para intercambio

## Recomendación funcional para formularios
1. Si se conoce el semestre, usarlo para sugerir etapa por defecto.
2. Permitir override manual del estudiante (evitar bloquear por clasificación automática).
3. Activar preguntas condicionales por semestre para reducir fricción.

## Roadmap sugerido (corto plazo)
1. Agregar campo `semester` al link personalizado y a `Responses_Processed`.
2. Preselección automática de etapa:
- `1-3` -> Exploración
- `4-6` -> Enfoque
3. Añadir bloque final de validación de metas y propósito:
- "¿Con cuáles metas sigues resonando?"
- "¿Tu propósito actual sigue representándote?"
4. Añadir CTA final doble:
- "Agendar entrevista"
- "Actualizar propósito/metas en Mi Vida Tec"

## Roadmap sugerido (mediano plazo)
Migración progresiva a stack web (Vercel + backend dedicado) cuando se requiera:
- más integraciones (CRM, calendar, analytics, APIs institucionales)
- control granular de usuarios/roles
- trazabilidad robusta y dashboards avanzados

## Criterio de migración recomendado
Mantener Apps Script/Sheets en piloto y migrar cuando se cumpla al menos 2 de 3:
1. Necesidad de múltiples integraciones productivas.
2. Requerimientos de seguridad/roles más estrictos.
3. Operación con mayor volumen y analítica en tiempo real.
