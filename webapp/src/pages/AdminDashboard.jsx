import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mail, Search, Users, Activity, CheckCircle, Upload, ShieldAlert, Send, Beaker, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '../utils/cn';
import { apiClient } from '../api/client';

const DEFAULT_API_URL = String(import.meta.env.VITE_API_URL || '').trim();
const DEFAULT_BOOKING_CONFIG = {
  mode: 'individual',
  url: 'https://outlook.office.com/book/RecalculandoRutaMentoraparaevaluartutrayectoria@tecmx.onmicrosoft.com/?ismsaljsauthenabled',
  cta: 'Agendar mi sesión',
};
const BOOKING_URLS = {
  individual: 'https://outlook.office.com/book/RecalculandoRutaMentoraparaevaluartutrayectoria@tecmx.onmicrosoft.com/?ismsaljsauthenabled',
  grupal: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=pj5axnwPC0CJNFptwXBWRcrMCtkST0lIvPsUKFV_0rVUQk1MRkJWQUJUOURBS1VIS1JNWEM3RDIxSy4u',
};

const DEFAULT_MENTORS = [];

const DEFAULT_STUDENTS = [];

function normalizeStudent(raw, fallbackIndex = 0) {
  return {
    id: raw.id || raw.matricula || `student-${fallbackIndex}`,
    matricula: raw.matricula || '',
    name: raw.name || raw.nombre || '',
    preferredName: raw.preferredName || raw.nombrepreferido || raw.nombrePreferido || '',
    email: raw.email || '',
    mentor: raw.mentor || raw.nicknamementor || '',
    community: raw.community || raw.comunidad || '',
    status: raw.status || 'Pendiente',
    checkIn: raw.checkIn || raw.checkin || 'No',
    agenciaCheckIn: raw.agenciaCheckIn || raw.agenciacheckin || '',
  };
}

function normalizeMentor(raw) {
  return {
    community: raw.community || raw.comunidad || 'Sin Comunidad',
    hex: raw.hex || raw['#hex'] || '#0033A0',
    name: raw.name || raw.nombre || 'Sin Nombre',
    nickname: raw.nickname || raw.apodo || raw.name || raw.nombre || 'Sin Nombre',
    email: raw.email || 'sin@correo.com',
  };
}

function normalizeUser(raw) {
  return {
    email: String(raw.email || '').trim().toLowerCase(),
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
  return String(item?.fechaSesion || item?.fecha_sesion || '').trim();
}

function getSessionUpdatedAt(item) {
  return String(
    item?.timestampActualizado ||
    item?.timestamp_actualizado ||
    item?.timestampGuardado ||
    item?.timestamp_guardado ||
    item?.timestampCreacion ||
    item?.timestamp_creacion ||
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
  const normalizedMatricula = String(matricula || '').trim().toUpperCase() || 'SINMATRICULA';
  const normalizedFecha = String(fechaSesion || '').trim() || getLocalDateInputValue();
  const normalizedTimestamp = Date.now().toString();
  return `${normalizedMatricula}-${normalizedFecha}-${normalizedTimestamp.slice(-10)}`;
}

function getAcademicPeriod(value = '') {
  const parsed = new Date(value || getLocalDateInputValue());
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  return `${year}-${month <= 6 ? '1' : '2'}`;
}

function ensureSentence(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export default function AdminDashboard() {
  const [accessEmail, setAccessEmail] = useState(() => localStorage.getItem('navi_admin_email') || '');
  const [accessPin, setAccessPin] = useState('');
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('navi_admin_user');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [isResolvingUser, setIsResolvingUser] = useState(false);
  const [selectedStudentForDiagnostic, setSelectedStudentForDiagnostic] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('navi_students');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
    return parsed.map((student, index) => normalizeStudent(student, index));
  });
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('navi_demo_mode') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('navi_user_role') || '';
  });
  const [mentors, setMentors] = useState(() => {
    const saved = localStorage.getItem('navi_mentors');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_MENTORS;
    return parsed.map(normalizeMentor);
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
  const [isSendingInitial, setIsSendingInitial] = useState(false);

  // Tab 2: Demo Config
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    const savedUrl = localStorage.getItem('navi_api_url');
    if (savedUrl) {
      return savedUrl;
    }
    if (DEFAULT_API_URL) {
      localStorage.setItem('navi_api_url', DEFAULT_API_URL);
      return DEFAULT_API_URL;
    }
    return '';
  });
  const [adminSecret, setAdminSecret] = useState(() => localStorage.getItem('navi_admin_secret') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [bookingConfig, setBookingConfig] = useState(() => {
    const saved = localStorage.getItem('navi_booking_config');
    return saved ? JSON.parse(saved) : DEFAULT_BOOKING_CONFIG;
  });
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

  // Campaign Modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignType, setCampaignType] = useState('invitation'); // invitation, session, noshow
  const [campaignConfig, setCampaignConfig] = useState({
    subject: '¡Bienvenido a Navi!',
    htmlBody: '<p>Hola {{nombre}},</p><p>Te invito a realizar tu diagnóstico Brújula.</p>',
    selectedMentorEmails: [] // Array of mentor emails
  });

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem('navi_students', JSON.stringify(students));
  }, [students]);

  // Auto-fetch al iniciar sesión con directorio vacío
  useEffect(() => {
    if (authUser && students.length === 0) {
      handleFetchFromSheets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
    localStorage.setItem('navi_demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem('navi_admin_user', JSON.stringify(authUser));
      localStorage.setItem('navi_admin_email', authUser.email);
      const resolvedRole = authUser.role === 'admin' ? 'admin' : `mentor:${authUser.email}`;
      localStorage.setItem('navi_user_role', resolvedRole);
      if (userRole !== resolvedRole) {
        setUserRole(resolvedRole);
        return;
      }
    } else {
      localStorage.removeItem('navi_admin_user');
      localStorage.removeItem('navi_admin_email');
      localStorage.removeItem('navi_user_role');
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
    localStorage.setItem('navi_responses', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    localStorage.setItem('navi_goal_selections', JSON.stringify(goalSelections));
  }, [goalSelections]);

  useEffect(() => {
    localStorage.setItem('navi_mentoring_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('navi_booking_config', JSON.stringify(bookingConfig));
  }, [bookingConfig]);

  const isAdmin = userRole === 'admin';
  const isMentorView = userRole.startsWith('mentor:');
  const currentMentorEmail = isMentorView ? userRole.split(':')[1] : null;
  const currentMentor = currentMentorEmail ? mentors.find((mentor) => mentor.email === currentMentorEmail) : null;
  const mentorByNickname = useMemo(() => {
    const map = new Map();
    mentors.forEach((mentor) => {
      const key = String(mentor.nickname || '').trim();
      if (key) map.set(key, mentor);
    });
    return map;
  }, [mentors]);
  const studentsWithContext = useMemo(
    () => students.map((student) => ({
      ...student,
      community: student.community || mentorByNickname.get(student.mentor)?.community || '',
    })),
    [students, mentorByNickname]
  );
  const checkInLink = typeof window !== 'undefined'
    ? `${window.location.origin}/check-in`
    : '/check-in';
  const permissions = isAdmin
    ? {
        tabs: ['dashboard', 'settings'],
        canPullSheets: true,
        canPushSheets: true,
        canRunCampaigns: true,
      }
    : {
        tabs: ['dashboard'],
        canPullSheets: true,
        canPushSheets: false,
        canRunCampaigns: false,
      };

  useEffect(() => {
    if (!permissions.tabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, permissions.tabs]);

  const stats = useMemo(() => {
    // Filter students by current mentor if applicable
    const scopeStudents = isAdmin
      ? studentsWithContext 
      : studentsWithContext.filter(s => {
          const mentorEmail = userRole.split(':')[1];
          const mentor = mentors.find(m => m.email === mentorEmail);
          return s.mentor === mentor?.nickname;
        });

    const total = scopeStudents.length;
    const sessionReady = scopeStudents.filter(s => s.status === 'Test Completado').length;
    const testCompletado = scopeStudents.filter(s => s.status === 'Test Completado' || s.status === 'Metas Seleccionadas').length;
    const metasSeleccionadas = scopeStudents.filter(s => s.status === 'Metas Seleccionadas').length;
    const noShows = scopeStudents.filter(s => s.status === 'Test Completado' && s.checkIn === 'No').length;
    return {
      total,
      sessionReady,
      testRate: Math.round((testCompletado / total) * 100) || 0,
      metasRate: Math.round((metasSeleccionadas / total) * 100) || 0,
      noShows,
      pendientes: total - testCompletado,
      scopeStudents // include for the table
    };
  }, [studentsWithContext, userRole, mentors, isAdmin]);

  const filteredStudents = stats.scopeStudents.filter(s => 
    String(s.matricula || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.preferredName && String(s.preferredName).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && String(s.email).toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    [...sessions]
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

  const humanizeAreaLabel = (value = '') =>
    String(value || '')
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const buildMentoringSummary = (student, diag, goalSelection, draft) => {
    const studentName = student?.preferredName || student?.name || 'Estudiante';
    const areas = String(diag?.areasprioritarias || '')
      .split(',')
      .map((item) => humanizeAreaLabel(item))
      .filter(Boolean);
    const summaryBlocks = [
      `Sesión de mentoría faro — ${draft.fechaSesion}`,
      `Estudiante: ${studentName} (${student?.matricula || 'Sin matrícula'})${student?.community ? ` · Comunidad ${student.community}` : ''}`,
      `Mentor/a: ${student?.mentor || 'Sin mentor asignado'}`,
    ];

    if (student?.agenciaCheckIn) {
      summaryBlocks.push(
        '',
        `${student.agenciaCheckIn}.`
      );
    }

    if (areas.length > 0) {
      summaryBlocks.push(
        '',
        `El diagnóstico identificó mayor oportunidad de trabajo en ${areas.join(', ')}.`
      );
    }

    const commitments = [];
    if (goalSelection?.metaprioritaria) commitments.push(`Meta prioritaria: ${ensureSentence(goalSelection.metaprioritaria)}`);
    if (goalSelection?.metacomplementaria) commitments.push(`Meta complementaria: ${ensureSentence(goalSelection.metacomplementaria)}`);
    if (goalSelection?.tiempo) commitments.push(`Horizonte: ${ensureSentence(goalSelection.tiempo)}`);
    if (goalSelection?.obstaculo) commitments.push(`Obstáculo identificado: ${ensureSentence(goalSelection.obstaculo)}`);
    if (goalSelection?.plan) commitments.push(`Estrategia: ${ensureSentence(goalSelection.plan)}`);

    if (commitments.length > 0) {
      summaryBlocks.push('', ...commitments);
    }

    if (draft.notasMentor) {
      summaryBlocks.push('', `El mentor o mentora señala: ${draft.notasMentor}`);
    }

    return summaryBlocks.join('\n');
  };

  useEffect(() => {
    if (!selectedStudentForDiagnostic) return;
    const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
    const today = getLocalDateInputValue();
    const draftStore = JSON.parse(localStorage.getItem('navi_mentoring_session_drafts') || '{}');
    const latestSaved = latestSessionsByMatricula.get(matricula);
    const persistedDraft = draftStore[matricula];
    const latestSavedDate = getSessionDate(latestSaved);
    const canResumeLatestSession = latestSaved && latestSavedDate === today;
    const baseDraft = persistedDraft || (canResumeLatestSession ? latestSaved : null);
    setMentoringSessionDraft({
      sessionId: getSessionId(baseDraft),
      fechaSesion: baseDraft?.fechaSesion || baseDraft?.fecha_sesion || today,
      notasMentor: baseDraft?.notasMentor || baseDraft?.notas_mentor || '',
      documentadoCrm: Boolean(
        baseDraft?.documentadoCrm ??
        (String(baseDraft?.documentado_crm || '').toLowerCase() === 'si')
      ),
      timestampCreacion: String(baseDraft?.timestampCreacion || baseDraft?.timestamp_creacion || '').trim(),
    });
    setSessionSaveFeedback(null);
  }, [selectedStudentForDiagnostic, latestSessionsByMatricula]);

  useEffect(() => {
    if (!selectedStudentForDiagnostic) return;
    const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
    const draftStore = JSON.parse(localStorage.getItem('navi_mentoring_session_drafts') || '{}');
    if (mentoringSessionDraft.sessionId) {
      delete draftStore[matricula];
    } else {
      draftStore[matricula] = mentoringSessionDraft;
    }
    localStorage.setItem('navi_mentoring_session_drafts', JSON.stringify(draftStore));
  }, [mentoringSessionDraft, selectedStudentForDiagnostic]);

  const StatusBadge = ({ student }) => {
    const { status, checkIn } = student;
    
    // Logic for No-Show according to methodology (Test Done but Check-in No)
    if (status === 'Test Completado' && checkIn === 'No') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200 flex items-center w-fit">
          <ShieldAlert className="w-3 h-3 mr-1" /> Sin sesión · plan pendiente
        </span>
      );
    }

    const styles = {
      'Pendiente': 'bg-gray-100 text-gray-800 border-gray-200',
      'Test Completado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Metas Seleccionadas': 'bg-green-100 text-green-800 border-green-200',
    };
    const labels = {
      'Pendiente': 'Pendiente',
      'Test Completado': 'Diagnóstico completo',
      'Metas Seleccionadas': 'Plan definido',
    };

    return (
      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', styles[status] || styles['Pendiente'])}>
        {labels[status] || labels['Pendiente']}
      </span>
    );
  };

  const campaignLabels = {
    invitation: 'Invitación al diagnóstico',
    session: 'Convocatoria a sesión',
    noshow: 'Seguimiento a ausencias',
  };

  const _handleOpenCampaignConfig = (type) => {
    setCampaignType(type);
    let defaults = {
      invitation: { 
        subject: 'Tu diagnóstico de trayectoria te espera', 
        body: '<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">' +
              '<h2 style="color: #0033A0;">Hola {{nombre}}!</h2>' +
              '<p>Soy <b>{{mentor}}</b> de la comunidad <b>{{comunidad}}</b>.</p>' +
              '<p>Te invito a entrar a <b>Navi</b> para comenzar tu diagnóstico de este semestre.</p>' +
              '<a href="#" style="background: #0033A0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Comenzar Ahora</a>' +
              '</div>' 
      },
      session: { 
        subject: 'Es momento de agendar tu sesión de mentoría', 
        body: '<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">' +
              '<h2 style="color: #6366f1;">Sesión de Metas</h2>' +
              '<p>Hola {{nombre}}, ya hiciste tu test. Ahora es momento de vernos presencialmente para definir tus metas.</p>' +
              '<p>Te espera tu mentor(a): <b>{{mentor}}</b></p>' +
              '</div>' 
      },
      noshow: { 
        subject: 'Aún puedes retomar tu plan de mentoría', 
        body: '<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">' +
              '<h2 style="color: #f97316;">¡Te extrañamos en la sesión!</h2>' +
              '<p>{{nombre}}, notamos que no pudiste asistir a la sesión presencial con <b>{{mentor}}</b>.</p>' +
              '<p>No te preocupes, aún puedes completar tu plan de acción desde la App.</p>' +
              '</div>' 
      }
    };

    setCampaignConfig({
      subject: defaults[type].subject,
      htmlBody: defaults[type].body,
      selectedMentorEmails: mentors.map(m => m.email) // Todas las comunidades participan por defecto
    });
    setIsCampaignModalOpen(true);
  };

  const handleExecuteCampaign = async () => {
    const selectedMentorsData = mentors.filter(m => campaignConfig.selectedMentorEmails.includes(m.email));
    const destinatarios = students.filter(s => {
      if (campaignType === 'invitation') return s.status === 'Pendiente';
      if (campaignType === 'session') return s.status === 'Test Completado';
      if (campaignType === 'noshow') return s.status === 'Test Completado' && s.checkIn === 'No';
      return false;
    }).filter(s => selectedMentorsData.some(m => m.nickname === s.mentor));

    if (destinatarios.length === 0) {
      setFeedback({ tone: 'error', message: 'No hay estudiantes que cumplan los criterios para esta campaña.' });
      setIsCampaignModalOpen(false);
      return;
    }

    setIsSendingInitial(true);
    try {
      const result = await apiClient.post('sendCampaign', {
        tipo: campaignType,
        subject: campaignConfig.subject,
        htmlBody: campaignConfig.htmlBody,
        destinatarios,
      });
      const fallMsg = result.fallidos > 0
        ? ` ${result.fallidos} no pudieron enviarse.`
        : '';
      setFeedback({
        tone: result.fallidos > 0 ? 'error' : 'success',
        message: `${campaignLabels[campaignType]}: ${result.enviados} correos enviados.${fallMsg}`,
      });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible enviar la campaña: ${err.message}` });
    } finally {
      setIsCampaignModalOpen(false);
      setIsSendingInitial(false);
    }
  };

  const handleFetchFromSheets = async () => {
    if (!apiUrl) {
      setFeedback({ tone: 'error', message: 'Configura primero la URL de Google Sheets en Configuración.' });
      return;
    }
    setIsSyncing(true);
    try {
      const data = await apiClient.get();
      if (data.students) setStudents(data.students.map((student, index) => normalizeStudent(student, index)));
      if (data.mentors) setMentors(data.mentors.map(normalizeMentor));
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

  const executePushToSheets = async () => {
    if (!apiUrl) {
      setFeedback({ tone: 'error', message: 'Configura primero la URL de Google Sheets en Configuración.' });
      return;
    }
    
    setIsSyncing(true);
    try {
      await apiClient.post('syncBulk', {
        students,
        mentors,
        studentCount: students.length,
        mentorCount: mentors.length,
        confirmOverwrite: true,
      });
      setFeedback({ tone: 'success', message: 'Datos guardados en Google Sheets.' });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible guardar los datos: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheets = () => {
    if (!apiUrl) {
      setFeedback({ tone: 'error', message: 'Configura primero la URL de Google Sheets en Configuración.' });
      return;
    }
    setConfirmation({
      type: 'pushSheets',
      title: 'Guardar cambios en Google Sheets',
      message: 'Esto sobrescribirá la información actual del origen compartido con la lista visible en Navi.',
    });
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem('navi_api_url', apiUrl.trim());
    const trimmedSecret = adminSecret.trim();
    if (trimmedSecret) {
      localStorage.setItem('navi_admin_secret', trimmedSecret);
    } else {
      localStorage.removeItem('navi_admin_secret');
    }
    setFeedback({ tone: 'success', message: 'La configuración de conexión quedó guardada.' });
    window.location.reload(); // Reload to refresh client.js instance
  };

  const handleCopyCheckInLink = async () => {
    try {
      await navigator.clipboard.writeText(checkInLink);
      setFeedback({ tone: 'success', message: 'El enlace de check-in se copió al portapapeles.' });
    } catch {
      setFeedback({ tone: 'error', message: 'No fue posible copiar el enlace. Intenta copiarlo manualmente.' });
    }
  };

  const handleCopyMentoringSummary = async () => {
    if (!selectedStudentForDiagnostic) return;
    const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
    const diag = latestResponsesByMatricula.get(matricula);
    const goalSelection = latestGoalSelectionsByMatricula.get(matricula);
    const summary = buildMentoringSummary(selectedStudentForDiagnostic, diag, goalSelection, mentoringSessionDraft);

    try {
      await navigator.clipboard.writeText(summary);
      setFeedback({ tone: 'success', message: 'Resumen de mentoría copiado para CRM.' });
    } catch {
      setFeedback({ tone: 'error', message: 'No fue posible copiar el resumen. Intenta de nuevo.' });
    }
  };

  const handleSaveMentoringSession = async () => {
    if (!selectedStudentForDiagnostic) return;

    const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
    const diag = latestResponsesByMatricula.get(matricula);
    const goalSelection = latestGoalSelectionsByMatricula.get(matricula);
    const sessionId = mentoringSessionDraft.sessionId || createSessionId(matricula, mentoringSessionDraft.fechaSesion);
    const timestampCreacion = mentoringSessionDraft.timestampCreacion || new Date().toISOString();
    const resolvedCommunity = selectedStudentForDiagnostic.community || mentorByNickname.get(selectedStudentForDiagnostic.mentor)?.community || '';
    const periodo = getAcademicPeriod(mentoringSessionDraft.fechaSesion);

    setIsSavingMentoringSession(true);
    try {
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
        metaPrioritaria: goalSelection?.metaprioritaria || '',
        metaComplementaria: goalSelection?.metacomplementaria || '',
        horizonte: goalSelection?.tiempo || '',
        obstaculo: goalSelection?.obstaculo || '',
        estrategia: goalSelection?.plan || '',
        notasMentor: mentoringSessionDraft.notasMentor,
        estadoDocumentacion: mentoringSessionDraft.documentadoCrm ? 'Documentado' : 'Borrador',
        documentadoCrm: mentoringSessionDraft.documentadoCrm,
        timestampCreacion,
      });

      const savedSessionId = String(result?.sessionId || result?.data?.sessionId || sessionId).trim() || sessionId;
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
        metaPrioritaria: goalSelection?.metaprioritaria || '',
        metaComplementaria: goalSelection?.metacomplementaria || '',
        horizonte: goalSelection?.tiempo || '',
        obstaculo: goalSelection?.obstaculo || '',
        estrategia: goalSelection?.plan || '',
        notasMentor: mentoringSessionDraft.notasMentor,
        estadoDocumentacion: mentoringSessionDraft.documentadoCrm ? 'Documentado' : 'Borrador',
        documentadoCrm: mentoringSessionDraft.documentadoCrm ? 'Si' : 'No',
        timestampCreacion: savedTimestampCreacion,
        timestampActualizado: savedTimestampActualizado,
      };
      setSessions((current) => {
        const remaining = current.filter((item) => getSessionId(item) !== savedSessionId);
        return [nextEntry, ...remaining];
      });

      const draftStore = JSON.parse(localStorage.getItem('navi_mentoring_session_drafts') || '{}');
      delete draftStore[matricula];
      localStorage.setItem('navi_mentoring_session_drafts', JSON.stringify(draftStore));
      setMentoringSessionDraft({
        sessionId: savedSessionId,
        fechaSesion: mentoringSessionDraft.fechaSesion,
        notasMentor: mentoringSessionDraft.notasMentor,
        documentadoCrm: mentoringSessionDraft.documentadoCrm,
        timestampCreacion: savedTimestampCreacion,
      });
      setSessionSaveFeedback({
        tone: result?.source === 'fallback' ? 'warning' : 'success',
        message: result?.source === 'fallback'
          ? 'La sesión se guardó localmente. Revisa la conexión antes de asumir que llegó a Sheets.'
          : `La sesión quedó guardada en Sheets${savedTimestampActualizado ? ` · ${formatLocalTimestamp(savedTimestampActualizado)}` : ''}.`,
      });

      const warning = result?.warning ? ` ${result.warning}` : '';
      setFeedback({ tone: result?.source === 'fallback' ? 'error' : 'success', message: `Resultado de mentoría guardado.${warning}` });
    } catch (err) {
      setFeedback({ tone: 'error', message: `No fue posible guardar la sesión: ${err.message}` });
    } finally {
      setIsSavingMentoringSession(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    if (confirmation.type === 'pushSheets') {
      setConfirmation(null);
      await executePushToSheets();
      return;
    }
  };

  const handleResolveInstitutionalUser = async () => {
    const email = accessEmail.trim().toLowerCase();
    const pin = accessPin.trim();
    if (!email.endsWith('@tec.mx')) {
      setFeedback({ tone: 'error', message: 'Ingresa un correo institucional del Tec.' });
      return;
    }
    if (!pin) {
      setFeedback({ tone: 'error', message: 'Ingresa tu PIN de acceso.' });
      return;
    }
    setIsResolvingUser(true);
    try {
      const response = await apiClient.post('resolveUserByEmail', { email, pin });
      const normalized = normalizeUser(response.user || response);
      setAuthUser(normalized);
      setFeedback({ tone: 'success', message: `Acceso habilitado para ${normalized.name}.` });
    } catch (error) {
      setFeedback({ tone: 'error', message: error.message });
    } finally {
      setIsResolvingUser(false);
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    setAccessEmail('');
    setUserRole('');
    setActiveTab('dashboard');
    setFeedback(null);
    setConfirmation(null);
  };

  const currentTabStyle = "border-[var(--coral-500)] text-[var(--navy-600)] font-semibold";
  const defaultTabStyle = "border-transparent text-[var(--ink-700)] hover:text-[var(--ink-900)] hover:border-[rgba(15,76,129,0.18)] font-medium";

  if (!authUser) {
    return (
      <div className="mx-auto max-w-3xl py-10 animate-in fade-in duration-500">
        <Card className="shadow-sm border-[rgba(15,76,129,0.12)]">
          <CardContent className="p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy-600)]">Acceso institucional</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)]">Ingresa con tu correo del Tec</h1>
            <p className="mt-3 max-w-2xl text-[var(--ink-700)]">
              Usaremos tu correo institucional para determinar si accedes como administración o mentoría dentro de faro.
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
            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <input
                type="email"
                placeholder="tu.correo@tec.mx"
                className="w-full rounded-2xl border border-[rgba(15,76,129,0.12)] px-4 py-3 text-base focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="PIN"
                className="w-full max-w-[124px] rounded-2xl border border-[rgba(15,76,129,0.12)] px-4 py-3 text-base focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)] text-center tracking-widest"
                value={accessPin}
                onChange={(e) => setAccessPin(e.target.value)}
              />
              <Button onClick={handleResolveInstitutionalUser} isLoading={isResolvingUser} className="px-8">
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] flex items-center">
            {isAdmin ? 'Panel de mentoría' : 'Mis estudiantes'}
            {isDemoMode && (
              <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                <Beaker className="w-3 h-3 mr-1"/> MODO DEMO ACTIVO
              </span>
            )}
          </h1>
          <p className="mt-2 text-[var(--ink-700)]">
            {isAdmin
              ? 'Seguimiento de estudiantes y documentación de mentoría.'
              : `Seguimiento de ${currentMentor?.community || 'tu comunidad'} y estado de tus estudiantes.`}
          </p>
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
            {permissions.canPushSheets ? (
              <Button size="sm" onClick={handlePushToSheets} isLoading={isSyncing}>
                <Upload className="w-4 h-4 mr-2" /> Guardar en Sheets
              </Button>
            ) : null}
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
        <div className="animate-in fade-in duration-300">
          
          {isMentorView || isAdmin ? (
            <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-[rgba(15,76,129,0.12)] bg-white px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy-600)]">
                  {isMentorView ? `Mentoría · ${currentMentor?.community || 'Comunidad'}` : 'Operación presencial'}
                </p>
                <h3 className="mt-2 text-xl font-bold text-[var(--ink-900)]">
                  {isMentorView ? (currentMentor?.name || 'Vista de mentor') : 'Panel de coordinación'}
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-700)]">
                  {isMentorView
                    ? 'Aquí ves únicamente a tus estudiantes asignados y el estado de su avance.'
                    : 'Desde aquí puedes compartir el acceso a check-in y supervisar el avance operativo de la sesión.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[rgba(15,76,129,0.12)] bg-white px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--navy-600)]">
                  Check-in presencial
                </p>
                <h3 className="mt-2 text-lg font-bold text-[var(--ink-900)]">
                  Comparte el acceso con tu estudiante
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-700)]">
                  Usa este enlace o muestra el QR para que el estudiante entre directo a faro y registre su llegada.
                </p>
                <div className="mt-4 rounded-xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.04)] px-3 py-2 font-mono text-xs text-[var(--ink-800)] break-all">
                  {checkInLink}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleCopyCheckInLink}>
                    Copiar enlace
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(checkInLink, '_blank', 'noopener,noreferrer')}>
                    Abrir check-in
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCheckInQr((current) => !current)}>
                    {showCheckInQr ? 'Ocultar QR' : 'Mostrar QR'}
                  </Button>
                </div>
                {showCheckInQr ? (
                  <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-[rgba(15,76,129,0.12)] bg-white px-4 py-4">
                    <QRCodeSVG value={checkInLink} size={168} includeMargin />
                    <p className="text-xs text-[var(--ink-700)]">
                      Muestra este código durante la sesión para facilitar el acceso al check-in.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4 mb-8">
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
                      <p className="text-sm font-medium text-gray-500">Diagnóstico completado</p>
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

          <Card className="shadow-sm overflow-hidden border-gray-200">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-800">Directorio de progreso</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por matrícula, nombre o correo" 
                  className="w-full pl-9 pr-4 py-2 text-sm border border-[rgba(15,76,129,0.12)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)] focus:border-[var(--navy-500)] bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-white border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Matrícula</th>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Asistió a sesión</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
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
                            {(student.status === 'Test Completado' || student.status === 'Metas Seleccionadas') && (
                              <button 
                                onClick={() => setSelectedStudentForDiagnostic(student)}
                                className="text-[11px] font-semibold uppercase tracking-wider text-[var(--navy-600)] hover:text-[var(--navy-700)] hover:underline"
                              >
                                Ver Diagnóstico
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No se encontraron estudiantes para la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {permissions.canRunCampaigns ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card className="border-[rgba(15,76,129,0.10)] shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[var(--navy-700)] mb-2 flex items-center"><Mail className="mr-2 h-5 w-5"/> Invitación al diagnóstico</h3>
                  <p className="text-sm text-[var(--ink-700)] mb-4 h-10">Envío masivo a estudiantes que aún no completaron el test.</p>
                  <Button
                    className="w-full"
                    onClick={() => setFeedback({ tone: 'error', message: 'Campañas en rediseño. Por ahora no se envían desde este panel.' })}
                  >
                    Campañas en rediseño
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[rgba(15,76,129,0.10)] shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[var(--navy-700)] mb-2 flex items-center"><CheckCircle className="mr-2 h-5 w-5"/> Convocatoria a sesión</h3>
                  <p className="text-sm text-[var(--ink-700)] mb-4 h-10">Aviso a estudiantes listos para su sesión presencial.</p>
                  <Button
                    className="w-full"
                    onClick={() => setFeedback({ tone: 'error', message: 'Campañas en rediseño. Por ahora no se envían desde este panel.' })}
                  >
                    Campañas en rediseño
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[rgba(15,76,129,0.10)] shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-[var(--navy-700)] mb-2 flex items-center"><Send className="mr-2 h-5 w-5"/> Seguimiento a ausencias</h3>
                  <p className="text-sm text-[var(--ink-700)] mb-4 h-10">Mensaje a estudiantes que no asistieron a su sesión.</p>
                  <Button
                    className="w-full"
                    onClick={() => setFeedback({ tone: 'error', message: 'Campañas en rediseño. Por ahora no se envían desde este panel.' })}
                  >
                    Campañas en rediseño
                  </Button>
                </CardContent>
              </Card>
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
          
          {/* Role Simulator */}
          {import.meta.env.DEV && isDemoMode ? (
          <Card className="shadow-sm border-[rgba(15,76,129,0.12)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[rgba(15,76,129,0.08)] rounded-xl text-[var(--navy-500)]">
                  <Users className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Vista por rol</h2>
                  <p className="text-[var(--ink-700)] text-sm mt-1">
                    Cambia el rol activo para revisar cómo se ve el panel para administración o mentoría. En producción, este acceso vendrá de la cuenta institucional.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[rgba(15,76,129,0.12)] flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[var(--ink-900)]">Rol activo</h4>
                  </div>
                  <div className="flex bg-[rgba(15,76,129,0.05)] p-1 rounded-lg overflow-x-auto max-w-full">
                    <button 
                      onClick={() => setUserRole('admin')}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap", userRole === 'admin' ? "bg-white shadow-sm text-[var(--navy-700)]" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]")}
                    >
                      Admin
                    </button>
                    {mentors.map(m => (
                      <button 
                        key={m.email}
                        onClick={() => setUserRole(`mentor:${m.email}`)}
                        className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap", userRole === `mentor:${m.email}` ? "bg-white shadow-sm text-[var(--navy-700)]" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]")}
                      >
                        {m.nickname}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : null}

          <Card className="shadow-sm border-[rgba(15,76,129,0.12)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[rgba(210,106,92,0.10)] rounded-xl text-[var(--coral-500)]">
                  <Beaker className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Modo demo</h2>
                  <p className="text-[var(--ink-700)] text-sm mt-1">
                    Al activar el modo demo, las campañas del tablero no dispararán correos reales. Úsalo para capacitación o presentaciones.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[rgba(210,106,92,0.16)] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[var(--ink-900)]">Estado actual</h4>
                  <p className="text-sm text-[var(--ink-700)]">{isDemoMode ? "Activado. Entorno seguro para demostraciones." : "Desactivado. Operación real."}</p>
                </div>
                <Button 
                  variant={isDemoMode ? "default" : "outline"}
                  className={isDemoMode ? "bg-[var(--coral-500)] hover:bg-[rgba(210,106,92,0.9)]" : ""}
                  onClick={() => setIsDemoMode(!isDemoMode)}
                >
                  {isDemoMode ? "Desactivar Demo" : "Activar Demo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[rgba(15,76,129,0.12)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[rgba(15,76,129,0.08)] rounded-xl text-[var(--navy-500)]">
                  <LayoutDashboard className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Conexión con Google Sheets</h2>
                  <p className="text-[var(--ink-700)] text-sm mt-1">
                    Configura la URL de tu Web App de Google Apps Script y la clave admin usada para operaciones de escritura.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://script.google.com/macros/s/.../exec" 
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500 font-mono text-xs"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <Button onClick={handleSaveApiUrl}>Guardar URL</Button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    placeholder="Clave admin para guardar en Sheets"
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500 font-mono text-xs"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  ID actual detectado: {apiUrl ? apiUrl.split('/s/')[1]?.split('/')[0] : 'Ninguno'}
                </p>
                <p className="text-[10px] text-gray-400 italic">
                  La clave admin no debe ir en variables públicas del frontend. Se guarda localmente en este navegador para acciones de escritura.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[rgba(15,76,129,0.12)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-[rgba(15,76,129,0.08)] rounded-xl text-[var(--navy-500)]">
                  <CalendarDays className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--ink-900)]">Agenda de mentoría</h2>
                  <p className="text-[var(--ink-700)] text-sm mt-1">
                    Define si los resultados deben dirigir a una sesión individual o a un registro grupal por bloques.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex bg-[rgba(15,76,129,0.05)] p-1 rounded-lg overflow-x-auto max-w-full border border-[rgba(15,76,129,0.12)]">
                  <button
                    onClick={() => setBookingConfig({
                      mode: 'individual',
                      url: BOOKING_URLS.individual,
                      cta: 'Agendar mi sesión',
                    })}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                      bookingConfig.mode === 'individual' ? 'bg-white shadow-sm text-[var(--navy-700)]' : 'text-[var(--ink-700)] hover:text-[var(--ink-900)]'
                    )}
                  >
                    Sesión individual
                  </button>
                  <button
                    onClick={() => setBookingConfig({
                      mode: 'grupal',
                      url: BOOKING_URLS.grupal,
                      cta: 'Registrar mi lugar',
                    })}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                      bookingConfig.mode === 'grupal' ? 'bg-white shadow-sm text-[var(--navy-700)]' : 'text-[var(--ink-700)] hover:text-[var(--ink-900)]'
                    )}
                  >
                    Evento grupal
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--ink-700)] mb-2 uppercase tracking-wider">Texto del botón</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                      value={bookingConfig.cta}
                      onChange={(e) => setBookingConfig((prev) => ({ ...prev, cta: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--ink-700)] mb-2 uppercase tracking-wider">URL activa</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500 font-mono text-xs"
                      value={bookingConfig.url}
                      onChange={(e) => setBookingConfig((prev) => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <p className="text-sm text-[var(--ink-700)]">
                    Modo actual: <span className="font-semibold text-[var(--ink-900)]">{bookingConfig.mode === 'individual' ? 'Sesión individual 1:1' : 'Registro a evento grupal'}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL DE CAMPAÑA */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-[var(--navy-500)]" /> Preparar campaña
                </h2>
                <p className="text-sm text-gray-500">{campaignLabels[campaignType]}. Ajusta el contenido y define a quién se enviará.</p>
              </div>
              <button onClick={() => setIsCampaignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Trash2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Left Column: Config */}
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Asunto del correo</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                    value={campaignConfig.subject}
                    onChange={(e) => setCampaignConfig({...campaignConfig, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Cuerpo HTML</label>
                  <div className="text-xs text-[var(--navy-600)] mb-2 font-mono">Tags: {'{{nombre}} | {{mentor}} | {{comunidad}}'}</div>
                  <textarea 
                    className="w-full rounded-xl border border-gray-300 p-4 text-sm font-mono text-gray-700 shadow-inner focus:border-brand-500 focus:ring-brand-500 h-64 resize-none"
                    value={campaignConfig.htmlBody}
                    onChange={(e) => setCampaignConfig({...campaignConfig, htmlBody: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Mentores y comunidades</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {mentors.map(m => (
                      <label key={m.email} className="flex items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mr-3"
                          checked={campaignConfig.selectedMentorEmails.includes(m.email)}
                          onChange={(e) => {
                            const newSelected = e.target.checked 
                              ? [...campaignConfig.selectedMentorEmails, m.email]
                              : campaignConfig.selectedMentorEmails.filter(email => email !== m.email);
                            setCampaignConfig({...campaignConfig, selectedMentorEmails: newSelected});
                          }}
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-900">{m.nickname}</p>
                          <p className="text-[10px] text-gray-500">{m.community}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="w-full md:w-1/2 flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Previsualización</label>
                <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col overflow-hidden">
                   <div className="bg-white rounded-xl shadow-lg flex-1 overflow-y-auto overflow-x-hidden p-6 border border-gray-100">
                      {/* Render simulated HTML body with dynamic tags replace for "Demo" */}
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: campaignConfig.htmlBody
                            .replace(/{{nombre}}/g, 'Juan Pérez')
                            .replace(/{{mentor}}/g, 'Tu Mentor Asignado')
                            .replace(/{{comunidad}}/g, 'Tu Comunidad')
                        }} 
                      />
                   </div>
                   <p className="text-[10px] text-gray-400 mt-4 text-center italic">Vista de referencia del mensaje que recibirá el estudiante.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="email" 
                  placeholder="enviar.prueba@tec.mx" 
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:ring-brand-500 w-full sm:w-64"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!testEmail) {
                      setFeedback({ tone: 'error', message: 'Ingresa un correo de prueba antes de enviarlo.' });
                      return;
                    }
                    setIsSendingTest(true);
                    try {
                      await apiClient.post('sendCampaign', {
                        tipo: 'prueba',
                        subject: campaignConfig.subject,
                        htmlBody: campaignConfig.htmlBody,
                        destinatarios: [{
                          email: testEmail,
                          name: 'Prueba',
                          mentor: 'Tu Mentor',
                          community: 'Tu Comunidad',
                          matricula: 'TEST',
                        }],
                      });
                      setFeedback({ tone: 'success', message: `Correo de prueba enviado a ${testEmail}.` });
                    } catch (err) {
                      setFeedback({ tone: 'error', message: `No se pudo enviar la prueba: ${err.message}` });
                    } finally {
                      setIsSendingTest(false);
                    }
                  }}
                  isLoading={isSendingTest}
                >
                  Probar
                </Button>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsCampaignModalOpen(false)} className="flex-1 sm:flex-none">Cancelar</Button>
                <Button 
                  onClick={handleExecuteCampaign} 
                  className="flex-1 sm:flex-none px-8 shadow-lg shadow-brand-500/20"
                  isLoading={isSendingInitial}
                  disabled={campaignConfig.selectedMentorEmails.length === 0}
                >
                  Enviar campaña
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Diagnostic View Modal */}
      {selectedStudentForDiagnostic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,36,66,0.4)] backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <CardContent className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6 border-b border-[rgba(15,76,129,0.1)] pb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[var(--ink-900)]">Resultado de mentoría</h3>
                  <p className="text-[var(--ink-700)]">{selectedStudentForDiagnostic.preferredName || selectedStudentForDiagnostic.name} · {selectedStudentForDiagnostic.matricula}</p>
                </div>
                <button 
                  onClick={() => setSelectedStudentForDiagnostic(null)} 
                  className="px-3 py-1 bg-[rgba(15,76,129,0.06)] hover:bg-[rgba(15,76,129,0.12)] text-[var(--ink-900)] rounded-full text-sm font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
              
              {selectedStudentForDiagnostic.agenciaCheckIn ? (
                <div className="mb-6 p-4 rounded-xl border border-[rgba(210,106,92,0.2)] bg-[rgba(249,236,232,0.4)]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--coral-500)] mb-2">Termómetro Emocional Presencial</p>
                  <p className="font-medium text-[var(--ink-900)] text-sm">{selectedStudentForDiagnostic.agenciaCheckIn}</p>
                </div>
              ) : null}

              {(() => {
                const matricula = String(selectedStudentForDiagnostic.matricula || '').trim().toUpperCase();
                const diag = latestResponsesByMatricula.get(matricula);
                const goalSelection = latestGoalSelectionsByMatricula.get(matricula);
                if (!diag) return <p className="text-[var(--ink-700)] bg-[rgba(15,76,129,0.04)] p-4 rounded-xl text-center">Aún no hay resultados de test guardados en la base de datos para este estudiante.</p>;
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[rgba(15,76,129,0.04)] rounded-xl">
                        <p className="text-xs font-semibold uppercase text-[var(--ink-500)]">Etapa</p>
                        <p className="font-medium text-[var(--ink-900)] mt-1">{diag.etapa || 'General'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--ink-900)] mb-3">Áreas Prioritarias Detectadas</h4>
                      {diag.areasprioritarias ? (
                        <div className="flex flex-wrap gap-2">
                          {diag.areasprioritarias.split(',').map(area => (
                            <span key={area} className="px-3 py-1 bg-[rgba(210,106,92,0.12)] text-[var(--coral-600)] font-semibold text-sm rounded-full capitalize">
                              {area.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--ink-700)] text-sm border-l-2 border-[var(--navy-300)] pl-3 py-1">No se detectaron áreas de riesgo significativas.</p>
                      )}
                    </div>
                    <div>
                        <h4 className="font-bold text-[var(--ink-900)] mb-3 flex items-center">
                          Métricas <span className="ml-2 px-2 py-0.5 border border-[rgba(15,76,129,0.15)] rounded text-xs text-[var(--ink-500)]">Escala 1-4</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {['claridad_carrera', 'desempeno_academico', 'plan_practicas', 'servicio_social', 'decision_semestretec', 'certificacion_idioma'].map(cat => {
                            if (!diag[cat.replace(/_/g, '')] && !diag[cat]) return null;
                            const score = parseFloat(diag[cat.replace(/_/g, '')] || diag[cat]);
                            const isLow = score <= 2.5;
                            return (
                              <div key={cat} className={cn("p-3 rounded-xl border relative overflow-hidden", isLow ? "border-[rgba(210,106,92,0.3)] bg-[rgba(253,245,242,0.8)]" : "border-[rgba(15,76,129,0.1)] bg-white")}>
                                {isLow && <div className="absolute top-0 left-0 w-1 h-full bg-[var(--coral-400)]" />}
                                <p className="text-[11px] font-semibold text-[var(--ink-500)] uppercase tracking-wider mb-1 truncate">{cat.replace(/_/g, ' ')}</p>
                                <p className={cn("text-xl font-bold", isLow ? "text-[var(--coral-600)]" : "text-[var(--navy-600)]")}>
                                  {score.toFixed(1)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[rgba(15,76,129,0.12)] bg-[rgba(15,76,129,0.04)] p-4">
                      <h4 className="font-bold text-[var(--ink-900)] mb-3">Metas acordadas</h4>
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
                              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Horizonte</p>
                              <p className="mt-1">{goalSelection.tiempo || 'Sin registro'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Obstáculo principal</p>
                              <p className="mt-1">{goalSelection.obstaculo || 'Sin registro'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Estrategia si-entonces</p>
                            <p className="mt-1 whitespace-pre-line">{goalSelection.plan || 'Sin registro'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--ink-700)]">Este estudiante aún no tiene metas guardadas en la plataforma.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[rgba(15,76,129,0.12)] bg-white p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Fecha de sesión</label>
                        <input
                          type="date"
                          className="mt-2 w-full rounded-xl border border-[rgba(15,76,129,0.12)] px-3 py-2 text-sm focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]"
                          value={mentoringSessionDraft.fechaSesion}
                          onChange={(e) => {
                            setSessionSaveFeedback(null);
                            setMentoringSessionDraft((current) => ({ ...current, fechaSesion: e.target.value }));
                          }}
                        />
                        <p className="mt-2 text-xs text-[var(--ink-600)]">
                          Este borrador se conserva en este equipo hasta que cierres o guardes la sesión.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink-500)]">Observaciones del mentor</label>
                        <textarea
                          className="mt-2 w-full rounded-xl border border-[rgba(15,76,129,0.12)] px-3 py-3 text-sm focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)] min-h-[120px] resize-none"
                          placeholder="Agrega aquí tus notas adicionales, si las hay."
                          value={mentoringSessionDraft.notasMentor}
                          onChange={(e) => {
                            setSessionSaveFeedback(null);
                            setMentoringSessionDraft((current) => ({ ...current, notasMentor: e.target.value }));
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
                            setMentoringSessionDraft((current) => ({ ...current, documentadoCrm: e.target.checked }));
                          }}
                        />
                        Marcar como documentado en CRM
                      </label>

                      {sessionSaveFeedback ? (
                        <div
                          className={cn(
                            "rounded-xl border px-3 py-3 text-sm",
                            sessionSaveFeedback.tone === 'success'
                              ? "border-[rgba(30,120,79,0.18)] bg-[rgba(30,120,79,0.08)] text-[rgb(30,120,79)]"
                              : "border-[rgba(210,106,92,0.18)] bg-[rgba(210,106,92,0.08)] text-[var(--ink-900)]"
                          )}
                        >
                          {sessionSaveFeedback.message}
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={handleCopyMentoringSummary}>
                          Copiar resumen para CRM
                        </Button>
                        <Button onClick={handleSaveMentoringSession} isLoading={isSavingMentoringSession}>
                          Guardar en Sheets
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
