// API Client for interacting with the same-origin faro gateway.
import { getClientTimeoutMs, isWriteAction, getActionPolicy } from '../../shared/actionPolicy.js';

function getSessionId(item = {}) {
  return String(item.sessionId || item.sessionid || '').trim();
}

function upsertSessionsById(items = [], nextEntry = {}) {
  const sessionId = getSessionId(nextEntry);
  if (!sessionId) return items;
  const remaining = items.filter((item) => getSessionId(item) !== sessionId);
  return [nextEntry, ...remaining];
}

// Remove catalog caches left by earlier local versions; never store a replacement.
try { globalThis.localStorage?.removeItem('navi_goals_catalog'); } catch { /* Storage may be unavailable. */ }

export const apiClient = {
  async post(action, data = {}) {
    const startedAt = Date.now();
    const timeoutMs = getClientTimeoutMs(action);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(getActionPolicy(action).route === 'goals' ? '/api/goals' : '/api/action', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
        signal: controller?.signal,
      });

      const result = await response.json().catch(() => ({
        status: 'error',
        message: 'La respuesta del servidor no es válida.',
      }));
      if (!response.ok || result.status === 'error') {
        const error = new Error(result.message || 'No pudimos completar la solicitud.');
        error.statusCode = response.status;
        error.code = result.code || 'REQUEST_ERROR';
        error.traceId = result.traceId || '';
        throw error;
      }
      const payload = result.data ?? result;

      console.info('[faro api timing]', {
        action,
        durationMs: Date.now() - startedAt,
        outcome: 'success',
      });
      return payload;
    } catch (error) {
      const requestError = controller?.signal.aborted
        ? Object.assign(new Error('La solicitud tardó demasiado en responder.'), {
            statusCode: 504,
            code: isWriteAction(action) ? 'WRITE_OUTCOME_UNKNOWN' : 'REQUEST_TIMEOUT',
          })
        : error;

      console.error('[faro api timing]', {
        action,
        durationMs: Date.now() - startedAt,
        outcome: requestError.code === 'REQUEST_TIMEOUT'
          ? 'timeout'
          : (requestError.code === 'WRITE_OUTCOME_UNKNOWN' ? 'outcome_unknown' : 'error'),
        statusCode: Number(requestError.statusCode) || 0,
      });

      if (requestError.statusCode === 401 || requestError.statusCode === 403) {
        throw requestError;
      }
      if (action === 'saveTestResponse' || action === 'getTestResponse') {
        throw requestError;
      }
      console.error(`API Error (POST) [${action}]:`, error);
      throw requestError;
    } finally {
      clearTimeout(timeoutId);
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
              emailingProfiles: JSON.parse(localStorage.getItem('navi_emailing_profiles') || '[]'),
              responses: savedResponses ? JSON.parse(savedResponses) : [],
              goalSelections: JSON.parse(localStorage.getItem('navi_goal_selections') || '[]'),
              sessions: JSON.parse(localStorage.getItem('navi_mentoring_sessions') || '[]'),
            });
            break;
          }
          case 'findStudent':
          case 'getStudentEntry': {
            const savedStudents = JSON.parse(localStorage.getItem('navi_students') || '[]');
            const savedMentors = JSON.parse(localStorage.getItem('navi_mentors') || '[]');
            const savedResponses = JSON.parse(localStorage.getItem('navi_responses') || '[]');
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
            const testResponse = action === 'getStudentEntry'
              ? [...savedResponses].reverse().find(
                (item) => item.matricula?.toUpperCase() === data.matricula?.toUpperCase()
              ) || null
              : undefined;
            resolve(action === 'getStudentEntry' ? { student, mentor, testResponse } : { student, mentor });
            break;
          }
          case 'getMetas':
          case 'getGoalsCatalog':
          case 'saveGoalsCatalog':
          case 'getGoalOptions':
          case 'getGoalDetails':
            reject(new Error('No pudimos completar la solicitud.'));
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
            const existing = savedResponses.find((item) => item.responseId && item.responseId === data.responseId);
            if (existing) {
              resolve({ status: 'success', data: { responseId: data.responseId, reused: true } });
              break;
            }
            savedResponses.push({ ...data, fechaTest: new Date().toISOString() });
            localStorage.setItem('navi_responses', JSON.stringify(savedResponses));
            resolve({ status: 'success', data: { responseId: data.responseId, reused: false } });
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
          default:
            resolve({ status: 'success' });
        }
      }, 800);
    });
  }
};
