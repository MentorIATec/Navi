import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';
import { apiClient } from '../api/client';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CATEGORY_META, DIAGNOSTIC_BANK, DIAGNOSTIC_TO_CATALOG_MAP } from '../data/diagnosticBank';
import goalRecommendationMatrixRaw from '../data/goalRecommendationMatrix.csv?raw';

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

const DIAGNOSTIC_TAG_ALIASES = {
  'hábitos de estudio': 'desempeno_academico',
  'habitos de estudio': 'desempeno_academico',
  aprendizaje: 'desempeno_academico',
  'claridad academica': 'desempeno_academico',
  'claridad académica': 'desempeno_academico',
  carrera: 'claridad_carrera',
  'decision profesional': 'claridad_carrera',
  'decisión profesional': 'claridad_carrera',
  empleabilidad: 'plan_practicas',
  practicas: 'plan_practicas',
  'prácticas': 'plan_practicas',
  'servicio social': 'servicio_social',
  'semestre tec': 'decision_semestre_tec',
  intercambio: 'certificacion_idioma',
};

function parseCsvLine(line = '') {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseRecommendationMatrix(csvText = '') {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
}

const GOAL_RECOMMENDATION_MATRIX = parseRecommendationMatrix(goalRecommendationMatrixRaw);

function normalizeGoalOption(goal = {}) {
  return {
    id: goal.id || '',
    text: goal.text || goal.metabase || goal.metaBase || '',
    dimension: goal.dimension || '',
    temaoperativo: goal.temaoperativo || goal.temaOperativo || '',
    etapa: goal.etapa || '',
    pasosbase: goal.pasosbase || goal.pasosBase || '',
    horizontesugerido: goal.horizontesugerido || goal.horizonteSugerido || '',
    preguntasparaafinar: goal.preguntasparaafinar || goal.preguntasParaAfinar || '',
    conexiondiagnostico: goal.conexiondiagnostico || goal.conexionDiagnostico || '',
  };
}

function firstPromptQuestion(goal) {
  const prompt = String(goal?.preguntasparaafinar || '').split('|').map((part) => part.trim()).filter(Boolean)[0];
  return prompt || '';
}

function matchSuggestedTimeframe(goal) {
  const value = String(goal?.horizontesugerido || '').trim().toLowerCase();
  if (!value) return null;
  if (value.includes('mes') || value.includes('30 días') || value.includes('30 dias')) return 't2';
  if (value.includes('semestre')) return 't3';
  if (value.includes('periodo') || value.includes('parcial') || value.includes('5 semanas')) return 't1';
  if (value.includes('4 semanas') || value.includes('6 semanas') || value.includes('8 semanas') || value.includes('2 semanas')) return 't2';
  return 't4';
}

function getGoalLabel(goal) {
  const dimension = String(goal?.dimension || '').trim().toLowerCase();
  const tema = String(goal?.temaoperativo || '').trim().toLowerCase();
  return DIMENSION_LABELS[dimension] || tema || 'Meta sugerida';
}

function getDiagnosticPriorityAreas() {
  const rawPayload = localStorage.getItem('navi_diagnostic_payload');
  if (!rawPayload) return [];

  try {
    const payload = JSON.parse(rawPayload);
    const stage = payload.stage;
    const answers = payload.answers || {};
    const questions = payload.questions || DIAGNOSTIC_BANK[stage] || [];

    return questions
      .map(({ key, category, title }) => ({
        key,
        category,
        title,
        label: CATEGORY_META[category]?.label || title,
        score: Number(answers[key] || 0),
      }))
      .filter((item) => item.score > 0 && item.score <= 2)
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
  } catch (error) {
    console.error('No se pudieron leer las áreas prioritarias del diagnóstico:', error);
    return [];
  }
}

function getDiagnosticStage() {
  const rawPayload = localStorage.getItem('navi_diagnostic_payload');
  if (rawPayload) {
    try {
      const payload = JSON.parse(rawPayload);
      if (payload.stage) return String(payload.stage).trim().toLowerCase();
    } catch (error) {
      console.error('No se pudo leer la etapa del diagnóstico:', error);
    }
  }
  return String(localStorage.getItem('navi_diagnostic_stage') || '').trim().toLowerCase();
}

function getBalancedGoals(items, page = 0, size = 4) {
  const groups = new Map();
  items.forEach((item) => {
    const key = getGoalLabel(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const stageOrder = ['multietapa', 'exploracion', 'enfoque', ''];
  for (const [label, bucket] of groups.entries()) {
    const stageGroups = new Map();
    bucket.forEach((item) => {
      const stage = String(item?.etapa || '').trim().toLowerCase();
      if (!stageGroups.has(stage)) stageGroups.set(stage, []);
      stageGroups.get(stage).push(item);
    });

    const balancedBucket = [];
    let round = 0;
    while (true) {
      let addedInRound = false;
      for (const stage of stageOrder) {
        const stageBucket = stageGroups.get(stage) || [];
        if (stageBucket[round]) {
          balancedBucket.push(stageBucket[round]);
          addedInRound = true;
        }
      }
      for (const [stage, stageBucket] of stageGroups.entries()) {
        if (!stageOrder.includes(stage) && stageBucket[round]) {
          balancedBucket.push(stageBucket[round]);
          addedInRound = true;
        }
      }
      if (!addedInRound) break;
      round += 1;
    }
    groups.set(label, balancedBucket);
  }

  const labels = Array.from(groups.keys());
  if (!labels.length) return [];

  const pool = [];
  let round = 0;

  while (true) {
    let addedInRound = false;
    for (const label of labels) {
      const bucket = groups.get(label) || [];
      if (bucket[round]) {
        pool.push(bucket[round]);
        addedInRound = true;
      }
    }
    if (!addedInRound) break;
    round += 1;
  }

  const start = (page * size) % pool.length;
  const slice = pool.slice(start, start + size);
  if (slice.length === size) return slice;
  return [...slice, ...pool.slice(0, size - slice.length)];
}

function normalizeTopic(value = '') {
  const topic = String(value || '').trim().toLowerCase();
  return topic === 'servicio' ? 'servicio social' : topic;
}

function normalizeDimension(value = '') {
  const dimension = String(value || '').trim().toLowerCase();
  return dimension === 'física' ? 'fisica' : dimension;
}

function parseDiagnosticTags(value = '') {
  return String(value || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeDiagnosticTags(value = '') {
  const rawTags = parseDiagnosticTags(value);
  const normalized = rawTags.flatMap((tag) => {
    const alias = DIAGNOSTIC_TAG_ALIASES[tag];
    return alias ? [tag, alias] : [tag];
  });
  return Array.from(new Set(normalized));
}

function buildPrioritariaView(goals = [], priorityAreas = [], stage = '', expanded = false, exploring = false) {
  if (!goals.length) {
    return {
      visible: [],
      corridor: [],
      explore: [],
      hasMoreCorridor: false,
      hasExplore: false,
    };
  }

  const areaEntries = priorityAreas
    .map((item) => ({
      category: item.category,
      topics: (DIAGNOSTIC_TO_CATALOG_MAP[item.category]?.topics || []).map(normalizeTopic),
      dimensions: (DIAGNOSTIC_TO_CATALOG_MAP[item.category]?.dimensions || []).map(normalizeDimension),
    }))
    .filter((item) => item.category && (item.topics.length || item.dimensions.length));

  if (!areaEntries.length) {
    const corridor = goals;
    const visible = expanded ? corridor : showFirstGoals(corridor);
    return {
      visible,
      corridor,
      explore: [],
      hasMoreCorridor: corridor.length > visible.length,
      hasExplore: false,
    };
  }

  const directBuckets = areaEntries.map((entry) =>
    goals.filter((goal) => {
      const topic = normalizeTopic(goal.temaoperativo);
      const tags = normalizeDiagnosticTags(goal.conexiondiagnostico);
      return entry.topics.includes(topic) || tags.includes(entry.category);
    })
  );

  const matrixBuckets = areaEntries.map((entry) => {
    const curatedIds = GOAL_RECOMMENDATION_MATRIX
      .filter((row) =>
        String(row.Active || '').trim().toLowerCase() !== 'no' &&
        row.CategoryKey === entry.category &&
        row.Stage === stage
      )
      .sort((a, b) => Number(a.PriorityRank || 999) - Number(b.PriorityRank || 999))
      .map((row) => row.GoalId)
      .filter(Boolean);

    return curatedIds
      .map((goalId) => goals.find((goal) => goal.id === goalId))
      .filter(Boolean);
  });

  const seen = new Set();
  const directInterleaved = [];
  let round = 0;
  while (true) {
    let addedInRound = false;
    matrixBuckets.forEach((bucket) => {
      const goal = bucket[round];
      if (goal && !seen.has(goal.id)) {
        seen.add(goal.id);
        directInterleaved.push(goal);
        addedInRound = true;
      }
    });
    if (!addedInRound && round === 0) {
      // keep going; matrix can be partial and the diagnostic buckets should still contribute
    }
    directBuckets.forEach((bucket) => {
      const goal = bucket[round];
      if (goal && !seen.has(goal.id)) {
        seen.add(goal.id);
        directInterleaved.push(goal);
        addedInRound = true;
      }
    });
    if (!addedInRound) break;
    round += 1;
  }

  const sameTopicNotDirect = goals.filter((goal) => {
    if (seen.has(goal.id)) return false;
    const topic = normalizeTopic(goal.temaoperativo);
    return areaEntries.some((entry) => entry.topics.includes(topic));
  });

  sameTopicNotDirect.forEach((goal) => seen.add(goal.id));

  const related = goals.filter((goal) => {
    if (seen.has(goal.id)) return false;
    const dimension = normalizeDimension(goal.dimension);
    return areaEntries.some((entry) => entry.dimensions.includes(dimension));
  });

  const corridor = [...directInterleaved, ...sameTopicNotDirect];
  const fallbackCorridor = corridor.length ? corridor : goals;
  const visibleCore = expanded ? fallbackCorridor : showFirstGoals(fallbackCorridor);
  const visible = exploring ? [...fallbackCorridor, ...related] : visibleCore;

  return {
    visible,
    corridor: fallbackCorridor,
    explore: related,
    hasMoreCorridor: fallbackCorridor.length > visibleCore.length,
    hasExplore: related.length > 0,
  };
}

function showFirstGoals(goals = []) {
  return goals.slice(0, 4);
}

function showGoalsWindow(goals = [], pages = 1, size = 4) {
  return goals.slice(0, Math.max(size, pages * size));
}

export default function GoalSelection() {
  const navigate = useNavigate();
  const [goalsData, setGoalsData] = useState({ prioritarias: [], complementarias: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [syncWarning, setSyncWarning] = useState('');
  
  const [selectedPrioritaria, setSelectedPrioritaria] = useState(null);
  const [selectedComplementaria, setSelectedComplementaria] = useState(null);
  const [prioritariaDraft, setPrioritariaDraft] = useState('');
  const [selectedTiempo, setSelectedTiempo] = useState(null);
  const [obstaculo, setObstaculo] = useState('');
  const [plan, setPlan] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [prioritariaPages, setPrioritariaPages] = useState(1);
  const [showExplorePrioritaria, setShowExplorePrioritaria] = useState(false);
  const [complementariaPage, setComplementariaPage] = useState(0);
  const [showCustomComplementaria, setShowCustomComplementaria] = useState(false);
  const [customComplementariaDimension, setCustomComplementariaDimension] = useState('emocional');
  const [customComplementariaText, setCustomComplementariaText] = useState('');

  useEffect(() => {
    async function loadGoals() {
      try {
        const rawPayload = localStorage.getItem('navi_diagnostic_payload');
        let stage = localStorage.getItem('navi_diagnostic_stage') || '';
        if (rawPayload) {
          try {
            const payload = JSON.parse(rawPayload);
            stage = payload.stage || stage;
          } catch (error) {
            console.error('No se pudo leer el payload del diagnóstico:', error);
          }
        }
        const priorityAreas = getDiagnosticPriorityAreas();
        const data = await apiClient.post('getMetas', { stage, priorityAreas });
        setGoalsData({
          prioritarias: (data.prioritarias || []).map(normalizeGoalOption),
          complementarias: (data.complementarias || []).map(normalizeGoalOption),
        });
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
    if (selectedPrioritaria && !prioritariaDraft) {
      setPrioritariaDraft(selectedPrioritaria.text);
    }
  }, [selectedPrioritaria, prioritariaDraft]);

  useEffect(() => {
    setPrioritariaPages(1);
    setShowExplorePrioritaria(false);
  }, [goalsData.prioritarias]);

  useEffect(() => {
    if (selectedPrioritaria && !selectedTiempo) {
      const suggestedId = matchSuggestedTimeframe(selectedPrioritaria);
      const suggested = TIMEFRAMES.find((item) => item.id === suggestedId);
      if (suggested) {
        setSelectedTiempo(suggested);
      }
    }
  }, [selectedPrioritaria, selectedTiempo]);

  useEffect(() => {
    if (prioritariaDraft.trim()) {
      localStorage.setItem('meta_prioritaria', prioritariaDraft.trim());
    }
  }, [prioritariaDraft]);

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

  useEffect(() => {
    if (showCustomComplementaria && customComplementariaText.trim()) {
      setSelectedComplementaria({
        id: 'custom-complementaria',
        text: customComplementariaText.trim(),
        dimension: customComplementariaDimension,
        temaoperativo: '',
        etapa: 'multietapa',
      });
    }
  }, [customComplementariaDimension, customComplementariaText, showCustomComplementaria]);

  const handleConfirm = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSyncWarning('');

    localStorage.setItem('meta_prioritaria', prioritariaDraft.trim() || selectedPrioritaria.text);
    localStorage.setItem('meta_complementaria', selectedComplementaria.text);
    localStorage.setItem('meta_tiempo', selectedTiempo.label);
    localStorage.setItem('meta_obstaculo', obstaculo);
    localStorage.setItem('meta_plan', plan);

    try {
      const response = await apiClient.post('saveGoalSelection', {
        matricula: localStorage.getItem('navi_matricula'),
        nombre: localStorage.getItem('navi_user_name'),
        metaPrioritaria: prioritariaDraft.trim() || selectedPrioritaria.text,
        metaComplementaria: selectedComplementaria.text,
        tiempo: selectedTiempo.label,
        obstaculo,
        plan,
        checkIn: localStorage.getItem('navi_checked_in') === 'true' ? 'Si' : undefined,
      });
      if (response?.source === 'fallback') {
        const warning =
          response.warning ||
          'Tu plan se guardó solo en este dispositivo. Intenta sincronizarlo de nuevo para asegurarte de que mentoría lo reciba.';
        localStorage.setItem('navi_goal_selection_warning', warning);
        setSyncWarning(warning);
      } else {
        localStorage.removeItem('navi_goal_selection_warning');
      }
      navigate('/plan-accion');
    } catch (error) {
      console.error('No se pudo guardar la selección de metas:', error);
      setErrorMessage('No pudimos guardar tus metas en este momento. Vuelve a intentarlo antes de continuar.');
    } finally {
      setIsSaving(false);
    }
  };

  const GoalCard = ({ goal, isSelected, onSelect, showLabel = true }) => {
    return (
      <Card
        onClick={() => onSelect(goal)}
        className={cn(
          'cursor-pointer overflow-hidden border transition-all',
          isSelected
            ? 'border-[rgba(15,76,129,0.26)] bg-[linear-gradient(180deg,rgba(242,247,253,0.98)_0%,rgba(231,239,249,0.94)_100%)] shadow-[0_16px_34px_rgba(17,36,66,0.10)] ring-1 ring-[rgba(210,106,92,0.16)]'
            : 'border-[rgba(15,76,129,0.08)] bg-white/72 hover:border-[rgba(15,76,129,0.18)] hover:bg-white hover:shadow-[0_14px_34px_rgba(17,36,66,0.10)]'
        )}
      >
        <div className="flex min-h-[210px] flex-col p-5 sm:min-h-[230px] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            {showLabel ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--navy-500)]">
                {getGoalLabel(goal)}
              </span>
            ) : (
              <span />
            )}
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
          <div className="mt-5 flex-1">
            <h4
              className={cn(
                'font-display text-[1.08rem] leading-[1.14] tracking-tight text-[var(--ink-900)] sm:text-[1.2rem]',
                isSelected ? 'font-semibold' : 'font-medium'
              )}
            >
              {goal.text}
            </h4>
          </div>
        </div>
      </Card>
    );
  };

  const canProceed = selectedPrioritaria && prioritariaDraft.trim().length > 6 && selectedComplementaria && selectedTiempo && obstaculo.trim().length > 3 && plan.trim().length > 5;
  const stepDefinitions = [
    {
      title: 'Meta prioritaria',
      description: 'Selecciona una meta enfocada en tu avance académico o profesional.',
      ready: Boolean(selectedPrioritaria && prioritariaDraft.trim().length > 6),
    },
    {
      title: 'Meta complementaria',
      description: 'Elige una meta que fortalezca tu bienestar y desarrollo integral.',
      ready: Boolean(selectedComplementaria),
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
  const suggestedTimeframeId = matchSuggestedTimeframe(selectedPrioritaria);
  const obstaclePrompt = firstPromptQuestion(selectedPrioritaria);
  const priorityAreas = getDiagnosticPriorityAreas();
  const diagnosticStage = getDiagnosticStage();
  const prioritariaView = buildPrioritariaView(goalsData.prioritarias, priorityAreas, diagnosticStage, true, showExplorePrioritaria);
  const prioritariasVisibles = showExplorePrioritaria
    ? prioritariaView.visible
    : showGoalsWindow(prioritariaView.corridor, prioritariaPages, 4);
  const hasMorePrioritariasInCorridor = prioritariaView.corridor.length > prioritariasVisibles.length;
  const complementariasVisibles = getBalancedGoals(goalsData.complementarias, complementariaPage, 4);
  const canRotateComplementarias = goalsData.complementarias.length > 4;

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
      <section className="mb-6 rounded-[24px] border border-[rgba(15,76,129,0.10)] bg-white/78 px-5 py-5 lg:hidden">
        <p className="navi-eyebrow" style={{ color: 'var(--coral-500)' }}>
          Paso {currentStep + 1} de {stepDefinitions.length}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--ink-900)]">
          {currentStepData.title}
        </h2>
        <div className="mt-4">
          <ProgressBar current={currentStep + 1} total={stepDefinitions.length} />
        </div>
      </section>

      <div className="mb-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <section className="hidden shell-panel rounded-[30px] border border-[rgba(15,76,129,0.12)] px-7 py-8 sm:px-8 sm:py-10 lg:block">
          <p className="navi-eyebrow">Cierre de mentoría</p>
          <h2 className="mt-4 font-display text-[2.4rem] font-bold tracking-tight text-[var(--ink-900)]">
            Construyamos tu plan
          </h2>
          <p className="navi-prose mt-4 text-sm sm:text-base">
            Lo que conversaste con tu mentor o mentora hoy se convierte en compromisos que puedes sostener.
          </p>
          <div className="mt-8">
            <ProgressBar current={currentStep + 1} total={stepDefinitions.length} />
          </div>
          <div className="mt-8 space-y-3">
            {stepDefinitions.map((step, index) => {
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
            <p className="hidden navi-eyebrow lg:block" style={{ color: 'var(--coral-500)' }}>Paso {currentStep + 1} de {stepDefinitions.length}</p>
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
          {syncWarning ? (
            <div className="mb-6 rounded-[20px] border border-[rgba(210,106,92,0.18)] bg-[rgba(249,236,232,0.7)] px-4 py-3 text-sm font-medium text-[var(--ink-900)]">
              {syncWarning}
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
                  <div className="space-y-5">
                    {priorityAreas.length ? (
                      <div className="rounded-[18px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.88)] px-4 py-3 text-sm text-[var(--ink-700)]">
                        Estas metas se ordenaron a partir de tus áreas de oportunidad más sensibles:
                        <strong>{` ${priorityAreas.map((item) => item.label).join(' y ')}`}</strong>.
                      </div>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {prioritariasVisibles.map(goal => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          isSelected={selectedPrioritaria?.id === goal.id}
                          showLabel
                          onSelect={(nextGoal) => {
                            setSelectedPrioritaria(nextGoal);
                            setPrioritariaDraft(nextGoal.text);
                            const nextSuggestedId = matchSuggestedTimeframe(nextGoal);
                            const nextSuggested = TIMEFRAMES.find((item) => item.id === nextSuggestedId);
                            if (nextSuggested) setSelectedTiempo(nextSuggested);
                          }}
                        />
                      ))}
                    </div>
                    {!showExplorePrioritaria && hasMorePrioritariasInCorridor ? (
                      <div className="flex justify-center pt-1">
                        <Button variant="outline" onClick={() => setPrioritariaPages((prev) => prev + 1)}>
                          {prioritariaPages === 1 ? 'Ver más metas relacionadas' : 'Ver 4 más'}
                        </Button>
                      </div>
                    ) : null}
                    {!hasMorePrioritariasInCorridor && !showExplorePrioritaria && prioritariaView.hasExplore ? (
                      <div className="space-y-4 pt-1">
                        <div className="rounded-[18px] border border-dashed border-[rgba(15,76,129,0.14)] bg-[rgba(255,255,255,0.55)] px-4 py-3 text-sm text-[var(--ink-700)]">
                          Ya viste las metas más relacionadas con tus áreas prioritarias. Si quieres, también puedes explorar otras metas de contexto similar.
                        </div>
                        <div className="flex justify-center">
                          <Button variant="ghost" onClick={() => setShowExplorePrioritaria(true)}>
                            Explorar otras metas
                          </Button>
                        </div>
                      </div>
                    ) : null}
                    {showExplorePrioritaria && prioritariaView.explore.length ? (
                      <div className="space-y-4 pt-2">
                        <div className="rounded-[18px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.88)] px-4 py-3 text-sm text-[var(--ink-700)]">
                          Aquí estás viendo metas de la misma dimensión institucional, pero menos directamente vinculadas a tus áreas más bajas.
                        </div>
                      </div>
                    ) : null}
                    {selectedPrioritaria ? (
                      <div className="rounded-[24px] border border-[rgba(15,76,129,0.12)] bg-[rgba(249,252,255,0.96)] p-6 shadow-[0_14px_28px_rgba(17,36,66,0.08)]">
                        <label className="block text-sm font-semibold text-[var(--ink-900)]">
                          ¿Así quieres expresar esta meta?
                        </label>
                        <p className="mt-2 text-sm text-[var(--ink-700)]">
                          Puedes dejarla tal como está o ajustarla para que se sienta más tuya.
                        </p>
                        <textarea
                          className="mt-4 w-full rounded-[20px] border border-[rgba(15,76,129,0.12)] bg-white/85 p-4 text-[var(--ink-900)] shadow-sm outline-none transition-all focus:border-[rgba(210,106,92,0.35)] focus:ring-4 focus:ring-[rgba(210,106,92,0.10)] resize-none"
                          rows="4"
                          value={prioritariaDraft}
                          onChange={(e) => setPrioritariaDraft(e.target.value)}
                        />
                        {selectedPrioritaria.pasosbase ? (
                          <details className="mt-4 rounded-[18px] border border-[rgba(15,76,129,0.08)] bg-white/72 px-4 py-3">
                            <summary className="cursor-pointer text-sm font-semibold text-[var(--navy-500)]">
                              Ver ejemplos de cómo avanzar con esta meta
                            </summary>
                            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-700)]">
                              {selectedPrioritaria.pasosbase.split(';').map((step) => step.trim()).filter(Boolean).join(' · ')}
                            </p>
                          </details>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentStep === 1 ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {complementariasVisibles.map(goal => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          isSelected={selectedComplementaria?.id === goal.id}
                          onSelect={(nextGoal) => {
                            setSelectedComplementaria(nextGoal);
                            setShowCustomComplementaria(false);
                            setCustomComplementariaText('');
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-center">
                      {canRotateComplementarias ? (
                        <Button variant="outline" onClick={() => setComplementariaPage((prev) => prev + 1)}>
                          Mostrar nuevas opciones
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowCustomComplementaria((prev) => !prev);
                          if (!showCustomComplementaria) {
                            setSelectedComplementaria(null);
                          }
                        }}
                      >
                        {showCustomComplementaria ? 'Ocultar meta libre' : 'Escribir una meta complementaria sencilla'}
                      </Button>
                    </div>
                    {showCustomComplementaria ? (
                      <div className="rounded-[24px] border border-[rgba(15,76,129,0.12)] bg-[rgba(249,252,255,0.96)] p-6 shadow-[0_14px_28px_rgba(17,36,66,0.08)]">
                        <label className="block text-sm font-semibold text-[var(--ink-900)]">
                          ¿Qué dimensión quieres cuidar este periodo?
                        </label>
                        <select
                          className="mt-3 w-full rounded-[16px] border border-[rgba(15,76,129,0.12)] bg-white/85 px-4 py-3 text-[var(--ink-900)] outline-none transition-all focus:border-[rgba(210,106,92,0.35)] focus:ring-4 focus:ring-[rgba(210,106,92,0.10)]"
                          value={customComplementariaDimension}
                          onChange={(e) => setCustomComplementariaDimension(e.target.value)}
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
                            setCustomComplementariaText(nextValue);
                            if (nextValue.trim()) {
                              setSelectedComplementaria({
                                id: 'custom-complementaria',
                                text: nextValue.trim(),
                                dimension: customComplementariaDimension,
                                temaoperativo: '',
                                etapa: 'multietapa',
                              });
                            } else {
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
                  <div>
                    {selectedPrioritaria?.horizontesugerido ? (
                      <div className="mb-4 rounded-[20px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.92)] px-5 py-4 text-sm text-[var(--ink-700)]">
                        Para esta meta, el horizonte sugerido es <strong>{selectedPrioritaria.horizontesugerido}</strong>. Puedes mantenerlo o ajustarlo si tu situación lo requiere.
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {TIMEFRAMES.map(time => (
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
                          <div className="space-y-3">
                            <p className="font-display text-lg font-semibold text-[var(--ink-900)]">{time.label}</p>
                            {time.id === suggestedTimeframeId ? (
                              <span className="inline-flex rounded-full bg-[rgba(210,106,92,0.18)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--coral-500)] ring-1 ring-[rgba(210,106,92,0.22)]">
                                Sugerido
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-[var(--ink-700)]">
                            {time.id === 't1' && 'Ideal para activar hábitos concretos de inmediato.'}
                            {time.id === 't2' && 'Permite sostener el esfuerzo más allá del primer impulso.'}
                            {time.id === 't3' && 'Alinea tus metas con el horizonte natural del semestre.'}
                            {time.id === 't4' && 'Útil si tu ruta requiere adaptarse a cambios o imprevistos.'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="rounded-[24px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.92)] p-6">
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
                  <div className="rounded-[24px] border border-[rgba(15,76,129,0.08)] bg-[rgba(249,252,255,0.92)] p-6">
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

                <div className="mt-8 border-t border-[rgba(15,76,129,0.08)] pt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-[20rem] text-sm text-[var(--ink-700)]">
                    {isCurrentStepReady
                      ? currentStep === stepDefinitions.length - 1
                        ? 'Listo. Tu plan ya tiene lo que necesita.'
                        : 'Paso completo. Puedes continuar.'
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
                        {currentStep === stepDefinitions.length - 1 ? 'Ver mi plan' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
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
