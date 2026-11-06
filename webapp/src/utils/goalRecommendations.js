const active = goal => String(goal.activa || 'Si').trim().toLowerCase() !== 'no';
export function normalizeGoal(goal = {}) {
  const lower = Object.fromEntries(Object.entries(goal).map(([key,value]) => [key.toLowerCase(),value]));
  return { ...lower, id:lower.id || '', text:lower.text || lower.metabase || '',
    dimension:String(lower.dimension || '').toLowerCase().replace('física','fisica'),
    etapa:String(lower.etapa || '').toLowerCase(), conexiondiagnostico:lower.conexiondiagnostico || '' };
}

export function uniqueGoals(goals = []) {
  return [...new Map(goals.filter(g => g?.id && g.text && active(g)).map(g=>[g.id,g])).values()];
}

// Presentation-only helpers: no catalog, editorial history or recommendation weights.
export function balancedGoalPage(items = [], page = 0, size = 4) {
  const groups=new Map();
  for(const goal of uniqueGoals(items)){
    const key=goal.dimension || '';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(goal);
  }
  const ordered=[];const buckets=[...groups.values()];
  for(let i=0;buckets.some(b=>i<b.length);i++) for(const bucket of buckets)if(bucket[i])ordered.push(bucket[i]);
  const pages=Math.ceil(ordered.length/size);if(!pages)return [];
  return ordered.slice((page%pages)*size,((page%pages)+1)*size);
}

// Presentation only: all inputs have already passed the server's eligibility
// rules. A group is a viewport, never an accumulated exposure limit.
export function primaryGoalGroups(items = [], recommendation = {}) {
  const eligible = uniqueGoals(items), byId = new Map(eligible.map(goal => [goal.id, goal]));
  const recommended = uniqueGoals(recommendation.recommended || [])
    .filter(goal => byId.has(goal.id)).slice(0, 4).map(goal => byId.get(goal.id));
  const selected = new Set(recommended.map(goal => goal.id));
  const remaining = eligible.filter(goal => !selected.has(goal.id));
  const ordered = balancedGoalPage(remaining, 0, Math.max(4, remaining.length));
  const groups = recommended.length ? [{ kind: 'recommended', items: recommended }] : [];
  for (let i = 0; i < ordered.length; i += 4) groups.push({ kind: 'explore', items: ordered.slice(i, i + 4) });
  return groups;
}

function encounterHash(value) {
  let result = 2166136261;
  for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

// Stable within the journey, varied across journeys. No diagnostic inference,
// random change on render, seed/catalog data, or additional backend request.
export function complementaryEncounterOrder(items = [], encounter = '') {
  const ordered = uniqueGoals(items).map(goal => ({ goal, rank: encounterHash(`${encounter}:${goal.id}`) }))
    .sort((a, b) => a.rank - b.rank || a.goal.id.localeCompare(b.goal.id)).map(item => item.goal);
  return balancedGoalPage(ordered, 0, Math.max(4, ordered.length));
}

export function choiceGroups(items = [], dimension = 'all') {
  const pool = uniqueGoals(items).filter(goal => dimension === 'all' || goal.dimension === dimension);
  return Array.from({ length: Math.ceil(pool.length / 4) }, (_, i) => pool.slice(i * 4, i * 4 + 4));
}

export function selectedChoiceGroup(groups, selected) {
  if (!selected) return -1;
  return groups.findIndex(group => (group.items || group).some(goal =>
    goal.id === selected.id || (selected.id?.startsWith('pending-') && goal.text === selected.text)));
}

export function exactTimeframe(goal, timeframes) {
  const label=String(goal?.horizontesugerido || '').trim();if(!label)return null;
  const match=timeframes.find(t=>t.label.trim().toLowerCase()===label.toLowerCase());
  return match || {id:`catalog:${label}`,label};
}
export function goalTimeOptions(goal, timeframes, selectedTime) {
  const options = [...timeframes];
  for (const option of [exactTimeframe(goal, timeframes), selectedTime]) {
    if (option && !options.some(time => time.id === option.id)) options.unshift(option);
  }
  return options;
}
export function choosePrimary(current, nextGoal, timeframes) {
  const drafts={...current.drafts};
  if(current.goal)drafts[current.goal.id]=current.draft;
  return {goal:nextGoal,draft:Object.hasOwn(drafts,nextGoal.id)?drafts[nextGoal.id]:nextGoal.text,drafts,
    time:current.manualTime?current.time:exactTimeframe(nextGoal,timeframes),manualTime:current.manualTime};
}
