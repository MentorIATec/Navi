import { callAppsScript } from './_lib/appsScript.js';
import { assertMethod, assertTrustedOrigin, sendApiError, sendJson } from './_lib/http.js';
import { requireSession } from './_lib/session.js';
import { requireStudentSession, setStudentSessionCookie } from './_lib/studentSession.js';
import { ACTION_POLICIES } from '../shared/actionPolicy.js';

function actionsWithAccess(access) {
  return new Set(Object.entries(ACTION_POLICIES)
    .filter(([, policy]) => policy.access === access && policy.route === 'action')
    .map(([action]) => action));
}

const STUDENT_ACTIONS = actionsWithAccess('student');
const WORKSPACE_ACTIONS = actionsWithAccess('workspace');
const ADMIN_ACTIONS = actionsWithAccess('admin');

function normalizeMatricula(value) {
  return String(value || '').trim().toUpperCase();
}

export function assertStudentBinding(data, session) {
  if (data.matricula && normalizeMatricula(data.matricula) !== session.matricula) {
    const error = new Error('La sesión cambió en otra pestaña. Confirma nuevamente tu matrícula.');
    error.statusCode = 409;
    error.code = 'STUDENT_SESSION_CHANGED';
    throw error;
  }
}

function isWhatsAppActive(value) {
  return !['no', 'false', '0', 'inactivo'].includes(String(value || '').trim().toLowerCase());
}

export function sanitizeStudentLookup(result) {
  const student = result?.student;
  const mentor = result?.mentor;
  if (!student) return { student: null, mentor: null };
  return {
    student: {
      matricula: normalizeMatricula(student.matricula),
      nombre: String(student.nombre || '').trim(),
      nombrepreferido: String(student.nombrepreferido || '').trim(),
      mentor: String(student.nicknamementor || '').trim(),
      nicknamementor: String(student.nicknamementor || '').trim(),
      status: String(student.status || 'Pendiente').trim(),
      checkin: String(student.checkin || 'No').trim(),
      agenciacheckin: String(student.agenciacheckin || '').trim(),
      comunidad: String(mentor?.comunidad || '').trim(),
      community: String(mentor?.comunidad || '').trim(),
    },
    mentor: mentor ? {
      nombre: String(mentor.nombre || '').trim(),
      name: String(mentor.nombre || '').trim(),
      alias: String(mentor.alias || '').trim(),
      comunidad: String(mentor.comunidad || '').trim(),
      community: String(mentor.comunidad || '').trim(),
      hex: String(mentor.hex || '').trim(),
      slogan: String(mentor.slogan || '').trim(),
      whatsappE164: isWhatsAppActive(mentor.whatsappactivo)
        ? String(mentor.whatsappe164 || '').replace(/[^0-9]/g, '')
        : '',
    } : null,
  };
}

export function requireStudentLookup(result) {
  if (result?.student) return result;
  const error = new Error('Alumno no encontrado');
  error.statusCode = 404;
  error.code = 'STUDENT_NOT_FOUND';
  throw error;
}

async function requireWorkspaceUser(request) {
  const actor = requireSession(request);
  const resolved = await callAppsScript('resolveWorkspaceUser', { actor });
  return { actor, user: resolved.user || resolved };
}

function assertMentorScope(user, dashboard, matricula) {
  if (String(user.role || '').toLowerCase() === 'admin') return;
  const allowed = (dashboard.students || []).some((student) => normalizeMatricula(student.matricula) === matricula);
  if (!allowed) {
    const error = new Error('No tienes permisos para registrar esta sesión.');
    error.statusCode = 403;
    throw error;
  }
}

export default async function handler(request, response) {
  try {
    assertMethod(request, ['POST']);
    assertTrustedOrigin(request);
    const action = String(request.body?.action || '').trim();
    const data = request.body?.data && typeof request.body.data === 'object' ? request.body.data : {};

    if (action === 'findStudent' || action === 'getStudentEntry' || action === 'startStudentCheckIn') {
      const matricula = normalizeMatricula(data.matricula);
      if (!/^A\d{8}$/.test(matricula)) {
        const error = new Error('La matrícula no es válida.');
        error.statusCode = 400;
        throw error;
      }
      const upstream = await callAppsScript(action, {
        ...data,
        matricula,
        ...(action === 'getStudentEntry' || action === 'startStudentCheckIn' ? { cycleScope: 'active' } : {}),
      });
      const result = requireStudentLookup(sanitizeStudentLookup(upstream));
      setStudentSessionCookie(response, matricula);
      sendJson(response, 200, {
        status: 'success',
        data: action === 'getStudentEntry' || action === 'startStudentCheckIn'
          ? {
              ...result,
              testResponse: upstream.testResponse || null,
              operationalCycle: upstream.operationalCycle || '',
              ...(action === 'startStudentCheckIn' ? { registration: upstream.registration || null } : { continuation: upstream.continuation || null }),
            }
          : result,
      });
      return;
    }

    if (action === 'getMetas') {
      const error = new Error('Acción no permitida.');
      error.statusCode = 410;
      error.code = 'GOAL_CATALOG_ROUTE_RETIRED';
      throw error;
    }

    if (STUDENT_ACTIONS.has(action)) {
      const studentSession = requireStudentSession(request);
      assertStudentBinding(data, studentSession);
      const result = await callAppsScript(action, { ...data, matricula: studentSession.matricula });
      sendJson(response, 200, { status: 'success', data: result });
      return;
    }

    if (WORKSPACE_ACTIONS.has(action)) {
      const actor = requireSession(request);
      const dashboard = await callAppsScript('getMentorDashboard', { actor });
      const user = dashboard.user || {};
      const matricula = normalizeMatricula(data.matricula);
      assertMentorScope(user, dashboard, matricula);
      const result = await callAppsScript(action, { ...data, matricula, actor });
      sendJson(response, 200, { status: 'success', data: result });
      return;
    }

    if (ADMIN_ACTIONS.has(action)) {
      if (action === 'getOperationalTelemetry'
        || action === 'prepareDashboardReadModelPreview'
        || action === 'getDashboardReadModelPreview'
        || action === 'runDashboardReadModelEvaluation') {
        const actor = requireSession(request);
        const result = await callAppsScript(action, { ...data, actor });
        sendJson(response, 200, { status: 'success', data: result });
        return;
      }
      const { actor, user } = await requireWorkspaceUser(request);
      if (String(user.role || '').toLowerCase() !== 'admin') {
        const error = new Error('Esta acción requiere permisos de administración.');
        error.statusCode = 403;
        throw error;
      }
      const result = await callAppsScript(action, { ...data, actor });
      sendJson(response, 200, { status: 'success', data: result });
      return;
    }

    const error = new Error('Acción no permitida.');
    error.statusCode = 400;
    throw error;
  } catch (error) {
    sendApiError(response, error);
  }
}
