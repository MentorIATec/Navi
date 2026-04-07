import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { CATEGORY_META, DIAGNOSTIC_BANK } from '../data/diagnosticBank';

const DEFAULT_BOOKING_CONFIG = {
  mode: 'individual',
  url: 'https://outlook.office.com/book/RecalculandoRutaMentoraparaevaluartutrayectoria@tecmx.onmicrosoft.com/?ismsaljsauthenabled',
  cta: 'Agendar mi sesión',
};

function getScoreData() {
  const rawPayload = localStorage.getItem('navi_diagnostic_payload');
  if (!rawPayload) return [];

  try {
    const payload = JSON.parse(rawPayload);
    const stage = payload.stage;
    const answers = payload.answers || {};
    const questions = payload.questions || DIAGNOSTIC_BANK[stage] || [];

    return questions.map(({ key, category, title }) => ({
      key,
      category,
      title,
      label: CATEGORY_META[category]?.label || title,
      recommendation: CATEGORY_META[category]?.recommendation || 'Conviene revisar esta área con más detalle durante la mentoría.',
      score: Number(answers[key] || 0),
    }));
  } catch (error) {
    console.error('No se pudieron leer las respuestas del diagnóstico:', error);
    return [];
  }
}

function getTone(score) {
  if (score <= 2) return 'Con margen de crecimiento';
  if (score === 3) return 'En construcción';
  return 'Con avance sólido';
}

function getPriorityAreas(scoreData) {
  return scoreData.filter((item) => item.score > 0 && item.score <= 2);
}

function getBookingConfig() {
  try {
    const rawConfig = localStorage.getItem('navi_booking_config');
    if (!rawConfig) return DEFAULT_BOOKING_CONFIG;
    return { ...DEFAULT_BOOKING_CONFIG, ...JSON.parse(rawConfig) };
  } catch (error) {
    console.error('No se pudo leer la configuración de agenda:', error);
    return DEFAULT_BOOKING_CONFIG;
  }
}

function getMicroPre() {
  try {
    const raw = localStorage.getItem('micro_pre');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('No se pudo leer el micro check-in de sesión:', error);
    return null;
  }
}

export default function Results() {
  const navigate = useNavigate();
  const scoreData = getScoreData();
  const isSessionMode = localStorage.getItem('navi_session_mode') === 'presencial';
  const isMissingRemoteTest = localStorage.getItem('navi_missing_remote_test') === 'true';
  const bookingConfig = getBookingConfig();
  const microPre = getMicroPre();
  const priorityAreas = getPriorityAreas(scoreData);
  const priorityCount = priorityAreas.length;

  return (
    <section className="mx-auto max-w-5xl py-4 sm:py-8">
      {scoreData.length === 0 && isSessionMode && isMissingRemoteTest ? (
        <Card className="border border-[rgba(210,106,92,0.20)] bg-[rgba(249,236,232,0.72)]">
          <CardContent className="p-7 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)]">
              Diagnóstico pendiente
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--ink-900)]">
              Aún no contamos con tu diagnóstico previo
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-700)]">
              Puedes continuar esta sesión con apoyo de tu mentor o mentora y usar este momento para definir tus metas. Después podrás completar tu diagnóstico para tener una lectura más completa de tu trayectoria.
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
                Responder diagnóstico ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : scoreData.length === 0 ? (
        <Card className="border border-[rgba(210,106,92,0.2)] bg-[var(--coral-100)]">
          <CardContent className="p-7">
            <p className="font-medium text-[var(--coral-500)]">
              No encontramos respuestas guardadas del diagnóstico. {isSessionMode ? 'Asegúrate de haber completado tu diagnóstico remoto antes de continuar con la sesión.' : 'Regresa a contestarlo antes de continuar.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="overflow-hidden">
            <CardContent className="p-10 sm:p-12">
              <p className={isSessionMode ? 'navi-eyebrow' : 'text-center text-sm font-semibold tracking-[0.02em] text-[var(--ink-600)]'}>
                {isSessionMode ? 'Tu sesión de hoy' : 'Tu diagnóstico de trayectoria'}
              </p>
              <div className={`mt-5 ${isSessionMode ? 'max-w-2xl' : 'mx-auto max-w-3xl text-center'}`}>
                {isSessionMode ? (
                  <div className="space-y-4">
                    {microPre?.summary ? (
                      <div className="rounded-[22px] border border-[rgba(15,76,129,0.10)] bg-[rgba(249,252,255,0.78)] px-5 py-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)]">
                          Cómo llegas hoy
                        </p>
                        <p className="mt-3 text-base leading-7 text-[var(--ink-700)]">
                          Hoy llegas con la sensación de que {microPre.summary.arrival} y {microPre.summary.agency}. Tengámoslo en cuenta mientras revisamos tu diagnóstico.
                        </p>
                      </div>
                    ) : null}
                    <p className="text-lg leading-8 text-[var(--ink-700)]">
                      Esto es lo que tu diagnóstico muestra hoy sobre tu trayectoria.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="font-display text-[96px] font-bold leading-none tracking-[-0.08em] text-[var(--navy-700)] sm:text-[120px]">
                      {priorityCount}
                    </div>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--navy-600)] sm:text-3xl">
                      temas prioritarios para revisar
                    </p>
                    {priorityAreas.length > 0 ? (
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
                    ) : null}
                    <p className="mt-4 text-lg leading-8 text-[var(--ink-700)]">
                      La sesión te ayuda a convertir esto en un plan concreto.
                    </p>
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
                  <a href={bookingConfig.url} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="px-9">
                      <CalendarDays className="mr-2 h-5 w-5" />
                      {bookingConfig.cta}
                    </Button>
                  </a>
                )}

                {isSessionMode ? (
                  <p className="mt-6 text-sm text-[var(--ink-500)]">
                    Usa esta lectura para llegar con más claridad a la elección de tus metas.
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
                              background: 'linear-gradient(90deg, var(--coral-500) 0%, var(--navy-500) 100%)'
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
