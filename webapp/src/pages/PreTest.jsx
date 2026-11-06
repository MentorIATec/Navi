import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { cn } from '../utils/cn';
import { consumePostPreTestRoute } from '../utils/sessionContinuation';
import { readJourney, assertCurrentJourney, readConfirmedPlan } from '../utils/journeyIntegrity';
import { persistJourneyArrival, readJourneyDiagnostic } from '../utils/journeyDiagnostic';

const arrivalOptions = [
  { id: 'clear', label: 'Con energía y ganas de avanzar' },
  { id: 'tired', label: 'Con algo de carga o cansancio' },
  { id: 'scattered', label: 'Con muchas cosas en la cabeza' },
  { id: 'uncertain', label: 'Con incertidumbre sobre mis siguientes pasos' },
];

const intentOptions = [
  { id: 'review', label: 'Revisar mis avances y ajustar lo que sigue' },
  { id: 'prioritize', label: 'Ordenar mis prioridades y saber por dónde empezar' },
  { id: 'understand', label: 'Entender algo que me tiene confundido/a' },
  { id: 'plan', label: 'Salir con un paso concreto, aunque sea pequeño' },
];

function getMicroPreSummary(answers) {
  const arrivalSummary = {
    clear: 'Llega con energía y ganas de avanzar',
    tired: 'Llega con algo de carga o cansancio',
    scattered: 'Llega con muchas cosas en la cabeza',
    uncertain: 'Llega con incertidumbre sobre sus siguientes pasos',
  };

  const intentSummary = {
    review: 'Quiere revisar avances y ajustar lo que sigue',
    prioritize: 'Quiere ordenar prioridades y saber por dónde empezar',
    understand: 'Quiere entender algo que hoy le genera confusión',
    plan: 'Quiere salir con un paso concreto',
  };

  return {
    arrival: arrivalSummary[answers.arrival] || '',
    intent: intentSummary[answers.intent] || '',
  };
}

export default function PreTest() {
  const navigate = useNavigate();
  const [journey] = useState(() => readJourney(sessionStorage));
  const isSessionMode = journey?.mode === 'presencial';
  const matricula = journey?.matricula;
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isComplete = useMemo(
    () => Boolean(answers.arrival && answers.intent),
    [answers]
  );

  const handleSelect = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      assertCurrentJourney(sessionStorage, journey);
      const summary = getMicroPreSummary(answers);
      const textSummary = `${summary.arrival} · ${summary.intent}`;
      const syncPayload = {
        matricula,
        checkInId: journey.checkInId || undefined,
        preTestSummary: textSummary,
      };

      const persistAndContinue = () => {
        persistJourneyArrival(sessionStorage, journey, {
          ...answers, summary, textSummary,
          agency: answers.intent,
        });
        navigate(consumePostPreTestRoute(sessionStorage, {
          matricula, checkInId: syncPayload.checkInId, missingTest: !readJourneyDiagnostic(sessionStorage, journey),
        }));
      };

      try {
        await apiClient.post('completeCheckInPreTest', syncPayload);
      } catch (error) {
        console.error('Error enviando pre-test:', error);
        if ([401, 403, 409].includes(error.statusCode)) throw error;
      }
      persistAndContinue();
    } catch (error) {
      setErrorMessage(error.message || 'No pudimos conservar este momento. Intenta nuevamente.');
    } finally { setIsSubmitting(false); }
  };

  if (readConfirmedPlan(sessionStorage, journey)) return <Navigate to="/plan-accion" replace />;

  return (
    <div className="clarity-pretest mx-auto max-w-4xl py-8 sm:py-12">
      {errorMessage && <p role="alert" className="mb-4 text-red-600">{errorMessage}</p>}
      <div className="mb-8 space-y-4">
        <div>
          <p className="navi-eyebrow" style={{ color: isSessionMode ? 'var(--coral-500)' : 'var(--ink-700)' }}>
            Termómetro de Sesión
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            Cuéntanos cómo llegas hoy
          </h2>
          <p className="navi-prose mt-3 max-w-2xl text-sm sm:text-base">
            Antes de continuar, cuéntanos cómo llegas hoy.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-[rgba(15,76,129,0.12)]">
        <CardContent className="clarity-pretest-questions space-y-8 p-8 sm:p-12">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-900)] sm:text-[2rem]">
              Hoy llego a esta sesión...
            </h3>
            <div className="grid gap-3">
              {arrivalOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect('arrival', option.id)}
                  aria-pressed={answers.arrival === option.id}
                  disabled={isSubmitting}
                  className={cn(
                    'answer-shift stage-card-lift w-full rounded-[18px] border px-5 py-4 text-left transition-all active:scale-[0.99]',
                    answers.arrival === option.id
                      ? 'border-[rgba(15,76,129,0.35)] bg-[var(--surface-raised)] '
                      : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white '
                  )}
                >
                  <span className="font-medium text-[var(--ink-900)]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-900)] sm:text-[2rem]">
              Lo que más me gustaría que pasara en esta sesión es...
            </h3>
            <div className="grid gap-3">
              {intentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect('intent', option.id)}
                  aria-pressed={answers.intent === option.id}
                  disabled={isSubmitting}
                  className={cn(
                    'answer-shift stage-card-lift w-full rounded-[18px] border px-5 py-4 text-left transition-all active:scale-[0.99]',
                    answers.intent === option.id
                      ? 'border-[rgba(15,76,129,0.35)] bg-[var(--surface-raised)] '
                      : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white '
                  )}
                >
                  <span className="font-medium text-[var(--ink-900)]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--ink-700)]">
              {isComplete ? 'Listo. Puedes continuar.' : 'Responde las dos preguntas para continuar.'}
            </p>
            <Button
              size="lg"
              disabled={!isComplete || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleContinue}
              className="w-full sm:w-auto"
            >
              Continuar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
