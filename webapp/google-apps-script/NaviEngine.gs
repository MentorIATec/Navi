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

const DEFAULT_GOALS = {
  prioritarias: [
    { id: 'prio-1', text: 'Regularizar mis materias clave para mantener mi avance', dimension: 'academica' },
    { id: 'prio-2', text: 'Fortalecer mi plan de prácticas profesionales para este semestre', dimension: 'profesional' },
    { id: 'prio-3', text: 'Avanzar con servicio social e inglés para no frenar mi graduación', dimension: 'cumplimiento' },
  ],
  complementarias: [
    { id: 'comp-1', text: 'Construir hábitos de estudio sostenibles durante el semestre', dimension: 'bienestar' },
    { id: 'comp-2', text: 'Mejorar mi organización personal y gestión del tiempo', dimension: 'autogestion' },
    { id: 'comp-3', text: 'Cuidar mi energía con rutinas de descanso y actividad física', dimension: 'bienestar' },
  ],
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Navi Admin')
    .addItem('Inicializar Tablas', 'setup')
    .addSeparator()
    .addItem('Limpiar Datos de Prueba', 'clearTestData')
    .addToUi();
}

/** Inicializa la estructura de hojas y encabezados */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureCoreSheets_(ss);
  ensureGoalsConfig_(ss);
  
  SpreadsheetApp.getUi().alert('✅ Estructura de Navi inicializada correctamente.');
}

/** API: Maneja solicitudes GET (Lectura de datos) */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureCoreSheets_(ss);

    const payload = {
      status: 'success',
      data: {
        students: parseSheetData(ss.getSheetByName('Students').getDataRange().getValues()),
        mentors: parseSheetData(ss.getSheetByName('Mentors').getDataRange().getValues()),
        goals: getMetasData(ss),
      }
    };

    if (e && e.parameter && e.parameter.action === 'getMetas') {
      return jsonResponse_({ status: 'success', ...getMetasData(ss) });
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
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    if (action === 'findStudent') {
      return findStudent(ss, params.data);
    }
    
    if (action === 'updateStudent') {
      return updateStudentStatus(ss, params.data);
    }
    
    if (action === 'syncBulk') {
      return syncBulkData(ss, params.data);
    }

    if (action === 'getMetas') {
      return jsonResponse_({ status: 'success', ...getMetasData(ss) });
    }

    if (action === 'saveMetasConfig') {
      return saveMetasConfig(ss, params.data);
    }

    if (action === 'saveGoalSelection') {
      return saveGoalSelection(ss, params.data);
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
  const studentSheet = ss.getSheetByName('Students');
  const mentorSheet = ss.getSheetByName('Mentors');
  
  // Limpiar y escribir Mentores
  mentorSheet.clearContents();
  mentorSheet.appendRow(['Comunidad', '#HEX', 'Nombre', 'Nickname', 'Email']);
  (data.mentors || []).forEach(m => {
    mentorSheet.appendRow([m.community, m.hex, m.name, m.nickname, m.email]);
  });
  
  // Limpiar y escribir Alumnos
  studentSheet.clearContents();
  studentSheet.appendRow(['Matrícula', 'Nombre', 'Email', 'NicknameMentor', 'Comunidad', 'Status', 'Check-in']);
  (data.students || []).forEach(s => {
    studentSheet.appendRow([s.matricula, s.name, s.email, s.mentor, s.community, s.status, s.checkIn]);
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
      if (data.email !== undefined) sheet.getRange(i + 1, 3).setValue(data.email);
      if (data.mentor !== undefined) sheet.getRange(i + 1, 4).setValue(data.mentor);
      if (data.community !== undefined) sheet.getRange(i + 1, 5).setValue(data.community);
      if (data.status !== undefined) sheet.getRange(i + 1, 6).setValue(data.status);
      if (data.checkIn !== undefined) sheet.getRange(i + 1, 7).setValue(data.checkIn);

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
  const mentors = parseSheetData(ss.getSheetByName('Mentors').getDataRange().getValues());
  const student = students.find(item => String(item.matricula || item.matrcula || '').toUpperCase() === matricula);

  if (!student) {
    return jsonResponse_({ status: 'error', message: 'Alumno no encontrado' });
  }

  const mentor = mentors.find(item => item.nickname === student.nicknamementor) || null;
  return jsonResponse_({ status: 'success', data: { student, mentor } });
}

/** Utilidad: Limpia datos para nueva cohorte */
function clearTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureCoreSheets_(ss);
  ss.getSheetByName('Students').getRange('A2:G').clearContent();
  SpreadsheetApp.getUi().alert('🧹 Datos de alumnos limpiados.');
}

function getMetasData(ss) {
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

function ensureCoreSheets_(ss) {
  const mentorsSheet = ensureSheetWithHeaders_(ss, 'Mentors', ['Comunidad', '#HEX', 'Nombre', 'Nickname', 'Email']);
  const studentsSheet = ensureSheetWithHeaders_(ss, 'Students', ['Matrícula', 'Nombre', 'Email', 'NicknameMentor', 'Comunidad', 'Status', 'Check-in']);
  const configSheet = ensureSheetWithHeaders_(ss, 'Config', ['Key', 'Value', 'Description']);

  if (mentorsSheet.getLastRow() === 1) {
    mentorsSheet.appendRow(['Krei', '#79858B', 'José Ricardo Flores Espinoza', 'JR', 'jr.flores@tec.mx']);
    mentorsSheet.appendRow(['Krei', '#79858B', 'Karen Ariadna Guzmán Vega', 'Karen', 'kareng@tec.mx']);
  }

  if (studentsSheet.getLastRow() === 1) {
    // Se deja la hoja vacía con encabezados para carga manual o syncBulk.
  }

  if (configSheet.getLastRow() === 1) {
    configSheet.appendRow([CONFIG_KEYS.version, '1.0', 'Versión del motor']);
    configSheet.appendRow([CONFIG_KEYS.lastSync, new Date().toISOString(), 'Última sincronización masiva']);
  }
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

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveGoalSelection(ss, data) {
  const sheet = ensureSheetWithHeaders_(ss, 'GoalSelections', ['Timestamp', 'Matrícula', 'Nombre', 'Meta Prioritaria', 'Meta Complementaria', 'Tiempo', 'Obstáculo', 'Plan']);
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
