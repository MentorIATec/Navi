# PLAN DE INVESTIGACIÓN DOCTORAL — VERSIÓN 2.4

## Agencia activada por intervención de mentoría y retención universitaria: diseño causal-predictivo con poblaciones diferenciadas en el Tecnológico de Monterrey

**Fecha:** 2026-03-18
**Versión:** 2.4 — edición de claridad, fluidez y consistencia editorial (sobre V2.3 de 2026-03-07)
**Nota de audiencia:** Este documento es autocontenido y no presupone acceso a la base documental del proyecto. Todas las afirmaciones metodológicas se acompañan de referencias cruzadas a los Anexos A1-A8 incluidos al final, que consolidan la trazabilidad del proceso de revisión, la base de estudios y el diseño empírico.


## 1. INTRODUCCIÓN Y JUSTIFICACIÓN DEL TEMA OBJETO DE ESTUDIO

### Bloque 1 — Problema global del campo

La deserción universitaria en educación superior es un problema global, de causas multifactoriales, que ninguna tradición teórica ha logrado explicar de forma integrada. Dos líneas de investigación han acumulado evidencia relevante, aunque siguen metodológicamente separadas. Por un lado, la tradición psicológica y relacional muestra que la agencia subjetiva, entendida aquí como la capacidad del estudiante para interpretar su experiencia, sostener expectativas de eficacia y regular su respuesta ante las dificultades, aporta mecanismos con plausibilidad causal para explicar por qué un estudiante persiste o abandona, especialmente durante la transición al primer año universitario (Brady et al., 2020, ensayo controlado aleatorizado (RCT) con seguimiento a 10 años; Murphy et al., 2020, RCT en institución de acceso masivo; Dennehy & Dasgupta, 2017, experimental longitudinal; Hernandez et al., 2017, emparejamiento por puntaje de propensión (PSM)). Por otro lado, la analítica del aprendizaje y los modelos de aprendizaje automático aplicados a la educación muestran alta capacidad diagnóstica para identificar estudiantes en riesgo de abandono a partir de registros administrativos (Musso et al., 2020; Crawford et al., 2024; Fincham et al., 2021), pero operan sin confirmar el mecanismo causal subyacente.

### Bloque 2 — Gap causal-predictivo identificado por la revisión sistemática

Una revisión sistemática focalizada, ejecutada conforme al protocolo PRISMA (véase **Anexo A1** para flujo completo y razones de exclusión), cerró con N=20 estudios empíricos incluidos en síntesis (véase **Anexo A2** para matriz de extracción con campos clave). La evidencia revisada sugiere una brecha relevante. Los estudios de aprendizaje automático con fines predictivos (n=3 en la muestra analizada: Musso, Crawford, Fincham) identifican *qué* predice el abandono con alta precisión, pero no *por qué* actúa ese predictor. En cambio, los estudios experimentales y cuasi-experimentales (n=10 en la muestra analizada) aportan evidencia de cadenas causales plausibles —mentoría de calidad → construal → autoeficacia/regulación → persistencia—, pero no las articulan con sistemas institucionales de alerta temprana. Esta tesis se propone abordar esa separación mediante un diseño de **causalidad predictiva integrada**. El proceso de identificación y priorización de los 90 estudios de la revisión exploratoria, junto con sus métricas de cobertura por dominio, se reporta en **Anexo A3**.

### Bloque 3 — Aterrizaje en Tec Monterrey y pertinencia LATAM

En el contexto latinoamericano, la deserción universitaria sigue siendo una preocupación persistente para los sistemas de educación superior. Al mismo tiempo, los modelos de mentoría han ampliado su cobertura, aunque sus mecanismos siguen poco evaluados. La revisión sistemática solo incluye un estudio con muestra LATAM directa (Venegas Muggli et al., 2021, Chile, cuasi-experimental con PSM), lo que sugiere una brecha importante de evidencia local. El Tecnológico de Monterrey constituye un caso pertinente porque cuenta con un modelo de acompañamiento estructurado (Tec21), un Mentor Estudiantil como figura central y herramientas institucionales de seguimiento —miVidaTec, Alertas de Bienestar Integral (IBI), ECOA y registros académicos Tec21— que potencialmente permiten un diseño de integración causal-predictiva en condiciones de validez ecológica real. Sin embargo, los indicadores vigentes del modelo (registro binario de sesiones, documentación de propósito de vida y metas) capturan la cobertura y el proceso de acompañamiento, pero no la activación de mecanismos de agencia del estudiante que la evidencia considera relevantes. La investigación se desarrollará con tres poblaciones institucionales: primer ingreso, transferencia interna (temporal o definitiva; en dos periodos semestrales consecutivos del ciclo 2025-2026, Campus Monterrey registró aproximadamente 680 y 530 transferencias, respectivamente) y reingreso, con análisis estratificado por etapa académica (Exploración, Enfoque, Especialización). La generalización de los resultados será **analítica y condicionada**: la validez interna constituye el objetivo principal, mientras que la validez externa podría ser transferible a instituciones con perfil comparable (mentoría estructurada y datos longitudinales vinculables), siempre sujeta a replicación.


## 2. HIPÓTESIS DE TRABAJO Y PRINCIPALES OBJETIVOS A ALCANZAR

### Hipótesis de trabajo

**H1 — Mecanismo de cambio en la agencia del estudiante activado por la intervención (evaluable mediante cambio pre/post y análisis de trayectorias):**
Los estudiantes expuestos al paquete de intervención I1-I2-I3 integrado a la mentoría mostrarán cambios pre/post significativamente mayores en construal de pertenencia (`delta_construal`), autoeficacia situacional (`delta_autoeficacia_sit`) y regulación de afrontamiento (`delta_regulacion`) que quienes reciban acompañamiento estándar sin intervención estructurada. Estos deltas mediarán el efecto sobre la retención t1→t2, por encima del efecto del registro administrativo de acompañamiento y controlando variables M0. La evidencia revisada que sustenta H1 proviene de RCT y de diseños cuasi-experimentales (Brady et al., 2020; Murphy et al., 2020; Broda et al., 2018; Hernandez et al., 2017 — ver **Anexo A2**). La inferencia de la tesis queda condicionada al carácter cuasi-experimental del diseño, por lo que no equivale a la de un RCT.

**H2 — Valor incremental predictivo diferenciado por población (evaluable mediante comparación M0→M1→M2):**
El modelo M2 —que incorpora variables de cambio en la agencia del estudiante junto con acompañamiento existente y datos administrativos— superará en AUC/F1 a M1 (acompañamiento + administrativas) y M0 (modelo administrativo base), con efectos diferenciales según el tipo de población y la etapa académica. Esta hipótesis se evaluará mediante comparación incremental, validación cruzada estratificada y análisis de valores de Shapley (SHAP). Las definiciones operativas de las variables de resultado (retención t1→t2, baja_motivo, nuevo_condicional, DHEA) se presentan en **Anexo A5**; el esquema temporal t0-t1-t2-t3, en **Anexo A6**.

### Objetivo general

Diseñar, implementar y contrastar empíricamente un modelo de causalidad predictiva integrada para la retención semestral en el Tecnológico de Monterrey, que conecte intervenciones de mentoría estructuradas, cambios medidos en la agencia del estudiante y resultados de retención diferenciados por tipo de población y etapa académica.

### Objetivos específicos

1. Formalizar el marco causal-predictivo (M0-M1-M2) a partir de la revisión N=20, separando evidencia causal de asociativa, operacionalizando variables de cambio en la agencia del estudiante que sustituyan indicadores indirectos binarios de documentación institucional (SQ1, SQ2 — ver **Anexo A2**).
2. Diseñar, validar e implementar el paquete I1-I2-I3 embebido en el flujo de mentoría, con microinstrumento pre/post mediante el mecanismo de captura que resulte institucionalmente viable en la fase inicial del proyecto, idealmente integrado en miVidaTec si las condiciones operativas lo permiten (parámetro preliminar de diseño: estimado en 10-12 ítems y ≤90 seg. de aplicación; longitud y formato finales sujetos a validación de contenido y pilotaje psicométrico en Años 1-2), diferenciando variables disponibles, de nueva captura y derivadas (ver **Anexo A4**).
3. Establecer un diseño cuasi-experimental con contrafactual explícito — cohorte histórica propia más mentores comparables contemporáneos — con diferencias-en-diferencias (DiD) y PSM, controlando por etapa académica y tipo de población (ver **Anexo A7** para diagrama del contrafactual).
4. Contrastar el desempeño M0→M1→M2 sobre retención t1→t2, motivo de baja y nuevo_condicional, con análisis estratificado por tipo_poblacion, tipo_transferencia y etapa_académica.
5. Evaluar la transición de estatus académico (Regular → Condicional → Baja Académica) y el cumplimiento del DHEA como variables de riesgo académico temprano (Reglamento Académico Cap. VIII, Art. 8.3-8.6; ver **Anexo A5**).
6. Generar recomendaciones operativas diferenciadas por nivel de intervención escalonada HMS/IBI (Niveles 0-3), tipo de población y etapa académica.


## 3. METODOLOGÍA A UTILIZAR

### Fase documental (cerrada): de 90 estudios de revisión exploratoria a N=20 en síntesis

El diseño metodológico de la tesis parte de una fase documental ya ejecutada y cerrada. Primero se realizó una revisión exploratoria que consolidó una base de **90 estudios codificados** en la matriz de booleanos de priorización (ver **Anexo A3** para métricas completas: 64% con variable de agencia subjetiva, 28% con ML, 47% longitudinales, 13% LATAM, 12% con invarianza de medición). A partir de esa base, se ejecutó una revisión sistemática focalizada conforme al protocolo PRISMA: **90 identificados → 40 excluidos en cribado título/resumen → 50 evaluados a texto completo → 30 excluidos → N=20 incluidos en síntesis** (ver **Anexo A1** para flujo detallado con razones de exclusión). La síntesis fue narrativa y se estructuró por subpreguntas SQ1-SQ3. El metaanálisis no fue viable por heterogeneidad conceptual irreductible, ya que "mentoría" y "persistencia" se operacionalizan de formas radicalmente distintas entre estudios. Esta fase constituye el marco teórico fijo de la fase empírica.

### Variables de la fase empírica (véase Anexo A4 para diccionario completo)

**Disponibles (sistemas institucionales Tec):**
- *M0 — base administrativa:* `promedio_acumulado`, `créditos_reprobados`, `tipo_beca`, `foráneo` (disponible), `programa`, `semestre`, `estatus_academico_previo` (Regular/Condicional), `etapa_académica` (Exploración/Enfoque/Especialización), `historial_condicionamiento`.
- *M1 — acompañamiento existente:* `registro_mivida`, `caso_crm`, `entrevista_crm`, `participacion_life_comunidad`, `dhea_cumplimiento`.
- *Estratificación:* `tipo_poblacion`, `tipo_transferencia` (temporal/definitiva; estimación preliminar: 20-25% temporal — **pendiente verificación exacta con Escolares**).
- *Variables de resultado:* `retencion_t1_t2` (primario, binario); `baja_motivo` (secundario, categórico — sujeto a auditoría de completitud ≥85%); `nuevo_condicional` (secundario, binario).
- *Riesgo normativo:* `estatus_academico_previo`, `dhea_inscripcion`, `dhea_cumplimiento`, `transicion_estatus` (derivada de créditos según Reglamento Cap. VIII).
- *Control contextual (no indicador indirecto de agencia):* `proposito_doc`, `metas_3_dim` (binarios; únicamente como covariables de contexto).

**Nueva captura — microinstrumento para aplicación en el entorno institucional disponible (en fase de diseño; parámetros preliminares sujetos a pilotaje psicométrico):**
- `delta_construal` = `construal_post` − `construal_pre` (estructura preliminar: 3 ítems Likert)
- `delta_autoeficacia_sit` = `autoeficacia_sit_post` − `autoeficacia_sit_pre` (estructura preliminar: 2-3 ítems)
- `delta_regulacion` = `regulacion_post` − `regulacion_pre` (estructura preliminar: 2-3 ítems)
- `calidad_mentoria_idx` (3 ítems, corte t2) | `calidad_metas_rubrica` (rúbrica 0-3, mentor)
- `intervencion_exposicion` (ninguna / parcial / completa)

### Temporalidad operativa (esquema completo en Anexo A6)

| Evento | Primer ingreso | Transferencia interna | Reingreso |
|---|---|---|---|
| **t0** — Pre + tamizaje IBI | Sem. 1-2, 1er semestre | Sem. 1-2 post-transfer | Sem. 1-2 del semestre |
| **t1** — Corte intermedio (Semana Tec 6) | Semana 6 | Semana 6 | Semana 6 |
| **t2** — Post + ECOA | Semana 17-18 | Semana 17-18 | Semana 17-18 |
| **t3** — Resultado: reinscripción | Inicio siguiente periodo | Inicio siguiente periodo | Inicio siguiente periodo |

*Nota:* El IBI de entrada para transferencias y reingreso no está confirmado. Por ello, se propone un tamizaje breve (5-7 ítems) como **Nueva captura propuesta**, sujeto al aval de Bienestar Estudiantil.

### Comparación contrafactual (diagrama textual completo en Anexo A7)

**Estrategia DiD + PSM con dos fuentes de comparación:**
1. **Cohorte histórica:** estudiantes de periodos previos sin I1-I2-I3 → control preintervención.
2. **Mentores comparables contemporáneos:** variación natural de adherencia al paquete I1-I2-I3 (`intervencion_exposicion`) dentro del mismo periodo → contraste interno.
3. **PSM:** emparejamiento por variables M0 (promedio, beca, foráneo, etapa, estatus previo, tipo_poblacion) para comparabilidad.
4. **Controles obligatorios:** `etapa_académica` y `tipo_poblacion` en todos los modelos; `tipo_transferencia` como moderador en subanálisis.
5. **Análisis de sensibilidad:** cotas de Rosenbaum para evaluar robustez ante confusores no observados.

*Límite declarado:* diseño cuasi-experimental; no equivalente a RCT. La inferencia causal es condicionada.

### Modelos M0-M1-M2

- **M0:** variables administrativas puras (promedio, créditos, beca, foráneo, etapa, estatus previo, tipo_poblacion).
- **M1:** M0 + acompañamiento existente (registro_mivida, caso_crm, entrevista_crm, participacion_life, dhea_cumplimiento).
- **M2:** M1 + nueva captura (delta_construal, delta_autoeficacia_sit, delta_regulacion, calidad_mentoria_idx, calidad_metas_rubrica).
- Algoritmos: Regresión Logística, Random Forest, XGBoost. Métricas: AUC, F1, exactitud. Validación cruzada estratificada. Valores SHAP en M2.

### Paquete I1-I2-I3 (embebido en mentoría, no sustitutivo)

- **I1 — Reencuadre de pertenencia (t0):** microintervención sobre normalización de dificultades de adaptación como transitorias; implementada en materia "Mi plan de vida en el Tec" (1er semestre, Generalidades Planes 2026, Art. 1.1.1.F). Evidencia experimental que sustenta I1: Brady et al. (RCT, 10 años); Murphy et al. (RCT); Broda et al. (RCT, efecto diferencial latinos). Producto: `delta_construal`.
- **I2 — Metas con implementación conductual:** reformulación de metas hacia formato meta + obstáculo + plan si-entonces + fecha. Producto: `calidad_metas_rubrica`. Sustituye el registro binario `metas_3_dim` como evidencia de agencia.
- **I3 — Cierre de sesión con autorregulación:** autoevaluación breve + siguiente acción concreta al cierre de cada sesión. Producto: `delta_regulacion`.

### Sistema escalonado HMS/IBI (umbrales verificados en documentación institucional; validar vigencia anual)

- **Nivel 0 (universal):** acompañamiento base con I1-I2-I3 para toda la cohorte.
- **Nivel 1 (preventivo centrado en agencia):** IBI global <51 o dimensión no clínica <51 (ocupacional, financiera, intelectual, social) → I2 reforzado + seguimiento en t1.
- **Nivel 2 (tamizaje clínico):** dimensiones física, emocional, espiritual en riesgo → canalización: PHQ-9 ≥15 → Consejería; GAD-7 ≥10 → TecMed.
- **Nivel 3 (alerta crítica):** riesgo alto → ruta inmediata Consejería/TecMed + trazabilidad miVidaTec.

### Hito de auditoría de calidad de datos (previo a análisis principales)

Completitud de `baja_motivo` (umbral ≥85% no nulos); consistencia de `tipo_transferencia`; trazabilidad de estatus académico y DHEA; vinculación de fuentes por ID anónimo con marca temporal.


## 4. MEDIOS Y RECURSOS MATERIALES DISPONIBLES

### Recursos ya disponibles

1. **Base sistemática de estudios con trazabilidad completa:** N=20 estudios con flujo PRISMA cerrado (**Anexo A1**), matriz de extracción (**Anexo A2**), síntesis narrativa, mapa de mecanismos causales y tabla de evidencia por subpregunta. Bibliografía verificada en fuentes primarias: 18 DOI confirmados; 2 PENDIENTE_VERIFICACION por razones editoriales no bloqueantes (ver **Anexo A8**).

2. **Infraestructura institucional Tec Monterrey (disponibilidad referencial al momento de elaboración):**
   - *miVidaTec:* plataforma de registro de acompañamiento, propósito, metas, casos, planes de éxito y citas. Acceso para Mentores Estudiantiles, Consejeros Emocionales y Directores LiFE. Representa una posible vía de integración futura del microinstrumento si las condiciones institucionales y técnicas lo permiten.
   - *Alertas Tempranas:* tablero institucional de riesgos de deserción. Umbrales operativos verificados en documentación institucional: IBI <51, PHQ-9 ≥15, GAD-7 ≥10.
   - *ECOA (Semana 17):* encuesta con ítems de calidad de mentoría (acompañamiento percibido, orientación de plan de vida, integración a comunidad; escala 0-10). Fuente parcial de `calidad_mentoria_idx`.
   - *Consulta Académica Tec21:* historial académico, calificaciones, faltas, horario. Fuente de variables M0.
   - *CRM:* registro de casos e intervenciones. Fuente de predictores M1.
   - *Materia "Mi plan de vida en el Tec":* cursada en 1er semestre, impartida por el Mentor Estudiantil, sin créditos (Generalidades Planes 2026, Art. 1.1.1.F). Espacio potencial de implementación de I1.

3. **Marco normativo institucional de referencia:** Reglamento Académico Cap. VIII (estatus académico, umbrales de créditos reprobados, DHEA como requisito normativo); Generalidades Planes 2026 (etapas Exploración/Enfoque/Especialización, semestre de 17 semanas, Semanas Tec en semanas 6 y 12).

4. **Posibilidad de trabajo con datos vinculables anonimizados** — sujeta a los permisos y validaciones institucionales aplicables.

5. **Mentores comparables disponibles** para contraste contrafactual dentro del mismo periodo, con variación natural de adherencia documentable en miVidaTec.

6. **Infraestructura analítica reproducible:** Claude Code (consistencia metodológica), NotebookLM (extracción temática de la revisión), Codex (control de versiones), flujo de trabajo versionado. Software estadístico: R/lavaan, R/semTools (SEM, invarianza, PSM con MatchIt), Python/scikit-learn, XGBoost, SHAP (ML), R/DiD.

### Recursos requeridos para la fase empírica

1. **Microinstrumento (versión preliminar de diseño estimada en 10-12 ítems; longitud definitiva condicionada a pilotaje psicométrico en Años 1-2):** ver estructura preliminar en **Anexo A4**. **Input requerido:** responsable funcional de validación psicométrica (área de Investigación o Bienestar Estudiantil Tec).
2. **Mecanismo de captura para el microinstrumento:** se requiere definir un medio de aplicación pre/post con marca temporal y vinculación por ID anónimo. La integración directa en miVidaTec sería deseable, pero no se considera condición necesaria para iniciar el piloto si existe una alternativa institucional viable de captura.
3. **Responsable funcional de captura y monitoreo:** quién carga, audita calidad y exporta datos del microinstrumento. **Input requerido.**
4. **Tamizaje HMS/IBI de entrada para transferencias/reingreso:** 5-7 ítems equivalentes (Nueva captura propuesta). Requiere aval de Bienestar Estudiantil.
5. **Protocolo de capacitación de mentores para I1-I2-I3.** **Dato no disponible:** capacidad logística del área de Mentores Estudiantiles en Año 1.
6. **Gestión de permisos y validaciones institucionales para el uso de datos anonimizados.** Se realizarán las gestiones correspondientes con las áreas responsables, conforme a los procedimientos institucionales aplicables.
7. **Corte de matrícula por subgrupo** para dimensionar muestra. **Input requerido** (meta preliminar: n≥400 total; subgrupos n≥100 — condicionada a corte real de Escolares).


## 5. PLANIFICACIÓN TEMPORAL AJUSTADA A CUATRO AÑOS

### Año 1 — Cierre teórico, instrumentación y protocolo empírico

**Actividades:**
- Redacción del marco teórico (cap. 1-2) con síntesis N=20: cadena causal, mapa de mecanismos, evidencia causal vs. asociativa, variables de riesgo normativo (DHEA, estatus académico).
- Diseño del microinstrumento de agencia (versión preliminar de diseño; longitud y formato definitivos a determinar tras validez de contenido y pilotaje psicométrico) y rúbrica I2; revisión por expertos; validación de contenido (ver estructura en **Anexo A4**).
- Definición del mecanismo de captura más viable para la nueva medición pre/post, con marca temporal y vinculación por ID anónimo; en caso de ser factible, exploración de una integración posterior en miVidaTec.
- Diseño del tamizaje HMS/IBI de entrada para transferencias/reingreso (Nueva captura propuesta) con aval de Bienestar Estudiantil.
- Diseño del protocolo de capacitación de mentores para I1-I2-I3 (lista de verificación, rúbrica, cierre de sesión).
- Extracción de cohorte histórica (periodos sin I1-I2-I3) para grupo control DiD.
- **Hito de auditoría de calidad de datos:** completitud de `baja_motivo`, consistencia de `tipo_transferencia`, trazabilidad de estatus académico y DHEA.
- Gestión de permisos institucionales y acuerdo formal de acceso a datos anonimizados.
- Registro de protocolo en repositorio abierto (OSF o equivalente).

**Hitos verificables:**
- Marco teórico (cap. 1-2) aprobado por comité. | Microinstrumento v1 listo para piloto.
- Acuerdo institucional de acceso y validaciones requeridas para el uso de datos anonimizados completadas.
- Informe de auditoría de calidad de datos con criterios de inclusión/manejo de faltantes.
- Cohorte histórica extraída y documentada para grupo control DiD.

### Año 2 — Pilotaje e instrumentación

**Actividades:**
- Pilotaje del microinstrumento y protocolo I1-I2-I3 (meta: n=80-120; tres tipos de población).
- Análisis psicométrico: confiabilidad, validez de constructo, invarianza configural y métrica por tipo_poblacion y etapa_académica.
- Evaluación de adherencia de mentores a I1-I2-I3; ajuste de la lista de verificación.
- Prueba técnica del mecanismo de captura seleccionado: aplicación, exportación y vinculación de fuentes; si resulta factible, valoración de integración en miVidaTec.
- Protocolo empírico v2 (definitivo); redacción de capítulo metodológico.

**Hitos verificables:**
- Informe psicométrico (confiabilidad, validez, invarianza configural/métrica).
- Tasa de adherencia de mentores documentada. | Protocolo v2 aprobado.
- Integración MiVidaTec operativa y auditada.

### Año 3 — Levantamiento principal y modelado

**Actividades:**
- Levantamiento en muestra principal (meta preliminar condicionada: n≥400 total; subgrupos n≥100).
- Implementación de I1-I2-I3 con registro de exposición; captura en t0 y t2; ECOA en t2.
- Análisis de mediación H1: análisis de trayectorias con variables delta como mediadores.
- Comparación incremental M0→M1→M2 (H2): aprendizaje automático con validación cruzada y SHAP.
- Análisis DiD + PSM; análisis de sensibilidad (cotas de Rosenbaum).
- Análisis de transiciones de estatus académico y cumplimiento DHEA.
- Análisis de subgrupos: tipo_poblacion, tipo_transferencia, etapa_académica.
- Redacción de capítulos de resultados.

**Hitos verificables:**
- Base de datos principal cerrada y anonimizada con trazabilidad completa.
- Modelos M0/M1/M2 ajustados con métricas reportadas (AUC, F1; RMSEA, CFI para análisis de trayectorias).
- Primer artículo empírico en borrador para revisión del asesor.

### Año 4 — Escritura, artículos, defensa y transferencia institucional

**Actividades:**
- Integración y redacción final de la tesis doctoral.
- Sometimiento de al menos dos artículos empíricos a revistas indexadas (uno por hipótesis).
- Preparación y defensa ante el comité doctoral.
- Informe de recomendaciones operativas para el área de Mentores Estudiantiles y Bienestar del Tec (protocolo I1-I2-I3-HMS/IBI por tipo de población y etapa académica).
- Diseminación en al menos un congreso LATAM de educación superior o learning analytics.

**Hitos verificables:**
- Tesis completa entregada al comité. | Al menos un artículo aceptado o en revisión.
- Informe de recomendaciones entregado al Tec. | Defensa pública realizada.


## 6. PLAN DE FORMACIÓN PERSONAL

El plan de formación personal se orientará al fortalecimiento metodológico necesario para el desarrollo de la tesis doctoral, con especial énfasis en inferencia causal, análisis de datos, aprendizaje automático, modelado de ecuaciones estructurales, reproducibilidad y visualización de resultados. La selección de actividades prioriza su alineación directa con el diseño empírico del proyecto y su utilidad para el análisis de datos, la construcción del microinstrumento y la comunicación de hallazgos.

### Actividades formativas previstas

1. **A Crash Course in Causality: Inferring Causal Effects from Observational Data** (University of Pennsylvania / Coursera).  
   Formación prevista en inferencia causal con datos observacionales, especialmente útil para fortalecer el componente de diseño cuasi-experimental, contrafactual y razonamiento causal del proyecto.

2. **Machine Learning Specialization** (Stanford University / DeepLearning.AI / Coursera).  
   Formación prevista en aprendizaje automático para reforzar el componente predictivo del modelo M0-M1-M2 y el análisis del riesgo de abandono con técnicas de clasificación y predicción.

3. **Structural Equation Modeling with lavaan in R** (DataCamp).  
   Formación prevista en modelado de ecuaciones estructurales y evaluación de modelos de medición, alineada con el análisis de trayectorias y la validación de constructos incluidos en la tesis.

4. **Principles, Statistical and Computational Tools for Reproducible Data Science** (Harvard).  
   Formación prevista en reproducibilidad, organización del análisis, documentación y trazabilidad del proceso empírico.

5. **Data Science: Visualization** (Harvard).  
   Formación prevista en visualización, exploración y comunicación de resultados, con aplicación directa a la presentación de hallazgos en tesis, artículos y exposiciones académicas.

6. **Actividad optativa de profundización psicométrica:** **Foundations of Item Response Theory** (CenterStat) o **Item Response Theory** (Statistical Horizons).  
   Esta actividad se considera especialmente pertinente si el microinstrumento adquiere un peso central en la tesis y se requiere profundizar en análisis de medición y teoría de respuesta al ítem.

### Seminarios y acciones complementarias

- Participación en seminarios metodológicos especializados en análisis longitudinal, medición, inferencia causal, analítica educativa y aprendizaje automático aplicado a educación superior.  
  **Detalle específico por definir en conjunto con el asesor de tesis.**

- Participación en acciones de movilidad académica, escuelas de verano, workshops o estancias cortas orientadas al fortalecimiento metodológico del proyecto.  
  **Detalle específico por definir en conjunto con el asesor de tesis.**


## 7. REFERENCIAS BIBLIOGRÁFICAS

Fuente base: `39_referencias_n20_verificadas_v1.md` (18 DOI verificados en fuentes primarias; 2 PENDIENTE_VERIFICACION — ver **Anexo A8** para estado completo). Convención: año del volumen impreso; nota "(online año)" cuando aplica. No se inventan DOI ni metadatos ausentes.

**Base sistemática de estudios — N=20 incluidos en síntesis PRISMA**

Baier, S. T., Markman, S. B., & Pernice-Duca, F. M. (2016). Intent to persist in college freshmen. *Journal of College Student Development, 57*(5), 614–618. https://doi.org/10.1353/csd.2016.0056

Berardi, L., Sanchez, B., & Kuperminc, G. (2020). Predictors of natural mentoring relationships. *Journal of Community Psychology, 48*(2), 525–544. https://doi.org/10.1002/jcop.22269 *(online 2019)*

Boutakidis, I., Espinoza, G., Sevier, M., & Sadek, A. (2024). Impact of a peer mentoring program on graduation rates. *Journal of College Student Retention.* Advance online publication. https://doi.org/10.1177/15210251241268852 *[PENDIENTE: vol./núm./pp.]*

Brady, S. T., Cohen, G. L., Jarvis, S. N., & Walton, G. M. (2020). A brief social-belonging intervention improves adult outcomes for Black Americans. *Science Advances, 6*(18), eaay3689. https://doi.org/10.1126/sciadv.aay3689

Broda, M., Yun, J., Schneider, B., Yeager, D. S., Walton, G. M., & Diemer, M. (2018). Reducing inequality in academic success. *Journal of Research on Educational Effectiveness, 11*(3), 317–338. https://doi.org/10.1080/19345747.2018.1429037

Crawford, J., Allen, K. A., Sanders, T., Baumeister, R., Parker, P., Saunders, C., & Tice, D. (2024). Sense of belonging: An Australian longitudinal study. *Studies in Higher Education, 49*(3), 395–409. https://doi.org/10.1080/03075079.2023.2238006

Dennehy, T. C., & Dasgupta, N. (2017). Female peer mentors increase women's retention in engineering. *PNAS, 114*(23), 5964–5969. https://doi.org/10.1073/pnas.1613117114

Dias-Broens, A. S., Meeuwisse, M., de Moor, M. H. M., & Severiens, S. E. (2026). First-year students' sense of belonging: measurement invariance and longitudinal development. *Studies in Higher Education.* *[PENDIENTE_VERIFICACION: DOI, vol., núm., pp.]*

Fincham, E., Rozemberczki, B., Kovanovic, V., Joksimovic, S., Jovanovic, J., & Gasevic, D. (2021). Persistence and performance in co-enrollment network embeddings. *IEEE Transactions on Learning Technologies, 14*(1), 106–121. https://doi.org/10.1109/TLT.2021.3059362

Fitzpatrick, D., Collier, D. A., Parnther, C., Du, Y., Brehm, C., Willson-Conrad, A., Beach, A., & Hearit, K. (2021). First-year experience course plus mentoring on student outcomes. *Higher Education Research & Development, 40*(3), 491–507. https://doi.org/10.1080/07294360.2020.1761303

Hernandez, P. R., Bloodhart, B., Barnes, R. T., Adams, A. S., Clinton, S. M., Pollack, I., Godfrey, E., Burt, M., & Fischer, E. V. (2017). Promoting professional identity, motivation, and persistence. *PLoS ONE, 12*(11), e0187531. https://doi.org/10.1371/journal.pone.0187531

Hernandez, P. R., Hopkins, P. D., Masters, K., Holland, L., Mei, B. M., Richards-Babb, M., Quedado, K., & Shook, N. J. (2018). Student integration into STEM careers and culture. *CBE—Life Sciences Education, 17*(3), ar50. https://doi.org/10.1187/cbe.18-02-0022

Hernandez, P. R., Agocha, V. B., Carney, L. M., Estrada, M., Lee, S. Y., & Loomis, D. et al. (2020). Reciprocal relations between social influence and integration in STEM. *PLoS ONE, 15*(9), e0238250. https://doi.org/10.1371/journal.pone.0238250 *[completar lista de autores en versión final]*

Holliman, A. J., Martin, A. J., & Collie, R. J. (2018). Adaptability, engagement, and degree completion. *Educational Psychology, 38*(6), 785–799. https://doi.org/10.1080/01443410.2018.1426835

Lee, H.-S., Flores, L. Y., Navarro, R. L., & Kanagui-Muñoz, M. (2015). Longitudinal test of SCCT's persistence model in engineering. *Journal of Vocational Behavior, 88*, 95–103. https://doi.org/10.1016/j.jvb.2015.02.003

Murphy, M. C., Gopalan, M., Carter, E. R., Emerson, K. T. U., Bottoms, B. L., & Walton, G. M. (2020). A customized belonging intervention improves retention at a broad-access university. *Science Advances, 6*(29), eaba4677. https://doi.org/10.1126/sciadv.aba4677

Musso, M. F., Hernández, C. F. R., & Cascallar, E. C. (2020). Predicting key educational outcomes: A machine-learning approach. *Higher Education, 80*, 875–894. https://doi.org/10.1007/s10734-020-00520-7

Patterson Silver Wolf (Adelv unegv Waya), D. A., Perkins, J., Butler-Barnes, S. T., & Walker, T. A. Jr. (2017). Social belonging and college retention. *Journal of College Student Development, 58*(5), 777–782. https://doi.org/10.1353/csd.2017.0060

van der Velden, G. J., Meeuwsen, J. A., Fox, C. M., et al. (2023). Peer-mentorship and first-year inclusion. *BMC Medical Education, 23*, art. 833. https://doi.org/10.1186/s12909-023-04805-0 *[completar lista de autores en versión final]*

Venegas Muggli, J. I., Barrientos, C., & Álvarez, F. (2021). The impact of peer-mentoring on academic success of underrepresented students. *Journal of College Student Retention, 25*(3), 554–571. https://doi.org/10.1177/1521025121995988 *(online 2021; vol. impreso 2023)*

**Referencias fundacionales (marco conceptual — fuera de la base sistemática)**

Bandura, A. (1997). *Self-efficacy: The exercise of control.* Freeman. | Lent, R. W., Brown, S. D., & Hackett, G. (1994). Toward a unifying social cognitive theory. *Journal of Vocational Behavior, 45*(1), 79–122. | Tinto, V. (1987). *Leaving college.* University of Chicago Press. | Walton, G. M., & Cohen, G. L. (2011). A brief social-belonging intervention. *Science, 331*(6023), 1447–1451.


## Supuestos y vacíos por validar

1. **Vigencia anual de umbrales HMS/IBI:** los umbrales IBI <51, PHQ-9 ≥15 y GAD-7 ≥10 fueron verificados en documentación institucional disponible; deben reconfirmarse con Bienestar Estudiantil antes de protocolizar los Niveles 2-3 del sistema escalonado.
2. **Mecanismo de captura del microinstrumento:** la modalidad definitiva de aplicación pre/post con marca temporal y vinculación por ID anónimo aún debe definirse institucionalmente. La integración en miVidaTec se considera una posibilidad de desarrollo, no un prerrequisito para el piloto.
3. **Responsable funcional del microinstrumento:** no definido. **Input requerido** (área de Bienestar, Mentores Estudiantiles o Analítica Institucional).
4. **Tamizaje de entrada para transferencias/reingreso (Nueva captura propuesta):** aún no está confirmado institucionalmente y requiere aval de Bienestar Estudiantil. Sin este tamizaje, el Nivel 0-1 HMS/IBI solo aplicaría a primer ingreso.
5. **Dimensionamiento muestral condicionado:** la meta de n≥400 total y subgrupos n≥100 es preliminar y depende del corte real de matrícula por subgrupo. La proporción de transferencias temporales (20-25% del total) también es una estimación preliminar — **pendiente verificación exacta con Escolares**.
6. **Completitud de `baja_motivo`:** disponible en CRM/Escolares pero sin porcentaje de completitud confirmado. Si <85%, se degrada a variable descriptiva con plan de faltantes.
7. **Cómputo de estatus académico para transferencias:** el Reglamento Cap. VIII (Art. 8.3/8.8) puede generar ambigüedad en el cálculo de `estatus_academico_previo`, dependiendo de la homologación de créditos. **Input requerido** con Escolares sobre el criterio exacto por subtipo de transferencia.
8. **Capacitación logística de mentores para I1-I2-I3:** no confirmada la capacidad del área de Mentores Estudiantiles para formar a los mentores en Año 1. **Dato no disponible.**
9. **Generalización analítica condicionada:** los resultados se interpretarían primariamente en el contexto del Tec Monterrey. Su transferibilidad a otras instituciones LATAM con perfil comparable está respaldada por la evidencia revisada, pero requiere replicación empírica.
10. **Listas de autores incompletas:** PRISMA_0061 (Hernandez et al., 2020) y PRISMA_0052 (van der Velden et al., 2023) tienen autores completos disponibles en fuentes abiertas; deben expandirse antes de la versión definitiva de la tesis.


## ANEXOS — ÍNDICE Y TRAZABILIDAD

*Esta sección consolida la documentación de soporte metodológico. Permite al evaluador verificar la trazabilidad del proceso de revisión y del diseño empírico sin acceder a los archivos originales del repositorio del proyecto.*


### A1 — Flujo PRISMA final (90 → 50 → 20)

**Fuente:** `proyecto_matriz_extraccion/prisma_flow_final_v1.md`

| Etapa PRISMA | Conteo | Detalle |
|---|---:|---|
| Identificación | 90 | Registros en la base de revisión exploratoria v8. |
| Duplicados/no elegibles iniciales | 2 | Duplicados: 1; no arbitrado por pares: 1. |
| Cribado título/resumen | 90 | Registros evaluados. |
| Excluidos en cribado | 40 | Sin agencia: 18; sin variable de retención: 18; fuera de ventana: 2; no arbitrado por pares: 1; duplicado: 1. |
| Texto completo evaluado | 50 | Registros que avanzan a elegibilidad. |
| Excluidos en texto completo | 30 | Diseño no elegible: 11; fuera de ventana: 8; sin variable de retención: 8; sin agencia: 3. |
| Incluidos en síntesis | 20 | Base final para síntesis sistemática. |

**Distribución por diseño:**
| Diseño | n |
|---|---:|
| RCT / experimental | 5 |
| Cuasi-experimental / control emparejado | 5 |
| Longitudinal (SEM / PSM / cross-lag) | 5 |
| ML predictivo / híbrido ML-teoría | 3 |
| Longitudinal + invarianza de medición | 2 |

**Distribución por subgrupo:**
| Subgrupo | n |
|---|---:|
| Primer año (foco explícito en first-year) | 10 |
| LATAM / LATAM-adjacent | 4–5 |
| STEM | 5 |
| ML / híbrido ML-teoría | 3 |


### A2 — Matriz de extracción sistemática N=20 (campos clave)

**Fuente:** `proyecto_matriz_extraccion/matriz_extraccion_sistematica_v2.csv`

| # | ID PRISMA | Autor | Año | Tradición | Diseño | Variable de resultado | Contexto | Constructo de agencia |
|---|---|---|---|---|---|---|---|---|
| 1 | PRISMA_0004 | Fincham et al. | 2021 | Integración + ML | ML predictivo | Persistencia/desempeño | EE. UU. | Relacional (red) |
| 2 | PRISMA_0007 | Holliman et al. | 2018 | Ajuste psicológico | Longitudinal | Engagement/completion | Reino Unido | Adaptabilidad |
| 3 | PRISMA_0017 | Dennehy & Dasgupta | 2017 | Mentoría relacional | Experimental | Retención STEM | EE. UU. | Mentoría par |
| 4 | PRISMA_0018 | Brady et al. | 2020 | Intervención breve | RCT (10 años) | Persistencia/vida | EE. UU. | Construal |
| 5 | PRISMA_0019 | Murphy et al. | 2020 | Intervención breve | RCT | Retención a 2 años | EE. UU. | Belonging |
| 6 | PRISMA_0025 | Hernandez et al. | 2017 | Mentoría SCCT | Long. PSM | Persistencia STEM | HSI EE. UU. | Identidad profesional |
| 7 | PRISMA_0026 | Crawford et al. | 2024 | Belonging + ML | Long. + ML | Riesgo de attrition | Australia | Belonging dinámico |
| 8 | PRISMA_0027 | Broda et al. | 2018 | Intervención breve | RCT | GPA (subgrupo latino) | EE. UU. | Growth mindset/belonging |
| 9 | PRISMA_0029 | Silver Wolf et al. | 2017 | Belonging | Cuasi-experimental | Retención piloto | EE. UU. | Belonging |
| 10 | PRISMA_0032 | Berardi et al. | 2019 | Mentoría natural | SEM longitudinal | Ajuste universitario | EE. UU. | Mentoría natural |
| 11 | PRISMA_0033 | Lee et al. | 2015 | SCCT | Longitudinal | Persistencia STEM | HSI EE. UU. | Self-efficacy |
| 12 | PRISMA_0042 | Dias-Broens et al. | 2026 | Belonging + invarianza | Long. invarianza | Belonging dinámico | Multipaís Erasmus | Belonging |
| 13 | PRISMA_0046 | Musso et al. | 2020 | ML híbrido | ML (ANN) | Retención/GPA | HE privada (LATAM) | Coping/estrategias aprendizaje |
| 14 | PRISMA_0047 | Fitzpatrick et al. | 2021 | Mentoría + FYE | Experimental | Persistencia | EE. UU. | Mentoría |
| 15 | PRISMA_0048 | Boutakidis et al. | 2024 | Mentoría par | Matched control | Graduation rates | HE | Mentoría par |
| 16 | PRISMA_0051 | Baier et al. | 2016 | Self-efficacy + mentoría | Predictivo cuant. | Intent to persist | EE. UU. | Self-efficacy |
| 17 | PRISMA_0052 | van der Velden et al. | 2023 | Mentoría par + inclusión | Long./cuasi | Belonging/inclusión | HE Europa | Mentoría par |
| 18 | PRISMA_0055 | Hernandez et al. | 2018 | Mentoría facultad STEM | Longitudinal | Integración STEM | EE. UU. STEM | Mentoría facultad |
| 19 | PRISMA_0061 | Hernandez et al. | 2020 | Integración social STEM | Long. cross-lag | Integración social | STEM | Integración social |
| 20 | PRISMA_0068 | Venegas Muggli et al. | 2021 | Mentoría par Chile | Cuasi-exp. PSM | Retención/promedio | Chile (INACAP) | Mentoría par |

*Nota LATAM:* PRISMA_0046 (Musso, Argentina) y PRISMA_0068 (Venegas Muggli, Chile) son los únicos estudios con contexto LATAM directo. PRISMA_0025, 0033, 0055, 0061 son LATAM-adjacent por composición de muestra (HSI con estudiantes Latina/o en EE. UU.).


### A3 — Consolidación de revisión exploratoria N=90 + métricas de booleanos (v8)

**Fuente:** `proyecto_matriz_extraccion/metricas_acumuladas_scoping_v8.md` + `prisma_fulltext_pool_v5_cerrado.csv`

**Base total de revisión exploratoria:** 90 estudios codificados, acumulados en 8 versiones iterativas (v1 a v8) mediante lotes progresivos de búsqueda y cribado por booleanos de priorización.

| Indicador booleano | Estudios que cumplen | % de la base |
|---|---:|---:|
| `bool_agencia_subjetiva` (variable de agencia presente) | 58 / 90 | 64% |
| `bool_longitudinal` (diseño longitudinal) | 42 / 90 | 47% |
| `bool_predice_retencion` (variable de retención explícita) | 66 / 90 | 73% |
| `bool_ml` (modelo de aprendizaje automático) | 25 / 90 | 28% |
| `bool_hibrido_ml_teoria` (ML + marco teórico) | 12 / 90 | 13% |
| `bool_experimental_o_cuasi` (diseño experimental/cuasi) | 13 / 90 | 14% |
| `bool_latam` (contexto LATAM) | 12 / 90 | 13% |
| `bool_stem` (contexto STEM) | 13 / 90 | 14% |
| `bool_invariancia` (estudio de invarianza de medición) | 11 / 90 | 12% |

**Micro-lote adicional de invarianza (v8):** 6 estudios agregados para cerrar gap de invarianza psicométrica (umbral mínimo ≥8 cumplido): INV_F_01 a INV_F_06.

**Notas sobre las brechas documentadas:**
- El bajo porcentaje de estudios `bool_hibrido_ml_teoria` (13%) confirma empíricamente la separación entre tradición predictiva y explicativa que motiva la Ruta B.
- El 13% de contexto LATAM con bajo solapamiento con estudios que también tienen agencia subjetiva es la brecha de evidencia local que la tesis se propone reducir.


### A4 — Diccionario de variables V2 (disponibles vs. nueva captura vs. derivadas)

**Fuente:** `entregables_finales/45_diccionario_variables_v2_agencia_activada_v1.csv`

**Variables disponibles (fuente institucional):**

| ID | Nombre | Fuente | Tipo | Uso en modelo |
|---|---|---|---|---|
| A001 | retencion_t1_t2 | Escolares | Binaria | Variable de resultado primaria |
| A002 | baja_motivo | Escolares/CRM | Categórica | Variable de resultado secundaria |
| A003 | nuevo_condicional | Escolares | Binaria | Variable de resultado secundaria |
| A004 | tipo_poblacion | Escolares | Categórica | Estratificación |
| A005 | tipo_transferencia | Escolares | Categórica (temporal/definitiva) | Estratificación |
| A006 | promedio_acumulado | Escolares | Numérica | Predictor M0 |
| A007 | creditos_reprobados | Escolares | Numérica | Predictor M0 |
| A008 | tipo_beca | Escolares | Categórica | Predictor M0 |
| A009 | registro_mivida | miVidaTec | Binaria | Predictor M1 |
| A010 | caso_crm | CRM | Binaria | Predictor M1 |
| A011 | entrevista_crm | CRM | Binaria | Predictor M1 |
| A012 | proposito_doc | miVidaTec | Binaria | Control contextual (no indicador indirecto de agencia) |
| A013 | metas_3_dim | miVidaTec | Binaria | Control contextual (no indicador indirecto de agencia) |

*Nota:* `foráneo` (Escolares, disponible) se incluye como covariable obligatoria en M0. `etapa_académica` (Exploración/Enfoque/Especialización — derivada de semestre y programa, Escolares) se incluye como covariable obligatoria y moderador potencial.

**Variables de nueva captura (microinstrumento en fase de diseño — parámetros preliminares: estimado ≤90 seg.; longitud definitiva sujeta a pilotaje psicométrico en Años 1-2):**

| ID | Nombre | Momento | Tipo | Uso en modelo |
|---|---|---|---|---|
| N001-N002 | construal_pre / construal_post | t0 / t2 | Ordinal (Likert 1-5) | Componente delta |
| N003 | delta_construal | Derivada (t2−t0) | Numérica | Indicador de agencia en M2 |
| N004-N005 | autoeficacia_sit_pre / _post | t0 / t2 | Ordinal (Likert 1-5) | Componente delta |
| N006 | delta_autoeficacia_sit | Derivada (t2−t0) | Numérica | Indicador de agencia en M2 |
| N007-N008 | regulacion_pre / _post | t0 / t2 | Ordinal (Likert 1-5) | Componente delta |
| N009 | delta_regulacion | Derivada (t2−t0) | Numérica | Indicador de agencia en M2 |
| N010 | calidad_mentoria_idx | t2 | Numérica (0-100) | Indicador de agencia en M2 |
| N011 | calidad_metas_rubrica | t2 | Ordinal (0-3, rúbrica mentor) | Indicador de agencia en M2 |
| N012 | intervencion_exposicion | t2 | Categórica (ninguna/parcial/completa) | Variable de tratamiento |


### A5 — Definiciones operativas de variables de resultado y variables de riesgo académico normativo

**Variables de resultado confirmadas disponibles en sistemas institucionales:**

| Variable de resultado | Definición operativa | Tipo | Fuente | Nota |
|---|---|---|---|---|
| `retencion_t1_t2` | Reinscripción del estudiante al siguiente periodo semestral (sí/no) | Binaria | Escolares | Variable de resultado primaria; comparable entre todas las poblaciones |
| `baja_motivo` | Razón de baja según taxonomía institucional (económica, académica, disciplinaria, salud, otro) | Categórica | Escolares/CRM | Completitud pendiente de auditoría (umbral mínimo ≥85% no nulos) |
| `nuevo_condicional` | Transición a estatus Condicional en el siguiente periodo (sí/no) | Binaria | Escolares | Variable de resultado intermedia/secundaria |

**Variables de riesgo académico normativo (Reglamento Académico Cap. VIII):**

| Estatus | Definición (Art. 8.2-8.6) | Variable en diseño |
|---|---|---|
| Regular | No incurre en condiciones de Condicional, Baja Académica o Baja por Integridad | `estatus_academico_previo` |
| Condicional | ≥12 créditos reprobados acumulados O ≥9 en un periodo semestral | `nuevo_condicional`; activador de DHEA |
| Baja Académica | Condicional + no registra/cumple DHEA; O ≥24 créditos antes del 50% del plan; O ≥30 créditos totales | `transicion_estatus` (derivada) |
| DHEA | Programa de Desarrollo de Habilidades para el Éxito Académico: obligatorio para estudiantes Condicionales (Art. 8.4). El incumplimiento genera Baja Académica. Los créditos DHEA no cuentan para el acumulado de reprobadas. | `dhea_inscripcion`, `dhea_cumplimiento` |

*Nota sobre transferencias:* el Reglamento toma en cuenta créditos de todas las UF aunque haya cambio de carrera (Art. 8.3, 8.8). El criterio exacto de cómputo de estatus para transferencias según homologación de créditos previos requiere confirmación con Escolares antes del protocolo.


### A6 — Esquema temporal t0-t1-t2-t3 por población

**Diseño:** longitudinal por semestre académico con 4 puntos de medición. El semestre tiene 17 semanas; Semanas Tec en semanas 6 y 12 (Generalidades Planes 2026).

| Punto | Evento | Primer ingreso | Transferencia interna | Reingreso |
|---|---|---|---|---|
| **t0** | Microinstrumento pre; tamizaje IBI/HMS | Semanas 1-2 del 1er semestre | Semanas 1-2 post-transfer | Semanas 1-2 del semestre de reingreso |
| **t1** | Corte intermedio; Semana Tec 6; seguimiento Nivel 1 | Semana 6 | Semana 6 | Semana 6 |
| **t2** | Microinstrumento post; ECOA Semana 17 | Semana 17-18 | Semana 17-18 | Semana 17-18 |
| **t3** | Variable de resultado primaria: reinscripción | Inicio siguiente periodo | Inicio siguiente periodo | Inicio siguiente periodo |

**Contenido de cada medición:**
- *t0:* microinstrumento pre (construal, autoeficacia, regulación — estructura preliminar estimada en 3+2+2 ítems; sujeta a pilotaje psicométrico); tamizaje IBI de entrada (confirmado para primer ingreso; *Nueva captura propuesta* para transferencias/reingreso); datos administrativos M0 vinculados.
- *t1:* revisión de adherencia I1-I2-I3; seguimiento Nivel 1 HMS/IBI si aplica; corte de datos de acompañamiento M1.
- *t2:* microinstrumento post (mismos constructos); ECOA (calidad_mentoria_idx parcial); rúbrica de metas I2 (calidad_metas_rubrica); registro de exposición (intervencion_exposicion).
- *t3:* verificación de reinscripción (retencion_t1_t2); registro de baja_motivo si aplica; actualización de estatus académico (nuevo_condicional).


### A7 — Estrategia contrafactual: DiD + emparejamiento (síntesis operativa)

**Fuente:** `entregables_finales/53_plan_investigacion_doctoral_v2_ajustado_final.md` (Sección 3)

| Componente | Definición operativa |
|---|---|
| Diseño principal | Diferencias-en-diferencias (DiD) con emparejamiento por puntaje de propensión (PSM). |
| Grupo de comparación 1 | Cohorte histórica preintervención (periodos sin I1-I2-I3), con mismas poblaciones objetivo. |
| Grupo de comparación 2 | Mentores comparables contemporáneos con variación natural de adherencia (`intervencion_exposicion`: ninguna/parcial/completa). |
| Variables de emparejamiento (PSM) | `promedio_acumulado`, `creditos_reprobados`, `tipo_beca`, `foraneo`, `etapa_academica`, `estatus_academico_previo`, `tipo_poblacion`. |
| Controles obligatorios | `etapa_academica` y `tipo_poblacion` en todos los modelos; `tipo_transferencia` como moderador en subanálisis. |
| Análisis de sensibilidad | Cotas de Rosenbaum para evaluar robustez ante confusores no observados. |
| Límite inferencial | Diseño cuasi-experimental; inferencia causal condicionada; no equivalente a un RCT. |


### A8 — Estado de referencias N=20 (18 verificadas + 2 pendientes)

**Fuente:** `entregables_finales/39_referencias_n20_verificadas_v1.md`

| Criterio | Estado |
|---|---|
| N final de la base | 20 |
| Registros VERIFICADO (DOI confirmado en fuentes primarias) | 18 |
| Registros PENDIENTE_VERIFICACION | 2 |
| DOIs inventados | **0** |
| Estudios fuera de la base incluida | **0** |

**Registros PENDIENTE_VERIFICACION:**

| ID | Autores | Causa del pendiente | Metadatos confirmados | Acción recomendada |
|---|---|---|---|---|
| PRISMA_0042 | Dias-Broens, Meeuwisse, de Moor, Severiens | Artículo de 2026; DOI y paginación no indexados completamente en Crossref a la fecha de cierre | Autores, título, journal (*Studies in Higher Education*), año 2026 | Consultar tandfonline.com o EUR Pure de la autora para DOI/paginación definitivos |
| PRISMA_0048 | Boutakidis, Espinoza, Sevier, Sadek | Publicado en OnlineFirst (SAGE, agosto 2024); sin vol./núm./pp. impresos definitivos | Autores, título, journal, DOI: 10.1177/15210251241268852, año 2024 | Citar con "Advance online publication" + DOI; verificar periódicamente hasta asignación del fascículo |

**Discrepancias editoriales no invalidantes (VERIFICADO):**

| ID | Discrepancia | Resolución aplicada |
|---|---|---|
| PRISMA_0032 (Berardi) | Publicado online 2019; vol. 48 = 2020 | Citado como 2020 con nota "(online 2019)" |
| PRISMA_0026 (Crawford) | Online 2023; vol. 49 = 2024 | Citado como 2024 conforme al volumen |
| PRISMA_0068 (Venegas Muggli) | Online first 2021; vol. 25, n.3 = 2023 según ERIC | Citado como 2021 con nota "(vol. impreso 2023)" |

**Estudios con lista de autores a completar en versión definitiva:**
- PRISMA_0061 (Hernandez et al., 2020) — fuente: PLoS ONE (acceso abierto)
- PRISMA_0052 (van der Velden et al., 2023) — fuente: BMC Medical Education (acceso abierto)


## GLOSARIO TÉCNICO (TÉRMINOS METODOLÓGICOS CLAVE)

*Este glosario define los términos especializados usados en el documento para facilitar la lectura de evaluadores con formación en educación o ciencias sociales no familiarizados con estadística metodológica avanzada o analítica del aprendizaje.*

| Término | Definición |
|---|---|
| **Ensayo controlado aleatorizado (RCT)** | Diseño experimental en el que los participantes se asignan al azar al grupo de tratamiento o control, lo que ofrece una base sólida para la inferencia causal en la evaluación de intervenciones. |
| **Emparejamiento por puntaje de propensión (PSM)** | Técnica estadística que crea grupos comparables en estudios observacionales o cuasi-experimentales al emparejar individuos tratados y no tratados según su probabilidad estimada de recibir el tratamiento, calculada a partir de covariables observables. |
| **Diferencias-en-diferencias (DiD)** | Método cuasi-experimental que estima el efecto de una intervención comparando el cambio en el tiempo de un grupo tratado con el cambio en el tiempo de un grupo control, controlando diferencias preexistentes entre grupos. |
| **Valores de Shapley (SHAP)** | Método de interpretabilidad para modelos de aprendizaje automático que calcula la contribución marginal de cada variable predictora al resultado del modelo para cada observación individual, facilitando la explicabilidad de modelos complejos. |
| **Agencia subjetiva** | Capacidad percibida del propio estudiante para influir en sus circunstancias académicas; operacionalizada aquí mediante construal de pertenencia, autoeficacia situacional y regulación de afrontamiento. |
| **Construal (reencuadre cognitivo de pertenencia)** | Interpretación que un estudiante hace de las señales de dificultad académica: si las interpreta como propias de la transición (normales y transitorias) o como evidencia de que "no pertenece", esa interpretación se asocia con respuestas conductuales distintas. |
| **Variable delta (Δ)** | Cambio pre→post calculado como la diferencia entre la medición post-intervención y la medición pre-intervención (Δ = post − pre). En este diseño, las variables delta son los indicadores operativos del cambio en la agencia del estudiante activado por I1-I2-I3. |
| **Invarianza de medición** | Propiedad psicométrica que indica que un instrumento mide el mismo constructo de manera comparable en distintos grupos (e.g., primer ingreso vs. transferencia). Sin evidencia de invarianza, las comparaciones entre grupos deben interpretarse con cautela. |
| **AUC (Área Bajo la Curva ROC)** | Métrica de desempeño para modelos de clasificación binaria; varía de 0.5 (azar) a 1.0 (predicción perfecta). Un AUC ≥0.75 indica capacidad predictiva sustantiva. |
| **DHEA** | Programa de Desarrollo de Habilidades para el Éxito Académico: programa institucional obligatorio para estudiantes en estatus Condicional. Su incumplimiento, según el Reglamento Académico Cap. VIII, Art. 8.4, genera Baja Académica. |
| **Revisión exploratoria** | Revisión bibliográfica amplia y sistemática orientada a mapear el campo, identificar brechas y priorizar estudios, sin llegar a síntesis cuantitativa (metaanálisis). En este proyecto fue el primer paso para construir la base sistemática N=20. |
| **Causalidad predictiva integrada** | Marco analítico propuesto en esta tesis que combina la identificación de mecanismos causales (de la tradición experimental y cuasi-experimental) con la capacidad predictiva de modelos de aprendizaje automático, para generar tanto explicación como anticipación del riesgo de abandono. |
