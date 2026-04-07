import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { CATEGORY_META, DIAGNOSTIC_BANK, DIAGNOSTIC_STAGE_OPTIONS, STAGE_COPY } from '../data/diagnosticBank';
import { cn } from '../utils/cn';

function cleanQuestionTitle(title) {
  return title.replace(/^[^\p{L}\p{N}¿¡]+/u, '').trim();
}

export default function Diagnostic() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState(localStorage.getItem('navi_diagnostic_stage') || '');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeScore, setActiveScore] = useState(null);

  const questions = useMemo(() => {
    if (!selectedStage) return [];
    return DIAGNOSTIC_BANK[selectedStage] || [];
  }, [selectedStage]);
  const selectedStageLabel = DIAGNOSTIC_STAGE_OPTIONS.find((item) => item.id === selectedStage)?.label || '';

  const question = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleStart = () => {
    if (!selectedStage) return;
    localStorage.setItem('navi_diagnostic_stage', selectedStage);
    setHasStarted(true);
  };

  const handleStageChange = (stageId) => {
    setSelectedStage(stageId);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setActiveScore(null);
  };

  const submitDiagnostic = async (finalAnswers) => {
    setIsSubmitting(true);
    const payload = {
      stage: selectedStage,
      answers: finalAnswers,
      questions,
    };
    localStorage.setItem('navi_diagnostic_payload', JSON.stringify(payload));
    localStorage.setItem('navi_diagnostic_answers', JSON.stringify(finalAnswers));
    localStorage.removeItem('navi_missing_remote_test');

    try {
      const matricula = localStorage.getItem('navi_matricula');
      if (matricula) {
        await apiClient.post('updateStudent', {
          matricula,
          status: 'Test Completado',
        });
      }
    } catch (error) {
      console.error('No se pudo actualizar el status del alumno:', error);
    } finally {
      navigate('/resultados');
    }
  };

  const handleAnswer = (score) => {
    if (!question) return;
    setActiveScore(score);
    const nextAnswers = { ...answers, [question.key]: score };
    setAnswers(nextAnswers);

    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setActiveScore(null);
      }, 260);
    } else {
      submitDiagnostic(nextAnswers);
    }
  };

  if (!hasStarted) {
    return (
      <div className="mx-auto max-w-5xl py-8 sm:py-12">
        <Card className="border-[rgba(15,76,129,0.12)]">
          <CardContent className="p-8 sm:p-10">
            <div className="max-w-3xl">
              <p className="navi-eyebrow">Tu punto de partida</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
                ¿Dónde estás hoy?
              </h2>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {DIAGNOSTIC_STAGE_OPTIONS.map((stage) => {
                const isSelected = selectedStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => handleStageChange(stage.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'stage-card-lift rounded-[24px] border p-6 text-left transition-all',
                      isSelected
                        ? 'border-[rgba(15,76,129,0.25)] bg-[linear-gradient(180deg,rgba(240,245,252,0.96)_0%,rgba(228,236,247,0.92)_100%)] shadow-[0_16px_34px_rgba(17,36,66,0.10)]'
                        : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink-900)]">
                          {stage.label}
                        </h3>
                        <p className="mt-4 text-base leading-7 text-[var(--ink-700)]">
                          {stage.description}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(210,106,92,0.14)] text-[var(--coral-500)]">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-[22px] border border-[rgba(15,76,129,0.10)] bg-[rgba(249,252,255,0.75)] px-5 py-5">
              <p className="text-base leading-7 text-[var(--ink-700)]">
                {selectedStage
                  ? STAGE_COPY[selectedStage].hero
                  : 'Elige la etapa que mejor describe tu momento actual. A partir de eso, el diagnóstico se ajustará para hacerte preguntas más cercanas a tu experiencia.'}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <Button
                type="button"
                size="lg"
                onClick={handleStart}
                disabled={!selectedStage}
                className="w-full"
              >
                Comenzar diagnóstico
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm leading-6 text-[var(--ink-700)]">
                Tus respuestas se usan únicamente para tu proceso de acompañamiento estudiantil.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8 sm:py-12">
      <div className="mb-8 space-y-4">
        <div className="space-y-3">
          <p className="navi-eyebrow">Diagnóstico · {selectedStageLabel}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--ink-900)] sm:text-4xl">
                {selectedStageLabel}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--ink-700)] sm:text-base">
                Responde según tu situación actual. Al final tendrás una lectura que te ayudará a ordenar mejor tus próximos pasos.
              </p>
            </div>
            <div className="text-sm font-medium text-[var(--ink-700)]">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </div>
          </div>
        </div>
        <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
      </div>

      <Card className="relative overflow-hidden border-[rgba(15,76,129,0.12)]">
        {isSubmitting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[rgba(251,253,255,0.88)] backdrop-blur-sm">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[rgba(15,76,129,0.12)] border-t-[var(--navy-500)]" />
            <p className="font-medium text-[var(--ink-700)]">Guardando tu diagnóstico...</p>
          </div>
        )}

        <CardContent className="p-8 sm:p-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-700)]">
              <span className="rounded-full border border-[rgba(15,76,129,0.12)] bg-white/70 px-3 py-1 font-medium">
                {selectedStageLabel}
              </span>
              <span>{CATEGORY_META[question.category]?.label}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasStarted(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setActiveScore(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,76,129,0.12)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink-700)] transition-all hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Cambiar etapa
            </button>
          </div>

          <div className="mb-8 space-y-5">
            <h3 className="min-h-[160px] font-display text-2xl font-semibold leading-relaxed text-[var(--ink-900)] sm:text-[2rem]">
              {cleanQuestionTitle(question.title)}
            </h3>
          </div>

          <div className="space-y-3">
            {question.options.map((label, index) => {
              const score = index + 1;
              return (
                <button
                  key={label}
                  onClick={() => handleAnswer(score)}
                  disabled={isSubmitting}
                  className={[
                    'answer-shift stage-card-lift w-full rounded-[22px] border px-5 py-4 text-left transition-all active:scale-[0.99]',
                    activeScore === score
                      ? 'border-[rgba(15,76,129,0.35)] bg-[linear-gradient(180deg,rgba(240,245,252,0.96)_0%,rgba(228,236,247,0.92)_100%)] shadow-[0_16px_38px_rgba(15,76,129,0.12)]'
                      : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white hover:shadow-[0_14px_34px_rgba(17,36,66,0.10)]',
                  ].join(' ')}
                >
                  <span className="font-medium leading-7 text-[var(--ink-900)]">{label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
