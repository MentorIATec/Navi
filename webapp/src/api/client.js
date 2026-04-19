// API Client for interacting with the Google Apps Script Backend
import goalsCatalogSeed from '../data/goalsCatalogSeed.json';

const ENV_API_URL = String(import.meta.env.VITE_API_URL || '').trim();
const ADMIN_WRITE_ACTIONS = new Set(['syncBulk', 'saveGoalsCatalog', 'saveMetasConfig', 'sendCampaign']);

function getApiUrl() {
  const savedUrl = localStorage.getItem('navi_api_url');
  if (savedUrl) {
    return savedUrl;
  }
  if (ENV_API_URL) {
    localStorage.setItem('navi_api_url', ENV_API_URL);
    return ENV_API_URL;
  }
  return '';
}

function getAdminSecret() {
  return String(localStorage.getItem('navi_admin_secret') || '').trim();
}

function isMockUrl(url) {
  return url.includes('AKfycbz');
}

function getLocalDataFallback() {
  const savedStudents = JSON.parse(localStorage.getItem('navi_students') || '[]');
  const savedMentors = JSON.parse(localStorage.getItem('navi_mentors') || '[]');
  const savedResponses = JSON.parse(localStorage.getItem('navi_responses') || '[]');
  const savedGoalSelections = JSON.parse(localStorage.getItem('navi_goal_selections') || '[]');
  const savedSessions = JSON.parse(localStorage.getItem('navi_mentoring_sessions') || '[]');
  return {
    students: savedStudents,
    mentors: savedMentors,
    responses: savedResponses,
    goalSelections: savedGoalSelections,
    sessions: savedSessions,
  };
}

function getSessionId(item = {}) {
  return String(item.sessionId || item.sessionid || '').trim();
}

function upsertSessionsById(items = [], nextEntry = {}) {
  const sessionId = getSessionId(nextEntry);
  if (!sessionId) return items;
  const remaining = items.filter((item) => getSessionId(item) !== sessionId);
  return [nextEntry, ...remaining];
}

function normalizeCatalogItem(item = {}) {
  const rawTopic = String(item.temaoperativo || item.temaOperativo || item.TemaOperativo || '').trim().toLowerCase();
  const temaoperativo = rawTopic === 'servicio' ? 'servicio social' : rawTopic;
  const rawDimension = String(item.dimension || item.Dimension || '').trim().toLowerCase();
  const dimension = temaoperativo === 'servicio social' ? 'ocupacional' : rawDimension;

  return {
    id: item.id || item.Id || '',
    temaoperativo,
    dimension,
    etapa: item.etapa || item.Etapa || '',
    metabase: item.metabase || item.metaBase || item.MetaBase || '',
    pasosbase: item.pasosbase || item.pasosBase || item.PasosBase || '',
    horizontesugerido: item.horizontesugerido || item.horizonteSugerido || item.HorizonteSugerido || '',
    indicadorlogro: item.indicadorlogro || item.indicadorLogro || item.IndicadorLogro || '',
    cuandousarla: item.cuandousarla || item.cuandoUsarla || item.CuandoUsarla || '',
    niveldificultad: item.niveldificultad || item.nivelDificultad || item.NivelDificultad || '',
    frecuenciaseguimiento: item.frecuenciaseguimiento || item.frecuenciaSeguimiento || item.FrecuenciaSeguimiento || '',
    conexiondiagnostico: sanitizeDiagnosticConnection(item.conexiondiagnostico || item.conexionDiagnostico || item.ConexionDiagnostico || ''),
    preguntasparaafinar: item.preguntasparaafinar || item.preguntasParaAfinar || item.PreguntasParaAfinar || '',
    activa: item.activa || item.Activa || 'Si',
  };
}

function mergeCatalogById(primaryItems = [], secondaryItems = []) {
  const merged = new Map();
  secondaryItems.map(normalizeCatalogItem).forEach((item) => {
    if (item.id) merged.set(item.id, item);
  });
  primaryItems.map(normalizeCatalogItem).forEach((item) => {
    if (item.id) merged.set(item.id, item);
  });
  return Array.from(merged.values());
}

function persistGoalsCatalog(items = []) {
  const normalizedItems = items.map(normalizeCatalogItem);
  const mergedCatalog = mergeCatalogById(normalizedItems, goalsCatalogSeed);
  localStorage.setItem('navi_goals_catalog', JSON.stringify(mergedCatalog));
  return mergedCatalog;
}

function getLocalGoalsCatalogFallback() {
  const savedCatalog = JSON.parse(localStorage.getItem('navi_goals_catalog') || '[]');
  if (savedCatalog.length > 0) {
    return persistGoalsCatalog(savedCatalog);
  }
  return persistGoalsCatalog(goalsCatalogSeed);
}

function normalizeGoalOption(item = {}) {
  return {
    id: item.id || item.Id || '',
    text: item.text || item.metabase || item.metaBase || item.MetaBase || '',
    dimension: item.dimension || item.Dimension || '',
    temaoperativo: item.temaoperativo || item.temaOperativo || item.TemaOperativo || '',
    etapa: item.etapa || item.Etapa || '',
    pasosbase: item.pasosbase || item.pasosBase || item.PasosBase || '',
    horizontesugerido: item.horizontesugerido || item.horizonteSugerido || item.HorizonteSugerido || '',
    preguntasparaafinar: item.preguntasparaafinar || item.preguntasParaAfinar || item.PreguntasParaAfinar || '',
    conexiondiagnostico: sanitizeDiagnosticConnection(item.conexiondiagnostico || item.conexionDiagnostico || item.ConexionDiagnostico || ''),
  };
}

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

function normalizeDimension(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'física') return 'fisica';
  return normalized;
}

function normalizeDiagnosticTags(value = '') {
  const rawTags = String(value || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const normalized = [];
  const unknown = [];

  rawTags.forEach((tag) => {
    const alias = DIAGNOSTIC_TAG_ALIASES[tag];
    const canonical = CONTROLLED_DIAGNOSTIC_TAGS.includes(tag)
      ? tag
      : alias && CONTROLLED_DIAGNOSTIC_TAGS.includes(alias)
        ? alias
        : '';

    if (canonical) {
      normalized.push(canonical);
    } else {
      unknown.push(tag);
    }
  });

  if (unknown.length) {
    console.warn('[Navi] ConexionDiagnostico contiene tags fuera del vocabulario controlado:', unknown);
  }

  return Array.from(new Set(normalized));
}

function sanitizeDiagnosticConnection(value = '') {
  return normalizeDiagnosticTags(value).join(',');
}

function buildPriorityContext(data = {}) {
  const incomingAreas = Array.isArray(data.priorityAreas) ? data.priorityAreas : [];
  const priorityAreas = incomingAreas
    .map((item) => {
      if (typeof item === 'string') {
        return { category: item, score: null };
      }
      return {
        category: item.category || item.key || '',
        score: Number.isFinite(Number(item.score)) ? Number(item.score) : null,
      };
    })
    .filter((item) => item.category);

  const topAreas = priorityAreas
    .sort((a, b) => {
      if (a.score == null && b.score == null) return 0;
      if (a.score == null) return 1;
      if (b.score == null) return -1;
      return a.score - b.score;
    })
    .slice(0, 2);

  const dimensionHints = Array.from(
    new Set(topAreas.flatMap((item) => DIAGNOSTIC_CATEGORY_MAP[item.category]?.dimensions || []))
  );
  const tagHints = topAreas.map((item) => DIAGNOSTIC_CATEGORY_MAP[item.category]?.tags || []);

  return {
    stage: String(data.stage || '').trim().toLowerCase(),
    topAreas,
    dimensionHints,
    tagHints,
  };
}

function scorePrioritaria(item, context, index) {
  const stage = String(item.etapa || '').trim().toLowerCase();
  const dimension = normalizeDimension(item.dimension);
  const tags = normalizeDiagnosticTags(item.conexiondiagnostico);

  let score = 0;
  let matchedAreaIndex = null;
  context.tagHints.forEach((hintBucket, bucketIndex) => {
    if (hintBucket.some((tag) => tags.includes(tag))) {
      if (matchedAreaIndex == null) matchedAreaIndex = bucketIndex;
      score += bucketIndex === 0 ? 120 : 95;
    }
  });

  if (context.dimensionHints.includes(dimension)) {
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

  return { ...item, _priorityScore: score, _sourceIndex: index, _matchedAreaIndex: matchedAreaIndex };
}

function balancePrioritarias(items, context) {
  if ((context.topAreas || []).length < 2) return items;

  const primary = items.filter((item) => item._matchedAreaIndex === 0);
  const secondary = items.filter((item) => item._matchedAreaIndex === 1);
  const rest = items.filter((item) => item._matchedAreaIndex !== 0 && item._matchedAreaIndex !== 1);

  const balanced = [];
  let round = 0;
  while (primary[round] || secondary[round]) {
    if (primary[round]) balanced.push(primary[round]);
    if (secondary[round]) balanced.push(secondary[round]);
    round += 1;
  }

  return [...balanced, ...rest];
}

function buildMetasFromCatalog(items = [], data = {}) {
  const normalized = items.map(normalizeGoalOption).filter((item) => item.text);
  const context = buildPriorityContext(data);

  const prioritarias = balancePrioritarias(normalized
    .filter((item) => PRIORITARIA_DIMENSIONS.includes(normalizeDimension(item.dimension)))
    .map((item, index) => scorePrioritaria(item, context, index))
    .sort((a, b) => {
      if (b._priorityScore !== a._priorityScore) return b._priorityScore - a._priorityScore;
      return a._sourceIndex - b._sourceIndex;
    })
  , context).map((item) => {
    const nextItem = { ...item };
    delete nextItem._priorityScore;
    delete nextItem._sourceIndex;
    delete nextItem._matchedAreaIndex;
    return nextItem;
  });

  const complementarias = normalized.filter((item) =>
    COMPLEMENTARIA_DIMENSIONS.includes(normalizeDimension(item.dimension))
  );

  return {
    prioritarias,
    complementarias,
  };
}

export const apiClient = {
  /**
   * Obtiene datos del backend (doGet)
   */
  async get() {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        throw new Error('No hay una URL de backend configurada.');
      }
      if (isMockUrl(apiUrl)) return this.mockRespuesta('getData');

      const response = await fetch(apiUrl);
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      return result.data;
    } catch (error) {
      console.error('API Error (GET):', error);
      return getLocalDataFallback();
    }
  },

  /**
   * Envía datos al backend (doPost)
   */
  async post(action, data = {}) {
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        throw new Error('No hay una URL de backend configurada.');
      }
      if (ADMIN_WRITE_ACTIONS.has(action) && !getAdminSecret()) {
        throw new Error('Configura la clave de administración en Configuración antes de escribir en Google Sheets.');
      }
      if (isMockUrl(apiUrl)) return this.mockRespuesta(action, data);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data, adminSecret: ADMIN_WRITE_ACTIONS.has(action) ? getAdminSecret() : '' })
      });

      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message);
      const payload = result.data ?? result;

      if (action === 'getGoalsCatalog' && Array.isArray(payload.items)) {
        payload.items = persistGoalsCatalog(payload.items);
      }

      if (action === 'saveGoalsCatalog' && Array.isArray(payload.items)) {
        payload.items = persistGoalsCatalog(payload.items);
      }

      return payload;
    } catch (error) {
      if (action === 'getMetas') {
        return buildMetasFromCatalog(getLocalGoalsCatalogFallback(), data);
      }
      if (action === 'getGoalsCatalog') {
        return { items: getLocalGoalsCatalogFallback(), source: 'fallback' };
      }
      if (action === 'resolveUserByEmail') {
        throw error;
      }
      if (action === 'saveGoalSelection') {
        const selections = JSON.parse(localStorage.getItem('navi_goal_selections') || '[]');
        const nextEntry = {
          timestamp: new Date().toISOString(),
          matricula: String(data.matricula || '').trim().toUpperCase(),
          nombre: data.nombre || '',
          metaPrioritaria: data.metaPrioritaria || '',
          metaComplementaria: data.metaComplementaria || '',
          tiempo: data.tiempo || '',
          obstaculo: data.obstaculo || '',
          plan: data.plan || '',
        };

        const nextSelections = [nextEntry, ...selections];
        localStorage.setItem('navi_goal_selections', JSON.stringify(nextSelections));

        const savedStudents = JSON.parse(localStorage.getItem('navi_students') || '[]');
        const nextStudents = savedStudents.map((student) => {
          if (String(student.matricula || '').trim().toUpperCase() !== nextEntry.matricula) {
            return student;
          }

          return {
            ...student,
            status: 'Metas Seleccionadas',
            checkIn: data.checkIn || student.checkIn,
          };
        });
        localStorage.setItem('navi_students', JSON.stringify(nextStudents));

        return {
          status: 'success',
          source: 'fallback',
          warning: 'Tu plan se guardó solo en este dispositivo. Intenta sincronizarlo otra vez para que mentoría lo reciba.',
        };
      }
      if (action === 'saveMentoringSession') {
        const sessions = JSON.parse(localStorage.getItem('navi_mentoring_sessions') || '[]');
        const timestampCreacion = String(data.timestampCreacion || '').trim() || new Date().toISOString();
        const timestampActualizado = new Date().toISOString();
        const nextEntry = {
          ...data,
          timestampCreacion,
          timestampActualizado,
        };
        const nextSessions = upsertSessionsById(sessions, nextEntry);
        localStorage.setItem('navi_mentoring_sessions', JSON.stringify(nextSessions));
        return {
          status: 'success',
          source: 'fallback',
          data: {
            sessionId: getSessionId(nextEntry),
            timestampCreacion,
            timestampActualizado,
          },
          warning: 'La sesión se guardó solo en este dispositivo. Intenta sincronizar de nuevo para dejar el registro compartido.',
        };
      }
      if (action === 'saveTestResponse') {
        const savedResponses = JSON.parse(localStorage.getItem('navi_responses') || '[]');
        savedResponses.push({ ...data, fechaTest: new Date().toISOString() });
        localStorage.setItem('navi_responses', JSON.stringify(savedResponses));
        return { status: 'success', source: 'fallback' };
      }
      if (action === 'getTestResponse') {
        const savedResponses = JSON.parse(localStorage.getItem('navi_responses') || '[]');
        const matricula = String(data.matricula || '').trim().toUpperCase();
        let match = null;
        for (let i = savedResponses.length - 1; i >= 0; i--) {
          if (String(savedResponses[i].matricula).toUpperCase() === matricula) {
            match = savedResponses[i];
            break;
          }
        }
        if (match) {
          return {
            status: 'success',
            data: {
              ...match,
              scores: {
                claridad_carrera: match.claridad_carrera,
                desempeno_academico: match.desempeno_academico,
                plan_practicas: match.plan_practicas,
                servicio_social: match.servicio_social,
                decision_semestre_tec: match.decision_semestre_tec,
                certificacion_idioma: match.certificacion_idioma
              }
            }
          };
        } else {
          throw new Error('No se encontraron respuestas para este alumno');
        }
      }
      console.error(`API Error (POST) [${action}]:`, error);
      throw error;
    }
  },

  /**
   * Mock Data para pruebas del Frontend sin Backend
   */
  mockRespuesta(action, data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (action) {
          case 'getData': {
            const savedStudents = localStorage.getItem('navi_students');
            const savedMentors = localStorage.getItem('navi_mentors');
            const savedResponses = localStorage.getItem('navi_responses');
            resolve({
              students: savedStudents ? JSON.parse(savedStudents) : [],
              mentors: savedMentors ? JSON.parse(savedMentors) : [],
              responses: savedResponses ? JSON.parse(savedResponses) : [],
              goalSelections: JSON.parse(localStorage.getItem('navi_goal_selections') || '[]'),
              sessions: JSON.parse(localStorage.getItem('navi_mentoring_sessions') || '[]'),
            });
            break;
          }
          case 'findStudent': {
            const savedStudents = JSON.parse(localStorage.getItem('navi_students') || '[]');
            const savedMentors = JSON.parse(localStorage.getItem('navi_mentors') || '[]');
            const student = savedStudents.find(
              (item) => item.matricula?.toUpperCase() === data.matricula?.toUpperCase()
            );
            const mentor = student
              ? savedMentors.find((item) => item.nickname === student.mentor) || null
              : null;
            if (!student) {
              reject(new Error('Alumno no encontrado'));
              return;
            }
            resolve({ student, mentor });
            break;
          }
          case 'resolveUserByEmail': {
            const savedUsers = JSON.parse(localStorage.getItem('navi_users') || '[]');
            const email = String(data.email || '').trim().toLowerCase();
            const user = savedUsers.find((item) => String(item.email || '').trim().toLowerCase() === email && String(item.activo || 'Si').toLowerCase() !== 'no');
            if (!user) {
              reject(new Error('No encontramos permisos para este correo institucional.'));
              return;
            }
            resolve({ user });
            break;
          }
          case 'getMetas':
            resolve(buildMetasFromCatalog(getLocalGoalsCatalogFallback(), data));
            break;
          case 'getGoalsCatalog': {
            resolve({ items: getLocalGoalsCatalogFallback() });
            break;
          }
          case 'saveGoalsCatalog':
            resolve({ items: persistGoalsCatalog(data.items || []) });
            break;
          case 'saveMetasConfig':
          case 'saveGoalSelection':
            resolve(data);
            break;
          case 'saveMentoringSession': {
            const sessions = JSON.parse(localStorage.getItem('navi_mentoring_sessions') || '[]');
            const timestampCreacion = String(data.timestampCreacion || '').trim() || new Date().toISOString();
            const timestampActualizado = new Date().toISOString();
            const nextEntry = { ...data, timestampCreacion, timestampActualizado };
            const nextSessions = upsertSessionsById(sessions, nextEntry);
            localStorage.setItem('navi_mentoring_sessions', JSON.stringify(nextSessions));
            resolve({
              status: 'success',
              data: {
                sessionId: getSessionId(nextEntry),
                timestampCreacion,
                timestampActualizado,
              },
            });
            break;
          }
          case 'saveTestResponse': {
            const savedResponses = JSON.parse(localStorage.getItem('navi_responses') || '[]');
            savedResponses.push({ ...data, fechaTest: new Date().toISOString() });
            localStorage.setItem('navi_responses', JSON.stringify(savedResponses));
            resolve({ status: 'success' });
            break;
          }
          case 'getTestResponse': {
            const savedResponses = JSON.parse(localStorage.getItem('navi_responses') || '[]');
            const matricula = String(data.matricula || '').trim().toUpperCase();
            let match = null;
            for (let i = savedResponses.length - 1; i >= 0; i--) {
              if (String(savedResponses[i].matricula).toUpperCase() === matricula) {
                match = savedResponses[i];
                break;
              }
            }
            if (match) {
              resolve({
                status: 'success',
                data: {
                  ...match,
                  scores: {
                    claridad_carrera: match.claridad_carrera,
                    desempeno_academico: match.desempeno_academico,
                    plan_practicas: match.plan_practicas,
                    servicio_social: match.servicio_social,
                    decision_semestre_tec: match.decision_semestre_tec,
                    certificacion_idioma: match.certificacion_idioma
                  }
                }
              });
            } else {
              reject(new Error('No se encontraron respuestas para este alumno'));
            }
            break;
          }
          case 'updateStudent':
            console.log('Mock Update Student:', data);
            resolve({ status: 'success' });
            break;
          case 'sendCampaign': {
            const count = (data.destinatarios || []).length;
            setTimeout(() => {
              resolve({ status: 'success', enviados: count, fallidos: 0, detalleFallidos: [] });
            }, 400 * Math.min(count, 5));
            return;
          }
          default:
            resolve({ status: 'success' });
        }
      }, 800);
    });
  }
};
