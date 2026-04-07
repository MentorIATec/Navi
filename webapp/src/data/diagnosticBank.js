export const DIAGNOSTIC_STAGE_OPTIONS = [
  {
    id: 'exploracion',
    label: 'Exploración',
    description:
      'Estoy en los primeros semestres de mi programa o avenida, y aún no defino cuál será mi carrera de egreso.',
    context: 'avenida',
  },
  {
    id: 'enfoque',
    label: 'Enfoque',
    description:
      'Ya elegí mi carrera de egreso y estoy cerca o en la mitad de mi carrera académica.',
    context: 'carrera_definida',
  },
];

export const DIAGNOSTIC_BANK = {
  exploracion: [
    {
      key: 'claridad_carrera',
      category: 'claridad_carrera',
      title: '🎓 ¿Qué tan claro tienes la carrera que quieres elegir y tu proceso para decidir?',
      options: [
        'Nada claro, necesito orientación.',
        'Tengo algunas ideas, pero sigo confundido/a.',
        'Estoy explorando opciones (cursos, talleres o asesoría).',
        'Tengo casi decidido mi camino.',
        'Estoy totalmente seguro/a de mi elección.',
      ],
    },
    {
      key: 'desempeno_academico',
      category: 'desempeno_academico',
      title: '📚 ¿Cómo evalúas tu desempeño académico y tu promedio actual?',
      options: [
        'Me siento insatisfecho/a con mi promedio.',
        'Mi promedio no refleja mi esfuerzo.',
        'Estoy en un promedio aceptable, pero quiero mejorar.',
        'Estoy satisfecho/a con mi desempeño.',
        'Mi promedio es excelente y constante.',
      ],
    },
    {
      key: 'plan_practicas',
      category: 'plan_practicas',
      title: '💼 ¿Qué tanto sabes sobre cómo y dónde buscar tus primeras prácticas profesionales?',
      options: [
        'No sé nada aún sobre prácticas.',
        'He escuchado algo, pero no tengo claro el proceso.',
        'Estoy investigando opciones y requisitos.',
        'Ya identifiqué oportunidades concretas.',
        'Estoy por aplicar o ya apliqué a prácticas.',
      ],
    },
    {
      key: 'servicio_social',
      category: 'servicio_social',
      title: '🤝 ¿Qué tan claro tienes tu plan para completar tus 480h de servicio social?',
      options: [
        'No he pensado en el servicio social.',
        'Sé que es requisito, pero no tengo plan.',
        'Estoy revisando opciones o proyectos.',
        'Ya tengo una opción identificada.',
        'Estoy inscrito/a y avanzando en horas.',
      ],
    },
  ],
  enfoque: [
    {
      key: 'servicio_social',
      category: 'servicio_social',
      title: '🤝 Antes de cursar tu Semestre Tec, necesitas haber completado tus 480 horas de Servicio Social. ¿Cuál es tu estatus actual?',
      options: [
        'No tengo claro cuándo lo terminaré, ni sé cuántas horas me faltan.',
        'Tengo un plan, pero me preocupa no terminar antes de mi Semestre Tec.',
        'Tengo pensado terminarlo en el próximo periodo intensivo (verano o invierno).',
        'Estoy en mi último proyecto y tengo planeado terminarlo este semestre.',
        '¡Misión cumplida! Ya cumplí mis 480 horas o más.',
      ],
    },
    {
      key: 'decision_semestre_tec',
      category: 'decision_semestre_tec',
      title: '✈️ ¿Qué tan definida tienes tu elección para tu(s) Semestre(s) Tec (intercambio, prácticas, concentración)?',
      options: [
        'Tengo algunas ideas generales, pero realmente no sé por dónde empezar a decidir.',
        'Ya estoy investigando, pero aún no he definido una opción clara.',
        'Tengo solo 1 opción considerada; si no funciona, no sabría qué elegir.',
        'Tengo al menos 3 alternativas que me gustan y planeo reunirme con mi Director de Programa para validarlas.',
        'Ya tengo 5 opciones bien estudiadas, me siento informado/a y ya lo validé con mi Director/a de Programa.',
      ],
    },
    {
      key: 'certificacion_idioma',
      category: 'certificacion_idioma',
      title: '🌍 Si consideras un intercambio, ¿cuál es tu estatus con el examen de certificación de idioma (inglés, francés, alemán, etc.)?',
      options: [
        'No estoy considerando un intercambio / No estoy seguro/a de qué examen o puntaje necesito para los destinos que me interesan.',
        'Sé lo que necesito, pero no he comenzado a prepararme formalmente.',
        'Estoy preparándome para un idioma distinto al inglés (ej. francés, alemán) que es requisito.',
        'Me siento listo/a para presentar el examen, pero aún no he agendado una fecha.',
        '¡Listo! Ya tengo mi certificado vigente con el puntaje necesario para mis opciones de intercambio.',
      ],
    },
    {
      key: 'plan_practicas',
      category: 'plan_practicas',
      title: '💼 Si tuvieras que aplicar a tus prácticas profesionales soñadas hoy mismo, ¿qué tan preparado/a te sentirías?',
      options: [
        'No me sentiría preparado/a; no he comenzado a adaptar mi CV ni he explorado empresas.',
        'Tengo un CV básico, pero necesitaría mucho trabajo para adaptarlo y no he buscado activamente.',
        'Estoy en proceso de mejorar mi CV y tengo una lista de empresas que me interesan.',
        'Me siento seguro/a con mi CV y ya estoy aplicando a vacantes o preparándome para entrevistas.',
        'Totalmente preparado/a; ya estoy en procesos de entrevista, tengo una oferta o ya conseguí prácticas.',
      ],
    },
  ],
};

export const CATEGORY_META = {
  claridad_carrera: {
    label: 'Claridad de carrera',
    recommendation:
      'Vale la pena conversar sobre opciones, criterios de decisión y próximos pasos para elegir con más seguridad.',
  },
  desempeno_academico: {
    label: 'Desempeño académico',
    recommendation:
      'Puede ser útil revisar hábitos, carga académica y apoyos concretos para fortalecer tu avance este semestre.',
  },
  plan_practicas: {
    label: 'Prácticas profesionales',
    recommendation:
      'Conviene aterrizar en qué punto del proceso te encuentras, qué te falta preparar y cuál sería tu siguiente paso más útil.',
  },
  servicio_social: {
    label: 'Servicio social',
    recommendation:
      'Hace sentido revisar tu avance real, lo que falta por resolver y cómo evitar que este tema te detenga más adelante.',
  },
  decision_semestre_tec: {
    label: 'Semestre Tec',
    recommendation:
      'Puede ayudar ordenar opciones, tiempos y criterios para tomar una decisión con más confianza.',
  },
  certificacion_idioma: {
    label: 'Certificación de idioma',
    recommendation:
      'Conviene aclarar requisitos, preparación y tiempos para que este frente no limite tus opciones.',
  },
};

export const STAGE_COPY = {
  exploracion: {
    hero: 'Aquí suele tocarte confirmar tu vocación profesional, fortalecer hábitos saludables, cuidar tu promedio académico y empezar a planear experiencias futuras como idiomas o programas insignia del Tec.',
  },
  enfoque: {
    hero: 'Aquí suele tocarte profundizar en la carrera que elegiste y prepararte para decisiones como Semestre Tec, intercambio, prácticas, investigación o emprendimiento.',
  },
};
