# Resumen Metodológico: Microinstrumento Breve en BrujulApp

Este documento detalla la integración operativa del "Microinstrumento de Afrontamiento" dentro del flujo de usuario de la plataforma **BrujulApp**. Su propósito es recolectar datos longitudinales viables (Pre-test y Post-test) para capturar la variación breve en **autoeficacia situacional y regulación de afrontamiento** después de una intervención puntual. No pretende probar un cambio amplio en el constructo general de "agencia", sino medir el efecto focal de la mentoría en estas dos dimensiones operativas.

## 1. Implementación en el Journey del Usuario

El diseño del microinstrumento busca medir el "Delta" ($\Delta$) o cambio en la agencia subjetiva a través de dos momentos clave de captura (t0 y t2), tal como se estipula en el protocolo empírico.

1. **Captura Basal / Pre-Test (t0):** 
   Se recolecta en la ruta `/pre-test`, inmediatamente después de que el estudiante ingresa su matrícula y antes de comenzar el "Diagnóstico de Pilares". Se presenta bajo el concepto de "Reflexión Inicial".
   
2. **Captura Post-Intervención / Post-Test (t2):**
   Se recolecta en la ruta oculta `/check-in`. Cuando el estudiante acude a su evento presencial de *Revisión de Trayectoria* con su mentor(a), valida su asistencia e inmediatamente responde los mismos ítems. Esto permite calcular el cambio ($\Delta_{post} - \Delta_{pre}$).

## 2. Constructos e Ítems del Microinstrumento

El microinstrumento consta de **4 ítems** divididos en dos constructos teóricos validados para intervenciones breves. Todos los ítems se responden utilizando una **Escala Likert de 5 puntos**:
*(1 = Totalmente en desacuerdo, 2 = En desacuerdo, 3 = Neutral, 4 = De acuerdo, 5 = Totalmente de acuerdo).*

### Constructo A: Autoeficacia Situacional
Mide la expectativa de que el estudiante se siente equipado para actuar frente al reto universitario.
* **Ítem 1 (a1):** *"Confío en mi capacidad para afrontar los retos académicos de este semestre."*
* **Ítem 2 (a2):** *"Sé qué tipo de acción tomar cuando me enfrento a una materia o situación académica difícil."*

### Constructo B: Regulación de Afrontamiento
Mide la contención ejecutiva-emocional frente a la dificultad y el estrés académico (Coping).
* **Ítem 3 (r1):** *"Cuando me siento estresado/a o saturado/a por la escuela, logro detenerme y enfocarme en cómo responder."*
* **Ítem 4 (r2):** *"Ante un obstáculo imprevisto que afecta mis planes, soy capaz de ajustar mi estrategia sin quedarme paralizado/a."*

---

## 3. Complemento de Agencia: Intervención Conductual (I2)

Además de medir la agencia mediante los ítems Likert, BrujulApp implementa de manera activa la **Intervención I2 (Metas con implementación conductual)** basada en la metodología WOOP (*Wish, Outcome, Obstacle, Plan*). 

En lugar de que los estudiantes simplemente seleccionen una meta pasiva de un catálogo, la ruta `/seleccion-metas` los obliga metodológicamente a definir:
1. **La Ventana de Tiempo** (flexibilidad de autonomía).
2. **El Obstáculo Principal:** *"¿Cuál es el obstáculo principal que podría impedirte lograr estas metas?"*
3. **El Plan Si-Entonces:** *"Estrategia 'Si-Entonces': Si sucede el obstáculo, ¿qué acción tomarás inmediatamente?"*

### Trazabilidad de Datos (Input para M2)
Los resultados emparejados del Pre-test y Post-test, junto con la evidencia cualitativa de las estrategias de afrontamiento (el plan Si-Entonces), alimentarán de forma automatizada las matrices de datos para el entrenamiento del modelo predictivo incrementado (M2).
