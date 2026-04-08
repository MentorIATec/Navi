import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Mail, Search, Users, Activity, CheckCircle, Upload, Settings, LayoutDashboard, ShieldAlert, FileText, Trash2, Send, Tags, Beaker } from 'lucide-react';
import { cn } from '../utils/cn';
import GoalManager from '../components/admin/GoalManager';
import { apiClient } from '../api/client';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbySV0558WApICc3gFJGeOkdtfBjrPnDWgWHwC5IiNaOT7Gxt-d-knzvM0oXClH_b4jtZw/exec';
const DEFAULT_BOOKING_CONFIG = {
  mode: 'individual',
  url: 'https://outlook.office.com/book/RecalculandoRutaMentoraparaevaluartutrayectoria@tecmx.onmicrosoft.com/?ismsaljsauthenabled',
  cta: 'Agendar mi sesión',
};
const BOOKING_URLS = {
  individual: 'https://outlook.office.com/book/RecalculandoRutaMentoraparaevaluartutrayectoria@tecmx.onmicrosoft.com/?ismsaljsauthenabled',
  grupal: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=pj5axnwPC0CJNFptwXBWRcrMCtkST0lIvPsUKFV_0rVUQk1MRkJWQUJUOURBS1VIS1JNWEM3RDIxSy4u',
};

const DEFAULT_MENTORS = [
  { community: 'Krei', hex: '#79858B', name: 'José Ricardo Flores Espinoza', nickname: 'JR', email: 'jr.flores@tec.mx' },
  { community: 'Krei', hex: '#79858B', name: 'Karen Ariadna Guzmán Vega', nickname: 'Karen', email: 'kareng@tec.mx' },
  { community: 'Krei', hex: '#79858B', name: 'Karla Lorena Villarreal Aldape', nickname: 'Karla', email: 'kvillarreal@tec.mx' },
  { community: 'Krei', hex: '#79858B', name: 'Angélica Yolanda Zúñiga Montemayor', nickname: 'Angie', email: 'azuniga@tec.mx' },
  { community: 'Krei', hex: '#79858B', name: 'Juan José Franklin Uraga', nickname: 'Franklin', email: 'jjfranklin@tec.mx' },
];

const DEFAULT_STUDENTS = [
  { id: 1, name: 'Juan Pérez', preferredName: 'Juan', matricula: 'A01234567', email: 'A01234567@tec.mx', status: 'Test Completado', checkIn: 'No', mentor: 'JR', community: 'Krei' },
  { id: 2, name: 'Ana Sofía Garza', preferredName: 'Ana Sofía', matricula: 'A01998877', email: 'A01998877@tec.mx', status: 'Metas Seleccionadas', checkIn: 'Si', mentor: 'Karen', community: 'Krei' },
  { id: 3, name: 'Luis Martínez', preferredName: 'Luis', matricula: 'A01776655', email: 'A01776655@tec.mx', status: 'Pendiente', checkIn: 'No', mentor: 'Karla', community: 'Krei' },
  { id: 4, name: 'María Rodríguez', preferredName: 'María', matricula: 'A01554433', email: 'A01554433@tec.mx', status: 'Pendiente', checkIn: 'No', mentor: 'JR', community: 'Krei' },
];

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

export default function AdminDashboard() {
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
    return localStorage.getItem('navi_user_role') || 'admin';
  });
  const [mentors, setMentors] = useState(() => {
    const saved = localStorage.getItem('navi_mentors');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_MENTORS;
    return parsed.map(normalizeMentor);
  });

  // Tab 1: Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [isSendingInitial, setIsSendingInitial] = useState(false);

  // Tab 2: Upload
  const [uploadText, setUploadText] = useState('');
  
  // Tab 3: Demo Config
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [mentorSyncText, setMentorSyncText] = useState('');
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('navi_api_url') || DEFAULT_API_URL;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [bookingConfig, setBookingConfig] = useState(() => {
    const saved = localStorage.getItem('navi_booking_config');
    return saved ? JSON.parse(saved) : DEFAULT_BOOKING_CONFIG;
  });

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

  useEffect(() => {
    localStorage.setItem('navi_demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  useEffect(() => {
    localStorage.setItem('navi_user_role', userRole);
    
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
    localStorage.setItem('navi_booking_config', JSON.stringify(bookingConfig));
  }, [bookingConfig]);

  const stats = useMemo(() => {
    // Filter students by current mentor if applicable
    const scopeStudents = userRole === 'admin' 
      ? students 
      : students.filter(s => {
          const mentorEmail = userRole.split(':')[1];
          const mentor = mentors.find(m => m.email === mentorEmail);
          return s.mentor === mentor?.nickname;
        });

    const total = scopeStudents.length;
    const testCompletado = scopeStudents.filter(s => s.status === 'Test Completado' || s.status === 'Metas Seleccionadas').length;
    const metasSeleccionadas = scopeStudents.filter(s => s.status === 'Metas Seleccionadas').length;
    const noShows = scopeStudents.filter(s => s.status === 'Test Completado' && s.checkIn === 'No').length;
    return {
      total,
      testRate: Math.round((testCompletado / total) * 100) || 0,
      metasRate: Math.round((metasSeleccionadas / total) * 100) || 0,
      noShows,
      pendientes: total - testCompletado,
      scopeStudents // include for the table
    };
  }, [students, userRole, mentors]);

  const filteredStudents = stats.scopeStudents.filter(s => 
    s.matricula.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.preferredName && s.preferredName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const StatusBadge = ({ student }) => {
    const { status, checkIn } = student;
    
    // Logic for No-Show according to methodology (Test Done but Check-in No)
    if (status === 'Test Completado' && checkIn === 'No') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200 flex items-center w-fit">
          <ShieldAlert className="w-3 h-3 mr-1" /> ⚠ No-Show (Post-Test Pendiente)
        </span>
      );
    }

    const styles = {
      'Pendiente': 'bg-gray-100 text-gray-800 border-gray-200',
      'Test Completado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Metas Seleccionadas': 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', styles[status] || styles['Pendiente'])}>
        {status}
      </span>
    );
  };

  const handleOpenCampaignConfig = (type) => {
    setCampaignType(type);
    let defaults = {
      invitation: { 
        subject: 'Fase 1: Invitación a Diagnóstico Brújula', 
        body: '<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">' +
              '<h2 style="color: #0033A0;">Hola {{nombre}}!</h2>' +
              '<p>Soy <b>{{mentor}}</b> de la comunidad <b>{{comunidad}}</b>.</p>' +
              '<p>Te invito a entrar a <b>Navi</b> para comenzar tu diagnóstico de este semestre.</p>' +
              '<a href="#" style="background: #0033A0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Comenzar Ahora</a>' +
              '</div>' 
      },
      session: { 
        subject: 'Fase 2: Agenda tu sesión 1-a-1', 
        body: '<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">' +
              '<h2 style="color: #6366f1;">Sesión de Metas</h2>' +
              '<p>Hola {{nombre}}, ya hiciste tu test. Ahora es momento de vernos presencialmente para definir tus metas.</p>' +
              '<p>Te espera tu mentor(a): <b>{{mentor}}</b></p>' +
              '</div>' 
      },
      noshow: { 
        subject: 'Fase 3: Recopilación Post-Sesión', 
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

  const handleExecuteCampaign = () => {
    // Simular el envío masivo usando el filtro de mentores seleccionados
    const selectedMentorsData = mentors.filter(m => campaignConfig.selectedMentorEmails.includes(m.email));
    const targetStudentsCount = students.filter(s => {
      // Regla: Pendientes (Fase 1), Test Hecho (Fase 2), No-Show (Fase 3)
      if (campaignType === 'invitation') return s.status === 'Pendiente';
      if (campaignType === 'session') return s.status === 'Test Completado';
      if (campaignType === 'noshow') return s.status === 'Test Completado' && s.checkIn === 'No';
      return false;
    }).filter(s => {
      // Filtro por mentor seleccionado
      return selectedMentorsData.some(m => m.nickname === s.mentor);
    }).length;

    setIsSendingInitial(true); // Reutilizar loader genérico
    setTimeout(() => {
      alert(`[CAMPANHA ${campaignType.toUpperCase()}] Enviada con éxito a ${targetStudentsCount} alumnos de las comunidades seleccionadas.`);
      setIsCampaignModalOpen(false);
      setIsSendingInitial(false);
    }, 1500);
  };

  const handleParseUpload = () => {
    if (!uploadText.trim()) return;
    
    // Parse Tab-separated or Comma-separated values
    const lines = uploadText.split('\n').filter(line => line.trim());
    const newStudents = lines.map((line, idx) => {
      const parts = line.split(/[\t,]/).map(p => p.trim());
      // Expected: Matricula, Nombre, NombrePreferido (opcional), Correo, NicknameMentor (opcional)
      const hasPreferredName = parts.length >= 5;
      const preferredName = hasPreferredName ? parts[2] : '';
      const email = hasPreferredName ? parts[3] : parts[2];
      const mentorNick = hasPreferredName ? parts[4] : parts[3];
      const mentor = mentors.find(m => m.nickname === mentorNick || m.name === mentorNick);
      
      return {
        id: Date.now() + idx,
        matricula: parts[0] || `DESC-${idx}`,
        name: parts[1] || 'Sin Nombre',
        preferredName,
        email: email || 'sin@correo.com',
        mentor: mentorNick || 'Sin Asignar',
        community: mentor?.community || 'N/A',
        status: 'Pendiente',
        checkIn: 'No'
      };
    });

    setStudents(prev => [...prev, ...newStudents]);
    setUploadText('');
    alert(`Se han cargado ${newStudents.length} estudiantes exitosamente.`);
    setActiveTab('dashboard');
  };

  const handleFetchFromSheets = async () => {
    if (!apiUrl) return alert("Por favor configura la URL de la Web App en Ajustes");
    setIsSyncing(true);
    try {
      const data = await apiClient.get();
      if (data.students) setStudents(data.students.map((student, index) => normalizeStudent(student, index)));
      if (data.mentors) setMentors(data.mentors.map(normalizeMentor));
      alert("¡Sincronización completada desde Google Sheets!");
    } catch (err) {
      alert("Error al sincronizar: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheets = async () => {
    if (!apiUrl) return alert("Por favor configura la URL de la Web App en Ajustes");
    if (!window.confirm("¿Deseas sobreescribir los datos en Google Sheets con tu lista actual?")) return;
    
    setIsSyncing(true);
    try {
      await apiClient.post('syncBulk', { students, mentors });
      alert("¡Datos subidos exitosamente a Google Sheets!");
    } catch (err) {
      alert("Error al subir datos: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem('navi_api_url', apiUrl);
    alert("URL de API guardada correctamente.");
    window.location.reload(); // Reload to refresh client.js instance
  };

  const handleParseMentors = () => {
    if (!mentorSyncText.trim()) return;
    const lines = mentorSyncText.split('\n').filter(line => line.trim());
    const newMentors = lines.map(line => {
      const parts = line.split(/[\t|]/).map(p => p.trim());
      // Format: Comunidad | hex | nombre | nickname | email
      return {
        community: parts[0] || 'Sin Comunidad',
        hex: parts[1] || '#0033A0',
        name: parts[2] || 'Sin Nombre',
        nickname: parts[3] || parts[2],
        email: parts[4] || 'sin@correo.com'
      };
    });
    setMentors(newMentors);
    setMentorSyncText('');
    alert(`Se han actualizado ${newMentors.length} mentores.`);
  };

  const handleClearStudents = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar toda la base de estudiantes?")) {
      setStudents([]);
    }
  };

  const currentTabStyle = "border-brand-500 text-brand-600 font-bold";
  const defaultTabStyle = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium";

  return (
    <div className="mx-auto max-w-6xl py-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            Panel Administrativo
            {isDemoMode && (
              <span className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                <Beaker className="w-3 h-3 mr-1"/> MODO DEMO ACTIVO
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Gestión de cohortes, correos y visualización de la lista de estudiantes.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={handleFetchFromSheets} isLoading={isSyncing}>
              <Activity className="w-4 h-4 mr-2" /> Bajar de Sheets
           </Button>
           <Button size="sm" onClick={handlePushToSheets} isLoading={isSyncing}>
              <Upload className="w-4 h-4 mr-2" /> Subir a Sheets
           </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn("whitespace-nowrap flex items-center py-4 px-1 border-b-2 text-sm transition-colors", activeTab === 'dashboard' ? currentTabStyle : defaultTabStyle)}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Tablero de Progreso
          </button>
          
          
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('upload')}
                className={cn("whitespace-nowrap flex items-center py-4 px-1 border-b-2 text-sm transition-colors", activeTab === 'upload' ? currentTabStyle : defaultTabStyle)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Carga de Estudiantes
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={cn("whitespace-nowrap flex items-center py-4 px-1 border-b-2 text-sm transition-colors", activeTab === 'goals' ? currentTabStyle : defaultTabStyle)}
              >
                <Tags className="mr-2 h-4 w-4" />
                Banco de Metas
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={cn("whitespace-nowrap flex items-center py-4 px-1 border-b-2 text-sm transition-colors", activeTab === 'settings' ? currentTabStyle : defaultTabStyle)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Simulador de Roles
          </button>
        </nav>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-300">
          
          {userRole.startsWith('mentor:') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900">
                  Vista de Mentor: <span className="text-brand-600">{mentors.find(m => m.email === userRole.split(':')[1])?.name}</span>
                </h3>
                <p className="text-sm text-blue-700">Tu comunidad: <span className="font-bold">{mentors.find(m => m.email === userRole.split(':')[1])?.community}</span>. Solo ves a tus alumnos asignados.</p>
              </div>
            </div>
          )}

          {userRole === 'admin' && (
            <>
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm relative overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-indigo-900 mb-2 flex items-center"><Mail className="mr-2 h-5 w-5"/> Fase 1: Test Brújula</h3>
                    <p className="text-sm text-indigo-700/80 mb-4 h-10">Invitación masiva al diagnóstico inicial remoto.</p>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 relative z-10" 
                      onClick={() => handleOpenCampaignConfig('invitation')}
                      disabled={stats.pendientes === 0}
                    >
                      Configurar e Invitar ({stats.pendientes})
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-purple-900 mb-2 flex items-center"><CheckCircle className="mr-2 h-5 w-5"/> Fase 2: Mentoría</h3>
                    <p className="text-sm text-purple-700/80 mb-4 h-10">Agenda sesión presencial para Check-in y Metas.</p>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 relative z-10"
                      onClick={() => handleOpenCampaignConfig('session')}
                    >
                      Configurar Mensaje Sesión
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-orange-900 mb-2 flex items-center"><Send className="mr-2 h-5 w-5"/> Fase 3: No-Shows</h3>
                    <p className="text-sm text-orange-700/80 mb-4 h-10">Recuperación de Post-test para alumnos que faltaron a la sesión.</p>
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700 relative z-10"
                      onClick={() => handleOpenCampaignConfig('noshow')}
                      disabled={stats.noShows === 0}
                    >
                      Configurar Recuperación ({stats.noShows})
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 mr-4"><Users className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Alumnos</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.total}</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600 mr-4"><ShieldAlert className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">No-Shows</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.noShows}</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4"><Activity className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Test Hecho</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.testRate}%</h4>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4"><CheckCircle className="h-6 w-6"/></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Con Metas</p>
                      <h4 className="text-2xl font-bold text-gray-900">{stats.metasRate}%</h4>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <Card className="shadow-sm overflow-hidden border-gray-200">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-800">Directorio de Progreso</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar alumno..." 
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
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
                    <th className="px-6 py-4 font-medium">Check-in (On-Site)</th>
                    <th className="px-6 py-4 font-medium">Status Actual</th>
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
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-bold",
                            student.checkIn === 'Si' ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                          )}>
                            {student.checkIn === 'Si' ? 'SI' : 'NO'}
                          </span>
                        </td>
                        <td className="px-6 py-4"><StatusBadge student={student} /></td>
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
        </div>
      )}

      {/* TAB 2: UPLOAD */}
      {activeTab === 'upload' && (
        <div className="max-w-3xl animate-in fade-in duration-300">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-brand-100 rounded-xl text-brand-600">
                  <FileText className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Estudiantes</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Copia y pega los datos de tu Excel. El sistema identificará los campos si están separados por tabulaciones o comas. <br/>
                    **Orden esperado:** <code>Matrícula</code> | <code>Nombre</code> | <code>NombrePreferido (opcional)</code> | <code>Correo</code> | <code>NicknameMentor (opcional)</code>
                  </p>
                </div>
              </div>

              <textarea
                className="w-full rounded-xl border border-gray-300 p-4 text-sm font-mono text-gray-700 shadow-inner focus:border-brand-500 focus:ring-brand-500 transition-all resize-none mb-4"
                rows="10"
                placeholder={`A01234567\tJuan Pérez\tJuan\tA01234567@tec.mx\tJR\nA01998877\tAna Sofía Garza\tAna Sofía\tA01998877@tec.mx\tKaren`}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
              />

              <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClearStudents}>
                  <Trash2 className="w-4 h-4 mr-2"/> Borrar Directorio Actual
                </Button>
                <Button onClick={handleParseUpload} disabled={!uploadText.trim()}>
                  <Upload className="w-4 h-4 mr-2"/> Importar {uploadText.trim() ? uploadText.split('\n').filter(Boolean).length : 0} Registros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'goals' && userRole === 'admin' && (
        <div className="animate-in fade-in duration-300">
          <GoalManager />
        </div>
      )}

      {/* TAB 3: DEMO & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl animate-in fade-in duration-300 space-y-6">
          
          {/* Role Simulator */}
          <Card className="shadow-sm border-blue-200 bg-blue-50/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <Users className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Simulador de Roles (RBAC)</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Cambia el rol activo para previsualizar cómo experimentarán este panel los Mentores. En producción este rol vendrá directo de la cuenta institucional (@tec.mx).
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase">Simular Rol</h4>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
                    <button 
                      onClick={() => setUserRole('admin')}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap", userRole === 'admin' ? "bg-white shadow-sm text-brand-700" : "text-gray-500 hover:text-gray-900")}
                    >
                      Admin
                    </button>
                    {mentors.map(m => (
                      <button 
                        key={m.email}
                        onClick={() => setUserRole(`mentor:${m.email}`)}
                        className={cn("px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap", userRole === `mentor:${m.email}` ? "bg-white shadow-sm text-brand-700" : "text-gray-500 hover:text-gray-900")}
                      >
                        {m.nickname}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-purple-200 bg-purple-50/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <Users className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Sincronización de Mentores (Ruta C)</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Pega tu lista de mentores para habilitar la asociación automática y el cambio de colores por comunidad. <br/>
                    **Formato:** <code>Comunidad</code> | <code>HexColor</code> | <code>Nombre</code> | <code>Nickname</code> | <code>Email</code>
                  </p>
                </div>
              </div>

              <textarea
                className="w-full rounded-xl border border-gray-300 p-4 text-sm font-mono text-gray-700 shadow-inner focus:border-brand-500 focus:ring-brand-500 transition-all resize-none mb-4"
                rows="6"
                placeholder={`Krei\t#79858B\tKaren Ariadna\tKaren\tkareng@tec.mx`}
                value={mentorSyncText}
                onChange={(e) => setMentorSyncText(e.target.value)}
              />
              <Button onClick={handleParseMentors} disabled={!mentorSyncText.trim()}>
                Actualizar Lista de Mentores
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-orange-200 bg-orange-50/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                  <ShieldAlert className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Modo Demo / Simulador</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Al activar el Modo Demo, las campañas enviadas desde el Tablero no dispararán correos reales en el servidor (útil para capacitar mentores o hacer presentaciones).
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-orange-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">Estado del Modo Demo</h4>
                  <p className="text-sm text-gray-500">{isDemoMode ? "Activado. Entorno seguro para demostraciones." : "Desactivado. Operación de producción real."}</p>
                </div>
                <Button 
                  variant={isDemoMode ? "default" : "outline"}
                  className={isDemoMode ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => setIsDemoMode(!isDemoMode)}
                >
                  {isDemoMode ? "Desactivar Demo" : "Activar Demo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Envío de Correo de Prueba</h2>
              <p className="text-gray-500 text-sm mb-6">
                Envía un correo de la Campaña Fase 1 a ti mismo para que los directivos y mentores puedan ver exactamente cómo luce la interfaz en su bandeja de entrada.
              </p>

              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder="tu.correo@tec.mx" 
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button 
                  onClick={() => {
                    setIsSendingTest(true);
                    setTimeout(() => { alert("Correo de prueba entregado a: " + testEmail); setIsSendingTest(false); setTestEmail(''); }, 1200);
                  }}
                  disabled={!testEmail.includes('@')}
                  isLoading={isSendingTest}
                >
                  <Send className="w-4 h-4 mr-2"/> Enviar Prueba
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-blue-200 bg-blue-50/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <LayoutDashboard className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Conectividad Google Sheets</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Configura la URL de tu Web App de Google Apps Script para habilitar la sincronización en tiempo real.
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
                <p className="text-[10px] text-gray-400 italic">
                  ID actual detectado: {apiUrl ? apiUrl.split('/s/')[1]?.split('/')[0] : 'Ninguno'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <CalendarDays className="h-6 w-6"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Configuración de Agenda</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Define si los resultados deben dirigir a una sesión individual o a un registro grupal por bloques.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex bg-white p-1 rounded-lg overflow-x-auto max-w-full border border-emerald-200">
                  <button
                    onClick={() => setBookingConfig({
                      mode: 'individual',
                      url: BOOKING_URLS.individual,
                      cta: 'Agendar mi sesión',
                    })}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                      bookingConfig.mode === 'individual' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-900'
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
                      bookingConfig.mode === 'grupal' ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    Evento grupal
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Texto del botón</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                      value={bookingConfig.cta}
                      onChange={(e) => setBookingConfig((prev) => ({ ...prev, cta: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">URL activa</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500 font-mono text-xs"
                      value={bookingConfig.url}
                      onChange={(e) => setBookingConfig((prev) => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Modo actual: <span className="font-semibold text-gray-700">{bookingConfig.mode === 'individual' ? 'Sesión individual 1:1' : 'Registro a evento grupal'}</span>
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
                <h2 className="text-xl font-bold text-gray-900 flex items-center capitalize">
                  <Mail className="w-5 h-5 mr-2 text-brand-600" /> Configurar {campaignType}
                </h2>
                <p className="text-sm text-gray-500">Configura el contenido y los destinatarios del correo masivo.</p>
              </div>
              <button onClick={() => setIsCampaignModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Trash2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
              {/* Left Column: Config */}
              <div className="w-full md:w-1/2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Asunto del Correo</label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                    value={campaignConfig.subject}
                    onChange={(e) => setCampaignConfig({...campaignConfig, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Cuerpo HTML</label>
                  <div className="text-xs text-brand-600 mb-2 font-mono">Tags: {'{{nombre}} | {{mentor}} | {{comunidad}}'}</div>
                  <textarea 
                    className="w-full rounded-xl border border-gray-300 p-4 text-sm font-mono text-gray-700 shadow-inner focus:border-brand-500 focus:ring-brand-500 h-64 resize-none"
                    value={campaignConfig.htmlBody}
                    onChange={(e) => setCampaignConfig({...campaignConfig, htmlBody: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Comunidades Participantes</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Previsualización (Demo)</label>
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
                   <p className="text-[10px] text-gray-400 mt-4 text-center italic">Este es un render simulado del HTML final que recibirá el estudiante.</p>
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
                  onClick={() => {
                    if (!testEmail) return alert("Ingresa un correo de prueba");
                    setIsSendingTest(true);
                    setTimeout(() => {
                      alert(`[PRUEBA] Correo enviado a ${testEmail} con el asunto: ${campaignConfig.subject}`);
                      setIsSendingTest(false);
                    }, 1000);
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
                  Disparar Campaña Masiva
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
