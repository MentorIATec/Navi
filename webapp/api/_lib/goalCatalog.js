// Server-only catalog and recommendation rules. Never import from a browser entry.
import seed from '../../src/data/goalsCatalogSeed.json' with { type: 'json' };
import overrides from '../../src/data/goalCatalogOverrides.json' with { type: 'json' };
import matrix from '../../src/data/goalRecommendationRules.json' with { type: 'json' };
import { CATEGORY_META, DIAGNOSTIC_BANK } from '../../src/data/diagnosticBank.js';

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
const controlledTags = new Set(Object.keys(CATEGORY_META));
function canonicalTags(value) {
  return [...new Set(String(value || '').split(',').map(tag => tag.trim().toLowerCase()).map(tag => DIAGNOSTIC_TAG_ALIASES[tag] || tag).filter(tag => controlledTags.has(tag)))].join(',');
}

export function parseGoalMatrix(text) {
  const lines = text.trim().split(/\r?\n/);
  const cells = (line) => line.match(/(?:"(?:[^"]|"")*"|[^,]*)(?:,|$)/g)
    .filter(Boolean).map(x => x.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
  const headers = cells(lines[0]);
  return lines.slice(1).map(line => Object.fromEntries(cells(line).map((value, i) => [headers[i], value])));
}
const active = goal => String(goal.activa || 'Si').trim().toLowerCase() !== 'no';
export function normalizeGoal(goal = {}) {
  const lower = Object.fromEntries(Object.entries(goal).map(([key,value]) => [key.toLowerCase(),value]));
  const topic = String(lower.temaoperativo || '').trim().toLowerCase().replace(/^servicio$/, 'servicio social');
  const stage = String(lower.etapa || '').trim().toLowerCase();
  return { ...lower, id:lower.id || '', text:lower.text || lower.metabase || '', temaoperativo:topic,
    dimension:topic === 'servicio social' ? 'ocupacional' : String(lower.dimension || '').toLowerCase().replace('física','fisica'),
    etapa:stage === 'longitudinal' ? 'multietapa' : stage, conexiondiagnostico:canonicalTags(lower.conexiondiagnostico) };
}
const seedById = new Map(seed.map(item => { const goal = normalizeGoal(item); return [goal.id,goal]; }));
const edits = new Map(overrides.map(item => [item.id,item]));
// Explicitly withdrawn titles only, including a screenshot-confirmed variant
// whose remote ID is unknown. Never match a keyword or overwrite remote rows.
const retiredTexts = new Set(overrides.filter(item => seedById.get(item.id)?.activa === 'No')
  .flatMap(item => item.retiredTexts || []).map(text => text.trim()));
// Exact variants from the historical seed draft, still present in Google.
// Recognize them by both ID and text; never reinterpret unknown editorial edits.
const legacyDraftVersions = new Map([
  ['PRA001', [{ MetaBase: 'Crear un CV de alto impacto y un perfil de LinkedIn estelar en 2 semanas.' }]],
  ['FIN003', [{ MetaBase: 'Reducir en un 20% mis "gastos hormiga" (cafés, snacks, etc.).' }]],
]);

// Local editorial overlay only when content is the known before/after version.
// Unknown edits under an existing ID are preserved and receive no curated claim.
export function prepareGoalCatalog(data) {
  const pool = new Map();
  const incoming = [...(data.prioritarias || []), ...(data.complementarias || [])];
  const incomingIds = new Set(incoming.map(raw => normalizeGoal(raw).id));
  for (const raw of incoming) {
    let goal = normalizeGoal(raw);
    if (!active(goal)) continue;
    if (retiredTexts.has(String(goal.text).trim())) continue;
    const record = edits.get(goal.id);
    const curated = seedById.get(goal.id);
    const historical = legacyDraftVersions.get(goal.id) || [];
    const versions = [...(record ? [record.before, ...(record.previous || [])] : []), ...historical]
      .filter(Boolean).map(normalizeGoal);
    if (curated && (record || historical.length) && [...versions.map(row => row.text), curated.text].includes(goal.text)) {
      goal = { ...goal, ...Object.fromEntries(Object.entries(curated).filter(([key, value]) =>
        goal[key] == null || goal[key] === '' || versions.some(row => goal[key] === row[key]) || goal[key] === value)) };
      // An explicit local archive is a tombstone for the known catalog version.
      if (curated.activa === 'No') continue;
    }
    else if (curated?.text === goal.text) goal = { ...curated, ...goal };
    if (goal.id && goal.text && active(goal) && !pool.has(goal.id)) pool.set(goal.id,goal);
  }
  for (const event of overrides.filter(item => (!item.before || item.restore) && seedById.get(item.id)?.activa === 'Si')) {
    const goal = seedById.get(event.id);
    if (!incomingIds.has(goal.id) && !pool.has(goal.id)) pool.set(goal.id,goal);
  }
  return {
    prioritarias:[...pool.values()].filter(g => ['ocupacional','intelectual','financiera'].includes(g.dimension)),
    complementarias:[...pool.values()].filter(g => ['emocional','social','fisica','espiritual'].includes(g.dimension)),
  };
}
function scoreOf(diagnostic, category) {
  const question = DIAGNOSTIC_BANK[diagnostic?.stage]?.find(q => q.category === category);
  const score = Number(diagnostic?.answers?.[question?.key]);
  return Number.isInteger(score) && score >= 1 && score <= 5 ? score : null;
}
export function eligible(goal, diagnostic) {
  const stage = diagnostic?.stage;
  if (stage && goal.etapa && !['multietapa',stage].includes(goal.etapa)) return false;
  const tags = String(goal.conexiondiagnostico).split(',').map(t=>t.trim());
  const service = scoreOf(diagnostic,'servicio_social');
  const language = scoreOf(diagnostic,'certificacion_idioma');
  const practice = scoreOf(diagnostic,'plan_practicas');
  const semester = scoreOf(diagnostic,'decision_semestre_tec');
  if (stage === 'enfoque' && service === 5 && tags.includes('servicio_social')) return false;
  if (stage === 'enfoque' && service === 1 && goal.id === 'SEED100') return false;
  if (goal.id === 'SEED088' && !(stage === 'enfoque' && [2,3].includes(service))) return false;
  if (language === 4 && goal.id === 'SEED102') return false;
  if (stage === 'exploracion' && ['SER002','SER004'].includes(goal.id) && service !== 5) return false;
  if (stage === 'exploracion' && service === 5 && goal.id === 'SER001') return false;
  if (tags.includes('certificacion_idioma') && (language === null || language === 1 || language === 5)) return false;
  if (['PRA002','SEED057','SEED099','SEED090','PRA004'].includes(goal.id)
      && !(stage === 'enfoque' && practice === 4)) return false;
  if (practice === 5 && tags.includes('plan_practicas')) return false;
  if (stage === 'enfoque' && semester === 5 && tags.includes('decision_semestre_tec')) return false;
  return true;
}
export function uniqueGoals(goals = []) {
  return [...new Map(goals.filter(g => g?.id && g.text && active(g)).map(g=>[g.id,g])).values()];
}
export function recommendGoals(goals = [], diagnostic) {
  const pool = uniqueGoals(goals).filter(g=>eligible(g,diagnostic));
  const eligibleById = new Map(pool.map(g=>[g.id,g]));
  const routes = matrix.filter(row => row.Active !== 'No' && row.Stage === diagnostic?.stage
    && row.ResponseScores.split('|').map(Number).includes(scoreOf(diagnostic,row.CategoryKey)))
    .filter(row => { const goal=eligibleById.get(row.GoalId); return goal && goal.text === seedById.get(goal.id)?.text; });
  const categories = [...new Set(routes.map(r=>r.CategoryKey))]
    .sort((a,b)=>scoreOf(diagnostic,a)-scoreOf(diagnostic,b) || DIAGNOSTIC_BANK[diagnostic.stage].findIndex(q=>q.category===a)-DIAGNOSTIC_BANK[diagnostic.stage].findIndex(q=>q.category===b)).slice(0,2);
  const buckets = categories.map(category=>routes.filter(r=>r.CategoryKey===category)
    .sort((a,b)=>Number(a.PriorityRank)-Number(b.PriorityRank)).map(r=>eligibleById.get(r.GoalId)));
  const ranked=[];const seen=new Set();
  for (let i=0; buckets.some(bucket=>i<bucket.length); i++) for(const bucket of buckets) {
    const goal=bucket[i];if(goal&&!seen.has(goal.id)){seen.add(goal.id);ranked.push(goal);}
  }
  const recommended=ranked.slice(0,4);
  const recommendedIds=new Set(recommended.map(goal=>goal.id));
  const alternatives=pool.filter(g=>!recommendedIds.has(g.id));
  return {recommended, alternatives, priorities:categories.map(category=>({category,label:CATEGORY_META[category]?.label || category,score:scoreOf(diagnostic,category)}))};
}

