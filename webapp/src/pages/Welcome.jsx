import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, UserCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { resumeEncounter } from '../utils/encounterContinuation';
import { beginJourney } from '../utils/journeyIntegrity';
import { persistJourneyDiagnostic } from '../utils/journeyDiagnostic';
import { applyJourneyTheme } from '../utils/journeyEntry';
import { clearSessionContinuation } from '../utils/sessionContinuation';

export default function Welcome() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidMatricula = /^A[0-9]{8}$/i.test(matricula.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidMatricula) {
      setErrorMessage('Ingresa una matrícula válida con formato A12345678.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await apiClient.post('getStudentEntry', { matricula: matricula.toUpperCase() });
      const student = response?.student;
      const mentor = response?.mentor;
      const testResponse = response?.testResponse;

      if (!student) {
        setErrorMessage('No encontramos tu matrícula en la base de estudiantes. Si crees que es un error, consulta con la persona que te acompaña o con la coordinación de mentoría antes de continuar.');
        return;
      }

      const storedPreferredName =
        preferredName.trim() ||
        student.nombrepreferido ||
        student.preferredName ||
        '';
      const resolvedDisplayName =
        storedPreferredName ||
        student.nombre ||
        student.name ||
        '';

      const journey = beginJourney(sessionStorage, { matricula: student.matricula, operationalCycle: response.operationalCycle,
        checkInId: response.continuation?.checkInId || '', displayName: resolvedDisplayName, community: student.community || student.comunidad || '',
        color: mentor?.hex || '', slogan: mentor?.slogan || '', mode: response.continuation ? 'presencial' : 'remoto',
        mentorName: mentor?.nombre || mentor?.name || '', mentorWhatsApp: mentor?.whatsappE164 || '' });
      const hasTest = persistJourneyDiagnostic(sessionStorage, journey, testResponse);
      clearSessionContinuation(sessionStorage);
      applyJourneyTheme(document.documentElement.style, journey);

      if (preferredName.trim() && preferredName.trim() !== (student.nombrepreferido || student.preferredName || '')) {
        await apiClient.post('saveStudentPreference', {
          matricula: student.matricula || matricula.toUpperCase(),
          preferredName: preferredName.trim(),
        });
      }

      if (response.continuation) {
        navigate(resumeEncounter(sessionStorage, journey, response.continuation));
        return;
      }

      if (hasTest) {
        navigate('/resultados');
        return;
      }

      navigate('/test');
    } catch (error) {
      console.error('No se pudo resolver la matrícula en backend:', error);
      setErrorMessage('No pudimos validar tu matrícula en este momento. Intenta de nuevo en unos minutos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="clarity-welcome grid min-h-[72vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
      <div className="clarity-welcome-hero relative overflow-hidden rounded-[28px] bg-[var(--surface-raised)] px-7 py-10 text-white  sm:px-10 sm:py-12">
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-[rgba(210,106,92,0.26)] blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
        <div className="absolute inset-y-0 right-10 hidden w-px bg-[var(--surface-raised)] lg:block" />
        <div className="absolute bottom-10 right-10 hidden h-40 w-40 rounded-full border border-white/8 lg:block" />
        <div className="absolute bottom-18 right-18 hidden h-24 w-24 rounded-full border border-white/10 lg:block" />

        <div className="relative z-10 max-w-xl">
          <p className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.28em] text-white/62">
            Tu espacio de mentoría
          </p>
          <h1 className="font-display text-5xl font-bold tracking-[-0.05em] text-white sm:text-6xl">
            Un espacio para pensar en lo que sigue.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/78">
            Explora tu momento actual y los temas que te gustaría conversar en tu mentoría.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-7 sm:p-9">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-[-0.04em] text-[var(--navy-700)]">
              Ingresa tu matrícula
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="matricula" className="text-sm font-semibold text-[var(--ink-900)]">
                Matrícula Estudiantil
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--ink-700)]">
                  <UserCircle className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="matricula"
                  placeholder="Ej. A01234567"
                  className="block w-full rounded-[20px] border border-[rgba(15,76,129,0.16)] bg-white/88 p-4 pl-12 text-lg font-medium text-[var(--ink-900)]  outline-none transition-all uppercase placeholder:text-[var(--ink-700)] focus:border-[var(--theme-color)] focus:bg-white focus:"
                  value={matricula}
                  onChange={(e) => {
                    setMatricula(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  maxLength={9}
                  required
                />
              </div>
              {errorMessage ? (
                <p className="rounded-2xl bg-[var(--coral-100)] px-4 py-3 text-sm font-medium text-[var(--coral-500)]">
                  {errorMessage}
                </p>
              ) : (
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-700)]">
                  Formato esperado: A seguido de 8 dígitos
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label htmlFor="preferredName" className="text-sm font-semibold text-[var(--ink-900)]">
                ¿Cómo deseas que te llamen?
              </label>
              <input
                type="text"
                id="preferredName"
                placeholder="Nombre de pila o nombre preferido"
                className="block w-full rounded-[20px] border border-[rgba(15,76,129,0.16)] bg-white/88 p-4 text-lg font-medium text-[var(--ink-900)]  outline-none transition-all placeholder:text-[var(--ink-700)] focus:border-[var(--theme-color)] focus:bg-white focus:"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-700)]">
                Opcional. Así te llamará tu mentor o mentora.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full group"
              size="lg"
              disabled={!isValidMatricula}
              isLoading={isLoading}
            >
              Continuar
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-xs leading-6 text-[var(--ink-700)]">
              Al continuar, aceptas el{' '}
              <a
                href="https://tec.mx/es/aviso-de-privacidad-alumnos"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[var(--navy-700)] underline underline-offset-2"
              >
                Aviso de Privacidad del Tecnológico de Monterrey
              </a>
              .
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
