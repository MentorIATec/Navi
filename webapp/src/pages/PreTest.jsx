import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

const arrivalOptions = [
  { id: 'clear', label: 'Con claridad y disposición para avanzar' },
  { id: 'stress', label: 'Con algo de estrés o cansancio' },
  { id: 'confused', label: 'Confundido/a sobre qué hacer primero' },
  { id: 'sorting', label: 'Con ganas de ordenar mis ideas' },
];

const agencyOptions = [
  { id: 'high', label: 'Sí, siento que puedo salir con un siguiente paso claro' },
  { id: 'medium', label: 'Creo que sí, si logro enfocarme en lo importante' },
  { id: 'low', label: 'Todavía no estoy seguro/a de poder verlo con claridad' },
  { id: 'blocked', label: 'Hoy me cuesta imaginar cuál debería ser ese siguiente paso' },
];

function getMicroPreSummary(answers) {
  const arrivalSummary = {
    clear: 'llegas con claridad y disposición para avanzar',
    stress: 'llegas con algo de estrés o cansancio',
    confused: 'llegas con dudas sobre qué atender primero',
    sorting: 'llegas con ganas de ordenar tus ideas',
  };

  const agencySummary = {
    high: 'sientes que puedes salir de esta sesión con un siguiente paso claro',
    medium: 'crees que puedes encontrar un siguiente paso si logras enfocarte en lo importante',
    low: 'todavía no tienes claro si hoy podrás salir con un siguiente paso definido',
    blocked: 'hoy te cuesta imaginar cuál debería ser tu siguiente paso',
  };

  return {
    arrival: arrivalSummary[answers.arrival] || '',
    agency: agencySummary[answers.agency] || '',
  };
}

export default function PreTest() {
  const navigate = useNavigate();
  const isSessionMode = localStorage.getItem('navi_session_mode') === 'presencial';
  const [answers, setAnswers] = useState({});

  const isComplete = useMemo(
    () => Boolean(answers.arrival && answers.agency),
    [answers]
  );

  const handleSelect = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = () => {
    const summary = getMicroPreSummary(answers);
    localStorage.setItem('micro_pre', JSON.stringify({ ...answers, summary }));
    navigate(isSessionMode ? '/resultados' : '/test');
  };

  return (
    <div className="mx-auto max-w-4xl py-8 sm:py-12">
      <div className="mb-8 space-y-4">
        <div>
          <p className="navi-eyebrow" style={{ color: isSessionMode ? 'var(--coral-500)' : 'var(--ink-700)' }}>
            {isSessionMode ? 'Antes de continuar' : 'Antes de comenzar'}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            {isSessionMode ? 'Cuéntanos cómo llegas hoy' : 'Cuéntanos cómo te sientes en este momento'}
          </h2>
          <p className="navi-prose mt-3 max-w-2xl text-sm sm:text-base">
            {isSessionMode
              ? 'Dos preguntas para que la sesión empiece con más foco.'
              : 'Dos preguntas breves antes de comenzar tu diagnóstico.'}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-[rgba(15,76,129,0.12)]">
        <CardContent className="space-y-8 p-8 sm:p-12">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-900)] sm:text-[2rem]">
              Hoy llego a esta sesión sintiéndome...
            </h3>
            <div className="grid gap-3">
              {arrivalOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect('arrival', option.id)}
                  className={cn(
                    'answer-shift stage-card-lift w-full rounded-[22px] border px-5 py-4 text-left transition-all active:scale-[0.99]',
                    answers.arrival === option.id
                      ? 'border-[rgba(15,76,129,0.35)] bg-[linear-gradient(180deg,rgba(240,245,252,0.96)_0%,rgba(228,236,247,0.92)_100%)] shadow-[0_16px_38px_rgba(15,76,129,0.12)]'
                      : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white hover:shadow-[0_14px_34px_rgba(17,36,66,0.10)]'
                  )}
                >
                  <span className="font-medium text-[var(--ink-900)]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold leading-tight text-[var(--ink-900)] sm:text-[2rem]">
              Hoy siento que puedo salir de esta sesión con un siguiente paso claro.
            </h3>
            <div className="grid gap-3">
              {agencyOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect('agency', option.id)}
                  className={cn(
                    'answer-shift stage-card-lift w-full rounded-[22px] border px-5 py-4 text-left transition-all active:scale-[0.99]',
                    answers.agency === option.id
                      ? 'border-[rgba(15,76,129,0.35)] bg-[linear-gradient(180deg,rgba(240,245,252,0.96)_0%,rgba(228,236,247,0.92)_100%)] shadow-[0_16px_38px_rgba(15,76,129,0.12)]'
                      : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white hover:shadow-[0_14px_34px_rgba(17,36,66,0.10)]'
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
              disabled={!isComplete}
              onClick={handleContinue}
              className="w-full sm:w-auto"
            >
              {isSessionMode ? 'Continuar a mis resultados' : 'Continuar al diagnóstico'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
