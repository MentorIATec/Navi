import { Dialog } from '../components/ui/Dialog';
import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Users, Activity, CheckCircle, ShieldAlert, RefreshCw, Copy, Mail, ExternalLink, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../utils/cn';
import { apiClient } from '../api/client';
import { workspaceClient } from '../api/workspaceClient';
import { GoogleWorkspaceLogin } from '../components/admin/GoogleWorkspaceLogin';
import { getCrmStatus } from '../utils/crmStatus';
import { getDashboardScopeStudents } from '../utils/dashboardScope';
import { filterMentorDirectory } from '../utils/mentorDirectory';
import { OUTLOOK_MESSAGE, buildOutlookComposeUrl } from '../utils/outlookDraft';
import { buildMentoringSummary, getCrmSourceReview, getSessionAreaLabel, getSessionAreas, getSessionScaleLabel, getSessionStageLabel } from '../utils/adminSessionCopy';
import { prepareMentoringAttempt, readPendingMentoringDraft, updatePendingMentoringDraft, clearMentoringAttempt } from '../utils/mentoringSessionStore';

const DEFAULT_MENTORS = [];

const DEFAULT_STUDENTS = [];
const DIRECTORY_PAGE_SIZE = 12;
const DEMO_STUDENT_MATRICULAS = [
  'A10984011', 'A10984012', 'A10984013', 'A10984014', 'A10984015',
  'A10984016', 'A10984017', 'A10984018', 'A10984019', 'A10984020',
];
function normalizeStudent(raw, fallbackIndex = 0) {
  return {
    id: raw.id || raw.matricula || `student-${fallbackIndex}`,
    matricula: raw.matricula || '',
    name: raw.name || raw.nombre || '',
    preferredName: raw.preferredName || raw.nombrepreferido || raw.nombrePreferido || '',
    email: raw.email || '',
    mentorId: raw.mentorId || raw.mentorid || '',
    mentor: raw.mentor || raw.nicknamementor || '',
    community: raw.community || raw.comunidad || '',
    status: raw.status || 'Pendiente',
    progressState: raw.progressState || raw.progressstate || '',
    hasResponse: Boolean(raw.hasResponse ?? raw.hasresponse),
    hasGoalSelection: Boolean(raw.hasGoalSelection ?? raw.hasgoalselection),
    hasCheckIn: Boolean(raw.hasCheckIn ?? raw.hascheckin),
    hasSession: Boolean(raw.hasSession ?? raw.hassession),
    checkIn: raw.checkIn || raw.checkin || 'No',
    agenciaCheckIn: raw.agenciaCheckIn || raw.agenciacheckin || '',
    checkInId: raw.checkInId || raw.checkinid || '',
    encounterManaged: Boolean(raw.encounterManaged ?? raw.encountermanaged),
    checkInSessionId: raw.checkInSessionId || raw.checkinsessionid || '',
    checkInTimestamp: raw.checkInTimestamp || raw.checkintimestamp || '',
    ultimoAviso: raw.ultimoAviso || raw.ultimoaviso || '',
  };
}

function normalizeMentor(raw) {
  return {
    mentorId: raw.mentorId || raw.mentorid || '',
    community: raw.community || raw.comunidad || 'Sin Comunidad',
    hex: raw.hex || raw['#hex'] || '#0033A0',
    name: raw.name || raw.nombre || 'Sin Nombre',
    nickname: raw.nickname || raw.alias || raw.apodo || raw.name || raw.nombre || 'Sin Nombre',
    email: raw.email || 'sin@correo.com',
  };
}

function normalizeUser(raw) {
  return {
    email: String(raw.email || '').trim().toLowerCase(),
    mentorId: String(raw.mentorId || raw.mentorid || '').trim(),
    name: raw.name || raw.nombre || 'Sin Nombre',
    role: String(raw.role || raw.rol || 'mentor').trim().toLowerCase(),
    community: raw.community || raw.comunidad || '',
    hex: raw.hex || raw['#hex'] || '#0033A0',
    slogan: raw.slogan || '',
    active: String(raw.active || raw.activo || 'Si').trim().toLowerCase() !== 'no',
  };
}

function getSessionId(item) {
  return String(item?.sessionId || item?.sessionid || '').trim();
}

function getSessionDate(item) {
  return normalizeSessionCalendarDate(item?.fechaSesion ?? item?.fecha_sesion ?? item?.fechasesion);
}

function getSessionUpdatedAt(item) {
  return String(
    item?.timestampActualizado || item?.timestamp_actualizado || item?.timestampactualizado ||
    item?.timestampGuardado || item?.timestamp_guardado || item?.timestampguardado ||
    item?.timestampCreacion || item?.timestamp_creacion || item?.timestampcreacion ||
    ''
  ).trim();
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalTimestamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function createSessionId(matricula, fechaSesion) {
  const suffix = globalThis.crypto?.randomUUID?.() || Date.now().toString() + '-' + Math.random().toString(36).slice(2);
  return String(matricula).trim().toUpperCase() + '-' + fechaSesion + '-' + suffix;
}

function getAcademicPeriod(value = '') {
  const day = normalizeSessionCalendarDate(value);
  return day ? day.slice(0, 4) + '-' + (Number(day.slice(5, 7)) <= 6 ? '1' : '2') : '';
}

function formatDuration(value) {
  const durationMs = Number(value);
  if (!Number.isFinite(durationMs)) return 'Sin muestra';
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`;
  return `${(durationMs / 1000).toFixed(durationMs < 10000 ? 1 : 0)} s`;
}

function normalizeCrmDocumentation(value) {
  if (typeof value === 'boolean') return value;
  if (value === 1) return true;
  if (typeof value !== 'string') return false;
  return ['si', 'sí', 'true', '1'].includes(value.trim().toLowerCase());
}

function normalizeSessionCalendarDate(value) {
  if (value instanceof Date) value = Number.isFinite(value.getTime()) ? value.toISOString() : '';
  if (typeof value !== 'string') return '';
  const text = value.trim();
  const day = text.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
  const calendar = new Date(`${day}T12:00:00.000Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) return '';
  if (text === day) return day;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) return '';
  if (Number(text.slice(11, 13)) > 23 || Number(text.slice(14, 16)) > 59 || Number(text.slice(17, 19)) > 59) return '';
  const instant = new Date(text);
  if (!Number.isFinite(instant.getTime())) return '';
  // Sheets date cells use the existing institutional calendar, not the device zone.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instant);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function normalizeMentoringSession(raw = {}) {
  const item = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const fields = {
    sessionId: ['sessionId', 'session_id', 'sessionid'], matricula: ['matricula'],
    nombre: ['nombre'], mentor: ['mentor'], comunidad: ['comunidad'], periodo: ['periodo'],
    fechaSesion: ['fechaSesion', 'fecha_sesion', 'fechasesion'], etapa: ['etapa'],
    areasPrioritarias: ['areasPrioritarias', 'areas_prioritarias', 'areasprioritarias'],
    pretestResumen: ['pretestResumen', 'pretest_resumen', 'pretestresumen'],
    metaPrioritaria: ['metaPrioritaria', 'meta_prioritaria', 'metaprioritaria'],
    metaComplementaria: ['metaComplementaria', 'meta_complementaria', 'metacomplementaria'],
    horizonte: ['horizonte'], obstaculo: ['obstaculo'], estrategia: ['estrategia'],
    notasMentor: ['notasMentor', 'notas_mentor', 'notasmentor'],
    estadoDocumentacion: ['estadoDocumentacion', 'estado_documentacion', 'estadodocumentacion'],
    documentadoCrm: ['documentadoCrm', 'documentado_crm', 'documentadocrm'],
    timestampCreacion: ['timestampCreacion', 'timestamp_creacion', 'timestampcreacion', 'timestampGuardado', 'timestamp_guardado', 'timestampguardado'],
    timestampActualizado: ['timestampActualizado', 'timestamp_actualizado', 'timestampactualizado', 'timestampGuardado', 'timestamp_guardado', 'timestampguardado'],
  };
  const result = { ...item };
  for (const [field, aliases] of Object.entries(fields)) {
    const key = aliases.find(alias => item[alias] !== undefined && item[alias] !== null);
    result[field] = key === undefined ? '' : item[key];
  }
  result.sessionId = String(result.sessionId).trim();
  result.matricula = String(result.matricula).trim().toUpperCase();
  result.fechaSesion = normalizeSessionCalendarDate(result.fechaSesion);
  result.notasMentor = String(result.notasMentor);
  result.documentadoCrm = normalizeCrmDocumentation(result.documentadoCrm);
  for (const field of ['timestampCreacion', 'timestampActualizado']) {
    const text = typeof result[field] === 'string' ? result[field].trim() : '';
    result[field] = text && Number.isFinite(Date.parse(text)) ? text : '';
  }
  return result;
}

function assertMentoringAcknowledgement(result, sessionId) {
  const acknowledgement = result?.data ?? result;
  if (result?.source === 'fallback' || acknowledgement?.source === 'fallback' || acknowledgement?.sessionId !== sessionId
    || typeof acknowledgement?.reused !== 'boolean') {
    throw Object.assign(new Error('No pudimos completar la solicitud.'), { code: 'WRITE_OUTCOME_UNKNOWN' });
  }
  return acknowledgement;
}

function getMentoringAttempt(attempts, contextKey, draft, matricula) {
  const pending = prepareMentoringAttempt(localStorage, contextKey, {
    ...draft, documentadoCrm: normalizeCrmDocumentation(draft.documentadoCrm),
  }, matricula, createSessionId, new Date().toISOString());
  attempts.set(pending.key, pending);
  return pending;
}

export default function AdminDashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [isCheckingWorkspaceSession, setIsCheckingWorkspaceSession] = useState(true);
  const [selectedStudentForDiagnostic, setSelectedStudentForDiagnostic] = useState(null);
  const [startingEncounter, setStartingEncounter] = useState(false);
  const newEncounterRequest = useRef(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('navi_students');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
    return parsed.map((student, index) => normalizeStudent(student, index));
  });
  const [userRole, setUserRole] = useState('');
  const [mentors, setMentors] = useState(() => {
    const saved = localStorage.getItem('navi_mentors');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_MENTORS;
    return parsed.map(normalizeMentor);
  });
  const [emailingProfiles, setEmailingProfiles] = useState(() => {
    const saved = localStorage.getItem('navi_emailing_profiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [responses, setResponses] = useState(() => {
    const saved = localStorage.getItem('navi_responses');
    return saved ? JSON.parse(saved) : [];
  });
  const [goalSelections, setGoalSelections] = useState(() => {
    const saved = localStorage.getItem('navi_goal_selections');
    return saved ? JSON.parse(saved) : [];
  });
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('navi_mentoring_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Tab 1: Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [advanceFilters, setAdvanceFilters] = useState([]);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState(() => new Set());
  const [adminViewScope, setAdminViewScope] = useState('own');
  // Tab 2: Config
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [showCheckInQr, setShowCheckInQr] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(() => localStorage.getItem('navi_last_sync_at') || '');
  const [sessionSaveFeedback, setSessionSaveFeedback] = useState(null);
  const [mentoringSessionDraft, setMentoringSessionDraft] = useState({
    sessionId: '',
    fechaSesion: getLocalDateInputValue(),
    notasMentor: '',
    documentadoCrm: false,
    timestampCreacion: '',
  });
  const [isSavingMentoringSession, setIsSavingMentoringSession] = useState(false);
  const mentoringAttempts = useRef(new Map());
  const mentoringSaveBusy = useRef(false);
  const mentoringContext = useRef('');
  const mentoringView = useRef(null);
  const mentoringDraft = useRef(mentoringSessionDraft);
  const mentoringActor = String(authUser?.email || authUser?.sub || '');
  useLayoutEffect(() => {
    mentoringContext.current = JSON.stringify([selectedStudentForDiagnostic?.checkInId ? `${mentoringActor}:${selectedStudentForDiagnostic.checkInId}` : mentoringActor,
      String(selectedStudentForDiagnostic?.matricula || '').trim().toUpperCase()]);
    mentoringView.current = {};
    return () => { mentoringContext.current = ''; mentoringView.current = null; };
  }, [mentoringActor, selectedStudentForDiagnostic]);
  useLayoutEffect(() => { mentoringDraft.current = mentoringSessionDraft; }, [mentoringSessionDraft]);
  useEffect(() => { mentoringAttempts.current.clear(); }, [mentoringActor]);
  const [demoResetMatricula, setDemoResetMatricula] = useState(DEMO_STUDENT_MATRICULAS[0]);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [isPreviewingDirectory, setIsPreviewingDirectory] = useState(false);
  const [directoryPreview, setDirectoryPreview] = useState(null);
  const [isPublishingDirectory, setIsPublishingDirectory] = useState(false);
  const [directoryPublication, setDirectoryPublication] = useState(null);
  const [operationalTelemetry, setOperationalTelemetry] = useState(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  const clearDashboardData = useCallback(() => {
    setStudents([]);
    setMentors([]);
    setEmailingProfiles([]);
    setResponses([]);
    setGoalSelections([]);
    setSessions([]);
  }, []);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem('navi_students', JSON.stringify(students));
  }, [students]);

  // La sesión Workspace siempre reemplaza cualquier caché legado con datos acotados en servidor.
  useEffect(() => {
    if (authUser) {
      handleFetchFromSheets();
    }
  }, [authUser]);

  useEffect(() => {
    let cancelled = false;
    workspaceClient.getSession()
      .then((response) => {
        if (cancelled) return;
        const normalized = normalizeUser(response.user || response);
        clearDashboardData();
        setAuthUser(normalized);
      })
      .catch((error) => {
        if (!cancelled && error.statusCode && error.statusCode !== 401) {
          console.warn('No se pudo restaurar la sesión de Google Workspace:', error);
        }
      })
      .finally(() => {
        if (!cancelled) setIsCheckingWorkspaceSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clearDashboardData]);

  useEffect(() => {
    localStorage.removeItem('navi_admin_user');
    localStorage.removeItem('navi_admin_email');
    localStorage.removeItem('navi_user_role');
    localStorage.removeItem('navi_api_url');
    localStorage.removeItem('navi_admin_secret');
    if (authUser) {
      const resolvedRole = authUser.role === 'admin' ? 'admin' : `mentor:${authUser.email}`;
      if (userRole !== resolvedRole) {
        setUserRole(resolvedRole);
        return;
      }
    }
  }, [authUser, userRole]);

  useEffect(() => {
    // Dynamic Theme Update
    if (userRole === 'admin') {
      document.documentElement.style.setProperty('--theme-color', '#0033A0'); // Azul Tec
    } else if (userRole.startsWith('mentor:')) {
      const email = userRole.split(':')[1];
      const mentor = mentors.find(m => m.email === email);
      if (mentor) {
        document.documentElement.style.setProperty('--theme-color', mentor.hex);
      }
    }
  }, [userRole, mentors]);

  useEffect(() => {
    localStorage.setItem('navi_mentors', JSON.stringify(mentors));
  }, [mentors]);

  useEffect(() => {
    localStorage.setItem('navi_emailing_profiles', JSON.stringify(emailingProfiles));
  }, [emailingProfiles]);

  useEffect(() => {
    localStorage.setItem('navi_responses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem('navi_goal_selections', JSON.stringify(goalSelections));
  }, [goalSelections]);

  useEffect(() => {
    localStorage.setItem('navi_mentoring_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const isAdmin = userRole === 'admin';
  const isMentorView = userRole.startsWith('mentor:');
  const currentMentorEmail = isMentorView ? userRole.split(':')[1] : null;
  const currentMentor = currentMentorEmail ? mentors.find((mentor) => mentor.email === currentMentorEmail) : null;
  const emailingProfileByMatricula = useMemo(() => {
    const map = new Map();
    emailingProfiles.forEach((profile) => {
      const key = String(profile.matricula || '').trim().toUpperCase();
      if (key) map.set(key, profile);
    });
    return map;
  }, [emailingProfiles]);
  const mentorByNickname = useMemo(() => {
    const map = new Map();
    mentors.forEach((mentor) => {
      const key = String(mentor.nickname || '').trim();
      if (key) map.set(key, mentor);
    });
    return map;
  }, [mentors]);
  const studentsWithContext = useMemo(
    () => students.map((student) => {
      const key = String(student.matricula || '').trim().toUpperCase();
      const profile = emailingProfileByMatricula.get(key) || {};
      return {
        ...student,
        community: student.community || profile.comunidad || mentorByNickname.get(student.mentor)?.community || '',
        programa: profile.programa || '',
        semestre: profile.semestre || '',
        promedioBucket: profile.promediobucket || '',
        creditosReprobadosFlag: profile.creditosreprobadosflag || '',
        condicionalFj26Flag: profile.condicionalfj26flag || '',
        segmentoEmail: profile.segmentoemail || '',
        mensajeClave: profile.mensajeclave || '',
      };
    }),
    [students, emailingProfileByMatricula, mentorByNickname]
  );
  const checkInLink = typeof window !== 'undefined'
    ? `${window.location.origin}/check-in`
    : '/check-in';
  const permissions = isAdmin
    ? {
        tabs: ['dashboard', 'settings'],
        canPullSheets: true,
      }
    : {
        tabs: ['dashboard'],
        canPullSheets: true,
      };

  useEffect(() => {
    if (!permissions.tabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, permissions.tabs]);

  const stats = useMemo(() => {
    const scopeStudents = getDashboardScopeStudents(studentsWithContext, {
      isAdmin,
      adminViewScope,
      userMentorId: authUser?.mentorId || '',
      mentorNickname: currentMentor?.nickname || '',
    });

    const total = scopeStudents.length;
    const sessionReady = scopeStudents.filter(s => s.hasResponse && !s.hasSession).length;
    const testCompletado = scopeStudents.filter(s => s.hasResponse).length;
    const metasSeleccionadas = scopeStudents.filter(s => s.hasGoalSelection).length;
    const noShows = sessionReady;
    return {
      total,
      sessionReady,
      testRate: Math.round((testCompletado / total) * 100) || 0,
      metasRate: Math.round((metasSeleccionadas / total) * 100) || 0,
      noShows,
      pendientes: total - testCompletado,
      scopeStudents // include for the table
    };
  }, [studentsWithContext, isAdmin, adminViewScope, authUser?.mentorId, currentMentor?.nickname]);

  useEffect(() => {
    setDirectoryPage(1);
    setSelectedStudentIds(new Set());
  }, [adminViewScope]);

  const filteredStudents = useMemo(() => filterMentorDirectory(stats.scopeStudents, {
    search: searchTerm, status: statusFilter, advances: advanceFilters,
  }), [searchTerm, stats.scopeStudents, statusFilter, advanceFilters]);
  const directoryTotalPages = Math.max(1, Math.ceil(filteredStudents.length / DIRECTORY_PAGE_SIZE));
  const paginatedStudents = useMemo(() => {
    const start = (directoryPage - 1) * DIRECTORY_PAGE_SIZE;
    return filteredStudents.slice(start, start + DIRECTORY_PAGE_SIZE);
  }, [directoryPage, filteredStudents]);
  const selectedStudents = useMemo(
    () => stats.scopeStudents.filter((student) => selectedStudentIds.has(student.id) && student.email),
    [selectedStudentIds, stats.scopeStudents]
  );
  const selectedEmails = useMemo(
    () => [...new Set(selectedStudents.map((student) => String(student.email || '').trim().toLowerCase()).filter(Boolean))],
    [selectedStudents]
  );
  const selectableVisibleStudents = paginatedStudents.filter((student) => student.email);
  const allVisibleSelected = selectableVisibleStudents.length > 0
    && selectableVisibleStudents.every((student) => selectedStudentIds.has(student.id));
  const directoryRangeStart = filteredStudents.length ? (directoryPage - 1) * DIRECTORY_PAGE_SIZE + 1 : 0;
  const directoryRangeEnd = Math.min(directoryPage * DIRECTORY_PAGE_SIZE, filteredStudents.length);

  useEffect(() => {
    setDirectoryPage(1);
  }, [searchTerm, statusFilter, advanceFilters]);

  useEffect(() => {
    if (directoryPage > directoryTotalPages) setDirectoryPage(directoryTotalPages);
  }, [directoryPage, directoryTotalPages]);

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) return '';
    const parsed = new Date(lastSyncAt);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }, [lastSyncAt]);

  const latestGoalSelectionsByMatricula = useMemo(() => {
    const map = new Map();
    [...goalSelections]
      .sort((a, b) => new Date(b.timestamp || b.Timestamp || 0) - new Date(a.timestamp || a.Timestamp || 0))
      .forEach((item) => {
        const key = String(item.matricula || '').trim().toUpperCase();
        if (key && !map.has(key)) {
          map.set(key, item);
        }
      });
    return map;
  }, [goalSelections]);

  const latestResponsesByMatricula = useMemo(() => {
    const map = new Map();
    [...responses]
      .sort((a, b) => {
        const aDate = new Date(a.fechaTest || a.fechatest || a.timestamp || 0).getTime();
        const bDate = new Date(b.fechaTest || b.fechatest || b.timestamp || 0).getTime();
        return bDate - aDate;
      })
      .forEach((item) => {
        const key = String(item.matricula || '').trim().toUpperCase();
        if (key && !map.has(key)) {
          map.set(key, item);
        }
      });
    return map;
  }, [responses]);

  const latestSessionsByMatricula = useMemo(() => {
    const map = new Map();
    sessions.map(normalizeMentoringSession)
      .sort((a, b) => {
        const aSessionDate = new Date(getSessionDate(a) || 0).getTime();
        const bSessionDate = new Date(getSessionDate(b) || 0).getTime();
        if (bSessionDate !== aSessionDate) return bSessionDate - aSessionDate;
        const aUpdatedAt = new Date(getSessionUpdatedAt(a) || 0).getTime();
        const bUpdatedAt = new Date(getSessionUpdatedAt(b) || 0).getTime();
        return bUpdatedAt - aUpdatedAt;
      })
      .forEach((item) => {
        const key = String(item.matricula || '').trim().toUpperCase();
        if (key && !map.has(key)) {
          map.set(key, item);
        }
      });
    return map;
  }, [sessions]);

  useEffect(() => {
    if (!selectedStudentForDiagnostic || !mentoringActor) return;
    const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
    const contextKey = mentoringContext.current;
    try {
      const today = getLocalDateInputValue();
      const draftStore = JSON.parse(localStorage.getItem('navi_mentoring_session_drafts') || '{}');
      const storedDraft = draftStore[contextKey];
      const scopedDraft = storedDraft?.checkInId === (selectedStudentForDiagnostic.checkInId || '') ? storedDraft : null;
      const candidateSession = latestSessionsByMatricula.get(matricula);
      const latestSaved = selectedStudentForDiagnostic.checkInSessionId
        ? (getSessionId(candidateSession) === selectedStudentForDiagnostic.checkInSessionId ? candidateSession : null)
        : (selectedStudentForDiagnostic.checkInId ? null : candidateSession);
      const latestSavedDate = getSessionDate(latestSaved);
      const legacyDraft = draftStore[matricula];
      const persistedDraft = scopedDraft
        ? (!scopedDraft._confirmed || (getSessionDate(scopedDraft) === today
          && (!latestSaved || getSessionId(latestSaved) === getSessionId(scopedDraft))) ? scopedDraft : null)
        : (!legacyDraft?._contextKey || legacyDraft._contextKey === contextKey ? legacyDraft : null);
      const pending = readPendingMentoringDraft(localStorage, contextKey);
      const canResumeLatestSession = latestSaved && latestSavedDate === today;
      const baseRecord = pending || persistedDraft || (canResumeLatestSession || (latestSaved && !latestSavedDate) ? latestSaved : null);
      const baseDraft = baseRecord ? normalizeMentoringSession(baseRecord) : null;
      setMentoringSessionDraft({
        checkInId: selectedStudentForDiagnostic.checkInId || '',
        sessionId: getSessionId(baseDraft), fechaSesion: baseDraft ? baseDraft.fechaSesion : today,
        notasMentor: baseDraft?.notasMentor ?? '', documentadoCrm: normalizeCrmDocumentation(baseDraft?.documentadoCrm),
        timestampCreacion: baseDraft?.timestampCreacion || '', _contextKey: contextKey,
        _confirmed: !pending && (persistedDraft ? persistedDraft._confirmed === true : Boolean(baseDraft)),
      });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible guardar la sesión: ${err.message}` });
    }
  }, [selectedStudentForDiagnostic, latestSessionsByMatricula, mentoringActor]);

  useEffect(() => {
    if (!selectedStudentForDiagnostic || mentoringSessionDraft._contextKey !== mentoringContext.current) return;
    try {
      const draftStore = JSON.parse(localStorage.getItem('navi_mentoring_session_drafts') || '{}');
      draftStore[mentoringContext.current] = mentoringSessionDraft;
      localStorage.setItem('navi_mentoring_session_drafts', JSON.stringify(draftStore));
      updatePendingMentoringDraft(localStorage, mentoringContext.current, mentoringSessionDraft);
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible guardar la sesión: ${err.message}` });
    }
  }, [mentoringSessionDraft, selectedStudentForDiagnostic]);

  const StatusBadge = ({ student }) => {
    const { status } = student;
    
    // Logic for No-Show according to methodology (Test Done but Check-in No)
    if (student.hasResponse && !student.hasSession) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200 flex items-center w-fit">
          <ShieldAlert className="w-3 h-3 mr-1" /> Sin sesión · plan pendiente
        </span>
      );
    }

    const styles = {
      'Pendiente': 'bg-gray-100 text-gray-800 border-gray-200',
      'Test Completado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Sesión Iniciada': 'bg-violet-100 text-violet-800 border-violet-200',
      'Metas Seleccionadas': 'bg-green-100 text-green-800 border-green-200',
    };
    const labels = {
      'Pendiente': 'Pendiente',
      'Test Completado': 'Test completo',
      'Sesión Iniciada': 'Sesión iniciada',
      'Metas Seleccionadas': 'Plan definido',
    };

    return (
      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', styles[status] || styles['Pendiente'])}>
        {labels[status] || labels['Pendiente']}
      </span>
    );
  };

  const CrmBadge = ({ student }) => {
    const matricula = String(student?.matricula || '').trim().toUpperCase();
    const latestSession = latestSessionsByMatricula.get(matricula);
    const crmStatus = getCrmStatus(student, latestSession);
    if (!crmStatus) return null;
    const documentado = crmStatus.documented;

    return (
      <span
        className={cn(
          'px-2.5 py-1 rounded-full text-[11px] font-medium border',
          documentado
            ? 'bg-[rgba(15,76,129,0.08)] text-[var(--navy-700)] border-[rgba(15,76,129,0.12)]'
            : 'bg-[rgba(210,106,92,0.08)] text-[var(--coral-500)] border-[rgba(210,106,92,0.16)]'
        )}
      >
        {crmStatus.label}
      </span>
    );
  };

  const handleFetchFromSheets = async () => {
    setIsSyncing(true);
    try {
      const data = await workspaceClient.getMentorDashboard();
      if (data.students) setStudents(data.students.map((student, index) => normalizeStudent(student, index)));
      if (data.mentors) setMentors(data.mentors.map(normalizeMentor));
      if (data.emailingProfiles) setEmailingProfiles(data.emailingProfiles);
      if (data.responses) setResponses(data.responses);
      if (data.goalSelections) setGoalSelections(data.goalSelections);
      if (data.sessions) setSessions(data.sessions);
      const now = new Date().toISOString();
      localStorage.setItem('navi_last_sync_at', now);
      setLastSyncAt(now);
      setFeedback({ tone: 'success', message: 'Directorio actualizado desde Google Sheets.' });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible sincronizar: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const executeDemoReset = async (matricula) => {
    setIsResettingDemo(true);
    try {
      const result = await apiClient.post('resetDemoStudentJourney', {
        matricula,
        confirmReset: true,
      });
      setResponses((current) => current.filter((item) => String(item.matricula || '').trim().toUpperCase() !== matricula));
      setGoalSelections((current) => current.filter((item) => String(item.matricula || '').trim().toUpperCase() !== matricula));
      setStudents((current) => current.map((student) => (
        String(student.matricula || '').trim().toUpperCase() === matricula
          ? { ...student, status: 'Pendiente' }
          : student
      )));

      if (String(localStorage.getItem('navi_matricula') || '').trim().toUpperCase() === matricula) {
        [
          'navi_diagnostic_payload',
          'navi_diagnostic_answers',
          'navi_diagnostic_stage',
          'navi_pending_response_id',
          'navi_goal_selection_warning',
        ].forEach((key) => localStorage.removeItem(key));
      }

      const deletedResponses = Number(result?.deletedResponses || 0);
      const deletedGoals = Number(result?.deletedGoalSelections || 0);
      setFeedback({
        tone: 'success',
        message: `${matricula} está lista para otra demostración. Se retiraron ${deletedResponses} respuesta${deletedResponses === 1 ? '' : 's'} y ${deletedGoals} selección${deletedGoals === 1 ? '' : 'es'} de metas.`,
      });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible restablecer la demostración: ${err.message}` });
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleDemoReset = () => {
    setConfirmation({
      type: 'resetDemo',
      matricula: demoResetMatricula,
      title: `Restablecer ${demoResetMatricula}`,
      message: 'Se eliminarán únicamente sus respuestas del test y selecciones de metas. Se conservarán la matrícula, preferencias, check-ins y sesiones.',
    });
  };

  const handleLoadOperationalTelemetry = async () => {
    setIsLoadingTelemetry(true);
    try {
      const result = await workspaceClient.getOperationalTelemetry({ hours: 24 });
      setOperationalTelemetry(result);
      setFeedback({
        tone: 'success',
        message: `Telemetría actualizada bajo demanda: ${result.summaries?.length || 0} ${result.summaries?.length === 1 ? 'operación' : 'operaciones'} con muestras en las últimas 24 horas.`,
      });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible consultar la telemetría: ${err.message}` });
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  const executeDirectoryPreview = async () => {
    setIsPreviewingDirectory(true);
    setDirectoryPreview(null);
    setDirectoryPublication(null);
    try {
      const result = await apiClient.post('previewManagedDirectoryImport', {});
      setDirectoryPreview(result);
      setFeedback({
        tone: result.errorCount === 0 ? 'success' : 'error',
        message: result.errorCount === 0
          ? `Vista previa lista: ${result.summary?.eligible || 0} estudiantes y ${result.mentors?.length || 0} mentores, sin publicación.`
          : `La vista previa encontró ${result.errorCount} errores bloqueantes.`,
      });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible generar la vista previa del padrón: ${err.message}` });
    } finally {
      setIsPreviewingDirectory(false);
    }
  };

  const executeDirectoryPublication = async (previewFingerprint) => {
    setIsPublishingDirectory(true);
    try {
      const result = await apiClient.post('publishManagedDirectoryImport', {
        confirmPublish: true,
        previewFingerprint,
      });
      setDirectoryPublication(result);
      await handleFetchFromSheets();
      setFeedback({ tone: 'success', message: `Padrón publicado: ${result.studentCount} estudiantes en la versión ${result.versionId}.` });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible publicar el padrón: ${err.message}` });
    } finally {
      setIsPublishingDirectory(false);
    }
  };

  const handleDirectoryPublication = () => {
    if (!directoryPreview?.readyForPublication || !directoryPreview.fingerprint) {
      setFeedback({ tone: 'error', message: 'La publicación sigue bloqueada en Config o la vista previa requiere correcciones.' });
      return;
    }
    setConfirmation({
      type: 'publishManagedDirectory',
      previewFingerprint: directoryPreview.fingerprint,
      title: 'Publicar la versión revisada del padrón',
      message: `Se activará la huella revisada con ${directoryPreview.summary?.eligible || 0} estudiantes. Las respuestas, metas, sesiones, check-ins, preferencias y matrículas demo permanecerán intactas.`,
    });
  };

  const handleCopyCheckInLink = async () => {
    try {
      await navigator.clipboard.writeText(checkInLink);
      setFeedback({ tone: 'success', message: 'El enlace de check-in se copió al portapapeles.' });
    } catch {
      setFeedback({ tone: 'error', message: 'No fue posible copiar el enlace. Intenta copiarlo manualmente.' });
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    const selectable = paginatedStudents.filter((student) => student.email);
    const allSelected = selectable.length > 0 && selectable.every((student) => selectedStudentIds.has(student.id));
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      selectable.forEach((student) => {
        if (allSelected) next.delete(student.id);
        else next.add(student.id);
      });
      return next;
    });
  };

  const handleCopySelectedEmails = async () => {
    if (!selectedEmails.length) {
      setFeedback({ tone: 'error', message: 'Selecciona al menos un estudiante con correo disponible.' });
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedEmails.join('; '));
      setFeedback({ tone: 'success', message: `${selectedEmails.length} correo${selectedEmails.length === 1 ? '' : 's'} copiado${selectedEmails.length === 1 ? '' : 's'} para usar en CCO.` });
    } catch {
      setFeedback({ tone: 'error', message: 'No fue posible copiar los correos.' });
    }
  };

  const handleCopyOutlookMessage = async () => {
    try {
      await navigator.clipboard.writeText(OUTLOOK_MESSAGE);
      setFeedback({ tone: 'success', message: 'Mensaje base copiado. Puedes editarlo antes de enviarlo.' });
    } catch {
      setFeedback({ tone: 'error', message: 'No fue posible copiar el mensaje base.' });
    }
  };

  const handleOpenOutlook = () => {
    if (!selectedEmails.length) {
      setFeedback({ tone: 'error', message: 'Selecciona al menos un estudiante con correo disponible.' });
      return;
    }
    window.open(buildOutlookComposeUrl({ recipients: selectedEmails }), '_blank', 'noopener,noreferrer');
    setFeedback({ tone: 'success', message: 'Abrimos un borrador en Outlook. Revisa destinatarios y contenido antes de enviarlo.' });
  };

  const handleCopyMentoringSummary = async () => {
    if (!selectedStudentForDiagnostic) return;
    const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
    const diag = latestResponsesByMatricula.get(matricula);
    const goalSelection = latestGoalSelectionsByMatricula.get(matricula);
    const sourceReview = getCrmSourceReview(selectedStudentForDiagnostic, diag, goalSelection);
    if (!sourceReview.canCopy) {
      setFeedback({ tone: 'error', message: sourceReview.message });
      return;
    }
    const summary = buildMentoringSummary(selectedStudentForDiagnostic, diag, goalSelection, mentoringSessionDraft);

    try {
      await navigator.clipboard.writeText(summary);
      setFeedback({ tone: 'success', message: 'Resumen de mentoría copiado para CRM.' });
    } catch {
      setFeedback({ tone: 'error', message: 'No fue posible copiar el resumen. Intenta de nuevo.' });
    }
  };

  const handleNewEncounter = async () => {
    if (startingEncounter || !selectedStudentForDiagnostic) return;
    const student = selectedStudentForDiagnostic;
    if (!window.confirm('Se registrará una nueva llegada para este estudiante. El encuentro y sus acuerdos anteriores se conservarán.')) return;
    setStartingEncounter(true);
    try {
      if (newEncounterRequest.current?.matricula !== student.matricula) newEncounterRequest.current = { matricula: student.matricula, requestId: crypto.randomUUID() };
      const registration = await apiClient.post('startNewMentoringEncounter', newEncounterRequest.current);
      const next = { ...student, encounterManaged: true, checkInId: registration.checkInId, checkInSessionId: '', checkInTimestamp: registration.timestamp,
        agenciaCheckIn: '', checkIn: 'Si', hasCheckIn: true, hasSession: true, hasGoalSelection: false, status: 'Sesión Iniciada' };
      setStudents(current => current.map(item => item.matricula === student.matricula ? next : item));
      setSelectedStudentForDiagnostic(next);
      setGoalSelections(current => current.filter(item => item.matricula !== student.matricula));
      newEncounterRequest.current = null;
      setFeedback({ tone: 'success', message: 'Nueva sesión preparada. El estudiante puede confirmar su matrícula para continuar.' });
    } catch (error) { setFeedback({ tone: 'error', message: error.message }); }
    finally { setStartingEncounter(false); }
  };

  const handleSaveMentoringSession = async () => {
    if (!selectedStudentForDiagnostic || mentoringSaveBusy.current) return;
    mentoringSaveBusy.current = true;
    const contextKey = mentoringContext.current;
    const view = mentoringView.current;
    setIsSavingMentoringSession(true);
    try {
      if (!mentoringActor || mentoringSessionDraft._contextKey !== contextKey || !normalizeSessionCalendarDate(mentoringSessionDraft.fechaSesion)) throw new Error('No pudimos completar la solicitud.');
      const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
      const documentadoCrm = normalizeCrmDocumentation(mentoringSessionDraft.documentadoCrm);
      const diag = latestResponsesByMatricula.get(matricula);
      const goalSelection = latestGoalSelectionsByMatricula.get(matricula);
      const { key: attemptKey, sessionId, timestampCreacion } = getMentoringAttempt(
        mentoringAttempts.current, contextKey, mentoringSessionDraft, matricula);
      const resolvedCommunity = selectedStudentForDiagnostic.community || mentorByNickname.get(selectedStudentForDiagnostic.mentor)?.community || '';
      const periodo = getAcademicPeriod(mentoringSessionDraft.fechaSesion);
      const result = await apiClient.post('saveMentoringSession', {
        sessionId,
        matricula,
        nombre: selectedStudentForDiagnostic.preferredName || selectedStudentForDiagnostic.name || '',
        mentor: selectedStudentForDiagnostic.mentor || '',
        comunidad: resolvedCommunity,
        periodo,
        fechaSesion: mentoringSessionDraft.fechaSesion,
        etapa: diag?.etapa || '',
        areasPrioritarias: diag?.areasprioritarias || '',
        pretestResumen: selectedStudentForDiagnostic.agenciaCheckIn || '',
        checkInId: selectedStudentForDiagnostic.checkInId || '',
        metaPrioritaria: goalSelection?.metaprioritaria || '',
        metaComplementaria: goalSelection?.metacomplementaria || '',
        horizonte: goalSelection?.tiempo || '',
        obstaculo: goalSelection?.obstaculo || '',
        estrategia: goalSelection?.plan || '',
        notasMentor: mentoringSessionDraft.notasMentor,
        estadoDocumentacion: documentadoCrm ? 'Documentado' : 'Borrador',
        documentadoCrm,
        timestampCreacion,
      });

      const acknowledgement = assertMentoringAcknowledgement(result, sessionId);
      // A valid acknowledgement confirms the sent snapshot, not subsequent edits.
      // Keep the attempt for an explicit save if this visit or draft has changed.
      if (mentoringContext.current !== contextKey || mentoringView.current !== view
        || mentoringDraft.current !== mentoringSessionDraft) return;
      const savedSessionId = acknowledgement.sessionId;
      const savedTimestampCreacion = String(
        result?.timestampCreacion ||
        result?.data?.timestampCreacion ||
        timestampCreacion
      ).trim() || timestampCreacion;
      const savedTimestampActualizado = String(
        result?.timestampActualizado ||
        result?.data?.timestampActualizado ||
        new Date().toISOString()
      ).trim();

      const nextEntry = {
        sessionId: savedSessionId,
        matricula,
        nombre: selectedStudentForDiagnostic.preferredName || selectedStudentForDiagnostic.name || '',
        mentor: selectedStudentForDiagnostic.mentor || '',
        comunidad: resolvedCommunity,
        periodo,
        fechaSesion: mentoringSessionDraft.fechaSesion,
        etapa: diag?.etapa || '',
        areasPrioritarias: diag?.areasprioritarias || '',
        pretestResumen: selectedStudentForDiagnostic.agenciaCheckIn || '',
        checkInId: selectedStudentForDiagnostic.checkInId || '',
        metaPrioritaria: goalSelection?.metaprioritaria || '',
        metaComplementaria: goalSelection?.metacomplementaria || '',
        horizonte: goalSelection?.tiempo || '',
        obstaculo: goalSelection?.obstaculo || '',
        estrategia: goalSelection?.plan || '',
        notasMentor: mentoringSessionDraft.notasMentor,
        estadoDocumentacion: documentadoCrm ? 'Documentado' : 'Borrador',
        documentadoCrm,
        timestampCreacion: savedTimestampCreacion,
        timestampActualizado: savedTimestampActualizado,
      };
      if (selectedStudentForDiagnostic.checkInId) {
        setStudents(current => current.map(student => student.matricula === matricula ? { ...student, checkInSessionId: savedSessionId } : student));
        
      }
      setSessions((current) => {
        const remaining = current.filter((item) => getSessionId(item) !== savedSessionId);
        return [nextEntry, ...remaining];
      });

      const draftStore = JSON.parse(localStorage.getItem('navi_mentoring_session_drafts') || '{}');
      draftStore[contextKey] = { ...mentoringSessionDraft, sessionId: savedSessionId, checkInId: selectedStudentForDiagnostic.checkInId || '', timestampCreacion: savedTimestampCreacion, _contextKey: contextKey, _confirmed: true };
      localStorage.setItem('navi_mentoring_session_drafts', JSON.stringify(draftStore));
      clearMentoringAttempt(localStorage, contextKey, attemptKey, savedSessionId);
      mentoringAttempts.current.delete(attemptKey);
      setMentoringSessionDraft({
        sessionId: savedSessionId,
        checkInId: selectedStudentForDiagnostic.checkInId || '',
        fechaSesion: mentoringSessionDraft.fechaSesion,
        notasMentor: mentoringSessionDraft.notasMentor,
        documentadoCrm,
        timestampCreacion: savedTimestampCreacion, _contextKey: contextKey, _confirmed: true,
      });
      setSessionSaveFeedback({
        tone: result?.source === 'fallback' ? 'warning' : 'success',
        message: result?.source === 'fallback'
          ? 'La sesión se guardó localmente. Revisa la conexión antes de asumir que quedó registrada.'
          : `La sesión quedó guardada en el registro${savedTimestampActualizado ? ` · ${formatLocalTimestamp(savedTimestampActualizado)}` : ''}.`,
      });

      const warning = result?.warning ? ` ${result.warning}` : '';
      setFeedback({ tone: result?.source === 'fallback' ? 'error' : 'success', message: `Sesión guardada.${warning}` });
    } catch (err) {
      if (mentoringContext.current === contextKey && mentoringView.current === view
        && mentoringDraft.current === mentoringSessionDraft) {
        setFeedback({ tone: 'error', message: `No fue posible guardar la sesión: ${err.message}` });
        setSessionSaveFeedback({ tone: 'error', message: `No fue posible guardar la sesión: ${err.message}` });
      }
    } finally {
      mentoringSaveBusy.current = false;
      setIsSavingMentoringSession(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    if (confirmation.type === 'resetDemo') {
      const matricula = confirmation.matricula;
      setConfirmation(null);
      await executeDemoReset(matricula);
      return;
    }
    if (confirmation.type === 'publishManagedDirectory') {
      const previewFingerprint = confirmation.previewFingerprint;
      setConfirmation(null);
      await executeDirectoryPublication(previewFingerprint);
    }
  };

  const handleWorkspaceAuthenticated = useCallback((user) => {
    const normalized = normalizeUser(user);
    clearDashboardData();
    setAuthUser(normalized);
    setFeedback({ tone: 'success', message: `Acceso habilitado para ${normalized.name}.` });
  }, [clearDashboardData]);

  const handleWorkspaceError = useCallback((error) => {
    const message = error.statusCode >= 500
      ? 'No pudimos validar tu acceso. Intenta nuevamente en unos minutos.'
      : error.message;
    setFeedback({ tone: 'error', message });
  }, []);

  const handleLogout = async () => {
    try {
      await workspaceClient.logout();
    } catch (error) {
      console.warn('No se pudo cerrar la sesión remota:', error);
    }
    clearDashboardData();
    setAuthUser(null);
    setUserRole('');
    setActiveTab('dashboard');
    setFeedback(null);
    setConfirmation(null);
  };

  const currentTabStyle = "border-[var(--coral-500)] text-[var(--navy-600)] font-semibold";
  const defaultTabStyle = "border-transparent text-[var(--ink-700)] hover:text-[var(--ink-900)] hover:border-[rgba(15,76,129,0.18)] font-medium";

  if (!authUser && isCheckingWorkspaceSession) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-[var(--ink-700)]">
        Verificando tu sesión institucional…
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="mx-auto max-w-3xl py-10 animate-in fade-in duration-500">
        <Card className="shadow-sm border-[rgba(15,76,129,0.12)]">
          <CardContent className="p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy-600)]">Acceso institucional</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)]">Vista de mentoría</h1>
            <p className="mt-3 max-w-2xl text-[var(--ink-700)]">
              Inicia sesión con tu correo del Tec para entrar a la vista de mentoría.
            </p>
            {feedback ? (
              <div className={cn(
                "mt-6 rounded-2xl border px-4 py-3 text-sm",
                feedback.tone === 'success'
                  ? "border-[rgba(15,76,129,0.14)] bg-[rgba(15,76,129,0.06)] text-[var(--navy-700)]"
                  : "border-[rgba(210,106,92,0.16)] bg-[rgba(210,106,92,0.08)] text-[var(--ink-900)]"
              )}>
                {feedback.message}
              </div>
            ) : null}
            <div className="mt-8 rounded-2xl border border-[rgba(15,76,129,0.12)] bg-white px-5 py-5">
              <GoogleWorkspaceLogin
                onAuthenticated={handleWorkspaceAuthenticated}
                onError={handleWorkspaceError}
              />
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="clarity-admin mx-auto max-w-6xl py-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] flex items-center">
            {isAdmin ? 'Panel de mentoría' : 'Mis estudiantes'}
          </h1>
          <p className="mt-2 text-[var(--ink-700)]">
            {isAdmin
              ? (adminViewScope === 'own'
                  ? 'Vista de mentoría de tu cartera. Conservas acceso a la coordinación global.'
                  : 'Vista global del padrón activo. Cada mentor ve únicamente a sus estudiantes.')
              : `Seguimiento de ${currentMentor?.community || 'tu comunidad'} y estado de tus estudiantes.`}
          </p>
          {isAdmin && authUser?.mentorId ? (
            <div
              className="mt-4 inline-flex rounded-xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.04)] p-1"
              role="group"
              aria-label="Alcance del directorio"
            >
              <button
                type="button"
                aria-pressed={adminViewScope === 'own'}
                onClick={() => setAdminViewScope('own')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  adminViewScope === 'own'
                    ? 'bg-white text-[var(--navy-700)] shadow-sm'
                    : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
                )}
              >
                Mi cartera
              </button>
              <button
                type="button"
                aria-pressed={adminViewScope === 'all'}
                onClick={() => setAdminViewScope('all')}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  adminViewScope === 'all'
                    ? 'bg-white text-[var(--navy-700)] shadow-sm'
                    : 'text-[var(--ink-600)] hover:text-[var(--ink-900)]'
                )}
              >
                Padrón completo
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          {permissions.canPullSheets && lastSyncLabel ? (
            <p className="text-xs text-[var(--ink-600)]">
              Última actualización: {lastSyncLabel}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleFetchFromSheets} isLoading={isSyncing} disabled={!permissions.canPullSheets}>
              <RefreshCw className="w-4 h-4 mr-2" /> Actualizar directorio
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className={cn(
          "mb-6 rounded-2xl border px-4 py-3 text-sm",
          feedback.tone === 'success'
            ? "border-[rgba(15,76,129,0.14)] bg-[rgba(15,76,129,0.06)] text-[var(--navy-700)]"
            : "border-[rgba(210,106,92,0.16)] bg-[rgba(210,106,92,0.08)] text-[var(--ink-900)]"
        )}>
          <div className="flex items-start justify-between gap-4">
            <p>{feedback.message}</p>
            <button
              onClick={() => setFeedback(null)}
              className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] opacity-70 hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {confirmation ? (
        <div className="mb-6 rounded-2xl border border-[rgba(210,106,92,0.16)] bg-[rgba(210,106,92,0.08)] px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-900)]">{confirmation.title}</p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">{confirmation.message}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmation(null)}>Cancelar</Button>
              <Button size="sm" onClick={handleConfirmAction}>Confirmar</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      {isAdmin ? (
      <div className="border-b border-[rgba(15,76,129,0.12)] mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn("whitespace-nowrap flex items-center py-4 px-1 border-b-2 text-sm transition-colors", activeTab === 'dashboard' ? currentTabStyle : defaultTabStyle)}
          >
            Vista general
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn("whitespace-nowrap flex items-center py-4 px-1 border-b-2 text-sm transition-colors", activeTab === 'settings' ? currentTabStyle : defaultTabStyle)}
          >
            Configuración
          </button>
        </nav>
      </div>
      ) : null}

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="clarity-mentor-workspace animate-in fade-in duration-300">

          <div className="clarity-mentor-metrics grid gap-4 md:grid-cols-4 mb-8">
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-[rgba(15,76,129,0.08)] rounded-lg text-[var(--navy-500)] mr-4"><Users className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{isAdmin ? 'Estudiantes' : 'Mis estudiantes'}</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.total}</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-[rgba(210,106,92,0.12)] rounded-lg text-[var(--coral-500)] mr-4"><ShieldAlert className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sin sesión</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.noShows}</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-[rgba(15,76,129,0.08)] rounded-lg text-[var(--navy-500)] mr-4"><Activity className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Test completo</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.testRate}%</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-[rgba(15,76,129,0.08)] rounded-lg text-[var(--navy-500)] mr-4"><CheckCircle className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Metas definidas</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.metasRate}%</h4>
                    </div>
                  </CardContent>
                </Card>
          </div>

          <Card className="clarity-mentor-directory shadow-sm overflow-hidden border-gray-200">
            <div className="border-b border-gray-100 bg-gray-50/50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">Directorio de progreso</h3>
                  <p className="mt-1 text-xs text-gray-500">{filteredStudents.length} estudiantes en esta vista</p>
                </div>
                <div className="clarity-directory-controls flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <select
                    id="mentor-directory-status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-lg border border-[rgba(15,76,129,0.12)] bg-white px-3 py-2 text-sm text-[var(--ink-800)] focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]"
                    aria-label="Filtrar por estado"
                  >
                    <option value="pending">Test pendiente</option>
                    <option value="test">Test completo</option>
                    <option value="session">Sesión iniciada</option>
                    <option value="plan">Plan definido</option>
                    <option value="all">Todos</option>
                  </select>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      aria-label="Buscar matrícula, nombre o correo"
                      placeholder="Buscar matrícula, nombre o correo"
                      className="w-full rounded-lg border border-[rgba(15,76,129,0.12)] bg-white py-2 pl-9 pr-4 text-sm focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" aria-label="Restablecer filtros" title="Restablecer filtros"
                    disabled={statusFilter === 'all' && advanceFilters.length === 0}
                    onClick={() => { setStatusFilter('all'); setAdvanceFilters([]); }}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por avance">
                {[['test', 'Test completo'], ['session', 'Sesión iniciada'], ['plan', 'Plan definido']].map(([key, label]) => (
                  <Button key={key} size="sm" variant="outline" aria-pressed={advanceFilters.includes(key)}
                    className={advanceFilters.includes(key) ? 'clarity-directory-filter-active' : ''}
                    onClick={() => setAdvanceFilters((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}>
                    {advanceFilters.includes(key) ? <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" /> : null}{label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink-900)]">Contacto desde la cuenta del mentor</p>
                <p className="mt-0.5 text-xs text-[var(--ink-600)]">
                  {selectedEmails.length ? `${selectedEmails.length} destinatario${selectedEmails.length === 1 ? '' : 's'} seleccionado${selectedEmails.length === 1 ? '' : 's'}` : 'Selecciona estudiantes con correo disponible.'}
                </p>
                {selectedStudents.length ? (
                  <div className="clarity-directory-recipients mt-2 flex flex-wrap gap-2" role="group" aria-label="Destinatarios seleccionados">
                    {selectedStudents.map((student) => (
                      <span key={student.id} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-[var(--mist)] pl-3 text-xs text-[var(--ink-900)]">
                        <span className="min-w-0 break-words">{student.preferredName || student.name} · {student.matricula}</span>
                        <button className="flex h-11 w-11 shrink-0 items-center justify-center" aria-label={`Quitar selección de ${student.preferredName || student.name}`}
                          onClick={() => toggleStudentSelection(student.id)}><X className="h-4 w-4" aria-hidden="true" /></button>
                      </span>
                    ))}
                    <Button variant="outline" size="icon" aria-label="Quitar toda la selección" title="Quitar toda la selección" onClick={() => setSelectedStudentIds(new Set())}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleCopySelectedEmails} disabled={!selectedEmails.length}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar correos
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyOutlookMessage}>
                  <Mail className="mr-2 h-4 w-4" /> Copiar mensaje
                </Button>
                <Button size="sm" onClick={handleOpenOutlook} disabled={!selectedEmails.length}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Abrir Outlook
                </Button>
              </div>
            </div>
            <div className="clarity-directory-table overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="w-12 px-4 py-4 font-medium">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleVisibleSelection}
                        disabled={!selectableVisibleStudents.length}
                        aria-label="Seleccionar estudiantes visibles con correo"
                        className="h-4 w-4 rounded border-gray-300 text-[var(--navy-600)]"
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">Matrícula</th>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Asistió a sesión</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            disabled={!student.email}
                            aria-label={student.email ? `Seleccionar a ${student.preferredName || student.name}` : `${student.preferredName || student.name} no tiene correo disponible`}
                            className="h-4 w-4 rounded border-gray-300 text-[var(--navy-600)]"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{student.matricula}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {student.preferredName || student.name}
                            </span>
                            {student.preferredName && student.preferredName !== student.name ? (
                              <span className="text-xs text-gray-500">{student.name}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-bold",
                              student.checkIn === 'Si' ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                            )}>
                              {student.checkIn === 'Si' ? 'SI' : 'NO'}
                            </span>
                            {student.agenciaCheckIn ? (
                              <span className="text-[11px] font-medium text-[var(--ink-700)] bg-[rgba(15,76,129,0.06)] px-2 py-0.5 rounded-full mt-1">
                                {student.agenciaCheckIn.split('·')[0].trim()}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2 items-start">
                            <StatusBadge student={student} />
                            <CrmBadge student={student} />
                            {(student.hasResponse || student.hasSession || student.hasGoalSelection) && (
                              <Button size="sm"
                                onClick={() => {
                                  setSessionSaveFeedback(null);
                                  setSelectedStudentForDiagnostic(student);
                                }}
                              >
                                Abrir sesión
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                        No se encontraron estudiantes con estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="clarity-directory-list">
              <label className="clarity-directory-select-all">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection}
                  disabled={!selectableVisibleStudents.length} aria-label="Seleccionar estudiantes visibles con correo" />
                <span>Seleccionar estudiantes visibles con correo</span>
              </label>
              {paginatedStudents.length ? paginatedStudents.map((student) => (
                <article key={student.id} className="clarity-directory-student">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-lg font-semibold text-[var(--ink-900)]">{student.preferredName || student.name}</h4>
                      {student.preferredName && student.preferredName !== student.name ? <p className="text-xs text-[var(--ink-600)]">{student.name}</p> : null}
                      <p className="mt-1 text-sm text-[var(--ink-700)]">{student.matricula}</p>
                    </div>
                    <label className="flex h-11 w-11 shrink-0 items-center justify-center">
                      <input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => toggleStudentSelection(student.id)}
                        disabled={!student.email} aria-label={student.email ? `Seleccionar a ${student.preferredName || student.name}` : `${student.preferredName || student.name} no tiene correo disponible`} />
                    </label>
                  </div>
                  <p className="my-3 text-sm text-[var(--ink-700)]">Asistió a sesión · {student.checkIn === 'Si' ? 'SI' : 'NO'}</p>
                  {student.agenciaCheckIn ? <p className="mb-3 text-xs text-[var(--ink-700)]">{student.agenciaCheckIn.split('·')[0].trim()}</p> : null}
                  <div className="flex flex-wrap gap-2"><StatusBadge student={student} /><CrmBadge student={student} /></div>
                  {(student.hasResponse || student.hasSession || student.hasGoalSelection) ? (
                    <Button className="mt-4 w-full" onClick={() => { setSessionSaveFeedback(null); setSelectedStudentForDiagnostic(student); }}>Abrir sesión</Button>
                  ) : null}
                </article>
              )) : <p className="px-4 py-8 text-center text-sm text-[var(--ink-700)]">No se encontraron estudiantes con estos filtros.</p>}
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Mostrando {directoryRangeStart}–{directoryRangeEnd} de {filteredStudents.length}
              </p>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => setDirectoryPage((page) => Math.max(1, page - 1))} disabled={directoryPage === 1}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <span className="text-xs font-semibold text-[var(--ink-700)]">Página {directoryPage} de {directoryTotalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setDirectoryPage((page) => Math.min(directoryTotalPages, page + 1))} disabled={directoryPage === directoryTotalPages}>
                  Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {isMentorView || isAdmin ? (
            <div className="clarity-mentor-access mb-6 rounded-2xl border border-[rgba(15,76,129,0.12)] bg-white px-5 py-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy-600)]">
                    {isMentorView ? `Mentoría · ${currentMentor?.community || 'Comunidad'}` : 'Operación de mentoría'}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--ink-900)]">
                    {isMentorView ? (currentMentor?.name || 'Vista de mentor') : 'Seguimiento y check-in'}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Consulta el avance del directorio o comparte el acceso de check-in durante una sesión presencial.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleCopyCheckInLink}>Copiar check-in</Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(checkInLink, '_blank', 'noopener,noreferrer')}>Abrir check-in</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCheckInQr((current) => !current)}>
                    {showCheckInQr ? 'Ocultar QR' : 'Mostrar QR'}
                  </Button>
                </div>
              </div>
              {showCheckInQr ? (
                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.03)] p-4 sm:flex-row sm:items-center">
                  <QRCodeSVG value={checkInLink} size={144} includeMargin />
                  <div>
                    <p className="font-mono text-xs text-[var(--ink-800)] break-all">{checkInLink}</p>
                    <p className="mt-2 text-xs text-[var(--ink-700)]">Muestra este código para que el estudiante registre su llegada.</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}


        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl animate-in fade-in duration-300 space-y-6">
          <div className="rounded-2xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.04)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy-600)]">Solo administración</p>
            <p className="mt-2 text-sm text-[var(--ink-700)]">
              Aquí se mantienen solo las conexiones y parámetros operativos mínimos del sistema. El directorio, staff y metas se administran directamente en Sheets.
            </p>
          </div>

          <Card className="shadow-sm border-[rgba(15,76,129,0.16)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[rgba(15,76,129,0.08)] p-3 text-[var(--navy-600)]">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--ink-900)]">Salud operacional</h2>
                      <p className="mt-1 text-sm text-[var(--ink-700)]">
                        Consulta manual de las últimas 24 horas. No ejecuta sondeos, sincronizaciones ni reintentos en segundo plano.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleLoadOperationalTelemetry} isLoading={isLoadingTelemetry}>
                      Consultar métricas
                    </Button>
                  </div>

                  {operationalTelemetry ? (
                    <div className="mt-5 space-y-4">
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--ink-600)]">
                        <span>Ventana: {operationalTelemetry.windowHours} h</span>
                        <span>Retención máxima: {operationalTelemetry.retentionHours} h</span>
                        <span>Muestreo de éxitos normales: {operationalTelemetry.successSampling}</span>
                      </div>
                      {operationalTelemetry.summaries?.length ? (
                        <div className="overflow-x-auto rounded-xl border border-[rgba(15,76,129,0.1)]">
                          <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-[rgba(15,76,129,0.04)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--ink-600)]">
                              <tr>
                                <th className="px-4 py-3">Operación</th>
                                <th className="px-4 py-3">Muestras</th>
                                <th className="px-4 py-3">Errores</th>
                                <th className="px-4 py-3">p50</th>
                                <th className="px-4 py-3">p95</th>
                                <th className="px-4 py-3">Máximo</th>
                                <th className="px-4 py-3">Espera lock</th>
                                <th className="px-4 py-3">Etapa dominante</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {operationalTelemetry.summaries.map((summary) => (
                                <tr key={summary.action}>
                                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-[var(--ink-900)]">{summary.action}</td>
                                  <td className="px-4 py-3 text-[var(--ink-700)]">{summary.sampleCount}</td>
                                  <td className={cn("px-4 py-3 font-semibold", summary.errorCount ? "text-red-700" : "text-[var(--ink-700)]")}>{summary.errorCount}</td>
                                  <td className="px-4 py-3 text-[var(--ink-700)]">{formatDuration(summary.p50Ms)}</td>
                                  <td className="px-4 py-3 text-[var(--ink-700)]">{formatDuration(summary.p95Ms)}</td>
                                  <td className="px-4 py-3 text-[var(--ink-700)]">{formatDuration(summary.maxMs)}</td>
                                  <td className="px-4 py-3 text-[var(--ink-700)]">{formatDuration(summary.averageLockWaitMs)}</td>
                                  <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-700)]">
                                    {summary.dominantStage
                                      ? `${summary.dominantStage} · ${formatDuration(summary.dominantStageTotalMs)}`
                                      : 'Sin desglose'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="rounded-xl border border-[rgba(15,76,129,0.1)] bg-[rgba(15,76,129,0.04)] px-4 py-3 text-sm text-[var(--ink-700)]">
                          No hay muestras dentro de esta ventana. Esto no inicia una recolección adicional.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[rgba(210,106,92,0.18)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[rgba(210,106,92,0.1)] p-3 text-[var(--coral-600)]">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Reiniciar una demostración</h2>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Deja una matrícula demo lista para repetir el test. No elimina sesiones, check-ins, preferencias ni la identidad del estudiante.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label htmlFor="demo-reset-matricula" className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-700)]">
                        Matrícula demo
                      </label>
                      <select
                        id="demo-reset-matricula"
                        value={demoResetMatricula}
                        onChange={(event) => setDemoResetMatricula(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:ring-brand-500"
                      >
                        {DEMO_STUDENT_MATRICULAS.map((matricula) => (
                          <option key={matricula} value={matricula}>{matricula}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleDemoReset} isLoading={isResettingDemo}>
                      Restablecer demo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="shadow-sm border-[rgba(15,76,129,0.16)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[rgba(15,76,129,0.08)] p-3 text-[var(--navy-600)]">
                  <Users className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Administrar padrón</h2>
                  <p className="mt-1 text-sm text-[var(--ink-700)]">
                    Lee las fuentes declaradas en Config y toma de Staff los mentores activos con MentorId. La vista previa valida, calcula diferencias y no modifica datos.
                  </p>
                  <Button className="mt-5" onClick={executeDirectoryPreview} isLoading={isPreviewingDirectory}>
                    Generar vista previa
                  </Button>
                  {directoryPreview ? (
                    <div className="mt-5 rounded-xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.04)] p-4 text-sm text-[var(--ink-700)]">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <p><span className="block text-xs font-bold uppercase tracking-wider">Elegibles</span><span className="text-lg font-bold text-[var(--ink-900)]">{directoryPreview.summary?.eligible ?? 0}</span></p>
                        <p><span className="block text-xs font-bold uppercase tracking-wider">Mentores</span><span className="text-lg font-bold text-[var(--ink-900)]">{directoryPreview.mentors?.length ?? 0}</span></p>
                        <p><span className="block text-xs font-bold uppercase tracking-wider">Errores</span><span className="text-lg font-bold text-[var(--ink-900)]">{directoryPreview.errorCount ?? 0}</span></p>
                        <p><span className="block text-xs font-bold uppercase tracking-wider">Advertencias</span><span className="text-lg font-bold text-[var(--ink-900)]">{directoryPreview.warningCount ?? 0}</span></p>
                      </div>
                      <div className="mt-4 border-t border-[rgba(15,76,129,0.1)] pt-4">
                        <p><span className="font-semibold text-[var(--ink-900)]">Diff:</span> +{directoryPreview.diff?.added ?? 0} altas · −{directoryPreview.diff?.removed ?? 0} bajas · {directoryPreview.diff?.reassigned ?? 0} reasignaciones · {directoryPreview.diff?.renamed ?? 0} cambios de nombre</p>
                        <p className="mt-1 break-all"><span className="font-semibold text-[var(--ink-900)]">Huella:</span> {directoryPreview.fingerprint}</p>
                        <p className="mt-1"><span className="font-semibold text-[var(--ink-900)]">Fuente:</span> {directoryPreview.sourceSheetName} · {directoryPreview.sourcePeriod} → {directoryPreview.targetPeriod}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(directoryPreview.mentors || []).map((mentor) => (
                            <span key={mentor.mentorId} className="rounded-full border border-[rgba(15,76,129,0.12)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-800)]">
                              {mentor.name} · {mentor.studentCount}
                            </span>
                          ))}
                        </div>
                        {directoryPreview.errors?.length ? (
                          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">
                            <p className="font-semibold">Corrige la fuente antes de publicar</p>
                            {directoryPreview.errors.slice(0, 5).map((error) => <p key={`${error.code}-${error.entityKey}`} className="mt-1">{error.entityKey}: {error.message}</p>)}
                          </div>
                        ) : null}
                        {directoryPreview.readyForPublication ? (
                          <Button className="mt-4" onClick={handleDirectoryPublication} isLoading={isPublishingDirectory}>
                            Publicar versión revisada
                          </Button>
                        ) : (
                          <p className="mt-4 font-semibold text-[var(--ink-700)]">Publicación bloqueada en Config. La vista previa sí puede repetirse cuantas veces sea necesario.</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {directoryPublication ? (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                      <p className="font-semibold">Padrón publicado</p>
                      <p className="mt-1">{directoryPublication.studentCount} estudiantes · versión {directoryPublication.versionId}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diagnostic View Modal */}
      {selectedStudentForDiagnostic && (
        <Dialog labelledBy="mentoring-dialog-title" onClose={() => { setSessionSaveFeedback(null); setSelectedStudentForDiagnostic(null); }} className="clarity-editor-overlay fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,36,66,0.4)] backdrop-blur-sm p-4">
          <Card className="clarity-editor w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-start gap-3 mb-6 border-b border-[rgba(15,76,129,0.1)] pb-4">
                <div className="min-w-0">
                  <h3 id="mentoring-dialog-title" className="font-display text-2xl font-bold text-[var(--ink-900)]">Resultado de mentoría</h3>
                  <p className="text-[var(--ink-700)]">{selectedStudentForDiagnostic.preferredName || selectedStudentForDiagnostic.name} · {selectedStudentForDiagnostic.matricula}</p>
                </div>
                <button 
                  onClick={() => {
                    setSessionSaveFeedback(null);
                    setSelectedStudentForDiagnostic(null);
                  }} 
                  className="shrink-0 whitespace-nowrap min-h-11 px-3 py-1 bg-[rgba(15,76,129,0.06)] hover:bg-[rgba(15,76,129,0.12)] text-[var(--ink-900)] rounded-full text-sm font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
              
              {selectedStudentForDiagnostic.agenciaCheckIn ? (
                <div className="mb-6 p-4 rounded-xl border border-[rgba(210,106,92,0.2)] bg-[rgba(249,236,232,0.4)]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--coral-500)] mb-2">Termómetro emocional presencial</p>
                  <p className="font-medium text-[var(--ink-900)] text-sm">{selectedStudentForDiagnostic.agenciaCheckIn}</p>
                </div>
              ) : null}

              {(() => {
                const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
                const diag = latestResponsesByMatricula.get(matricula);
                const goalSelection = latestGoalSelectionsByMatricula.get(matricula);
                if (!diag) return <p className="text-[var(--ink-700)] bg-[rgba(15,76,129,0.04)] p-4 rounded-xl text-center">No hay resultados del test disponibles en esta consulta.</p>;
                const sourceReview = getCrmSourceReview(selectedStudentForDiagnostic, diag, goalSelection);
                const crmSummary = buildMentoringSummary(selectedStudentForDiagnostic, diag, goalSelection, mentoringSessionDraft);
                return (
                  <div className="clarity-editor-sections space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[rgba(15,76,129,0.04)] rounded-xl">
                        <p className="text-xs font-semibold uppercase text-[var(--ink-500)]">Etapa</p>
                        <p className="font-medium text-[var(--ink-900)] mt-1">{getSessionStageLabel(diag.etapa)}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--ink-900)] mb-3">Áreas por revisar según el test</h4>
                      {getSessionAreas(diag).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {getSessionAreas(diag).map(area => (
                            <span key={area} className="px-3 py-1 bg-[rgba(210,106,92,0.12)] text-[var(--coral-600)] font-semibold text-sm rounded-full">
                              {area}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--ink-700)] text-sm border-l-2 border-[var(--navy-300)] pl-3 py-1">No hay áreas prioritarias disponibles en esta consulta.</p>
                      )}
                    </div>
                    <div>
                        <h4 className="font-bold text-[var(--ink-900)] mb-3 flex items-center">
                          Métricas <span className="ml-2 px-2 py-0.5 border border-[rgba(15,76,129,0.15)] rounded text-xs text-[var(--ink-500)]">{getSessionScaleLabel(diag.etapa)}</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {['claridad_carrera', 'desempeno_academico', 'plan_practicas', 'servicio_social', 'decision_semestretec', 'certificacion_idioma'].map(cat => {
                            if (!diag[cat.replace(/_/g, '')] && !diag[cat]) return null;
                            const score = parseFloat(diag[cat.replace(/_/g, '')] || diag[cat]);
                            const isLow = score <= 2.5;
                            return (
                              <div key={cat} className={cn("p-3 rounded-xl border relative overflow-hidden", isLow ? "border-[rgba(210,106,92,0.3)] bg-[rgba(253,245,242,0.8)]" : "border-[rgba(15,76,129,0.1)] bg-white")}>
                                {isLow && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--coral-400)]" />}
                                <p className="text-[11px] font-semibold text-[var(--ink-500)] mb-1 break-words">{getSessionAreaLabel(cat)}</p>
                                <p className={cn("text-xl font-bold", isLow ? "text-[var(--coral-600)]" : "text-[var(--navy-600)]")}>
                                  {score.toFixed(1)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.04)] p-4">
                      <h4 className="font-bold text-[var(--ink-900)] mb-3">Metas registradas en faro</h4>
                      {goalSelection ? (
                        <div className="space-y-3 text-sm text-[var(--ink-800)]">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Meta prioritaria</p>
                            <p className="mt-1">{goalSelection.metaprioritaria || 'Sin registro'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Meta complementaria</p>
                            <p className="mt-1">{goalSelection.metacomplementaria || 'Sin registro'}</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Tiempo previsto</p>
                              <p className="mt-1">{goalSelection.tiempo || 'Sin registro'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Obstáculo principal</p>
                              <p className="mt-1">{goalSelection.obstaculo || 'Sin registro'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Estrategia</p>
                            <p className="mt-1 whitespace-pre-line">{goalSelection.plan || 'Sin registro'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--ink-700)]">No hay metas disponibles en esta consulta.</p>
                      )}
                    </div>

                    <div className="clarity-session-form rounded-2xl border border-[rgba(15,76,129,0.12)] bg-white p-4 space-y-4">
                      {sessionSaveFeedback ? (
                        <div
                          role={sessionSaveFeedback.tone === 'success' ? 'status' : 'alert'}
                          aria-atomic="true"
                          className={cn(
                            "rounded-2xl border px-4 py-4",
                            sessionSaveFeedback.tone === 'success'
                              ? "border-[rgba(30,120,79,0.22)] bg-[rgba(30,120,79,0.08)]"
                              : "border-[rgba(210,106,92,0.18)] bg-[rgba(210,106,92,0.08)]"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                sessionSaveFeedback.tone === 'success'
                                  ? "bg-[rgba(30,120,79,0.14)] text-[rgb(30,120,79)]"
                                  : "bg-[rgba(210,106,92,0.12)] text-[var(--coral-600)]"
                              )}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--ink-900)]">
                                {sessionSaveFeedback.tone === 'success' ? 'Sesión guardada' : 'Guardado pendiente de confirmar'}
                              </p>
                              <p className="mt-1 text-sm text-[var(--ink-800)]">
                                {sessionSaveFeedback.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <Button variant="outline" onClick={handleNewEncounter} isLoading={startingEncounter}>Iniciar una nueva sesión</Button>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Fecha de sesión</label>
                        <input
                          type="date"
                          className="mt-2 w-full rounded-xl border border-[rgba(15,76,129,0.12)] px-3 py-2 text-sm focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]"
                          value={mentoringSessionDraft.fechaSesion}
                          onChange={(e) => {
                            setSessionSaveFeedback(null);
                            setMentoringSessionDraft((current) => ({ ...current, fechaSesion: e.target.value, _confirmed: false }));
                          }}
                        />
                        <p className="mt-2 text-xs text-[var(--ink-600)]">
                          Este borrador se conserva en este equipo hasta que cierres o guardes la sesión.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Lo trabajado durante el encuentro</label>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-[rgba(15,76,129,0.12)] px-3 py-3 text-sm focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)] min-h-[120px] resize-none"
                          placeholder="Describe qué trabajaron durante el encuentro y qué acordaron. Conserva sólo lo relevante para el acompañamiento."
                          value={mentoringSessionDraft.notasMentor}
                          onChange={(e) => {
                            setSessionSaveFeedback(null);
                            setMentoringSessionDraft((current) => ({ ...current, notasMentor: e.target.value, _confirmed: false }));
                          }}
                        />
                      </div>

                      <label className="flex items-center gap-3 text-sm text-[var(--ink-800)]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[rgba(15,76,129,0.18)] text-[var(--navy-600)] focus:ring-[rgba(15,76,129,0.16)]"
                          checked={mentoringSessionDraft.documentadoCrm}
                          onChange={(e) => {
                            setSessionSaveFeedback(null);
                            setMentoringSessionDraft((current) => ({ ...current, documentadoCrm: e.target.checked, _confirmed: false }));
                          }}
                        />
                        Marcar como documentado en CRM
                      </label>

                      <details className="rounded-xl border border-[rgba(15,76,129,0.12)] p-3 text-sm text-[var(--ink-800)]">
                        <summary className="min-h-11 cursor-pointer py-3 font-semibold">Vista previa del resumen para CRM</summary>
                        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm">{crmSummary}</pre>
                      </details>

                      {!sourceReview.canCopy ? <p role="alert" className="text-sm text-[var(--ink-800)]">{sourceReview.message}</p> : null}

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={handleCopyMentoringSummary} disabled={!sourceReview.canCopy}>
                          Copiar resumen para CRM
                        </Button>
                        <Button onClick={handleSaveMentoringSession} isLoading={isSavingMentoringSession}>
                          {sessionSaveFeedback?.tone === 'success' ? 'Sesión guardada' : 'Guardar sesión'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </Dialog>
      )}

    </div>
  );
}
