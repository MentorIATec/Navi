# Arquitectura y Documento Metodológico: BrujulApp
**Versión:** 1.0
**Rol del Sistema:** Vehículo tecnológico híbrido (Remoto/Presencial) para la ejecución de intervenciones de mentoría y captura de datos (modelo M2).

## 1. Naturaleza del Sistema
**BrujulApp** es una Single Page Application (SPA) React conectada a una API de Google Apps Script. No es el "Instrumento de Investigación" en sí mismo, sino la **infraestructura de entrega** que permite operacionalizar el acompañamiento a escala y capturar de manera invisible los datos requeridos por el modelo causal-predictivo.

## 2. Fases Operativas y Captura de Datos

El diseño de BrujulApp obedece a un modelo operativo de "Embudo Híbrido" (Hybrid Funnel) diseñado para interactuar con las poblaciones de estudiantes (Primer Ingreso, Transferencias, Reingreso):

### Fase 1: Despliegue Masivo y Línea Base (Remoto)
- **Mecanismo:** El Admin/Mentor dispara una campaña masiva de correos desde la interfaz `/admin`.
- **Ruta del Usuario:** `/pre-test` $\rightarrow$ `/test` $\rightarrow$ `/resultados`.
- **Captura Metodológica:** En esta fase, el 100% de la población contactada que abre el enlace proporciona su **Línea Base de Agencia** (Pre-test, $t_0$) y el diagnóstico de pilares institucionales. Termina con un Call To Action para que el estudiante agende una sesión de mentoría presencial.

### Fase 2: Intervención Conductual (Presencial / On-Site)
- **Mecanismo:** Ocurre durante la sesión física de Revisión de Trayectoria.
- **Ruta del Usuario:** `/check-in` $\rightarrow$ `/seleccion-metas` $\rightarrow$ `/plan-accion`.
- **Captura Metodológica:**
  1. En la sala de mentoría, el alumno usa su dispositivo para validar asistencia (`/check-in`). Aquí el sistema levanta el **Post-test** ($t_2$) para la población tratada (expuesta).
  2. Inmediatamente después, el sistema guía la **Intervención I2**, forzando al alumno a articular su meta, obstáculo y plan "Si-Entonces" (WOOP).
  3. El texto bruto ingresado por el alumno se guarda en la base de datos para que posteriormente el Mentor evalúe la calidad mediante la *Rúbrica de Metas* establecida en la investigación.

### Fase 3: Recuperación de Sesgo y "No-Shows" (Remoto)
- **Contexto Operacional:** BrujulApp incluye un Panel de Administración que cruza los datos de quienes completaron la Fase 1 pero no llegaron a la Fase 2 (No-Shows).
- **Mecanismo:** El Mentor ejecuta una campaña de "Follow-up" exclusiva para inasistencias.
- **Solución al Sesgo Analítico:** Esto permite habilitar una ruta alternativa (ej. `/remote-check-in` o un simple form) enviada por correo a los No-Shows para capturar su **Post-test** sin la intervención presencial, garantizando así la recolección de datos del grupo "No Tratado / No Expuesto" para la correcta evaluación causal del diseño.

## 3. Seguridad y Privacidad de Datos (IP)
La plataforma utiliza Google Workspace SSO ("Ejecutar como usuario que accede").
- **Estudiantes:** Solo escriben datos en su sesión.
- **Mentores:** Solo visualizan en el panel `/admin` a los estudiantes que les fueron asignados, y pueden consultar el catálogo de metas sin poder exportarlo.
- **Admin (Investigador principal):** Acceso global a los datos crudos anónimos para entrenar los modelos M0, M1, y M2.
