import { createHash, createHmac, randomBytes } from 'node:crypto';
import { prepareGoalCatalog, recommendGoals, eligible } from './goalCatalog.js';
import { balancedGoalPage } from '../../src/utils/goalRecommendations.js';
import { CATEGORY_META, DIAGNOSTIC_BANK } from '../../src/data/diagnosticBank.js';

const LIMIT = 16;
const PRIMARY_LIMIT = 12; // Preserve room for four complementary choices.
const TTL = 4 * 60 * 60 * 1000;
const PRIMARY = new Set(['ocupacional', 'intelectual', 'financiera']);
const FAMILY_GROUPS = [
  ['PRA001', 'SEED056', 'SEED061'], ['PRA002', 'SEED099'], ['PRA004', 'SEED090'], ['CAR003', 'SEED089'],
  ['SEED058', 'SEED060'], ['EMO001', 'SEED082'], ['FIN001', 'SEED078'],
];
const families = new Map(FAMILY_GROUPS.flatMap((ids, i) => ids.map(id => [id, `family-${i}`])));
const family = goal => families.get(goal.id) || `text:${goal.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
const fail = (statusCode, code) => { throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode, code }); };
const hash = value => createHash('sha256').update(value).digest('hex');
const topicsFor = stage => (DIAGNOSTIC_BANK[stage] || []).map(q => ({ id: q.category, label: CATEGORY_META[q.category].label }));

export function recoverContext(entry, session, requestedCycle) {
  if (String(entry?.student?.matricula || '').trim().toUpperCase() !== session.matricula) fail(403, 'GOAL_SCOPE_INVALID');
  const cycle = String(entry.operationalCycle || '');
  const test = entry.testResponse;
  if (!cycle || cycle !== requestedCycle) fail(409, 'OPERATIONAL_CYCLE_CHANGED');
  if (!test && entry.assistedExploration === true) return { cycle, responseId: 'assisted', diagnostic: { stage: 'acompanamiento', answers: {} } };
  if ((test?.operationalCycle || entry.diagnosticContext?.cycle) !== cycle) fail(409, 'OPERATIONAL_CYCLE_CHANGED');
  const questions = DIAGNOSTIC_BANK[test?.etapa];
  const diagnosticRef = test?.responseId || (/^legacy:[a-f0-9]{64}$/.test(entry.diagnosticContext?.reference || '') ? entry.diagnosticContext.reference : '');
  if (!questions || !diagnosticRef || String(test.matricula).trim().toUpperCase() !== session.matricula) fail(409, 'GOAL_DIAGNOSTIC_REQUIRED');
  const answers = {};
  for (const q of questions) {
    const score = Number(test.scores?.[q.category]);
    if (!Number.isInteger(score) || score < 1 || score > 5) fail(409, 'GOAL_DIAGNOSTIC_REQUIRED');
    answers[q.key] = score;
  }
  return { cycle, responseId: diagnosticRef, diagnostic: { stage: test.etapa, answers } };
}

function matchesTopic(goal, topic) {
  if (topic === 'recommended') return true;
  if (topic === 'financiera' || ['emocional', 'social', 'fisica', 'espiritual'].includes(topic)) return goal.dimension === topic;
  const tags = String(goal.conexiondiagnostico || '').split(',').map(t => t.trim());
  if (tags.includes(topic)) return true;
  if (topic === 'plan_practicas') return ['SEED051', 'SEED058', 'SEED060', 'SEED089', 'SEED095'].includes(goal.id);
  if (topic === 'claridad_carrera') return ['SEED051', 'SEED058', 'SEED060', 'SEED094', 'SEED095'].includes(goal.id);
  if (topic === 'certificacion_idioma') return ['SEED094', 'SEED095'].includes(goal.id);
  return false;
}

export function createGoalExplorationService({ loadEntry, loadCatalog, store, secret, now = Date.now }) {
  if (String(secret).length < 32) throw new Error('Exploration secret required');
  const opaque = (scope, id) => createHmac('sha256', secret).update(`${scope}:${id}`).digest('base64url');
  return async function explore(action, data, session) {
    if (!['getGoalOptions', 'getGoalDetails'].includes(action)) fail(400, 'GOAL_ACTION_INVALID');
    if (data.matricula && data.matricula !== session.matricula) fail(409, 'STUDENT_SESSION_CHANGED');
    if (typeof data.operationalCycle !== 'string' || !['prioritaria', 'complementaria'].includes(data.kind)) fail(400, 'GOAL_SCOPE_INVALID');
    // Stage, scores, size, offset and arbitrary IDs never come from the caller.
    if (Object.keys(data).some(key => !['matricula', 'operationalCycle', 'kind', 'context', 'cursor', 'optionId'].includes(key))) fail(400, 'GOAL_INPUT_INVALID');
    const [entry, catalogData] = await Promise.all([loadEntry(session.matricula), loadCatalog()]);
    const context = recoverContext(entry, session, data.operationalCycle);
    const scope = hash(`${session.matricula}:${context.cycle}:${context.responseId}`);
    // Refreshing a cookie or replacing a diagnostic cannot mint another exposure budget.
    const key = createHmac('sha256', secret).update(`${session.matricula}:${context.cycle}`).digest('hex');
    const catalog = prepareGoalCatalog(catalogData);
    const all = [...catalog.prioritarias, ...catalog.complementarias];
    const byId = new Map(all.map(goal => [goal.id, goal]));
    const kindPool = data.kind === 'prioritaria' ? catalog.prioritarias : catalog.complementarias;
    const recommendation = recommendGoals(kindPool, context.diagnostic);
    const available = [...recommendation.recommended, ...recommendation.alternatives];
    const topics = data.kind === 'prioritaria'
      ? topicsFor(context.diagnostic.stage).concat({ id: 'financiera', label: 'Financiera' })
      : ['emocional', 'social', 'fisica', 'espiritual'].map(id => ({ id, label: id === 'fisica' ? 'Física' : id[0].toUpperCase() + id.slice(1) }));
    const contexts = [{ id: 'recommended', label: data.kind === 'prioritaria' ? 'Meta prioritaria' : 'Meta complementaria' },
      ...topics.filter(topic => available.some(goal => matchesTopic(goal, topic.id)))];
    const topic = data.context ?? 'recommended';
    if (!contexts.some(item => item.id === topic)) fail(400, 'GOAL_CONTEXT_INVALID');
    const basic = goal => ({ id: opaque(scope, goal.id), text: goal.text, dimension: goal.dimension, horizontesugerido: goal.horizontesugerido || '' });
    return store.withScope(key, existing => {
      const stamp = now();
      const state = existing && existing.expiresAt > stamp ? existing : { expiresAt: stamp + TTL, responseId: context.responseId, seen: [], pages: {}, cursors: {}, requests: [] };
      if (state.responseId !== context.responseId) {
        if (state.responseId !== 'assisted') fail(409, 'GOAL_DIAGNOSTIC_CHANGED');
        // A completed test can refine an assisted journey, preserving exposure.
        state.responseId = context.responseId; state.pages = {}; state.cursors = {};
      }
      state.requests = state.requests.filter(time => time > stamp - 60000);
      if (state.requests.length >= 60) fail(429, 'GOAL_RATE_LIMIT');
      state.requests.push(stamp);
      if (action === 'getGoalDetails') {
        const id = typeof data.optionId === 'string' && state.seen.find(id => opaque(scope, id) === data.optionId);
        const goal = byId.get(id);
        if (!goal || !eligible(goal, context.diagnostic) || PRIMARY.has(goal.dimension) !== (data.kind === 'prioritaria')) fail(403, 'GOAL_OPTION_NOT_ISSUED');
        return { state, result: { option: { ...basic(goal), pasosbase: goal.pasosbase || '', preguntasparaafinar: goal.preguntasparaafinar || '' } } };
      }
      const pageKey = `${data.kind}:${topic}`;
      const pages = state.pages[pageKey] || (state.pages[pageKey] = []);
      let pageIndex = 0;
      if (data.cursor != null) {
        const point = typeof data.cursor === 'string' && state.cursors[data.cursor];
        if (!point || point.key !== pageKey) fail(409, 'GOAL_CONTINUATION_INVALID');
        pageIndex = point.index;
      }
      if (pageIndex > pages.length) fail(409, 'GOAL_CONTINUATION_INVALID');
      let page = pages[pageIndex];
      if (!page) {
        const seen = new Set(state.seen);
        const shownFamilies = new Set(state.seen.map(id => byId.get(id)).filter(Boolean).map(family));
        const primarySeen = state.seen.filter(id => PRIMARY.has(byId.get(id)?.dimension)).length;
        const remaining = Math.min(LIMIT - state.seen.length, data.kind === 'prioritaria' ? PRIMARY_LIMIT - primarySeen : LIMIT);
        const ordered = topic === 'recommended' && recommendation.recommended.length ? recommendation.recommended
          : balancedGoalPage(available.filter(goal => matchesTopic(goal, topic)), 0, Math.max(1, available.length));
        const choices = [];
        for (const goal of ordered) {
          if (seen.has(goal.id) || shownFamilies.has(family(goal))) continue;
          shownFamilies.add(family(goal)); choices.push(goal);
        }
        const ids = choices.slice(0, Math.max(0, Math.min(4, remaining))).map(goal => goal.id);
        state.seen.push(...ids);
        const more = choices.length > ids.length && ids.length > 0 && remaining > ids.length;
        const cursor = more ? randomBytes(24).toString('base64url') : null;
        if (cursor) state.cursors[cursor] = { key: pageKey, index: pageIndex + 1 };
        page = { ids, cursor };
        pages.push(page);
      }
      return { state, result: { options: page.ids.map(id => byId.get(id)).filter(Boolean).map(basic),
        contexts, context: topic, cursor: page.cursor,
        priorities: topic === 'recommended' && recommendation.recommended.length ? recommendation.priorities.map(({ label }) => ({ label })) : [] } };
    });
  };
}
