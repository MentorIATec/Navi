import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, UserCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';

export default function CheckIn() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState(localStorage.getItem('navi_matricula') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [missingRemoteTest, setMissingRemoteTest] = useState(null);

  const isValidMatricula = /^A[0-9]{8}$/i.test(matricula.trim());

  const registerPresence = async (student, mentor) => {
    const normalizedMatricula = matricula.toUpperCase();
    await apiClient.post('updateStudent', {
      matricula: normalizedMatricula,
      checkIn: 'Si',
    });

    localStorage.setItem('navi_matricula', normalizedMatricula);
    localStorage.setItem('navi_checked_in', 'true');
    localStorage.setItem('navi_session_mode', 'presencial');

    if (student?.name) localStorage.setItem('navi_user_name', student.name);
    if (student?.mentor) localStorage.setItem('navi_user_mentor', student.mentor);
    if (student?.community || student?.comunidad) {
      localStorage.setItem('navi_user_community', student.community || student.comunidad);
    }
    if (mentor?.hex) {
      document.documentElement.style.setProperty('--theme-color', mentor.hex);
      localStorage.setItem('navi_community_color', mentor.hex);
    }
    if (mentor?.nombre || mentor?.name) {
      localStorage.setItem('navi_mentor_name', mentor.nombre || mentor.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidMatricula) {
      setErrorMessage('Confirma una matrícula válida con formato A12345678.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { student, mentor } = await apiClient.post('findStudent', {
        matricula: matricula.toUpperCase(),
      });

      await registerPresence(student, mentor);

      if (student?.status === 'Test Completado' || student?.status === 'Metas Seleccionadas') {
        localStorage.removeItem('navi_missing_remote_test');
        navigate('/pre-test');
        return;
      }

      localStorage.setItem('navi_missing_remote_test', 'true');
      setMissingRemoteTest({
        name: student?.name || '',
        status: student?.status || 'Pendiente',
      });
    } catch (error) {
      console.error('No se pudo registrar el check-in o consultar el estatus del alumno:', error);
      setErrorMessage(
        error?.message === 'Alumno no encontrado'
          ? 'No encontramos esta matrícula en el registro. Revísala con tu mentor o mentora antes de continuar.'
          : 'No pudimos registrar tu llegada a la sesión. Verifica tu conexión e intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeDiagnosticNow = () => {
    navigate('/test');
  };

  const handleContinueWithMentor = () => {
    navigate('/pre-test');
  };

  return (
    <div className="mx-auto max-w-5xl py-8 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="shell-panel relative overflow-hidden rounded-[30px] border border-[rgba(210,106,92,0.18)] px-8 py-10 sm:px-10 sm:py-12">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: 'linear-gradient(90deg, var(--coral-500) 0%, var(--navy-500) 100%)' }}
          />
          <div className="relative max-w-2xl">
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Bienvenido a tu sesión de mentoría
            </h1>
            <p className="navi-prose mt-4 max-w-xl text-base sm:text-lg">
              Confirma tu matrícula para registrar tu llegada y continuar con el siguiente paso de la sesión.
            </p>
          </div>
        </div>

        <Card className="w-full border-[rgba(210,106,92,0.16)]">
          <CardContent className="p-7 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(249,236,232,0.92)] text-[var(--coral-500)] shadow-inner">
                <MapPin className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--ink-900)]">
                  Confirma tu matrícula
                </h2>
              </div>
            </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="matricula" className="text-sm font-semibold text-[var(--ink-700)]">
                Confirmar Matrícula
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--ink-700)]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="matricula"
                  placeholder="Ej. A01234567"
                  className="block w-full rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/80 p-4 pl-11 text-[var(--ink-900)] focus:border-[rgba(210,106,92,0.45)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(210,106,92,0.12)] transition-all uppercase"
                  value={matricula}
                  onChange={(e) => {
                    setMatricula(e.target.value);
                    if (errorMessage) setErrorMessage('');
                    if (missingRemoteTest) setMissingRemoteTest(null);
                  }}
                  maxLength={9}
                  required
                />
              </div>
              {errorMessage ? (
                <p className="text-sm font-medium text-red-600">{errorMessage}</p>
              ) : null}
              {!errorMessage ? (
                <p className="text-sm text-[var(--ink-700)]">
                  La usaremos para ubicar tu registro y continuar con este momento de la sesión.
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="group w-full"
              size="lg"
              disabled={!isValidMatricula}
              isLoading={isLoading}
            >
              Ir al siguiente paso
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>

            {missingRemoteTest ? (
              <div className="rounded-[22px] border border-[rgba(210,106,92,0.20)] bg-[rgba(249,236,232,0.72)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)]">
                  Diagnóstico pendiente
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--ink-900)]">
                  No encontramos tu diagnóstico previo
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
                  {missingRemoteTest.name
                    ? `${missingRemoteTest.name.split(' ')[0]}, `
                    : ''}
                  para aprovechar mejor la sesión conviene completar primero el diagnóstico remoto. Si hoy no es posible, puedes continuar con apoyo de tu mentor o mentora y definir tus metas desde esta sesión.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Button type="button" size="lg" className="w-full" onClick={handleTakeDiagnosticNow}>
                    Responder diagnóstico ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleContinueWithMentor}>
                    Continuar con apoyo del mentor
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
