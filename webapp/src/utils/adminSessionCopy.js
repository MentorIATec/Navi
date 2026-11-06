import { CATEGORY_META, DIAGNOSTIC_BANK, DIAGNOSTIC_STAGE_OPTIONS } from '../data/diagnosticBank.js';
import { getPriorityAreaIdsFromScores } from './testResults.js';

const normalizeLabel = value => String(value || '').trim().toLocaleLowerCase('es-MX')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_]+/g, '');
const areaLabels = new Map(Object.entries(CATEGORY_META).flatMap(([id, { label }]) => [
  [normalizeLabel(id), label], [normalizeLabel(label), label],
]));

export function getSessionAreaLabel(value) {
  return areaLabels.get(normalizeLabel(value)) || 'Área sin etiqueta disponible';
}

export function getSessionStageLabel(value) {
  return DIAGNOSTIC_STAGE_OPTIONS.find(stage => normalizeLabel(stage.id) === normalizeLabel(value))?.label
    || 'Etapa sin información disponible';
}

export function getSessionScaleLabel(value) {
  const stage = DIAGNOSTIC_STAGE_OPTIONS.find(stage => normalizeLabel(stage.id) === normalizeLabel(value));
  const sizes = new Set((DIAGNOSTIC_BANK[stage?.id] || []).map(question => question.options.length));
  return sizes.size === 1 ? `Escala 1–${[...sizes][0]}` : 'Escala no disponible';
}

export function getSessionAreas(diag) {
  return [...new Set(String(diag?.areasprioritarias || diag?.areasPrioritarias || '').split(',')
    .map(area => area.trim()).filter(Boolean).map(getSessionAreaLabel))];
}

// Date-only fields must retain their calendar day, without UTC parsing shifting it.
// Timestamps use the device's local zone, as the rest of the session editor does.
export function formatSessionRecordDate(value) {
  if (!value) return '';
  const source = String(value);
  const parts = source.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!parts) return '';
  const [, year, month, day] = parts;
  const calendar = new Date(`${year}-${month}-${day}T12:00:00Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return '';
  if (source.length === 10) return source;
  const date = new Date(source);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const cycleOf = record => String(record?.operationalCycle || record?.operationalcycle || '').trim().toUpperCase();
const studentIdOf = record => String(record?.matricula || '').trim().toUpperCase();

export function getCrmSourceReview(student, diag, goalSelection) {
  const studentId = studentIdOf(student);
  if ([diag, goalSelection].some(record => studentId && studentIdOf(record) && studentIdOf(record) !== studentId)) {
    return { canCopy: false, message: 'El test o las metas consultados corresponden a otra matrícula. Revisa los registros antes de copiar el resumen para CRM.' };
  }
  const testCycle = cycleOf(diag);
  const goalCycle = cycleOf(goalSelection);
  if (testCycle && goalCycle && testCycle !== goalCycle) {
    return { canCopy: false, message: 'El test y las metas consultados pertenecen a ciclos distintos. Revisa los registros antes de copiar el resumen para CRM.' };
  }
  // GoalSelections has no diagnostic ResponseId link. A matching cycle or date
  // cannot establish that these were the agreements of the indicated session.
  return { canCopy: true, message: 'Los registros consultados no confirman por sí solos los acuerdos de esta sesión. Revisa la vigencia del check-in, el test y las metas antes de documentar en CRM.' };
}

// Editorial mapping of the existing arrival summaries, without changing the
// questionnaire or treating these declarations as observations of the mentor.
const arrivalPhrases = new Map([
  ['Llega con energía y ganas de avanzar', 'Al inicio de la sesión, indicó que llegaba con energía y ganas de avanzar.'],
  ['Llega con algo de carga o cansancio', 'Al inicio de la sesión, indicó que llegaba con algo de carga o cansancio.'],
  ['Llega con muchas cosas en la cabeza', 'Al inicio de la sesión, indicó que llegaba con muchas cosas en la cabeza.'],
  ['Llega con incertidumbre sobre sus siguientes pasos', 'Al inicio de la sesión, indicó que llegaba con incertidumbre sobre sus siguientes pasos.'],
]);
const intentPhrases = new Map([
  ['Quiere revisar avances y ajustar lo que sigue', 'Buscaba revisar sus avances y ajustar lo que sigue.'],
  ['Quiere ordenar prioridades y saber por dónde empezar', 'Buscaba ordenar sus prioridades y saber por dónde empezar.'],
  ['Quiere entender algo que hoy le genera confusión', 'Buscaba entender algo que le generaba confusión.'],
  ['Quiere salir con un paso concreto', 'Buscaba salir con un paso concreto.'],
]);

function getCrmArrivalContext(value) {
  const source = String(value || '');
  if (!source.trim()) return '';
  const parts = source.split('·').map(part => part.trim().replace(/\.$/, ''));
  const arrival = parts.length === 2 && arrivalPhrases.get(parts[0]);
  const intent = parts.length === 2 && intentPhrases.get(parts[1]);
  // Product rule confirmed by the owner: this thermometer is completed only
  // at session check-in. It describes arrival, not actions of the mentor.
  if (arrival && intent) return `${arrival} ${intent}`;
  // Preserve unknown/legacy/free-text summaries in full, rather than guessing
  // their meaning or discarding an unrecognized part of the declaration.
  return `En el termómetro de llegada se registró:\n${source.replace(/ *· */g, '\n')}`;
}

function getCrmTestContext(diag) {
  if (!diag) return '';
  const testDate = formatSessionRecordDate(diag?.fechaTest || diag?.fechatest || diag?.timestamp);
  const questions = DIAGNOSTIC_BANK[diag.etapa] || [];
  const values = new Map(Object.entries({ ...diag, ...diag.scores }).map(([key, value]) => [normalizeLabel(key), value]));
  const scores = Object.fromEntries(questions.map(question => [question.category, Number(values.get(normalizeLabel(question.category)))]));
  const complete = questions.length > 0 && questions.every(question => Number.isInteger(scores[question.category])
    && scores[question.category] >= 1 && scores[question.category] <= question.options.length);
  const areas = complete ? getPriorityAreaIdsFromScores(scores).map(getSessionAreaLabel) : getSessionAreas(diag);
  const knownAreas = areas.filter(label => label !== 'Área sin etiqueta disponible');
  const reference = testDate ? `al test del ${testDate}` : 'al test';
  if (knownAreas.length) {
    const labels = knownAreas.map(label => label === 'Semestre Tec' ? label : label.charAt(0).toLocaleLowerCase('es-MX') + label.slice(1));
    const topics = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}` : labels[0];
    return `A partir de sus respuestas ${reference}, se sugirió conversar sobre ${topics}.`;
  }
  if (complete) return `Sus respuestas ${reference} no señalaron temas prioritarios específicos para conversar.`;
  return 'La información disponible del test no permite precisar temas prioritarios para conversar.';
}

export function buildMentoringSummary(student, diag, goalSelection, draft = {}) {
  const studentName = student?.preferredName || student?.name || 'Estudiante';
  const hasNotes = Boolean(String(draft.notasMentor || '').trim());
  const arrivalContext = getCrmArrivalContext(student?.agenciaCheckIn);
  const blocks = [
    'Registro de acompañamiento con faro',
    `Fecha de sesión: ${formatSessionRecordDate(draft.fechaSesion) || 'sin información disponible'}`,
    `Estudiante: ${studentName} (${student?.matricula || 'sin matrícula disponible'})`,
  ];

  const encounter = [arrivalContext, getCrmTestContext(diag), hasNotes ? draft.notasMentor : ''].filter(Boolean);
  if (encounter.length) blocks.push('', 'Durante el encuentro', encounter.join('\n\n'));

  const goalFields = [
    ['Meta prioritaria', 'metaprioritaria'], ['Meta complementaria', 'metacomplementaria'],
    ['Tiempo previsto', 'tiempo'],
  ];
  const linesFor = fields => fields.filter(([, key]) => String(goalSelection?.[key] || '').trim())
    .map(([label, key]) => `${label}: ${goalSelection[key]}`);
  const commitments = linesFor(goalFields);
  if (commitments.length) {
    blocks.push('', hasNotes ? 'Con base en la conversación, las metas elegidas para trabajar fueron:' : 'Las metas elegidas para trabajar fueron:', ...commitments);
  } else {
    blocks.push('', 'No hay metas disponibles en esta consulta.');
  }
  const nextSteps = linesFor([['Obstáculo identificado', 'obstaculo'], ['Estrategia elegida', 'plan']]);
  if (nextSteps.length) {
    const transition = nextSteps.length === 2 ? 'El obstáculo anticipado y la estrategia de acción elegida fueron:'
      : String(goalSelection?.obstaculo || '').trim() ? 'El obstáculo anticipado fue:' : 'La estrategia de acción elegida fue:';
    blocks.push('', transition, ...nextSteps);
  }
  return blocks.join('\n');
}
