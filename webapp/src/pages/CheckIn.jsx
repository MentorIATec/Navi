import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, UserCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { resumeEncounter } from '../utils/encounterContinuation';
import { getCheckInErrorMessage } from '../utils/checkInErrors';
import { clearSessionContinuation, selectMentorAssistedContinuation } from '../utils/sessionContinuation';
import { beginJourney, readJourney, assertCurrentJourney } from '../utils/journeyIntegrity';
import { persistJourneyDiagnostic } from '../utils/journeyDiagnostic';
import { getCheckInRequestId, applyJourneyTheme } from '../utils/journeyEntry';

export default function CheckIn() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState(() => readJourney(sessionStorage)?.matricula || '');
  const [preferredName, setPreferredName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [returningEncounter, setReturningEncounter] = useState(null);
  const [missingRemoteTest, setMissingRemoteTest] = useState(null);

  const isValidMatricula = /^A[0-9]{8}$/i.test(matricula.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidMatricula) {
      setErrorMessage('Confirma una matrícula válida con formato A12345678.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const requestId = getCheckInRequestId(sessionStorage, matricula.toUpperCase());
      const { student, mentor, testResponse, registration, operationalCycle } = await apiClient.post('startStudentCheckIn', {
        matricula: matricula.toUpperCase(),
        requestId,
        modality: 'presencial',
        preferredName: preferredName.trim(),
      });

      const resolvedDisplayName = preferredName.trim() || student?.nombrepreferido || student?.preferredName || student?.nombre || student?.name || '';
      const journey = beginJourney(sessionStorage, { matricula: student.matricula, operationalCycle,
        checkInId: registration?.checkInId, entryRequestId: requestId, displayName: resolvedDisplayName,
        community: student.community || student.comunidad || '', color: mentor?.hex || '', slogan: mentor?.slogan || '',
        mode: 'presencial', mentorName: mentor?.nombre || mentor?.name || '', mentorWhatsApp: mentor?.whatsappE164 || '' });
      const hasTest = persistJourneyDiagnostic(sessionStorage, journey, testResponse);
      clearSessionContinuation(sessionStorage);
      applyJourneyTheme(document.documentElement.style, journey);

      if (registration?.reused && registration.continuation) {
        if (registration.continuation.plan) {
          navigate(resumeEncounter(sessionStorage, journey, registration.continuation));
          return;
        }
        setReturningEncounter({ journey, continuation: registration.continuation });
        return;
      }

      if (hasTest) {
        navigate('/pre-test');
        return;
      }

      setMissingRemoteTest({
        name: resolvedDisplayName,
        status: student?.status || 'Pendiente',
      });
    } catch (error) {
      console.error('No se pudo registrar el check-in o consultar el estatus del alumno:', error);
      setErrorMessage(getCheckInErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeDiagnosticNow = () => {
    clearSessionContinuation(sessionStorage);
    navigate('/test');
  };

  const handleContinueWithMentor = () => {
    try {
      const journey = readJourney(sessionStorage);
      assertCurrentJourney(sessionStorage, journey);
      if (!selectMentorAssistedContinuation(sessionStorage, journey.matricula, journey.checkInId)) {
        setErrorMessage('Confirma nuevamente tu matrícula para continuar con tu mentor.');
        return;
      }
      navigate('/pre-test');
    } catch {
      setErrorMessage('No pudimos conservar tu elección en este dispositivo. Intenta nuevamente.');
    }
  };

  return (
    <div className="clarity-checkin mx-auto max-w-5xl py-8 sm:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="clarity-checkin-hero shell-panel relative overflow-hidden rounded-[18px] border border-[rgba(210,106,92,0.18)] px-8 py-10 sm:px-10 sm:py-12">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: 'linear-gradient(90deg, var(--coral-500) 0%, var(--navy-500) 100%)' }}
          />
          <div className="relative max-w-2xl">
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Comencemos tu sesión de mentoría
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
                  {returningEncounter ? 'Continuemos' : 'Confirma tu matrícula'}
                </h2>
              </div>
            </div>
          {returningEncounter ? <div className="space-y-5" role="status">
            <h3 className="text-xl font-semibold">{returningEncounter.continuation.preTestSummary ? 'Sigamos con tus metas' : 'Cuéntanos cómo llegas hoy'}</h3>
            <p>{returningEncounter.continuation.preTestSummary ? 'Elige una meta para tu avance académico o profesional y otra para tu bienestar.' : 'Responde dos preguntas sobre cómo te sientes y qué te gustaría conversar en esta sesión.'}</p>
            <Button className="w-full" onClick={() => {
              try { navigate(resumeEncounter(sessionStorage, returningEncounter.journey, returningEncounter.continuation)); }
              catch (error) { setErrorMessage(error.message); }
            }}>{returningEncounter.continuation.preTestSummary ? 'Elegir mis metas' : 'Responder las preguntas'}</Button>
            <Button variant="ghost" onClick={() => { setReturningEncounter(null); setMatricula(''); setPreferredName(''); }}>Usar otra matrícula</Button>
            {errorMessage ? <p role="alert" className="text-red-600">{errorMessage}</p> : null}
          </div> : <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <label htmlFor="preferredName" className="text-sm font-semibold text-[var(--ink-700)]">
                ¿Cómo deseas que te llamen?
              </label>
              <input
                type="text"
                id="preferredName"
                placeholder="Nombre de pila o nombre preferido"
                className="block w-full rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/80 p-4 text-[var(--ink-900)] focus:border-[rgba(210,106,92,0.45)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[rgba(210,106,92,0.12)] transition-all"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                maxLength={80}
              />
              <p className="text-sm text-[var(--ink-700)]">
                Opcional. Así te llamará tu mentor o mentora.
              </p>
            </div>

            <Button
              type="submit"
              className="group w-full"
              size="lg"
              disabled={!isValidMatricula}
              isLoading={isLoading}
            >
              {missingRemoteTest ? 'Actualizar matrícula' : 'Registrar mi llegada'}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>

            {missingRemoteTest ? (
              <div className="rounded-[18px] border border-[rgba(210,106,92,0.20)] bg-[rgba(249,236,232,0.72)] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)]">
                  Test pendiente
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--ink-900)]">
                  No encontramos tu test previo
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-700)]">
                  {missingRemoteTest.name
                    ? `${missingRemoteTest.name.split(' ')[0]}, `
                    : ''}
                  para aprovechar mejor la sesión conviene completar primero el test remoto. Si hoy no es posible, puedes continuar con apoyo de tu mentor o mentora y definir tus metas desde esta sesión.
                </p>
                <p className="mt-3 text-sm font-medium text-[var(--navy-700)]">
                  Tu llegada ya quedó registrada. Elige cómo quieres continuar.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Button type="button" size="lg" className="w-full" onClick={handleTakeDiagnosticNow}>
                    Responder el test ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleContinueWithMentor}>
                    Continuar con acompañamiento
                  </Button>
                </div>
              </div>
            ) : null}
          </form>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
