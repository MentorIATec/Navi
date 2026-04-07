import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { ProgressBar } from '../components/ui/ProgressBar';

// Ítems refinados: Autoeficacia situacional y Regulación de afrontamiento
const microItems = [
  { id: 'a1', construct: 'autoeficacia', text: 'Confío en mi capacidad para afrontar los retos académicos de este semestre.' },
  { id: 'a2', construct: 'autoeficacia', text: 'Sé qué tipo de acción tomar cuando me enfrento a una materia o situación académica difícil.' },
  { id: 'r1', construct: 'regulacion', text: 'Cuando me siento estresado/a o saturado/a por la escuela, logro detenerme y enfocarme en cómo responder.' },
  { id: 'r2', construct: 'regulacion', text: 'Ante un obstáculo imprevisto que afecta mis planes, soy capaz de ajustar mi estrategia sin quedarme paralizado/a.' }
];

export default function PreTest() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const isSessionMode = localStorage.getItem('navi_session_mode') === 'presencial';

  const isComplete = Object.keys(answers).length === microItems.length;
  const currentItem = microItems[currentIndex];

  const handleSelect = (itemId, val) => {
    setAnswers(prev => ({ ...prev, [itemId]: val }));
  };

  const handleNext = () => {
    if (currentIndex < microItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    handleContinue();
  };

  const handleContinue = () => {
    localStorage.setItem('micro_pre', JSON.stringify(answers));
    navigate(isSessionMode ? '/resultados' : '/test');
  };

  return (
    <div className="mx-auto max-w-3xl py-8 sm:py-12">
      <div className="mb-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="navi-eyebrow" style={{ color: isSessionMode ? 'var(--coral-500)' : 'var(--ink-700)' }}>
              {isSessionMode ? 'Sesión presencial' : 'Reflexión inicial'}
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--ink-900)] sm:text-4xl">
              {isSessionMode ? 'Antes de revisar tu diagnóstico' : 'Reflexión inicial'}
            </h2>
            <p className="navi-prose mt-3 max-w-2xl text-sm sm:text-base">
              {isSessionMode
                ? 'Cuéntanos cómo te sientes hoy para contextualizar la conversación con tu mentor antes de definir tus metas.'
                : 'Antes de comenzar tu diagnóstico, responde con honestidad estas afirmaciones sobre cómo te sientes frente a tu semestre actualmente.'}
            </p>
          </div>
          <div className="hidden h-16 w-16 items-center justify-center rounded-full bg-[rgba(249,236,232,0.8)] text-[var(--coral-500)] shadow-inner sm:flex">
            <BrainCircuit className="h-8 w-8" />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ProgressBar current={currentIndex + 1} total={microItems.length} className="sm:flex-1" />
          <span className="text-sm font-medium text-[var(--ink-700)]">
            Pregunta {currentIndex + 1} de {microItems.length}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden border-[rgba(15,76,129,0.12)]">
        <CardContent className="p-8 sm:p-12">
          <div className="mb-8 space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-700)]">
              <span className="rounded-full border border-[rgba(210,106,92,0.18)] bg-[rgba(249,236,232,0.8)] px-3 py-1 font-medium">
                {isSessionMode ? 'Estado actual' : 'Autoexploración'}
              </span>
              <span>{currentItem.construct === 'autoeficacia' ? 'Autoeficacia' : 'Regulación de afrontamiento'}</span>
            </div>
            <h3 className="min-h-[120px] font-display text-2xl font-semibold leading-relaxed text-[var(--ink-900)] sm:text-[2rem]">
              {currentItem.text}
            </h3>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => handleSelect(currentItem.id, val)}
                className={cn(
                  'answer-shift stage-card-lift w-full rounded-[22px] border px-5 py-4 text-left transition-all active:scale-[0.99]',
                  answers[currentItem.id] === val
                    ? 'border-[rgba(15,76,129,0.35)] bg-[linear-gradient(180deg,rgba(240,245,252,0.96)_0%,rgba(228,236,247,0.92)_100%)] shadow-[0_16px_38px_rgba(15,76,129,0.12)]'
                    : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white hover:shadow-[0_14px_34px_rgba(17,36,66,0.10)]'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-[var(--ink-900)]">
                    {val === 1 && 'Totalmente en desacuerdo'}
                    {val === 2 && 'En desacuerdo'}
                    {val === 3 && 'Neutral'}
                    {val === 4 && 'De acuerdo'}
                    {val === 5 && 'Totalmente de acuerdo'}
                  </span>
                  <span className="shrink-0 rounded-full border border-[rgba(15,76,129,0.12)] bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--ink-700)]">
                    {val}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--ink-700)]">
              {answers[currentItem.id]
                ? 'Respuesta registrada. Puedes continuar al siguiente paso.'
                : 'Selecciona una opción para continuar.'}
            </p>
            <Button
              size="lg"
              disabled={!answers[currentItem.id] || !isComplete && currentIndex === microItems.length - 1 && !answers[currentItem.id]}
              onClick={handleNext}
              className="w-full sm:w-auto"
            >
              {currentIndex === microItems.length - 1
                ? isSessionMode ? 'Ver mi diagnóstico' : 'Continuar al diagnóstico oficial'
                : 'Siguiente'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
