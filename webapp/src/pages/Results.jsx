import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { readJourney, readPendingSubmission, readConfirmedPlan } from '../utils/journeyIntegrity';
import { readJourneyDiagnostic, readJourneyArrival } from '../utils/journeyDiagnostic';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { CATEGORY_META, DIAGNOSTIC_BANK } from '../data/diagnosticBank';
import {
  buildScoreData,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  getPriorityAreas,
  getInitialConversationAreas,
  getSuggestedConversationAreas,
  normalizeWhatsAppNumber,
  toggleConversationTopicSelection,
} from '../utils/testResults';

function getScoreData(diagnostic) {
  return buildScoreData(diagnostic, DIAGNOSTIC_BANK, CATEGORY_META);
}

function getTone(score) {
  if (score <= 2) return 'Con margen de crecimiento';
  if (score === 3) return 'En construcción';
  return 'Con avance sólido';
}

function getMicroPre(journey) {
  try {
    const parsed = readJourneyArrival(sessionStorage, journey);
    if (!parsed) return null;
    if (!parsed.intent && parsed.agency) {
      return { ...parsed, intent: parsed.agency };
    }
    if (parsed.summary && typeof parsed.summary === 'object' && !parsed.summary.intent && parsed.summary.agency) {
      return {
        ...parsed,
        summary: {
          ...parsed.summary,
          intent: parsed.summary.agency,
        },
      };
    }
    return parsed;
  } catch (error) {
    console.error('No se pudo leer el micro check-in de sesión:', error);
    return null;
  }
}

function getSessionArrivalCopy(microPre) {
  if (!microPre) return null;

  const arrivalCopy = {
    clear: 'Llegaste con energía y disposición para avanzar.',
    tired: 'Llegaste con algo de carga hoy.',
    scattered: 'Llegaste con muchas cosas en la cabeza.',
    uncertain: 'Llegaste con incertidumbre sobre tus siguientes pasos.',
  };

  const intentCopy = {
    review: 'Hoy te ayudaría revisar avances y ajustar lo que sigue.',
    prioritize: 'Hoy te ayudaría ordenar prioridades y saber por dónde empezar.',
    understand: 'Hoy te ayudaría entender algo que todavía te genera confusión.',
    plan: 'Hoy te ayudaría salir con un paso concreto, aunque sea pequeño.',
  };

  const arrival = arrivalCopy[microPre.arrival];
  const intent = intentCopy[microPre.intent];

  if (arrival && intent) {
    return `${arrival} ${intent}`;
  }

  return null;
}

export default function Results() {
  const [journey] = useState(() => readJourney(sessionStorage));
  const [diagnostic] = useState(() => readJourneyDiagnostic(sessionStorage, journey));
  const [hasPendingTest] = useState(() => {
    if (!journey) return false;
    try { return Boolean(readPendingSubmission(sessionStorage, journey, 'test')); }
    catch { return true; }
  });
  if (!journey) return <Navigate to="/" replace />;
  if (readConfirmedPlan(sessionStorage, journey)) return <Navigate to="/plan-accion" replace />;
  if (hasPendingTest || (!diagnostic && journey.mode !== 'presencial')) return <Navigate to="/test" replace />;
  return <JourneyResults journey={journey} diagnostic={diagnostic} />;
}

function JourneyResults({ journey, diagnostic }) {
  const navigate = useNavigate();
  const scoreData = getScoreData(diagnostic);
  const isSessionMode = journey.mode === 'presencial';
  const isMissingRemoteTest = scoreData.length === 0;
  const microPre = getMicroPre(journey);
  const sessionArrivalCopy = getSessionArrivalCopy(microPre);
  const priorityAreas = getPriorityAreas(scoreData);
  const priorityCount = priorityAreas.length;
  const suggestedAreas = getSuggestedConversationAreas(scoreData);
  const initialConversationAreas = getInitialConversationAreas(priorityAreas, suggestedAreas);
  const studentName = journey.displayName || '';
  const mentorName = journey.mentorName || '';
  const mentorWhatsApp = normalizeWhatsAppNumber(journey.mentorWhatsApp);
  const [selectedTopicKeys, setSelectedTopicKeys] = useState(() =>
    initialConversationAreas.map((item) => item.key)
  );
  const getSelectedLabels = (keys) => scoreData
    .filter((item) => keys.includes(item.key))
    .map((item) => item.label);
  const createMessage = (keys) => buildWhatsAppMessage({
    studentName,
    mentorName,
    topicLabels: getSelectedLabels(keys),
  });
  const whatsAppMessage = createMessage(selectedTopicKeys);
  const whatsAppUrl = buildWhatsAppUrl(mentorWhatsApp, whatsAppMessage);
  const canOpenWhatsApp = Boolean(whatsAppUrl && selectedTopicKeys.length > 0);

  const toggleConversationTopic = (key) => {
    setSelectedTopicKeys(toggleConversationTopicSelection(selectedTopicKeys, key));
  };

  return (
    <section className="clarity-results mx-auto max-w-5xl py-4 sm:py-8">
      {scoreData.length === 0 && isSessionMode && isMissingRemoteTest ? (
        <Card className="border border-[rgba(210,106,92,0.20)] bg-[rgba(249,236,232,0.72)]">
          <CardContent className="p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)]">
              Test pendiente
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--ink-900)]">
              Aún no contamos con tu test previo
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)]">
              Puedes continuar esta sesión con apoyo de tu mentor o mentora y usar este momento para definir tus metas. Después podrás completar el test para tener una lectura más completa de tu trayectoria.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('/seleccion-metas')}>
                Ir a mis metas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/test')}
              >
                Responder el test ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : scoreData.length === 0 ? (
        <Card className="border border-[rgba(210,106,92,0.2)] bg-[var(--coral-100)]">
          <CardContent className="p-7">
            <p className="font-medium text-[var(--coral-500)]">
              No encontramos respuestas guardadas del test. {isSessionMode ? 'Asegúrate de haber completado el test remoto antes de continuar con la sesión.' : 'Regresa a contestarlo antes de continuar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="clarity-results-summary overflow-hidden">
            <CardContent className="p-10 sm:p-12">
              <p className={isSessionMode ? 'navi-eyebrow' : 'text-center text-sm font-semibold tracking-[0.02em] text-[var(--ink-600)]'}>
                {isSessionMode ? 'Tu sesión de hoy' : 'faro · ruta guiada de acompañamiento'}
              </p>
              <div className={`mt-5 ${isSessionMode ? 'max-w-2xl' : 'mx-auto max-w-3xl text-center'}`}>
                {isSessionMode ? (
                  <div className="space-y-4">
                    {sessionArrivalCopy ? (
                      <div className="rounded-[18px] border border-[rgba(15,76,129,0.10)] bg-[var(--surface-raised)] px-5 py-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)]">
                          Cómo llegas hoy
                        </p>
                        <p className="mt-3 text-base leading-7 text-[var(--ink-700)]">
                          {sessionArrivalCopy}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {priorityCount > 0 ? (
                      <>
                        <div className="font-display text-6xl font-bold leading-none tracking-[-0.06em] text-[var(--navy-700)] sm:text-7xl">
                          {priorityCount}
                        </div>
                        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--navy-600)] sm:text-3xl">
                          {priorityCount === 1 ? 'tema para conversar en mentoría' : 'temas para conversar en mentoría'}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          {priorityAreas.map(({ key, label }) => (
                            <span
                              key={key}
                              className="rounded-full bg-[rgba(15,76,129,0.08)] px-3 py-1.5 text-sm font-medium text-[var(--navy-600)]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        <p className="mt-4 text-lg leading-8 text-[var(--ink-700)]">
                          {priorityCount === 1
                            ? 'Este tema puede ser un buen punto de partida para tu próxima conversación.'
                            : 'No necesitas abordar todo a la vez. Enseguida podrás elegir con qué te gustaría empezar.'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--coral-500)]">
                          Tu siguiente conversación
                        </p>
                        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--navy-700)] sm:text-4xl">
                          Tienes una base sólida para seguir avanzando
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[var(--ink-700)]">
                          Tus respuestas muestran avances en todas las áreas. Conversar sobre lo que quieres fortalecer puede ayudarte a anticipar decisiones y definir el siguiente paso.
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className={`mt-10 ${isSessionMode ? 'text-left' : 'text-center'}`}>
                {isSessionMode ? (
                  <Button size="lg" onClick={() => navigate('/seleccion-metas')}>
                    Ir a mis metas
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <div className="mx-auto max-w-3xl rounded-[18px] border border-[rgba(15,76,129,0.12)] bg-[var(--surface-raised)] p-5 text-left sm:p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--navy-500)]">
                      ¿Con qué te gustaría empezar?
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-600)]">
                      Elige uno o dos temas para preparar tu mensaje. Los demás seguirán visibles en tus resultados.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scoreData.map(({ key, label }) => {
                        const isSelected = selectedTopicKeys.includes(key);
                        const isDisabled = !isSelected && selectedTopicKeys.length >= 2;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isDisabled}
                            onClick={() => toggleConversationTopic(key)}
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'border-[var(--navy-500)] bg-[var(--navy-500)] text-white'
                                : isDisabled
                                  ? 'cursor-not-allowed border-[rgba(15,76,129,0.08)] bg-[rgba(15,76,129,0.03)] text-[var(--ink-400)]'
                                  : 'border-[rgba(15,76,129,0.16)] bg-white text-[var(--navy-600)] hover:border-[var(--navy-500)]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {mentorWhatsApp ? (
                      <div className="mt-5">
                        {canOpenWhatsApp ? (
                          <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" className="block sm:inline-block">
                            <Button size="lg" className="w-full px-7 sm:w-auto">
                              <MessageCircle className="mr-2 h-5 w-5" />
                              Escribir por WhatsApp
                            </Button>
                          </a>
                        ) : (
                          <Button size="lg" className="w-full px-7 sm:w-auto" disabled>
                            <MessageCircle className="mr-2 h-5 w-5" />
                            Elige al menos un tema
                          </Button>
                        )}
                        <p className="mt-3 text-sm leading-6 text-[var(--ink-500)]">
                          Prepararemos el mensaje con los temas que elegiste. Podrás revisarlo o cambiarlo en WhatsApp antes de enviarlo.
                        </p>
                      </div>
                    ) : null}
                    {!mentorWhatsApp ? (
                      <p className="mt-3 text-sm text-[var(--ink-500)]">
                        No encontramos un número de WhatsApp vigente. Puedes responder al correo con el que recibiste el test para contactar a tu mentor o mentora.
                      </p>
                    ) : null}
                  </div>
                )}

                {isSessionMode ? (
                  <p className="mt-6 text-sm text-[var(--ink-500)]">
                    Revisa nuevamente tus respuestas del test y avancemos a definir las mejores metas.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div>
            <p className="navi-eyebrow mb-4">Cómo está cada área</p>
          </div>

          <div className="space-y-4">
            {scoreData.map(({ key, label, recommendation, score }) => {
              const percentage = (score / 5) * 100;
              return (
                <Card key={key}>
                  <CardContent className="p-6 sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="max-w-xl">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-[var(--navy-700)]">
                            {label}
                          </h3>
                          <span className="rounded-full bg-[rgba(15,76,129,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--navy-500)]">
                            {getTone(score)}
                          </span>
                        </div>
                        <p className="mt-3 text-base leading-7 text-[var(--ink-700)]">
                          {recommendation}
                        </p>
                      </div>

                      <div className="w-full max-w-sm">
                        <div className="h-3 overflow-hidden rounded-full bg-[rgba(15,76,129,0.10)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              background: 'var(--coral-500)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
