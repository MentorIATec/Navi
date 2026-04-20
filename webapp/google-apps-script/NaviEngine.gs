/**
 * NAVI ENGINE - Google Apps Script Backend
 * 
 * INSTRUCCIONES:
 * 1. Crea una nueva Google Sheet.
 * 2. Ve a 'Extensiones' > 'Apps Script'.
 * 3. Pega este código y guarda.
 * 4. Ejecuta la función 'setup' para inicializar las pestañas.
 * 5. Despliega como 'Aplicación Web' (Acceso: Cualquier persona).
 * 6. Copia la URL del despliegue en la configuración de Navi.
 */

const CONFIG_KEYS = {
  goalsJson: 'GOALS_JSON',
  goalsUpdatedAt: 'GOALS_UPDATED_AT',
  version: 'VERSION',
  lastSync: 'LAST_SYNC',
};

const STUDENT_HEADERS = ['Matrícula', 'Nombre', 'NombrePreferido', 'Email', 'NicknameMentor', 'Status', 'Check-in', 'AgenciaCheckIn', 'UltimoAviso'];
const LEGACY_STUDENT_HEADERS = ['Matrícula', 'Nombre', 'Email', 'NicknameMentor', 'Comunidad', 'Status', 'Check-in'];
const STAFF_HEADERS = ['Email', 'PIN', 'Nombre', 'Alias', 'Rol', 'Comunidad', 'Hex', 'Slogan', 'Activo'];
const RESPONSES_HEADERS = ['Matrícula', 'FechaTest', 'Modalidad', 'Etapa', 'ScorePromedio', 'AreasPrioritarias', 'Claridad_Carrera', 'Desempeno_Academico', 'Plan_Practicas', 'Servicio_Social', 'Decision_SemestreTec', 'Certificacion_Idioma'];
const GOAL_SELECTION_HEADERS = ['Timestamp', 'Matrícula', 'Nombre', 'Meta Prioritaria', 'Meta Complementaria', 'Tiempo', 'Obstáculo', 'Plan'];
const SESSIONS_HEADERS = ['Session_ID', 'Matricula', 'Nombre', 'Mentor', 'Comunidad', 'Periodo', 'Fecha_Sesion', 'Etapa', 'Areas_Prioritarias', 'Pretest_Resumen', 'Meta_Prioritaria', 'Meta_Complementaria', 'Horizonte', 'Obstaculo', 'Estrategia', 'Notas_Mentor', 'Estado_Documentacion', 'Documentado_CRM', 'Timestamp_Creacion', 'Timestamp_Actualizado'];
// Dimension = una sola de las 7 dimensiones del bienestar del modelo Tec.
// TemaOperativo = agrupador práctico de navegación/curación para mentoría; no reemplaza a la dimensión.
const GOALS_CATALOG_HEADERS = ['Id', 'TemaOperativo', 'Dimension', 'Etapa', 'MetaBase', 'PasosBase', 'HorizonteSugerido', 'IndicadorLogro', 'CuandoUsarla', 'NivelDificultad', 'FrecuenciaSeguimiento', 'ConexionDiagnostico', 'PreguntasParaAfinar', 'Activa'];
const COMMUNITY_SLOGANS = {
  Pasio: 'Descubre y vive tu pasión.',
  Revo: 'Somos luz que guía para forjar los sueños.',
  Kresko: 'Crecimiento integral que entrelaza ideas, pensamientos y actitudes.',
  Krei: 'Grandes ideas.',
  Forta: 'Fortaleza que hace que las acciones perduren, como el carácter fuerte para llegar lejos.',
  Spirita: 'Espíritu que inspira y genera cambio.',
  Reflekto: 'Creatividad que fluye y se refleja.',
  Energio: 'Energía en constante movimiento, que impulsa y transforma.',
  Ekvilibro: 'Simetría y balance en la vida.',
  Talenta: 'Alcanzar el éxito con los talentos que tenemos.',
};

const DEFAULT_GOALS = {
  prioritarias: [
    { id: 'prio-1', text: 'Regularizar mis materias clave para mantener mi avance', dimension: 'intelectual', conexiondiagnostico: 'riesgo-academico,planeacion-estudio' },
    { id: 'prio-2', text: 'Fortalecer mi plan de prácticas profesionales para este semestre', dimension: 'ocupacional', conexiondiagnostico: 'plan_practicas,empleabilidad' },
    { id: 'prio-3', text: 'Avanzar con servicio social e inglés para no frenar mi graduación', dimension: 'ocupacional', conexiondiagnostico: 'servicio_social,requisitos-egreso' },
  ],
  complementarias: [
    { id: 'comp-1', text: 'Construir hábitos de estudio sostenibles durante el semestre', dimension: 'emocional' },
    { id: 'comp-2', text: 'Mejorar mi organización personal y gestión del tiempo', dimension: 'espiritual' },
    { id: 'comp-3', text: 'Cuidar mi energía con rutinas de descanso y actividad física', dimension: 'fisica' },
  ],
};

const PRIORITARIA_DIMENSIONS = ['ocupacional', 'intelectual', 'financiera'];
const COMPLEMENTARIA_DIMENSIONS = ['emocional', 'social', 'fisica', 'espiritual'];
const DIAGNOSTIC_CATEGORY_MAP = {
  claridad_carrera: {
    dimensions: ['ocupacional'],
    tags: ['claridad_carrera', 'claridad-direccion', 'exploracion-vocacional', 'decision-profesional', 'carrera'],
  },
  desempeno_academico: {
    dimensions: ['intelectual'],
    tags: ['desempeno_academico', 'riesgo-academico', 'planeacion-estudio', 'habitos-estudio', 'aprendizaje', 'autogestion', 'retencion'],
  },
  plan_practicas: {
    dimensions: ['ocupacional'],
    tags: ['plan_practicas', 'empleabilidad', 'practicas', 'proyeccion-profesional'],
  },
  servicio_social: {
    dimensions: ['ocupacional'],
    tags: ['servicio_social', 'cumplimiento-requisitos', 'requisitos-egreso', 'servicio social', 'proyeccion-trayectoria'],
  },
  decision_semestre_tec: {
    dimensions: ['ocupacional'],
    tags: ['decision_semestre_tec', 'semestre tec', 'decision-profesional', 'movilidad', 'proyeccion-trayectoria'],
  },
  certificacion_idioma: {
    dimensions: ['intelectual', 'ocupacional'],
    tags: ['certificacion_idioma', 'idioma', 'intercambio', 'requisitos-egreso', 'proyeccion-trayectoria'],
  },
};

const DIAGNOSTIC_TAG_ALIASES = {
  'hábitos de estudio': 'desempeno_academico',
  'habitos de estudio': 'desempeno_academico',
  aprendizaje: 'desempeno_academico',
  'claridad academica': 'desempeno_academico',
  'claridad académica': 'desempeno_academico',
  carrera: 'claridad_carrera',
  'decision profesional': 'claridad_carrera',
  'decisión profesional': 'claridad_carrera',
  empleabilidad: 'plan_practicas',
  practicas: 'plan_practicas',
  'prácticas': 'plan_practicas',
  'servicio social': 'servicio_social',
  'semestre tec': 'decision_semestre_tec',
  intercambio: 'certificacion_idioma',
};
const CONTROLLED_DIAGNOSTIC_TAGS = Object.keys(DIAGNOSTIC_CATEGORY_MAP);
const ADMIN_WRITE_ACTIONS = ['syncBulk', 'saveGoalsCatalog', 'saveMetasConfig', 'sendCampaign'];

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Navi Admin')
    .addItem('Inicializar Tablas', 'setup')
    .addItem('Cargar Datos de Prueba de Comunidad', 'seedCommunityTestData')
    .addItem('Poblar Roles y Banco de Metas', 'seedRolesAndGoalsCatalog')
    .addSeparator()
    .addItem('Limpiar Datos de Prueba', 'clearTestData')
    .addToUi();
}

/** Inicializa la estructura de hojas y encabezados */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureCoreSheets_(ss);
  ensureGoalsConfig_(ss);
  ensureOperationsSheets_(ss);
  
  SpreadsheetApp.getUi().alert('✅ Estructura de Navi inicializada correctamente.');
}

/** API: Maneja solicitudes GET (Lectura de datos) */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureCoreSheets_(ss);
    ensureOperationsSheets_(ss);

    const staffData = parseSheetData(ensureSheetWithHeaders_(ss, 'Staff', STAFF_HEADERS).getDataRange().getValues());
    const payload = {
      status: 'success',
      data: {
        students: parseSheetData(ss.getSheetByName('Students').getDataRange().getValues()),
        staff: staffData,
        mentors: staffData,
        goalSelections: parseSheetData(ensureSheetWithHeaders_(ss, 'GoalSelections', GOAL_SELECTION_HEADERS).getDataRange().getValues()),
        responses: parseSheetData(ensureSheetWithHeaders_(ss, 'Responses', RESPONSES_HEADERS).getDataRange().getValues()),
        sessions: parseSheetData(ensureSessionsSheet_(ss).getDataRange().getValues()),
      }
    };

    if (e && e.parameter && e.parameter.action === 'getMetas') {
      return jsonResponse_({ status: 'success', ...getMetasData(ss, e && e.parameter ? e.parameter : {}) });
    }

    return jsonResponse_(payload);
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err.toString()
    });
  }
}

/** API: Maneja solicitudes POST (Escritura de datos) */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureCoreSheets_(ss);
    ensureOperationsSheets_(ss);
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (ADMIN_WRITE_ACTIONS.indexOf(action) > -1) {
      requireAdminSecret_(params, action);
    }

    if (action === 'findStudent') {
      return findStudent(ss, params.data);
    }

    if (action === 'resolveUserByEmail') {
      return resolveUserByEmail(ss, params.data);
    }
    
    if (action === 'updateStudent') {
      return updateStudentStatus(ss, params.data);
    }
    
    if (action === 'syncBulk') {
      return syncBulkData(ss, params.data);
    }

    if (action === 'getMetas') {
      return jsonResponse_({ status: 'success', ...getMetasData(ss, params.data || {}) });
    }

    if (action === 'getGoalsCatalog') {
      return jsonResponse_({ status: 'success', items: getGoalsCatalogData(ss) });
    }

    if (action === 'saveMetasConfig') {
      return saveMetasConfig(ss, params.data);
    }

    if (action === 'saveGoalsCatalog') {
      return saveGoalsCatalog(ss, params.data);
    }

    if (action === 'saveGoalSelection') {
      return saveGoalSelection(ss, params.data);
    }
    if (action === 'saveMentoringSession') {
      return saveMentoringSession(ss, params.data);
    }

    if (action === 'saveTestResponse') {
      return saveTestResponse(ss, params.data);
    }

    if (action === 'getTestResponse') {
      return getTestResponse(ss, params.data);
    }

    if (action === 'sendCampaign') {
      return sendCampaignHandler(ss, params.data);
    }

    return jsonResponse_({
      status: 'error',
      message: 'Acción no reconocida'
    });
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err.toString()
    });
  }
}

/** Auxiliar: Convierte matriz de Sheet a Array de Objetos */
function parseSheetData(values) {
  if (!values || values.length === 0) return [];
  const headers = values[0];
  if (!headers || headers.length === 0) return [];

  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      // Normalizar nombres de llaves para JS preservando letras acentuadas.
      const key = String(h)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      obj[key || 'field' + i] = row[i];
    });
    return obj;
  }).filter(row => Object.values(row).some(value => value !== '' && value !== null && value !== undefined));
}

/** Lógica: Sincronización masiva desde el Dashboard */
function syncBulkData(ss, data) {
  validateSyncBulkPayload_(ss, data);
  const studentSheet = ss.getSheetByName('Students');

  // Limpiar y escribir Alumnos (Staff se gestiona directamente en la hoja, no desde syncBulk)
  studentSheet.clearContents();
  studentSheet.appendRow(STUDENT_HEADERS);
  (data.students || []).forEach(s => {
    studentSheet.appendRow([
      s.matricula,
      s.name,
      s.preferredName || s.nombrepreferido || '',
      s.email,
      s.mentor,
      s.status,
      s.checkIn,
      s.agenciaCheckIn || '',
      s.ultimoAviso || '',
    ]);
  });

  setConfigValue_(ss, CONFIG_KEYS.lastSync, new Date().toISOString(), 'Última sincronización masiva');

  return jsonResponse_({ status: 'success' });
}

/** Lógica: Actualiza un estudiante específico */
function updateStudentStatus(ss, data) {
  if (!data || !data.matricula) {
    return jsonResponse_({ status: 'error', message: 'Falta la matrícula del alumno' });
  }

  const sheet = ss.getSheetByName('Students');
  const values = sheet.getDataRange().getValues();
  const matricula = String(data.matricula).toUpperCase();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase() === matricula) {
      if (data.name !== undefined) sheet.getRange(i + 1, 2).setValue(data.name);
      if (data.preferredName !== undefined) sheet.getRange(i + 1, 3).setValue(data.preferredName);
      if (data.email !== undefined) sheet.getRange(i + 1, 4).setValue(data.email);
      if (data.mentor !== undefined) sheet.getRange(i + 1, 5).setValue(data.mentor);
      if (data.status !== undefined) sheet.getRange(i + 1, 6).setValue(data.status);
      if (data.checkIn !== undefined) sheet.getRange(i + 1, 7).setValue(data.checkIn);
      if (data.agenciaCheckIn !== undefined) sheet.getRange(i + 1, 8).setValue(data.agenciaCheckIn);

      return jsonResponse_({ status: 'success' });
    }
  }

  return jsonResponse_({ status: 'error', message: 'Alumno no encontrado' });
}

function findStudent(ss, data) {
  const matricula = String(data && data.matricula ? data.matricula : '').trim().toUpperCase();
  if (!matricula) {
    return jsonResponse_({ status: 'error', message: 'Falta la matrícula del alumno' });
  }

  const students = parseSheetData(ss.getSheetByName('Students').getDataRange().getValues());
  const staff = parseSheetData(ensureSheetWithHeaders_(ss, 'Staff', STAFF_HEADERS).getDataRange().getValues());
  const student = students.find(item => String(item.matricula || item.matrcula || '').toUpperCase() === matricula);

  if (!student) {
    return jsonResponse_({ status: 'success', data: { student: null, mentor: null } });
  }

  const mentor = staff.find(item => item.alias === student.nicknamementor) || null;
  return jsonResponse_({ status: 'success', data: { student, mentor } });
}

function resolveUserByEmail(ss, data) {
  const email = String(data && data.email ? data.email : '').trim().toLowerCase();
  const pin = String(data && data.pin ? data.pin : '').trim();
  if (!email) {
    return jsonResponse_({ status: 'error', message: 'Falta el correo institucional.' });
  }

  const staff = parseSheetData(ensureSheetWithHeaders_(ss, 'Staff', STAFF_HEADERS).getDataRange().getValues());
  const user = staff.find(function(item) {
    return String(item.email || '').trim().toLowerCase() === email &&
      String(item.activo || 'Si').trim().toLowerCase() !== 'no';
  });

  if (!user) {
    return jsonResponse_({ status: 'error', message: 'No encontramos permisos vigentes para este correo.' });
  }

  if (String(user.pin || '').trim() !== pin) {
    return jsonResponse_({ status: 'error', message: 'El PIN ingresado es incorrecto.' });
  }

  return jsonResponse_({ status: 'success', data: { user: user } });
}

/** Utilidad: Limpia datos para nueva cohorte */
function clearTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureCoreSheets_(ss);
  ss.getSheetByName('Students').getRange('A2:I').clearContent();
  SpreadsheetApp.getUi().alert('🧹 Datos de alumnos limpiados.');
}

function seedCommunityTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureCoreSheets_(ss);
  ensureOperationsSheets_(ss);

  const staffSheet = ensureSheetWithHeaders_(ss, 'Staff', STAFF_HEADERS);
  const studentsSheet = ss.getSheetByName('Students');

  upsertRowByKey_(staffSheet, 1, 'jr.flores@tec.mx', ['jr.flores@tec.mx', '1234', 'José Ricardo Flores Espinoza', 'JR', 'mentor', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
  upsertRowByKey_(staffSheet, 1, 'kareng@tec.mx', ['kareng@tec.mx', '1234', 'Karen Ariadna Guzmán Vega', 'Karen', 'admin', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
  upsertRowByKey_(studentsSheet, 1, 'A00803848', ['A00803848', 'Karen Ariadna Guzman Vega', 'Karen', 'kareng@tec.mx', 'Karen', 'Metas Seleccionadas', 'Si', '', '']);

  SpreadsheetApp.getUi().alert('✅ Datos de prueba de comunidad cargados o actualizados sin duplicados.');
}

function seedRolesAndGoalsCatalog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureCoreSheets_(ss);
  ensureGoalsConfig_(ss);
  ensureOperationsSheets_(ss);
  SpreadsheetApp.getUi().alert('✅ Roles, permisos base y banco de metas inicial listos.');
}

function getMetasData(ss, data) {
  var catalogItems = getGoalsCatalogData(ss);
  if (catalogItems && catalogItems.length) {
    return buildMetasFromCatalog_(catalogItems, data || {});
  }

  const configSheet = ensureConfigSheet_(ss);
  const raw = getConfigValue_(configSheet, CONFIG_KEYS.goalsJson);

  if (!raw) {
    return cloneDefaultGoals_();
  }

  try {
    return normalizeGoalsPayload_(JSON.parse(raw));
  } catch (err) {
    return cloneDefaultGoals_();
  }
}

function normalizeDimension_(value) {
  var normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'física') return 'fisica';
  return normalized;
}

function normalizeDiagnosticTags_(value) {
  var rawTags = String(value || '')
    .split(',')
    .map(function(part) { return String(part || '').trim().toLowerCase(); })
    .filter(function(part) { return part; });

  var normalized = [];
  var unknown = [];
  rawTags.forEach(function(tag) {
    var alias = DIAGNOSTIC_TAG_ALIASES[tag];
    var canonical = CONTROLLED_DIAGNOSTIC_TAGS.indexOf(tag) > -1
      ? tag
      : alias && CONTROLLED_DIAGNOSTIC_TAGS.indexOf(alias) > -1
        ? alias
        : '';

    if (canonical) {
      normalized.push(canonical);
    } else {
      unknown.push(tag);
    }
  });

  if (unknown.length) {
    console.warn('[Navi] ConexionDiagnostico contiene tags fuera del vocabulario controlado: ' + unknown.join(', '));
  }

  return normalized.filter(function(tag, index, array) {
    return array.indexOf(tag) === index;
  });
}

function sanitizeDiagnosticConnection_(value) {
  return normalizeDiagnosticTags_(value).join(',');
}

function buildPriorityContext_(data) {
  var incomingAreas = Array.isArray(data && data.priorityAreas) ? data.priorityAreas : [];
  var topAreas = incomingAreas
    .map(function(item) {
      if (typeof item === 'string') {
        return { category: item, score: null };
      }
      return {
        category: String(item.category || item.key || '').trim(),
        score: item.score === undefined || item.score === null || item.score === '' ? null : Number(item.score),
      };
    })
    .filter(function(item) {
      return item.category;
    })
    .sort(function(a, b) {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return a.score - b.score;
    })
    .slice(0, 2);

  var dimensionHints = [];
  var tagHints = topAreas.map(function(item) {
    var entry = DIAGNOSTIC_CATEGORY_MAP[item.category];
    if (entry && entry.dimensions) {
      entry.dimensions.forEach(function(dimension) {
        if (dimensionHints.indexOf(dimension) === -1) {
          dimensionHints.push(dimension);
        }
      });
    }
    return entry && entry.tags ? entry.tags : [];
  });

  return {
    stage: String(data && data.stage ? data.stage : '').trim().toLowerCase(),
    topAreas: topAreas,
    dimensionHints: dimensionHints,
    tagHints: tagHints,
  };
}

function scorePrioritaria_(item, context, index) {
  var stage = String(item.etapa || '').trim().toLowerCase();
  var dimension = normalizeDimension_(item.dimension);
  var tags = normalizeDiagnosticTags_(item.conexiondiagnostico);

  var score = 0;
  var matchedAreaIndex = null;
  context.tagHints.forEach(function(hintBucket, hintIndex) {
    var matched = hintBucket.some(function(tag) {
      return tags.indexOf(tag) > -1;
    });
    if (matched) {
      if (matchedAreaIndex === null) matchedAreaIndex = hintIndex;
      score += hintIndex === 0 ? 120 : 95;
    }
  });

  if (context.dimensionHints.indexOf(dimension) > -1) {
    score += 60;
  }

  if (context.stage && stage === context.stage) {
    score += 24;
  } else if (stage === 'multietapa') {
    score += 12;
  } else if (!stage) {
    score += 2;
  }

  if (dimension === 'financiera') {
    score += 4;
  }

  item._priorityScore = score;
  item._sourceIndex = index;
  item._matchedAreaIndex = matchedAreaIndex;
  return item;
}

function balancePrioritarias_(items, context) {
  if (!context.topAreas || context.topAreas.length < 2) {
    return items;
  }

  var primary = items.filter(function(item) { return item._matchedAreaIndex === 0; });
  var secondary = items.filter(function(item) { return item._matchedAreaIndex === 1; });
  var rest = items.filter(function(item) {
    return item._matchedAreaIndex !== 0 && item._matchedAreaIndex !== 1;
  });

  var balanced = [];
  var round = 0;
  while (primary[round] || secondary[round]) {
    if (primary[round]) balanced.push(primary[round]);
    if (secondary[round]) balanced.push(secondary[round]);
    round += 1;
  }

  return balanced.concat(rest);
}

function buildMetasFromCatalog_(items, data) {
  var context = buildPriorityContext_(data || {});
  var normalized = items
    .map(function(item) {
      var tema = String(item.temaoperativo || '').trim().toLowerCase();
      if (tema === 'servicio') tema = 'servicio social';

      var dimension = normalizeDimension_(item.dimension);
      if (tema === 'servicio social') dimension = 'ocupacional';

      var etapa = String(item.etapa || '').trim().toLowerCase();
      if (etapa === 'longitudinal') etapa = 'multietapa';

      return {
        id: String(item.id || '').trim(),
        text: String(item.metabase || '').trim(),
        dimension: dimension,
        temaoperativo: tema,
        etapa: etapa,
        pasosbase: String(item.pasosbase || '').trim(),
        horizontesugerido: String(item.horizontesugerido || '').trim(),
        preguntasparaafinar: String(item.preguntasparaafinar || '').trim(),
        conexiondiagnostico: String(item.conexiondiagnostico || item.conexionDiagnostico || '').trim(),
        activa: String(item.activa || 'Si').trim().toLowerCase(),
      };
    })
    .filter(function(item) {
      return item.id && item.text && item.dimension && item.activa !== 'no';
    });

  var prioritarias = balancePrioritarias_(normalized
    .filter(function(item) {
      return PRIORITARIA_DIMENSIONS.indexOf(item.dimension) > -1;
    })
    .map(function(item, index) {
      return scorePrioritaria_(item, context, index);
    })
    .sort(function(a, b) {
      if (b._priorityScore !== a._priorityScore) return b._priorityScore - a._priorityScore;
      return a._sourceIndex - b._sourceIndex;
    }),
    context)
    .map(function(item) {
      delete item._priorityScore;
      delete item._sourceIndex;
      delete item._matchedAreaIndex;
      return item;
    });

  // La meta complementaria se mantiene anclada a dimensiones de bienestar.
  var complementarias = normalized.filter(function(item) {
    return COMPLEMENTARIA_DIMENSIONS.indexOf(item.dimension) > -1;
  });

  return {
    prioritarias: prioritarias,
    complementarias: complementarias,
  };
}

function saveMetasConfig(ss, data) {
  const configSheet = ensureConfigSheet_(ss);
  const goals = normalizeGoalsPayload_(data);

  setConfigValue_(ss, CONFIG_KEYS.goalsJson, JSON.stringify(goals), 'Banco de metas Navi');
  setConfigValue_(ss, CONFIG_KEYS.goalsUpdatedAt, new Date().toISOString(), 'Última actualización del banco de metas');

  return jsonResponse_({
    status: 'success',
    ...goals,
  });
}

function getGoalsCatalogData(ss) {
  const sheet = ensureSheetWithHeaders_(ss, 'GoalsCatalog', GOALS_CATALOG_HEADERS);
  ensureGoalsCatalogSchema_(sheet);
  return parseSheetData(sheet.getDataRange().getValues());
}

function saveGoalsCatalog(ss, data) {
  const sheet = ensureSheetWithHeaders_(ss, 'GoalsCatalog', GOALS_CATALOG_HEADERS);
  ensureGoalsCatalogSchema_(sheet);
  const items = normalizeGoalsCatalogPayload_(data && data.items ? data.items : []);
  validateGoalsCatalogPayload_(items);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, GOALS_CATALOG_HEADERS.length).setValues([GOALS_CATALOG_HEADERS]);
  if (items.length) {
    const rows = items.map(function(item) {
      return [
        item.id,
        item.temaoperativo,
        item.dimension,
        item.etapa,
        item.metabase,
        item.pasosbase,
        item.horizontesugerido,
        item.indicadorlogro,
        item.cuandousarla,
        item.niveldificultad,
        item.frecuenciaseguimiento,
        item.conexiondiagnostico,
        item.preguntasparaafinar,
        item.activa,
      ];
    });
    sheet.getRange(2, 1, rows.length, GOALS_CATALOG_HEADERS.length).setValues(rows);
  }
  applyGoalsCatalogValidation_(sheet);

  return jsonResponse_({ status: 'success', items: items });
}

function requireAdminSecret_(params, action) {
  var expected = String(PropertiesService.getScriptProperties().getProperty('NAVI_ADMIN_SECRET') || '').trim();
  if (!expected) {
    throw new Error('El backend requiere NAVI_ADMIN_SECRET en Script Properties para permitir ' + action + '.');
  }

  var provided = String((params && params.adminSecret) || '').trim();
  if (!provided) {
    throw new Error('Falta la clave de administración para ejecutar ' + action + '.');
  }

  if (provided !== expected) {
    throw new Error('La clave de administración no es válida para ' + action + '.');
  }
}

function validateSyncBulkPayload_(ss, data) {
  var payload = data || {};
  var students = Array.isArray(payload.students) ? payload.students : [];
  var studentCount = Number(payload.studentCount);

  if (payload.confirmOverwrite !== true) {
    throw new Error('syncBulk requiere confirmación explícita antes de sobrescribir Google Sheets.');
  }

  if (!Number.isFinite(studentCount) || studentCount !== students.length) {
    throw new Error('El payload de estudiantes es inconsistente. Revisa la sincronización antes de guardar.');
  }

  var currentStudentRows = Math.max(ss.getSheetByName('Students').getLastRow() - 1, 0);
  if (currentStudentRows > 0 && students.length === 0) {
    throw new Error('syncBulk rechazado: no se permite vaciar Students con un payload vacío.');
  }

  var invalidStudents = students.filter(function(student) {
    return !String(student.matricula || '').trim() || !String(student.name || student.nombre || '').trim();
  });
  if (invalidStudents.length) {
    throw new Error('Hay estudiantes sin matrícula o nombre. Corrige el directorio antes de sincronizar.');
  }
}

function validateGoalsCatalogPayload_(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El catálogo no puede guardarse vacío.');
  }

  var seen = {};
  items.forEach(function(item) {
    var id = String(item.id || '').trim();
    if (!id) {
      throw new Error('Cada meta del catálogo debe tener Id antes de guardarse.');
    }
    if (seen[id]) {
      throw new Error('El catálogo contiene Id duplicado: ' + id + '.');
    }
    seen[id] = true;

    if (!String(item.metabase || '').trim()) {
      throw new Error('La meta ' + id + ' no tiene MetaBase.');
    }
    if (!String(item.dimension || '').trim()) {
      throw new Error('La meta ' + id + ' no tiene Dimensión.');
    }
    if (!String(item.etapa || '').trim()) {
      throw new Error('La meta ' + id + ' no tiene Etapa.');
    }
  });
}

function ensureCoreSheets_(ss) {
  const staffSheet = ensureSheetWithHeaders_(ss, 'Staff', STAFF_HEADERS);
  const studentsSheet = ensureSheetWithHeaders_(ss, 'Students', STUDENT_HEADERS);
  const configSheet = ensureSheetWithHeaders_(ss, 'Config', ['Key', 'Value', 'Description']);

  ensureStudentsSheetSchema_(studentsSheet);

  if (staffSheet.getLastRow() === 1) {
    seedStaffSheet_(staffSheet);
  }

  if (studentsSheet.getLastRow() === 1) {
    // Se deja la hoja vacía con encabezados para carga manual o syncBulk.
  }

  if (configSheet.getLastRow() === 1) {
    configSheet.appendRow([CONFIG_KEYS.version, '1.1', 'Versión del motor']);
    configSheet.appendRow([CONFIG_KEYS.lastSync, new Date().toISOString(), 'Última sincronización masiva']);
  }
}

function ensureOperationsSheets_(ss) {
  const goalsCatalogSheet = ensureSheetWithHeaders_(ss, 'GoalsCatalog', GOALS_CATALOG_HEADERS);
  ensureSheetWithHeaders_(ss, 'Responses', RESPONSES_HEADERS);
  ensureSheetWithHeaders_(ss, 'GoalSelections', GOAL_SELECTION_HEADERS);
  ensureSessionsSheet_(ss);
  ensureGoalsCatalogSchema_(goalsCatalogSheet);
  applyGoalsCatalogValidation_(goalsCatalogSheet);

  if (goalsCatalogSheet.getLastRow() === 1) {
    seedGoalsCatalogSheet_(goalsCatalogSheet);
  }
}

function ensureGoalsCatalogSchema_(sheet) {
  const currentWidth = Math.max(sheet.getLastColumn(), GOALS_CATALOG_HEADERS.length);
  const headers = sheet.getRange(1, 1, 1, currentWidth).getValues()[0];
  const currentNormalized = headers.map(normalizeHeader_);
  const expectedNormalized = GOALS_CATALOG_HEADERS.map(normalizeHeader_);

  if (expectedNormalized.every(function(value, index) { return currentNormalized[index] === value; })) {
    applyGoalsCatalogValidation_(sheet);
    return;
  }

  const legacyHeaders = ['Id', 'Tipo', 'MetaBase', 'Dimension', 'Contexto', 'CuandoUsarla', 'HorizonteSugerido', 'IndicadorLogro', 'SMARTER_Specific', 'SMARTER_Measurable', 'SMARTER_Achievable', 'SMARTER_Relevant', 'SMARTER_Timebound', 'SMARTER_Evaluated', 'SMARTER_Revised', 'Activa'];
  const legacyNormalized = legacyHeaders.map(normalizeHeader_);
  const previousHeaders = ['Id', 'Categoria', 'Dimension', 'Etapa', 'MetaBase', 'PasosBase', 'HorizonteSugerido', 'IndicadorLogro', 'CuandoUsarla', 'NivelDificultad', 'FrecuenciaSeguimiento', 'ConexionDiagnostico', 'PreguntasParaAfinar', 'Activa'];
  const previousNormalized = previousHeaders.map(normalizeHeader_);

  if (legacyNormalized.every(function(value, index) { return currentNormalized[index] === value; })) {
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, legacyHeaders.length).getValues()
      : [];
    const migratedRows = rows
      .filter(function(row) {
        return row.some(function(cell) { return cell !== '' && cell !== null && cell !== undefined; });
      })
      .map(function(row) {
        return [
          row[0],
          row[1] === 'prioritaria' ? 'academico' : 'bienestar',
          row[3] || '',
          row[1] === 'prioritaria' ? 'enfoque' : 'multietapa',
          row[2] || '',
          '',
          row[6] || '',
          row[7] || '',
          row[5] || '',
          'media',
          row[13] || 'por sesión',
          '',
          '',
          row[15] || 'Si',
        ];
      });

    sheet.clearContents();
    sheet.getRange(1, 1, 1, GOALS_CATALOG_HEADERS.length).setValues([GOALS_CATALOG_HEADERS]);
    if (migratedRows.length) {
      sheet.getRange(2, 1, migratedRows.length, GOALS_CATALOG_HEADERS.length).setValues(migratedRows);
    }
    applyGoalsCatalogValidation_(sheet);
    return;
  }

  if (previousNormalized.every(function(value, index) { return currentNormalized[index] === value; })) {
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, previousHeaders.length).getValues()
      : [];

    sheet.clearContents();
    sheet.getRange(1, 1, 1, GOALS_CATALOG_HEADERS.length).setValues([GOALS_CATALOG_HEADERS]);
    if (rows.length) {
      sheet.getRange(2, 1, rows.length, GOALS_CATALOG_HEADERS.length).setValues(rows);
    }
    applyGoalsCatalogValidation_(sheet);
    return;
  }

  sheet.getRange(1, 1, 1, GOALS_CATALOG_HEADERS.length).setValues([GOALS_CATALOG_HEADERS]);
  applyGoalsCatalogValidation_(sheet);
}

function applyGoalsCatalogValidation_(sheet) {
  var connectionColumn = GOALS_CATALOG_HEADERS.indexOf('ConexionDiagnostico') + 1;
  if (!connectionColumn) return;

  var lastRow = Math.max(sheet.getMaxRows(), 2);
  var targetRange = sheet.getRange(2, connectionColumn, lastRow - 1, 1);
  var escapedTags = CONTROLLED_DIAGNOSTIC_TAGS.map(function(tag) {
    return tag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  });
  var pattern = '^(' + escapedTags.join('|') + ')(,(' + escapedTags.join('|') + '))*$';
  var formula = '=OR(LEN(' + sheet.getRange(2, connectionColumn).getA1Notation() + ')=0,REGEXMATCH(SUBSTITUTE(' + sheet.getRange(2, connectionColumn).getA1Notation() + '," ",""),"' + pattern + '"))';

  var rule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied(formula)
    .setAllowInvalid(false)
    .setHelpText('Usa solo tags diagnósticos controlados separados por coma: ' + CONTROLLED_DIAGNOSTIC_TAGS.join(', '))
    .build();

  targetRange.setDataValidation(rule);
}

function upsertRowByKey_(sheet, keyColumnIndex, keyValue, rowValues) {
  const lastRow = sheet.getLastRow();
  const normalizedKey = String(keyValue || '').trim().toUpperCase();

  if (lastRow > 1) {
    const values = sheet.getRange(2, keyColumnIndex, lastRow - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0] || '').trim().toUpperCase() === normalizedKey) {
        sheet.getRange(i + 2, 1, 1, rowValues.length).setValues([rowValues]);
        return;
      }
    }
  }

  sheet.appendRow(rowValues);
}

function ensureStudentsSheetSchema_(sheet) {
  const currentWidth = Math.max(sheet.getLastColumn(), LEGACY_STUDENT_HEADERS.length);
  const headers = sheet.getRange(1, 1, 1, currentWidth).getValues()[0];
  const expectedNormalized = STUDENT_HEADERS.map(normalizeHeader_);
  const legacyNormalized = LEGACY_STUDENT_HEADERS.map(normalizeHeader_);
  const currentNormalized = headers.map(normalizeHeader_);

  if (expectedNormalized.every(function(value, index) { return currentNormalized[index] === value; })) {
    return;
  }

  if (legacyNormalized.every(function(value, index) { return currentNormalized[index] === value; })) {
    const lastRow = sheet.getLastRow();
    const rows = lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, LEGACY_STUDENT_HEADERS.length).getValues()
      : [];
    const migratedRows = rows
      .filter(function(row) {
        return row.some(function(cell) { return cell !== '' && cell !== null && cell !== undefined; });
      })
      .map(function(row) {
        return [row[0], row[1], '', row[2], row[3], row[4], row[5], row[6]];
      });

    sheet.clearContents();
    sheet.getRange(1, 1, 1, STUDENT_HEADERS.length).setValues([STUDENT_HEADERS]);
    if (migratedRows.length) {
      sheet.getRange(2, 1, migratedRows.length, STUDENT_HEADERS.length).setValues(migratedRows);
    }
    return;
  }

  sheet.getRange(1, 1, 1, STUDENT_HEADERS.length).setValues([STUDENT_HEADERS]);
}

function normalizeHeader_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function ensureGoalsConfig_(ss) {
  const configSheet = ensureConfigSheet_(ss);
  if (!getConfigValue_(configSheet, CONFIG_KEYS.goalsJson)) {
    setConfigValue_(ss, CONFIG_KEYS.goalsJson, JSON.stringify(DEFAULT_GOALS), 'Banco de metas Navi');
    setConfigValue_(ss, CONFIG_KEYS.goalsUpdatedAt, new Date().toISOString(), 'Última actualización del banco de metas');
  }
  ensureSheetWithHeaders_(ss, 'GoalSelections', ['Timestamp', 'Matrícula', 'Nombre', 'Meta Prioritaria', 'Meta Complementaria', 'Tiempo', 'Obstáculo', 'Plan']);
}

function ensureConfigSheet_(ss) {
  return ensureSheetWithHeaders_(ss, 'Config', ['Key', 'Value', 'Description']);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function normalizeHeaderKey_(header) {
  return String(header || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildLegacySessionId_(matricula, fechaSesion, fallbackTimestamp) {
  const normalizedMatricula = String(matricula || '').trim().toUpperCase() || 'SINMATRICULA';
  const normalizedFecha = String(fechaSesion || '').trim() || 'sin-fecha';
  const normalizedTimestamp = String(fallbackTimestamp || '').trim() || new Date().toISOString();
  return normalizedMatricula + '-' + normalizedFecha + '-' + normalizedTimestamp.replace(/[^0-9]/g, '').slice(-12);
}

function ensureSessionsSheet_(ss) {
  const sheet = ensureSheetWithHeaders_(ss, 'Sesiones', SESSIONS_HEADERS);
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const currentNormalized = currentHeaders.map(normalizeHeaderKey_);
  const targetNormalized = SESSIONS_HEADERS.map(normalizeHeaderKey_);

  if (currentNormalized.join('|') === targetNormalized.join('|')) {
    return sheet;
  }

  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map(function(row) {
    const record = {};
    currentHeaders.forEach(function(header, index) {
      record[normalizeHeaderKey_(header)] = row[index];
    });
    return record;
  }).filter(function(record) {
    return Object.keys(record).some(function(key) {
      return record[key] !== '' && record[key] !== null && record[key] !== undefined;
    });
  });

  const migratedRows = rows.map(function(record) {
    const matricula = String(record.matricula || '').trim().toUpperCase();
    const fechaSesion = String(record.fechasesion || '').trim();
    const timestampCreacion = String(record.timestampcreacion || record.timestampguardado || '').trim() || new Date().toISOString();
    const timestampActualizado = String(record.timestampactualizado || record.timestampguardado || timestampCreacion).trim() || timestampCreacion;
    return [
      String(record.sessionid || '').trim() || buildLegacySessionId_(matricula, fechaSesion, timestampCreacion),
      matricula,
      record.nombre || '',
      record.mentor || '',
      record.comunidad || '',
      record.periodo || '',
      fechaSesion,
      record.etapa || '',
      record.areasprioritarias || '',
      record.pretestresumen || record.checkinresumen || '',
      record.metaprioritaria || '',
      record.metacomplementaria || '',
      record.horizonte || '',
      record.obstaculo || '',
      record.estrategia || '',
      record.notasmentor || '',
      record.estadodocumentacion || 'Borrador',
      record.documentadocrm || 'No',
      timestampCreacion,
      timestampActualizado,
    ];
  });

  sheet.clearContents();
  sheet.getRange(1, 1, 1, SESSIONS_HEADERS.length).setValues([SESSIONS_HEADERS]);
  if (migratedRows.length > 0) {
    sheet.getRange(2, 1, migratedRows.length, SESSIONS_HEADERS.length).setValues(migratedRows);
  }

  return sheet;
}

function getConfigValue_(configSheet, key) {
  const values = configSheet.getDataRange().getValues();
  if (values.length <= 1) return '';

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      return values[i][1];
    }
  }

  return '';
}

function setConfigValue_(ss, key, value, description) {
  const configSheet = ensureConfigSheet_(ss);
  const values = configSheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      if (description) configSheet.getRange(i + 1, 3).setValue(description);
      return;
    }
  }

  configSheet.appendRow([key, value, description || '']);
}

function cloneDefaultGoals_() {
  return {
    prioritarias: DEFAULT_GOALS.prioritarias.map(goal => ({ ...goal })),
    complementarias: DEFAULT_GOALS.complementarias.map(goal => ({ ...goal })),
  };
}

function normalizeGoalsPayload_(payload) {
  const normalizeList = (items, fallbackList) => {
    if (!Array.isArray(items) || items.length === 0) {
      return fallbackList.map(goal => ({ ...goal }));
    }

    const normalized = items
      .map((goal, index) => ({
        id: String(goal && goal.id ? goal.id : `${Date.now()}-${index}`),
        text: String(goal && goal.text ? goal.text : '').trim(),
        dimension: String(goal && goal.dimension ? goal.dimension : 'general').trim() || 'general',
      }))
      .filter(goal => goal.text.length > 0);

    return normalized.length ? normalized : fallbackList.map(goal => ({ ...goal }));
  };

  return {
    prioritarias: normalizeList(payload && payload.prioritarias, DEFAULT_GOALS.prioritarias),
    complementarias: normalizeList(payload && payload.complementarias, DEFAULT_GOALS.complementarias),
  };
}

function normalizeGoalsCatalogPayload_(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map(function(item, index) {
      const normalizedStage = String(item.etapa || '').trim().toLowerCase();
      return {
        id: String(item.id || `goal-${Date.now()}-${index}`).trim(),
        temaoperativo: String(item.temaoperativo || item.temaOperativo || '').trim().toLowerCase(),
        dimension: String(item.dimension || '').trim().toLowerCase(),
        etapa: normalizedStage === 'longitudinal' ? 'multietapa' : normalizedStage,
        metabase: String(item.metabase || item.metaBase || '').trim(),
        pasosbase: String(item.pasosbase || item.pasosBase || '').trim(),
        horizontesugerido: String(item.horizontesugerido || item.horizonteSugerido || '').trim(),
        indicadorlogro: String(item.indicadorlogro || item.indicadorLogro || '').trim(),
        cuandousarla: String(item.cuandousarla || item.cuandoUsarla || '').trim(),
        niveldificultad: String(item.niveldificultad || item.nivelDificultad || 'media').trim().toLowerCase(),
        frecuenciaseguimiento: String(item.frecuenciaseguimiento || item.frecuenciaSeguimiento || 'por sesión').trim().toLowerCase(),
        conexiondiagnostico: sanitizeDiagnosticConnection_(String(item.conexiondiagnostico || item.conexionDiagnostico || '').trim()),
        preguntasparaafinar: String(item.preguntasparaafinar || item.preguntasParaAfinar || '').trim(),
        activa: String(item.activa || 'Si').trim() || 'Si',
      };
    })
    .filter(function(item) {
      return item.id && item.metabase && item.dimension && item.etapa;
    });
}

function sendCampaignHandler(ss, data) {
  var destinatarios = data.destinatarios || [];
  var subject = String(data.subject || '').trim();
  var htmlBody = String(data.htmlBody || '').trim();

  if (!subject || !htmlBody) {
    return jsonResponse_({ status: 'error', message: 'Faltan asunto o cuerpo del correo.' });
  }
  if (destinatarios.length === 0) {
    return jsonResponse_({ status: 'error', message: 'No hay destinatarios para esta campaña.' });
  }

  var enviados = [];
  var fallidos = [];

  destinatarios.forEach(function(estudiante) {
    var email = String(estudiante.email || '').trim();
    if (!email || email === 'sin@correo.com') {
      fallidos.push({ matricula: estudiante.matricula, razon: 'Sin correo válido' });
      return;
    }

    var nombre = String(estudiante.name || estudiante.preferredName || '').trim().split(' ')[0] || 'Estudiante';
    var mentor = String(estudiante.mentor || '').trim();
    var comunidad = String(estudiante.community || '').trim();

    var subjectFinal = subject
      .replace(/\{\{nombre\}\}/g, nombre)
      .replace(/\{\{mentor\}\}/g, mentor)
      .replace(/\{\{comunidad\}\}/g, comunidad);

    var htmlFinal = htmlBody
      .replace(/\{\{nombre\}\}/g, nombre)
      .replace(/\{\{mentor\}\}/g, mentor)
      .replace(/\{\{comunidad\}\}/g, comunidad);

    try {
      GmailApp.sendEmail(email, subjectFinal, '', {
        htmlBody: htmlFinal,
        name: 'Mentoría Estudiantil',
      });
      enviados.push(estudiante.matricula);
      markUltimoAviso_(ss, estudiante.matricula, data.tipo || 'campaña');
    } catch (err) {
      fallidos.push({ matricula: estudiante.matricula, razon: err.toString() });
    }
  });

  return jsonResponse_({
    status: 'success',
    enviados: enviados.length,
    fallidos: fallidos.length,
    detalleFallidos: fallidos,
  });
}

function markUltimoAviso_(ss, matricula, tipo) {
  var sheet = ss.getSheetByName('Students');
  if (!sheet) return;
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var colIndex = headers.indexOf('UltimoAviso');
  if (colIndex === -1) return;
  var mat = String(matricula).toUpperCase();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase() === mat) {
      sheet.getRange(i + 1, colIndex + 1).setValue(tipo + ' · ' + new Date().toLocaleDateString('es-MX'));
      return;
    }
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveTestResponse(ss, data) {
  const sheet = ensureSheetWithHeaders_(ss, 'Responses', RESPONSES_HEADERS);
  const matricula = String(data.matricula || '').trim().toUpperCase();
  
  if (!matricula) {
    return jsonResponse_({ status: 'error', message: 'Falta la matrícula del alumno' });
  }

  sheet.appendRow([
    matricula,
    new Date().toISOString(),
    data.modalidad || 'remoto',
    data.etapa || '',
    data.scorePromedio || '',
    data.areasPrioritarias || '',
    data.claridad_carrera || '',
    data.desempeno_academico || '',
    data.plan_practicas || '',
    data.servicio_social || '',
    data.decision_semestre_tec || '',
    data.certificacion_idioma || ''
  ]);

  return updateStudentStatus(ss, {
    matricula: matricula,
    status: 'Test Completado'
  });
}

function getTestResponse(ss, data) {
  const sheet = ensureSheetWithHeaders_(ss, 'Responses', RESPONSES_HEADERS);
  const matricula = String(data.matricula || '').trim().toUpperCase();
  
  if (!matricula) {
    return jsonResponse_({ status: 'error', message: 'Falta la matrícula del alumno' });
  }

  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i > 0; i--) {
    if (String(values[i][0]).toUpperCase() === matricula) {
      const row = values[i];
      return jsonResponse_({
        status: 'success',
        data: {
          matricula: row[0],
          fechaTest: row[1],
          modalidad: row[2],
          etapa: row[3],
          scorePromedio: row[4],
          areasPrioritarias: row[5],
          scores: {
            claridad_carrera: row[6],
            desempeno_academico: row[7],
            plan_practicas: row[8],
            servicio_social: row[9],
            decision_semestre_tec: row[10],
            certificacion_idioma: row[11]
          }
        }
      });
    }
  }

  return jsonResponse_({ status: 'error', message: 'No se encontraron respuestas para este alumno' });
}

function saveGoalSelection(ss, data) {
  const sheet = ensureSheetWithHeaders_(ss, 'GoalSelections', GOAL_SELECTION_HEADERS);
  const matricula = String(data && data.matricula ? data.matricula : '').trim().toUpperCase();

  if (!matricula) {
    return jsonResponse_({ status: 'error', message: 'Falta la matrícula del alumno' });
  }

  sheet.appendRow([
    new Date().toISOString(),
    matricula,
    data.nombre || '',
    data.metaPrioritaria || '',
    data.metaComplementaria || '',
    data.tiempo || '',
    data.obstaculo || '',
    data.plan || '',
  ]);

  updateStudentStatus(ss, {
    matricula: matricula,
    status: 'Metas Seleccionadas',
    checkIn: data.checkIn,
  });

  return jsonResponse_({ status: 'success' });
}

function saveMentoringSession(ss, data) {
  const sheet = ensureSessionsSheet_(ss);
  const matricula = String(data && data.matricula ? data.matricula : '').trim().toUpperCase();

  if (!matricula) {
    return jsonResponse_({ status: 'error', message: 'Falta la matrícula del estudiante.' });
  }

  const sessionId = String(data.sessionId || '').trim() || buildLegacySessionId_(matricula, data.fechaSesion, data.timestampCreacion);
  const fechaSesion = String(data.fechaSesion || '').trim() || new Date().toISOString().slice(0, 10);
  const timestampCreacion = String(data.timestampCreacion || '').trim() || new Date().toISOString();
  const timestampActualizado = new Date().toISOString();
  var row = [
    sessionId,
    matricula,
    data.nombre || '',
    data.mentor || '',
    data.comunidad || '',
    data.periodo || '',
    fechaSesion,
    data.etapa || '',
    data.areasPrioritarias || '',
    data.pretestResumen || '',
    data.metaPrioritaria || '',
    data.metaComplementaria || '',
    data.horizonte || '',
    data.obstaculo || '',
    data.estrategia || '',
    data.notasMentor || '',
    data.estadoDocumentacion || 'Borrador',
    data.documentadoCrm ? 'Si' : 'No',
    timestampCreacion,
    timestampActualizado,
  ];

  var values = sheet.getDataRange().getValues();
  var targetRow = 0;
  for (var i = 1; i < values.length; i++) {
    var currentSessionId = String(values[i][0] || '').trim();
    if (currentSessionId === sessionId) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return jsonResponse_({
    status: 'success',
    data: {
      sessionId: sessionId,
      timestampCreacion: timestampCreacion,
      timestampActualizado: timestampActualizado,
    },
  });
}

function seedStaffSheet_(sheet) {
  upsertRowByKey_(sheet, 1, 'kareng@tec.mx', ['kareng@tec.mx', '1234', 'Karen Ariadna Guzmán Vega', 'Karen', 'admin', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
  upsertRowByKey_(sheet, 1, 'jr.flores@tec.mx', ['jr.flores@tec.mx', '1234', 'José Ricardo Flores Espinoza', 'JR', 'mentor', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
  upsertRowByKey_(sheet, 1, 'kvillarreal@tec.mx', ['kvillarreal@tec.mx', '1234', 'Karla Lorena Villarreal Aldape', 'Karla', 'mentor', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
  upsertRowByKey_(sheet, 1, 'azuniga@tec.mx', ['azuniga@tec.mx', '1234', 'Angélica Yolanda Zúñiga Montemayor', 'Angélica', 'mentor', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
  upsertRowByKey_(sheet, 1, 'jjfranklin@tec.mx', ['jjfranklin@tec.mx', '1234', 'Juan José Franklin Uraga', 'Juanjo', 'mentor', 'Krei', '#79858B', COMMUNITY_SLOGANS.Krei, 'Si']);
}

function seedGoalsCatalogSheet_(sheet) {
  const rows = [
    ['CAR001', 'carrera', 'ocupacional', 'exploracion', 'Entrevistar a Directores de Programa o Entrada de mi área de interés en 4 semanas.', 'Buscar correos hoy; Enviar mensajes de contacto esta semana; Agendar la primera entrevista para la próxima semana.', '4 semanas', 'Tiene al menos una entrevista realizada y aprendizajes documentados sobre su área de interés.', 'Úsala cuando el estudiante aún está explorando opciones de carrera o necesita contrastar caminos posibles con información real.', 'media', 'por sesión', 'exploracion-vocacional,claridad-direccion', '¿Qué áreas te llaman más la atención hoy?; ¿Ya hablaste con alguien de esa carrera o entrada?; ¿Qué necesitas saber para decidir mejor?', 'Si'],
    ['CAR002', 'carrera', 'ocupacional', 'enfoque', 'Definir 2 posibles áreas de especialización para mi carrera en 5 semanas.', 'Agendar cita con mi Director de Carrera esta semana; Investigar planes de estudio de posgrado; Platicar con 2 estudiantes de semestres más avanzados.', '5 semanas', 'Puede nombrar dos áreas viables y explicar por qué le hacen sentido para su trayectoria.', 'Úsala cuando el estudiante ya tiene interés general en una ruta pero todavía no logra acotarla.', 'media', 'quincenal', 'claridad-direccion,proyeccion-profesional', '¿Qué opciones has descartado ya?; ¿Qué información te falta para tomar una decisión?; ¿Qué criterio usarás para comparar opciones?', 'Si'],
    ['ACA001', 'academico', 'intelectual', 'enfoque', 'Subir mi promedio 0.5 puntos en una materia específica este parcial.', 'Agendar asesoría con el profesor esta semana; Formar un grupo de estudio y reunirse 2 veces por semana; Rehacer los ejercicios con errores del último examen o tarea.', '5 semanas', 'Tiene evidencia de mejora en calificaciones parciales o en entregas corregidas de la materia objetivo.', 'Úsala cuando el estudiante enfrenta una materia crítica y necesita una meta concreta de recuperación académica.', 'alta', 'por sesión', 'riesgo-academico,retencion,planeacion-estudio', '¿Qué materia está poniendo más presión en tu avance?; ¿Qué evidencia te mostraría que vas mejorando?; ¿Qué apoyo concreto necesitas activar esta semana?', 'Si'],
    ['ACA003', 'academico', 'intelectual', 'multietapa', 'Entregar todas mis tareas 24 horas antes de la fecha límite por 5 semanas.', 'Usar Google Calendar para poner recordatorios hoy; Bloquear horas de tarea en mi agenda semanal; Empezar las tareas el día que las asignan.', '5 semanas', 'Puede sostener durante 5 semanas la entrega anticipada en la mayoría de sus materias.', 'Úsala cuando el problema central es organización, procrastinación o acumulación de entregas.', 'media', 'quincenal', 'autogestion,planeacion-estudio', '¿Qué suele pasar justo antes de que entregues tarde?; ¿Qué materia te desordena más la semana?; ¿Cómo sabrás que esta vez sí vas a tiempo?', 'Si'],
    ['SER001', 'servicio', 'social', 'enfoque', 'Inscribirme y completar un proyecto de servicio social este periodo.', 'Investigar 3 opciones de servicio social en el sistema del Tec; Contactar a la organización que más me interese esta semana; Definir mi horario y empezar el próximo periodo.', '1 periodo', 'Tiene el proyecto identificado, inscripción iniciada o completada, y una ruta de participación definida.', 'Úsala cuando el estudiante necesita activar un requisito institucional con sentido personal y calendario concreto.', 'media', 'quincenal', 'cumplimiento-requisitos,proyeccion-trayectoria', '¿Qué te falta exactamente para arrancar servicio social?; ¿Qué opción te haría más sentido por horarios e intereses?; ¿Qué paso puedes cerrar esta semana?', 'Si'],
    ['SER005', 'servicio social', 'ocupacional', 'multietapa', 'Avanzar mi servicio social con entregables mensuales hasta completar las horas requeridas.', 'Definir hoy una meta mensual de horas o entregables; Revisar al cierre de cada mes cuánto avancé; Ajustar calendario y compromisos antes del siguiente periodo.', '2 periodos', 'Puede mostrar avance acumulado en horas o entregables y una ruta clara hasta completar el requisito.', 'Úsala cuando servicio social ya está en marcha o debe sostenerse en varios periodos para concluirlo sin presión final.', 'media', 'mensual', 'servicio_social', '¿Cuántas horas te faltan realmente?; ¿Qué ritmo mensual sí puedes sostener?; ¿Qué obstáculo suele frenarte para avanzar con continuidad?', 'Si'],
    ['ACA007', 'academico', 'intelectual', 'multietapa', 'Sostener un sistema semanal de estudio y seguimiento de entregas durante todo el semestre.', 'Bloquear horas fijas de estudio cada semana; Revisar cada domingo tareas y exámenes próximos; Ajustar la agenda semanal al cierre de cada parcial.', '1 semestre', 'Mantiene una rutina de estudio visible y puede mostrar continuidad en entregas, repasos y preparación de evaluaciones.', 'Úsala cuando el reto académico es estructural y requiere constancia sostenida más allá de un solo parcial.', 'media', 'quincenal', 'desempeno_academico', '¿Qué parte de tu rutina académica se rompe más fácil?; ¿Qué horario sí podrías sostener todo el semestre?; ¿Qué materia necesita más constancia de tu parte?', 'Si'],
    ['EGR010', 'requisitos de egreso', 'ocupacional', 'multietapa', 'Definir y ejecutar mi ruta de Semestre Tec con plan A y plan B antes del próximo periodo.', 'Investigar hoy dos opciones viables de Semestre Tec; Validar requisitos y fechas límite este mes; Elegir plan A y plan B con respaldo de mi mentor o director.', '1 semestre', 'Tiene una ruta de Semestre Tec definida con opción principal, alternativa y fechas críticas claras.', 'Úsala cuando Semestre Tec depende de varios requisitos y decisiones que deben cerrarse con anticipación.', 'alta', 'mensual', 'decision_semestre_tec', '¿Qué te falta para tomar esta decisión con confianza?; ¿Cuál sería tu plan B si la primera opción no se abre?; ¿Qué fecha crítica no puedes dejar pasar?', 'Si'],
    ['EMO003', 'emocional', 'emocional', 'multietapa', 'Agendar una sesión en Punto Blanco o BienestarTec para un chequeo emocional.', 'Buscar el contacto de Punto Blanco en la página del Tec; Enviar un correo para solicitar una cita esta semana; Preparar 1 o 2 temas de los que me gustaría hablar.', '2 semanas', 'Tiene una cita agendada o una primera aproximación concreta al servicio de apoyo emocional.', 'Úsala cuando el estudiante expresa saturación, malestar emocional sostenido o necesidad de apoyo profesional.', 'media', 'por sesión', 'bienestar-emocional,ansiedad-estres', '¿Qué te gustaría que cambiara en cómo te has sentido últimamente?; ¿Qué te detiene de pedir apoyo?; ¿Qué tipo de acompañamiento te haría sentir más en confianza?', 'Si'],
    ['SOC001', 'social', 'social', 'multietapa', 'Unirme a un grupo estudiantil y asistir a todas sus reuniones por 5 semanas.', 'Investigar los grupos estudiantiles disponibles en el Tec; Asistir a una reunión de prueba esta semana; Presentarme con al menos 2 miembros del grupo.', '5 semanas', 'Se integró a un grupo o mantiene participación sostenida en sus reuniones durante el periodo acordado.', 'Úsala cuando el estudiante necesita ampliar su red, sentido de pertenencia o participación en vida estudiantil.', 'baja', 'al final del periodo', 'pertenencia,integracion-social', '¿Qué tipo de espacios te gustaría explorar?; ¿Qué tan fácil o difícil te resulta llegar a grupos nuevos?; ¿Qué haría que esa experiencia valga la pena para ti?', 'Si'],
    ['FIS005', 'fisica', 'fisica', 'multietapa', 'Dormir 7 a 8 horas cada noche, mejorando mi higiene del sueño.', 'Establecer una hora fija para dormir y despertar; Dejar el celular fuera de la habitación 30 min antes de dormir; Evitar cafeína después de las 4 p.m.', '4 semanas', 'Puede sostener una rutina de sueño más estable y reporta mejoras observables en descanso o energía.', 'Úsala cuando el cansancio, la desregulación o la baja energía afectan su rendimiento y bienestar diario.', 'media', 'quincenal', 'bienestar-fisico,energia,autorregulacion', '¿Qué está interfiriendo hoy con tu descanso?; ¿Qué ajuste sería realista esta semana?; ¿Cómo notarías que estás durmiendo mejor?', 'Si'],
  ];

  rows.forEach(function(row) {
    upsertRowByKey_(sheet, 1, row[0], row);
  });
}
