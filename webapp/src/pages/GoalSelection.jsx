import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Star, BookOpen, Loader2, ArrowRight, ArrowLeft, Compass, Target } from 'lucide-react';
import { cn } from '../utils/cn';
import { apiClient } from '../api/client';
import { ProgressBar } from '../components/ui/ProgressBar';

export default function GoalSelection() {
  const navigate = useNavigate();
  const [goalsData, setGoalsData] = useState({ prioritarias: [], complementarias: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedPrioritaria, setSelectedPrioritaria] = useState(null);
  const [selectedComplementaria, setSelectedComplementaria] = useState(null);
  const [selectedTiempo, setSelectedTiempo] = useState(null);
  const [obstaculo, setObstaculo] = useState('');
  const [plan, setPlan] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const timeframes = [
    { id: 't1', label: '1 Periodo (5 Semanas)' },
    { id: 't2', label: '1 Mes' },
    { id: 't3', label: '1 Semestre' },
    { id: 't4', label: 'Flexible' }
  ];

  useEffect(() => {
    async function loadGoals() {
      try {
        const data = await apiClient.post('getMetas');
        setGoalsData(data);
      } catch (e) {
        console.error("No se pudieron cargar metas", e);
        setErrorMessage('No pudimos cargar el banco de metas. Recarga la página o intenta más tarde.');
      } finally {
        setIsLoading(false);
      }
    }
    loadGoals();
  }, []);

  useEffect(() => {
    if (selectedPrioritaria) {
      localStorage.setItem('meta_prioritaria', selectedPrioritaria.text);
    }
  }, [selectedPrioritaria]);

  useEffect(() => {
    if (selectedComplementaria) {
      localStorage.setItem('meta_complementaria', selectedComplementaria.text);
    }
  }, [selectedComplementaria]);

  useEffect(() => {
    if (selectedTiempo) {
      localStorage.setItem('meta_tiempo', selectedTiempo.label);
    }
  }, [selectedTiempo]);

  useEffect(() => {
    localStorage.setItem('meta_obstaculo', obstaculo);
  }, [obstaculo]);

  useEffect(() => {
    localStorage.setItem('meta_plan', plan);
  }, [plan]);

  const handleConfirm = async () => {
    setIsSaving(true);
    setErrorMessage('');

    localStorage.setItem('meta_prioritaria', selectedPrioritaria.text);
    localStorage.setItem('meta_complementaria', selectedComplementaria.text);
    localStorage.setItem('meta_tiempo', selectedTiempo.label);
    localStorage.setItem('meta_obstaculo', obstaculo);
    localStorage.setItem('meta_plan', plan);

    try {
      await apiClient.post('saveGoalSelection', {
        matricula: localStorage.getItem('navi_matricula'),
        nombre: localStorage.getItem('navi_user_name'),
        metaPrioritaria: selectedPrioritaria.text,
        metaComplementaria: selectedComplementaria.text,
        tiempo: selectedTiempo.label,
        obstaculo,
        plan,
        checkIn: localStorage.getItem('navi_checked_in') === 'true' ? 'Si' : undefined,
      });
      navigate('/plan-accion');
    } catch (error) {
      console.error('No se pudo guardar la selección de metas:', error);
      setErrorMessage('No pudimos guardar tus metas en este momento. Vuelve a intentarlo antes de continuar.');
    } finally {
      setIsSaving(false);
    }
  };

  const GoalCard = ({ goal, isSelected, onSelect, icon }) => {
    const GoalIcon = icon;

    return (
    <Card 
      onClick={() => onSelect(goal)}
      className={cn(
        "cursor-pointer hover:border-brand-300 hover:shadow-lg transition-all border-2",
        isSelected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600 ring-offset-2" : "border-transparent"
      )}
    >
      <div className="flex p-5">
        <div className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl mr-4 transition-colors",
          isSelected ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"
        )}>
          <GoalIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-900 text-lg mb-1">{goal.text}</h4>
            {isSelected && <Check className="h-6 w-6 text-brand-600 shrink-0 ml-2" />}
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-white border border-gray-200 text-gray-600">
            {goal.dimension}
          </span>
        </div>
      </div>
    </Card>
    );
  };

  const canProceed = selectedPrioritaria && selectedComplementaria && selectedTiempo && obstaculo.trim().length > 3 && plan.trim().length > 5;
  const stepDefinitions = [
    {
      title: 'Meta prioritaria',
      description: 'Selecciona una meta enfocada en tu avance académico o profesional.',
      icon: BookOpen,
      ready: Boolean(selectedPrioritaria),
    },
    {
      title: 'Meta complementaria',
      description: 'Elige una meta que fortalezca tu bienestar y desarrollo integral.',
      icon: Star,
      ready: Boolean(selectedComplementaria),
    },
    {
      title: 'Ventana de tiempo',
      description: 'Define el horizonte en el que te comprometes a trabajar estas metas.',
      icon: Compass,
      ready: Boolean(selectedTiempo),
    },
    {
      title: 'Obstáculo principal',
      description: 'Anticipa qué podría dificultar tu avance para no improvisar después.',
      icon: Target,
      ready: obstaculo.trim().length > 3,
    },
    {
      title: 'Estrategia si-entonces',
      description: 'Formula una respuesta concreta para actuar cuando aparezca el obstáculo.',
      icon: Check,
      ready: plan.trim().length > 5,
    },
  ];

  const currentStepData = stepDefinitions[currentStep];
  const isCurrentStepReady = currentStepData.ready;

  const handleNext = async () => {
    if (currentStep < stepDefinitions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    if (canProceed) {
      await handleConfirm();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 sm:py-12">
      <div className="mb-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section className="shell-panel rounded-[30px] border border-[rgba(15,76,129,0.12)] px-7 py-8 sm:px-8 sm:py-10">
          <p className="navi-eyebrow">Cierre de mentoría</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--ink-900)] sm:text-4xl">
            Construyamos tu plan
          </h2>
          <p className="navi-prose mt-4 text-sm sm:text-base">
            Este recorrido traduce la conversación con tu mentor en compromisos claros y una estrategia accionable.
          </p>
          <div className="mt-8">
            <ProgressBar current={currentStep + 1} total={stepDefinitions.length} />
          </div>
          <div className="mt-8 space-y-3">
            {stepDefinitions.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || step.ready;

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => {
                    if (index <= currentStep || step.ready) {
                      setCurrentStep(index);
                    }
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-[20px] border px-4 py-4 text-left transition-all',
                    isActive
                      ? 'border-[rgba(15,76,129,0.20)] bg-white/85 shadow-[0_16px_34px_rgba(17,36,66,0.10)]'
                      : 'border-[rgba(15,76,129,0.08)] bg-white/50',
                    index > currentStep && !step.ready && 'cursor-default opacity-75'
                  )}
                >
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                    isCompleted
                      ? 'bg-[rgba(210,106,92,0.14)] text-[var(--coral-500)]'
                      : 'bg-[rgba(15,76,129,0.08)] text-[var(--ink-700)]'
                  )}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {index + 1}. {step.title}
                      </p>
                      {isCompleted ? <Check className="h-4 w-4 text-[var(--coral-500)]" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--ink-700)]">{step.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="navi-eyebrow" style={{ color: 'var(--coral-500)' }}>Paso {currentStep + 1} de {stepDefinitions.length}</p>
            <h3 className="mt-3 font-display text-3xl font-semibold text-[var(--ink-900)]">
              {currentStepData.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm text-[var(--ink-700)] sm:text-base">
              {currentStepData.description}
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-[rgba(15,76,129,0.10)] bg-white/70 px-6 py-16 text-[var(--navy-500)]">
              <div className="flex flex-col items-center text-center">
                <Loader2 className="mb-4 h-10 w-10 animate-spin" />
                <p className="font-medium">Cargando catálogo de metas propuesto...</p>
              </div>
            </div>
          ) : (
            <Card className="border-[rgba(15,76,129,0.12)]">
              <div className="p-6 sm:p-8">
                {currentStep === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {goalsData.prioritarias.map(goal => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        isSelected={selectedPrioritaria?.id === goal.id}
                        onSelect={setSelectedPrioritaria}
                        icon={BookOpen}
                      />
                    ))}
                  </div>
                ) : null}

                {currentStep === 1 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {goalsData.complementarias.map(goal => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        isSelected={selectedComplementaria?.id === goal.id}
                        onSelect={setSelectedComplementaria}
                        icon={Star}
                      />
                    ))}
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {timeframes.map(time => (
                      <button
                        key={time.id}
                        onClick={() => setSelectedTiempo(time)}
                        className={cn(
                          'stage-card-lift rounded-[22px] border px-4 py-5 text-left transition-all',
                          selectedTiempo?.id === time.id
                            ? 'border-[rgba(15,76,129,0.25)] bg-[linear-gradient(180deg,rgba(240,245,252,0.96)_0%,rgba(228,236,247,0.92)_100%)] shadow-[0_16px_34px_rgba(17,36,66,0.10)]'
                            : 'border-[rgba(15,76,129,0.10)] bg-white/72 hover:border-[rgba(15,76,129,0.22)] hover:bg-white'
                        )}
                      >
                        <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{time.label}</p>
                        <p className="mt-2 text-sm text-[var(--ink-700)]">
                          {time.id === 't1' && 'Ideal para activar hábitos concretos de inmediato.'}
                          {time.id === 't2' && 'Permite sostener el esfuerzo más allá del primer impulso.'}
                          {time.id === 't3' && 'Alinea tus metas con el horizonte natural del semestre.'}
                          {time.id === 't4' && 'Útil si tu ruta requiere adaptarse a cambios o imprevistos.'}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="rounded-[24px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.92)] p-6">
                    <label className="block text-sm font-semibold text-[var(--ink-900)]">
                      ¿Qué podría dificultarte lograr esta meta?
                    </label>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Nómbralo con honestidad. Anticipar el obstáculo hace más probable que puedas enfrentarlo a tiempo.
                    </p>
                    <textarea
                      className="mt-4 w-full rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/85 p-4 text-[var(--ink-900)] shadow-sm outline-none transition-all focus:border-[rgba(210,106,92,0.35)] focus:ring-4 focus:ring-[rgba(210,106,92,0.10)] resize-none"
                      placeholder="Ej. Posponer tareas importantes cuando me siento abrumado/a o disperso/a."
                      rows="5"
                      value={obstaculo}
                      onChange={(e) => setObstaculo(e.target.value)}
                    />
                  </div>
                ) : null}

                {currentStep === 4 ? (
                  <div className="rounded-[24px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.92)] p-6">
                    <label className="block text-sm font-semibold text-[var(--ink-900)]">
                      Estrategia si-entonces
                    </label>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Formula una respuesta específica para cuando aparezca el obstáculo. La clave es que sea inmediata y concreta.
                    </p>
                    <div className="mt-4 overflow-hidden rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/88 shadow-sm transition-all focus-within:border-[rgba(210,106,92,0.35)] focus-within:ring-4 focus-within:ring-[rgba(210,106,92,0.10)]">
                      <div className="border-b border-[rgba(15,76,129,0.08)] bg-[rgba(249,236,232,0.45)] px-5 py-3 text-sm font-semibold text-[var(--coral-500)]">
                        Si pasa esto, entonces yo...
                      </div>
                      <textarea
                        className="w-full resize-none border-0 bg-transparent p-5 text-[var(--ink-900)] outline-none"
                        placeholder="Ej. apagaré mi celular por 45 minutos, abriré mi material y comenzaré por una tarea específica."
                        rows="5"
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 flex flex-col gap-3 border-t border-[rgba(15,76,129,0.08)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[var(--ink-700)]">
                    {isCurrentStepReady
                      ? 'Paso completo. Puedes continuar.'
                      : 'Completa este paso para avanzar al siguiente.'}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleBack}
                      disabled={currentStep === 0 || isSaving}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      size="lg"
                      disabled={!isCurrentStepReady || goalsData.prioritarias.length === 0 || goalsData.complementarias.length === 0}
                      isLoading={isSaving}
                      onClick={handleNext}
                    >
                      {currentStep === stepDefinitions.length - 1 ? 'Ver plan de acción' : 'Siguiente'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
