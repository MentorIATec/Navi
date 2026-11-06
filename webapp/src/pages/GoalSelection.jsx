import { useState, useEffect, useRef, useMemo } from 'react';
import './GoalSelection.css';
import { readJourney, readPendingSubmission, pendingOperation, acknowledgeOperation, readConfirmedPlan } from '../utils/journeyIntegrity';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';
import { apiClient } from '../api/client';
import { ProgressBar } from '../components/ui/ProgressBar';
import { primaryGoalGroups, complementaryEncounterOrder, exactTimeframe, goalTimeOptions, choosePrimary } from '../utils/goalRecommendations';

const TIMEFRAMES = [
  { id: 't1', label: '1 Periodo (5 Semanas)' },
  { id: 't2', label: '1 Mes' },
  { id: 't3', label: '1 Semestre' },
  { id: 't4', label: 'Flexible' }
];

const DIMENSION_LABELS = {
  ocupacional: 'Ocupacional',
  intelectual: 'Intelectual',
  emocional: 'Emocional',
  social: 'Social',
  fisica: 'Física',
  física: 'Física',
  espiritual: 'Espiritual',
  financiera: 'Financiera',
};

const COMPLEMENTARY_DIMENSIONS = [
  { value: 'fisica', label: 'Física' },
  { value: 'emocional', label: 'Emocional' },
  { value: 'social', label: 'Social' },
  { value: 'espiritual', label: 'Espiritual' },
  { value: 'financiera', label: 'Financiera' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'ocupacional', label: 'Ocupacional' },
];

function firstPromptQuestion(goal) {
  const prompt = String(goal?.preguntasparaafinar || '').split('|').map((part) => part.trim()).filter(Boolean)[0];
  return prompt || '';
}

function getGoalLabel(goal) {
  const dimension = String(goal?.dimension || '').trim().toLowerCase();
  const tema = String(goal?.temaoperativo || '').trim().toLowerCase();
  return DIMENSION_LABELS[dimension] || tema || 'Meta sugerida';
}

function GoalCard({ goal, isSelected, onSelect }) {
    return (
      <Card
        onClick={event => onSelect(goal, { reveal: event.detail > 0 })}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(goal); }
        }}
        className={cn(
          'clarity-goal-choice cursor-pointer overflow-hidden border transition-all',
          isSelected
            ? 'border-[rgba(15,76,129,0.26)] bg-[var(--surface-raised)]  ring-1 ring-[rgba(210,106,92,0.16)]'
            : 'border-[rgba(15,76,129,0.08)] bg-white/72 hover:border-[rgba(15,76,129,0.18)] hover:bg-white '
        )}
      >
        <div className="goal-choice-row">
          <div className="goal-choice-copy">
              <span className="goal-dimension-label">
                {getGoalLabel(goal)}
              </span>
              <h4>{goal.text}</h4>
          </div>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all',
                isSelected
                  ? 'border-[rgba(210,106,92,0.28)] bg-[rgba(210,106,92,0.16)] text-[var(--coral-500)]'
                  : 'border-[rgba(15,76,129,0.10)] bg-white/70 text-transparent'
              )}
            >
              <Check className="h-4 w-4" />
            </span>
        </div>
      </Card>
    );
  }

const TIMEFRAME_DESCRIPTIONS = {
  t1: 'Ideal para activar hábitos concretos de inmediato.',
  t2: 'Permite sostener el esfuerzo más allá del primer impulso.',
  t3: 'Alinea tus metas con el horizonte natural del semestre.',
  t4: 'Útil si tu ruta requiere adaptarse a cambios o imprevistos.',
};

function HorizonOption({ time, suggested = false, selected, onSelect, children }) {
  return <button type="button" onClick={onSelect} aria-pressed={selected}
    className="clarity-horizon goal-horizon-option" data-suggested={suggested || undefined}>
    <span className="goal-horizon-top">
      <span className="goal-horizon-label">{time.label}</span>
      {suggested ? <span className="goal-horizon-badge">Sugerido</span> : null}
    </span>
    {children}
    {TIMEFRAME_DESCRIPTIONS[time.id] ? <span className="goal-horizon-description">{TIMEFRAME_DESCRIPTIONS[time.id]}</span> : null}
  </button>;
}

function MoreGoals({ visible, total, onMore }) {
  if (visible >= total) return null;
  return <div className="goal-more-options">
    <Button variant="outline" onClick={onMore}>Ver más metas <ArrowRight className="h-4 w-4 rotate-90" aria-hidden="true" /></Button>
  </div>;
}

function PersonalizeGoal({ value, original, onChange, label }) {
  const [editing, setEditing] = useState(false);
  return <div className="goal-personalize">
    <Button type="button" variant="outline" aria-expanded={editing} onClick={() => setEditing(open => !open)}>
      {editing ? 'Cerrar edición' : 'Personalizar esta meta'}
    </Button>
    {editing ? <div className="mt-3 space-y-3">
      <label className="block text-sm font-semibold">{label}
        <textarea className="mt-2 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-raised)] p-4 text-[var(--ink-900)]"
          rows={3} value={value} onChange={event => onChange(event.target.value)} />
      </label>
      <p className="text-sm text-[var(--ink-700)]">Ajusta la propuesta a lo que quieres trabajar. Tus cambios se conservarán mientras exploras otras metas en este recorrido.</p>
      <Button type="button" variant="ghost" disabled={value === original} onClick={() => onChange(original)}>Restablecer propuesta</Button>
    </div> : null}
  </div>;
}

function GoalExamples({ goal }) {
  const steps = String(goal?.pasosbase || '').split(';').map(step => step.trim()).filter(Boolean);
  if (!steps.length) return null;
  return (
    <section className="goal-examples" aria-label="Ejemplos para avanzar">
      <h4>Ejemplos para avanzar</h4>
      <ol>{steps.slice(0, 3).map((step, index) => <li key={index}>{step}</li>)}</ol>
      {steps.length > 3 ? <details>
        <summary>Ver todos los pasos</summary>
        <ol start={4}>{steps.slice(3).map((step, index) => <li key={index}>{step}</li>)}</ol>
      </details> : null}
    </section>
  );
}

export default function GoalSelection() {
  const [journey] = useState(() => readJourney(sessionStorage));
  const [recovery, setRecovery] = useState(() => {
    if (!journey) return null;
    try { return readPendingSubmission(sessionStorage, journey, 'goal'); }
    catch (error) { return { errorMessage: error.message }; }
  });
  if (!journey) return <Navigate to="/check-in" replace />;
  if (readConfirmedPlan(sessionStorage, journey)) return <Navigate to="/plan-accion" replace />;
  return <GoalEditor journey={journey} recovery={recovery} onPending={setRecovery} />;
}

function GoalEditor({ journey, recovery, onPending }) {
  const navigate = useNavigate();
  const saveBusy = useRef(false);
  const primaryDrafts = useRef({});
  const [restored] = useState(() => recovery?.payload || readConfirmedPlan(sessionStorage, journey)?.payload || null);
  const manualTime = useRef(Boolean(restored));
  const [goalsData, setGoalsData] = useState(() => ({
    prioritarias: restored ? [{ id: 'pending-prioritaria', text: restored.metaPrioritaria }] : [],
    complementarias: restored ? [{ id: 'pending-complementaria', text: restored.metaComplementaria }] : [],
    recommendation: { recommended: [], alternatives: [], priorities: [] },
  }));
  const [isLoading, setIsLoading] = useState(!recovery);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(recovery?.errorMessage || '');
  
  const [selectedPrioritaria, setSelectedPrioritaria] = useState(restored ? { id: 'pending-prioritaria', text: restored.metaPrioritaria } : null);
  const [selectedComplementaria, setSelectedComplementaria] = useState(restored ? { id: 'pending-complementaria', text: restored.metaComplementaria } : null);
  const complementaryDrafts = useRef({});
  const [complementariaDraft, setComplementariaDraft] = useState(restored?.metaComplementaria || '');
  const [prioritariaDraft, setPrioritariaDraft] = useState(restored?.metaPrioritaria || '');
  const [selectedTiempo, setSelectedTiempo] = useState(restored ? (TIMEFRAMES.find(item => item.label === restored.tiempo) || { id: 'pending-time', label: restored.tiempo }) : null);
  const [obstaculo, setObstaculo] = useState(restored?.obstaculo || '');
  const [plan, setPlan] = useState(restored?.plan || '');
  const [currentStep, setCurrentStep] = useState(recovery?.payload ? 4 : 0);
  const stepHeading = useRef(null);
  const selectionRef = useRef(null);
  const footerRef = useRef(null);
  const selectionRevealRequested = useRef(false);
  useEffect(() => {
    if (!selectionRevealRequested.current) return;
    selectionRevealRequested.current = false;
    const selection = selectionRef.current;
    if (!selection) return;
    const bounds = selection.getBoundingClientRect();
    const visibleBottom = Math.min(window.innerHeight, footerRef.current?.getBoundingClientRect().top ?? window.innerHeight) - 16;
    if (bounds.top >= 16 && bounds.bottom <= visibleBottom) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    selection.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [selectedPrioritaria?.id, selectedComplementaria?.id]);
  const sidebarRef = useRef(null);
  const [sidebarFits, setSidebarFits] = useState(false);
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const checkHeight = () => setSidebarFits(sidebar.getBoundingClientRect().height <= window.innerHeight - 32);
    const observer = new ResizeObserver(checkHeight);
    observer.observe(sidebar);
    window.addEventListener('resize', checkHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkHeight);
    };
  }, []);
  const previousStep = useRef(currentStep);
  useEffect(() => {
    if (previousStep.current === currentStep) return;
    previousStep.current = currentStep;
    stepHeading.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    stepHeading.current?.focus({ preventScroll: true });
  }, [currentStep]);
  const [additionalPrimaryCount, setAdditionalPrimaryCount] = useState(0);
  const [complementaryVisibleCount, setComplementaryVisibleCount] = useState(4);
  const [showCustomComplementaria, setShowCustomComplementaria] = useState(false);
  const [customComplementariaDimension, setCustomComplementariaDimension] = useState('emocional');
  const [customComplementariaText, setCustomComplementariaText] = useState('');

  const choicesRequest = useRef(null);
  useEffect(() => {
    if (recovery) return;
    let active = true;
    // StrictMode may repeat the effect; share this read within the mounted editor.
    choicesRequest.current ??= apiClient.post('getGoalSelectionOptions', {
      matricula: journey.matricula, operationalCycle: journey.operationalCycle,
    });
    choicesRequest.current.then(data => {
      if (active) setGoalsData(data);
    }).catch(error => {
      console.error('No se pudieron cargar metas', error);
      if (active) setErrorMessage('No pudimos cargar el banco de metas. Recarga la página o intenta más tarde.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [journey.matricula, journey.operationalCycle, recovery]);

  const handleConfirm = async () => {
    if (saveBusy.current || (recovery && !recovery.payload)) return;
    saveBusy.current = true;
    setIsSaving(true);
    setErrorMessage('');
    let pending;
    let goalSelection;
    try {
      goalSelection = recovery?.payload || {
        matricula: journey?.matricula,
        operationalCycle: journey?.operationalCycle,
        nombre: journey?.displayName || '',
        metaPrioritaria: prioritariaDraft.trim() || selectedPrioritaria.text,
        metaComplementaria: complementariaDraft.trim(),
        checkInId: journey.checkInId || '',
        tiempo: selectedTiempo.label,
        obstaculo,
        plan,
      };
      pending = pendingOperation(sessionStorage, journey, 'goal', goalSelection);
      if (recovery?.operation && pending.id !== recovery.operation.id) throw new Error('El envío cambió. Pide apoyo a tu mentor o mentora.');
      const acknowledgement = await apiClient.post('saveGoalSelection', {
        ...goalSelection,
        selectionId: pending.id,
      });
      acknowledgeOperation(sessionStorage, journey, 'goal', pending, acknowledgement, goalSelection);
      navigate('/plan-accion');
    } catch (error) {
      console.error('No se pudo guardar la selección de metas:', error);
      const message = error.code === 'WRITE_OUTCOME_UNKNOWN'
        ? 'No pudimos guardar tus metas. Intenta nuevamente.'
        : (error.message || 'No pudimos guardar tus metas en este momento. Vuelve a intentarlo antes de continuar.');
      if (pending) onPending({ operation: pending, payload: goalSelection });
      setErrorMessage(message);
    } finally {
      saveBusy.current = false;
      setIsSaving(false);
    }
  };


  const canProceed = selectedPrioritaria && prioritariaDraft.trim().length > 6 && selectedComplementaria && complementariaDraft.trim() && selectedTiempo && obstaculo.trim().length > 3 && plan.trim().length > 5;
  const stepDefinitions = [
    {
      title: 'Meta prioritaria',
      description: 'Selecciona una meta enfocada en tu avance académico o profesional.',
      ready: Boolean(selectedPrioritaria && prioritariaDraft.trim().length > 6),
    },
    {
      title: 'Meta complementaria',
      description: 'Elige una meta que fortalezca tu bienestar y desarrollo integral.',
      ready: Boolean(selectedComplementaria && complementariaDraft.trim()),
    },
    {
      title: 'Tu horizonte de tiempo',
      description: 'Define el horizonte en el que te comprometes a trabajar estas metas.',
      ready: Boolean(selectedTiempo),
    },
    {
      title: 'Obstáculo principal',
      description: 'Anticipa qué podría dificultar tu avance para no improvisar después.',
      ready: obstaculo.trim().length > 3,
    },
    {
      title: 'Mi respuesta al obstáculo',
      description: 'Define qué harás cuando aparezca ese obstáculo para no improvisar después.',
      ready: plan.trim().length > 5,
    },
  ];

  const currentStepData = stepDefinitions[currentStep];
  const isCurrentStepReady = currentStepData.ready;
  const completedSteps = stepDefinitions.filter(step => step.ready).length;
  const canVisitStep = index => index <= currentStep || stepDefinitions.slice(0, index).every(step => step.ready);
  const suggestedTimeframe = exactTimeframe(selectedPrioritaria, TIMEFRAMES);
  const suggestedTimeframeId = suggestedTimeframe?.id;
  const timeOptions = goalTimeOptions(selectedPrioritaria, TIMEFRAMES, selectedTiempo);
  const obstaclePrompt = firstPromptQuestion(selectedPrioritaria);
  const recommendation = goalsData.recommendation;
  const priorityAreas = recommendation.priorities;
  const primaryGroups = useMemo(() => primaryGoalGroups(goalsData.prioritarias, recommendation), [goalsData.prioritarias, recommendation]);
  const primaryOptions = useMemo(() => primaryGroups.flatMap(group => group.items), [primaryGroups]);
  const recommendedCount = primaryGroups[0]?.kind === 'recommended' ? primaryGroups[0].items.length : 0;
  const primaryVisibleCount = (recommendedCount || 4) + additionalPrimaryCount;
  const complementaryOrder = useMemo(() => complementaryEncounterOrder(goalsData.complementarias, journey.id), [goalsData.complementarias, journey.id]);

  const selectPrimary = (nextGoal, { reveal = false } = {}) => {
    selectionRevealRequested.current = reveal && nextGoal.id !== selectedPrioritaria?.id;
    const next = choosePrimary({ goal: selectedPrioritaria, draft: prioritariaDraft,
      drafts: primaryDrafts.current, time: selectedTiempo, manualTime: manualTime.current }, nextGoal, TIMEFRAMES);
    primaryDrafts.current = next.drafts;
    setSelectedPrioritaria(next.goal);
    setPrioritariaDraft(next.draft);
    setSelectedTiempo(next.time);
  };

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
    <div className="clarity-goals clarity-goals-layout mx-auto py-8 sm:py-12">
      <section className="goal-mobile-intro lg:hidden">
        <p className="navi-eyebrow" style={{ color: 'var(--coral-500)' }}>Cierre de mentoría</p>
        <h2>Construyamos tu plan</h2>
        <p className="navi-prose">Lo que conversaste con tu mentor o mentora hoy se convierte en compromisos que puedes sostener.</p>
        <details key={currentStep} className="goal-mobile-route">
          <summary>Paso {currentStep + 1} de {stepDefinitions.length}</summary>
          <nav aria-label="Pasos del plan">
            {stepDefinitions.map((step, index) => <button key={step.title} type="button"
              disabled={isSaving || Boolean(recovery) || !canVisitStep(index)}
              aria-current={index === currentStep ? 'step' : undefined}
              onClick={() => setCurrentStep(index)}>{index + 1}. {step.title}</button>)}
          </nav>
        </details>
      </section>

      <div className="goal-layout-grid">
        <section ref={sidebarRef} className={cn('clarity-goals-nav hidden shell-panel rounded-[18px] border border-[rgba(15,76,129,0.12)] px-7 py-8 sm:px-8 sm:py-10 lg:block', sidebarFits && 'goal-sidebar-sticky')}>
          <p className="navi-eyebrow">Cierre de mentoría</p>
          <h2 className="mt-4 font-display text-[2.4rem] font-bold tracking-tight text-[var(--ink-900)]">
            Construyamos tu plan
          </h2>
          <p className="navi-prose mt-4 text-sm sm:text-base">
            Lo que conversaste con tu mentor o mentora hoy se convierte en compromisos que puedes sostener.
          </p>
          <div className="mt-8">
            <ProgressBar current={completedSteps} total={stepDefinitions.length} />
          </div>
          <div className="goal-step-links">
            {stepDefinitions.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = step.ready;

              return (
                <button
                  key={step.title}
                  disabled={isSaving || Boolean(recovery) || !canVisitStep(index)}
                  aria-current={isActive ? 'step' : undefined}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-[20px] border px-4 py-4 text-left transition-all',
                    isActive
                      ? 'border-[rgba(15,76,129,0.20)] bg-white/85 '
                      : 'border-[rgba(15,76,129,0.08)] bg-white/50',
                    !canVisitStep(index) && 'cursor-default opacity-75'
                  )}
                >
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold',
                    isCompleted
                      ? 'bg-[rgba(210,106,92,0.14)] text-[var(--coral-500)]'
                      : 'bg-[rgba(15,76,129,0.08)] text-[var(--ink-700)]'
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-lg font-semibold text-[var(--ink-900)]">
                        {step.title}
                      </p>
                      {isCompleted ? <Check className="h-4 w-4 text-[var(--coral-500)]" /> : null}
                    </div>
                    {isActive ? <p className="goal-step-description mt-1 text-sm text-[var(--ink-700)]">{step.description}</p> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="goal-main">
          <div className="goal-step-heading">
            <p className="hidden navi-eyebrow lg:block" style={{ color: 'var(--coral-500)' }}>Paso {currentStep + 1} de {stepDefinitions.length}</p>
            <h3 ref={stepHeading} tabIndex={-1} className="mt-3 font-display text-3xl font-semibold text-[var(--ink-900)]">
              {currentStepData.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm text-[var(--ink-700)] sm:text-base">
              {currentStepData.description}
            </p>
          </div>

          {errorMessage ? (
            <div role="alert" className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
            <Card className="goal-step-panel border-[rgba(15,76,129,0.12)]" data-goal-step={currentStep}>
              <div className="goal-step-content">
                {currentStep === 0 ? (
                  <div inert={Boolean(recovery) || isSaving} className="space-y-5">
                    <div data-options-heading="primary">
                      <div className="goal-options-guidance text-sm text-[var(--ink-700)]">
                        {recommendedCount > 0 && additionalPrimaryCount === 0 && priorityAreas.length ? <p>
                          Opciones relacionadas con tus respuestas sobre <strong>{priorityAreas.map(item => item.label).join(' y ')}</strong>.
                        </p> : <p>Explora otras metas y elige la que quieras trabajar.</p>}
                        <p className="mt-2">Puedes explorar más metas sin perder tu selección.</p>
                      </div>
                    </div>
                    {selectedPrioritaria ? (
                      <div ref={selectionRef} id="goal-current-selection" tabIndex={-1} data-selected-primary className="goal-selected-summary">
                        <p className="text-sm font-semibold text-[var(--ink-900)]">{stepDefinitions[0].title}</p>
                        <span className="goal-dimension-label">{getGoalLabel(selectedPrioritaria)}</span>
                        <p className="break-words text-sm leading-relaxed text-[var(--ink-700)]">{prioritariaDraft}</p>
                        <PersonalizeGoal key={`edit-${selectedPrioritaria.id}`} value={prioritariaDraft} original={selectedPrioritaria.text}
                          onChange={setPrioritariaDraft} label="Tu meta prioritaria" />
                        <GoalExamples key={selectedPrioritaria.id} goal={selectedPrioritaria} />
                      </div>
                    ) : null}
                    <div className="goal-options-grid" role="group" aria-label="Opciones de meta prioritaria">
                      {primaryOptions.slice(0, primaryVisibleCount).map(goal => (
                        <GoalCard key={goal.id} goal={goal} isSelected={selectedPrioritaria?.id === goal.id}
                          onSelect={selectPrimary} />
                      ))}
                    </div>
                    <MoreGoals visible={primaryVisibleCount} total={primaryOptions.length} onMore={() => setAdditionalPrimaryCount(count => count + 4)} />

                  </div>
                ) : null}

                {currentStep === 1 ? (
                  <div inert={Boolean(recovery) || isSaving} className="space-y-5">
                    {selectedComplementaria ? <div ref={selectionRef} id="goal-current-selection" tabIndex={-1} data-selected-complementary className="goal-selected-summary">
                      <p className="text-sm font-semibold text-[var(--ink-900)]">{stepDefinitions[1].title}</p>
                      <span className="goal-dimension-label">{getGoalLabel(selectedComplementaria)}</span>
                      <p className="break-words text-sm leading-relaxed text-[var(--ink-700)]">{complementariaDraft}</p>
                      <PersonalizeGoal key={`edit-${selectedComplementaria.id}`} value={complementariaDraft} original={selectedComplementaria.text}
                        onChange={setComplementariaDraft} label="Tu meta complementaria" />
                      <GoalExamples key={selectedComplementaria.id} goal={selectedComplementaria} />
                    </div> : null}
                    <div className="goal-options-grid" role="group" aria-label="Opciones de meta complementaria">
                      {complementaryOrder.slice(0, complementaryVisibleCount).map(goal => (
                        <GoalCard key={goal.id} goal={goal} isSelected={selectedComplementaria?.id === goal.id}
                          onSelect={(nextGoal, { reveal = false } = {}) => {
                            selectionRevealRequested.current = reveal && nextGoal.id !== selectedComplementaria?.id;
                            if (selectedComplementaria) complementaryDrafts.current[selectedComplementaria.id] = complementariaDraft;
                            setSelectedComplementaria(nextGoal);
                            setComplementariaDraft(complementaryDrafts.current[nextGoal.id] ?? nextGoal.text);
                            setShowCustomComplementaria(false);
                          }} />
                      ))}
                    </div>
                    <MoreGoals visible={complementaryVisibleCount} total={complementaryOrder.length} onMore={() => setComplementaryVisibleCount(count => count + 4)} />
                    <div className="flex justify-center pt-1">
                      <Button variant="ghost" onClick={() => setShowCustomComplementaria(previous => !previous)}>
                        {showCustomComplementaria ? 'Ocultar meta libre' : 'Escribir una meta complementaria sencilla'}
                      </Button>
                    </div>
                    {showCustomComplementaria ? (
                      <div className="rounded-[18px] border border-[rgba(15,76,129,0.12)] bg-[var(--surface-raised)] p-6 ">
                        <label className="block text-sm font-semibold text-[var(--ink-900)]">
                          ¿Qué dimensión quieres cuidar este periodo?
                        </label>
                        <select
                          className="mt-3 w-full rounded-[16px] border border-[rgba(15,76,129,0.12)] bg-white/85 px-4 py-3 text-[var(--ink-900)] outline-none transition-all focus:border-[rgba(210,106,92,0.35)] focus:ring-4 focus:ring-[rgba(210,106,92,0.10)]"
                          value={customComplementariaDimension}
                          onChange={event => {
                            setCustomComplementariaDimension(event.target.value);
                            if (selectedComplementaria?.id === 'custom-complementaria') setSelectedComplementaria(previous => ({ ...previous, dimension: event.target.value }));
                          }}
                        >
                          {COMPLEMENTARY_DIMENSIONS.map((dimension) => (
                            <option key={dimension.value} value={dimension.value}>{dimension.label}</option>
                          ))}
                        </select>
                        <label className="mt-4 block text-sm font-semibold text-[var(--ink-900)]">
                          Escribe tu meta en una oración
                        </label>
                        <p className="mt-2 text-sm text-[var(--ink-700)]">
                          Describe qué quieres cuidar o sostener este periodo.
                        </p>
                        <textarea
                          className="mt-4 w-full rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/85 p-4 text-[var(--ink-900)] shadow-sm outline-none transition-all focus:border-[rgba(210,106,92,0.35)] focus:ring-4 focus:ring-[rgba(210,106,92,0.10)] resize-none"
                          rows="3"
                          maxLength={120}
                          placeholder="Ej. Dormir mejor entre semana para sostener mi energía y concentración."
                          value={customComplementariaText}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            if (selectedComplementaria && selectedComplementaria.id !== 'custom-complementaria') complementaryDrafts.current[selectedComplementaria.id] = complementariaDraft;
                            setCustomComplementariaText(nextValue);
                            setComplementariaDraft(nextValue);
                            if (nextValue.trim()) {
                              setSelectedComplementaria({
                                id: 'custom-complementaria',
                                text: nextValue.trim(),
                                dimension: customComplementariaDimension,
                                temaoperativo: '',
                                etapa: 'multietapa',
                              });
                            } else if (selectedComplementaria?.id === 'custom-complementaria') {
                              setSelectedComplementaria(null);
                            }
                          }}
                        />
                        <p className="mt-2 text-right text-xs text-[var(--ink-600)]">
                          {customComplementariaText.length}/120
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div inert={Boolean(recovery) || isSaving} className="goal-horizons">
                    {timeOptions.filter(time => time.id === suggestedTimeframeId).map(time => (
                      <HorizonOption key={time.id} time={time} suggested
                        selected={selectedTiempo?.id === time.id}
                        onSelect={() => { manualTime.current = true; setSelectedTiempo(time); }}>
                        <span className="goal-horizon-guidance">
                          Para esta meta, el horizonte sugerido es <strong>{selectedPrioritaria.horizontesugerido}</strong>. Puedes mantenerlo o ajustarlo si tu situación lo requiere.
                        </span>
                      </HorizonOption>
                    ))}
                    <div className="goal-horizon-alternatives">
                      {timeOptions.filter(time => time.id !== suggestedTimeframeId).map(time => (
                        <HorizonOption key={time.id} time={time} selected={selectedTiempo?.id === time.id}
                          onSelect={() => { manualTime.current = true; setSelectedTiempo(time); }} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div inert={Boolean(recovery) || isSaving} className="rounded-[18px] border border-[rgba(15,76,129,0.08)] bg-[var(--surface-raised)] p-6">
                    <label className="block text-sm font-semibold text-[var(--ink-900)]">
                      ¿Qué podría dificultarte lograr esta meta?
                    </label>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      {obstaclePrompt
                        ? `${obstaclePrompt} Anticipar el obstáculo hace más probable que puedas enfrentarlo a tiempo.`
                        : 'Nómbralo con honestidad. Anticipar el obstáculo hace más probable que puedas enfrentarlo a tiempo.'}
                    </p>
                    <textarea
                      className="mt-4 w-full rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/85 p-4 text-[var(--ink-900)] shadow-sm outline-none transition-all focus:border-[rgba(210,106,92,0.35)] focus:ring-4 focus:ring-[rgba(210,106,92,0.10)] resize-none"
                      placeholder={obstaclePrompt || 'Ej. Posponer tareas importantes cuando me siento abrumado/a o disperso/a.'}
                      rows="5"
                      value={obstaculo}
                      onChange={(e) => setObstaculo(e.target.value)}
                    />
                  </div>
                ) : null}

                {currentStep === 4 ? (
                  <div inert={Boolean(recovery) || isSaving} className="rounded-[18px] border border-[rgba(15,76,129,0.08)] bg-[var(--surface-raised)] p-6">
                    <label className="block text-sm font-semibold text-[var(--ink-900)]">
                      ¿Cómo vas a responder cuando aparezca ese obstáculo?
                    </label>
                    <p className="mt-2 text-sm text-[var(--ink-700)]">
                      Cuando aparezca ese obstáculo, ¿qué harás exactamente? Escríbelo antes de que pase.
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


              </div>
            </Card>
          )}
          {!isLoading ? (
                <div ref={footerRef} className="goal-step-footer border-t border-[rgba(15,76,129,0.08)]">
                  <div className="goal-step-footer-layout">
                    <div className="goal-step-status text-sm text-[var(--ink-700)]">
                    <p>
                    {isCurrentStepReady
                      ? currentStep === stepDefinitions.length - 1
                        ? 'Al confirmar, las metas y la estrategia quedarán como acuerdos de este encuentro.'
                        : 'Paso completo. Puedes continuar.'
                      : 'Completa este paso para avanzar al siguiente.'}
                    </p>
                    {(currentStep === 0 && selectedPrioritaria) || (currentStep === 1 && selectedComplementaria)
                      ? <a href="#goal-current-selection" onClick={event => {
                        event.preventDefault();
                        selectionRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
                        selectionRef.current?.focus({ preventScroll: true });
                      }}>Ver mi selección</a> : null}
                    </div>
                    <div className="goal-step-actions">
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
                        {currentStep === stepDefinitions.length - 1 ? 'Confirmar mi plan' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
