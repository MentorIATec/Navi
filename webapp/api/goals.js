import { createSelectionOptionsHandler } from './_lib/goalSelectionOptions.js';
import { resolve } from 'node:path';
import { callAppsScript } from './_lib/appsScript.js';
import { requireStudentSession } from './_lib/studentSession.js';
import { assertMethod, assertTrustedOrigin, sendApiError, sendJson } from './_lib/http.js';
import { createFileExplorationStore } from './_lib/goalExplorationStore.js';
import { createGoalExplorationService } from './_lib/goalExploration.js';
import { createHmac } from 'node:crypto';
import { createGoogleExplorationStore } from './_lib/googleExplorationStore.js';

export function assertLocalGoalRuntime() {
  // A durable shared store must be supplied and reviewed before any deployment.
  if (process.env.GOAL_EXPLORATION_LOCAL !== '1' || process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode: 503, code: 'GOAL_EXPLORATION_LOCAL_ONLY' });
  }
}

export function createGoalsHandler({ loadEntry, loadCatalog, store, secret, runtime = 'local' }) {
  const explore = createGoalExplorationService({ loadEntry, loadCatalog, store, secret });
  return async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Vary', 'Cookie, Origin');
    try {
      if (runtime === 'local') assertLocalGoalRuntime();
      else if (runtime !== 'google' || store.kind !== 'google-cas') throw new Error('Shared exploration store required');
      assertMethod(request, ['POST']);
      assertTrustedOrigin(request);
      const session = requireStudentSession(request);
      const data = request.body?.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode: 400 });
      const result = await explore(request.body?.action, data, session);
      sendJson(response, 200, { status: 'success', data: result });
    } catch (error) { sendApiError(response, error); }
  };
}

export function createSharedGoalsHandler(call = callAppsScript) { return async function handler(request, response) {
  try {
    // Authenticate before loading context or touching the shared technical state.
    assertMethod(request, ['POST']);
    assertTrustedOrigin(request);
    const session = requireStudentSession(request);
    const data = request.body?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)
      || typeof data.operationalCycle !== 'string' || !data.operationalCycle || data.operationalCycle.length > 80
      || (data.matricula && data.matricula !== session.matricula)) throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode: 400 });
    if (!['getGoalOptions', 'getGoalDetails'].includes(request.body.action)
      || !['prioritaria', 'complementaria'].includes(data.kind)
      || Object.keys(data).some(key => !['matricula', 'operationalCycle', 'kind', 'context', 'cursor', 'optionId'].includes(key))) throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode: 400 });
    const secret = process.env.SESSION_SECRET;
    const scope = createHmac('sha256', secret).update(`${session.matricula}:${data.operationalCycle}`).digest('hex');
    // One context read and one CAS, rather than four independent round trips.
    let context;
    const loadContext = () => context ??= call('getGoalExplorationContext', { matricula: session.matricula, scope });
    const store = createGoogleExplorationStore(call, async () => (await loadContext()).snapshot);
    const sharedHandler = createGoalsHandler({ runtime: 'google', secret, store,
      loadEntry: async () => (await loadContext()).entry,
      loadCatalog: async () => (await loadContext()).catalog,
    });
    return await sharedHandler(request, response);
  } catch (error) { sendApiError(response, error); }
}; }

let localHandler;
const sharedHandler = createSharedGoalsHandler();
const selectionHandler = createSelectionOptionsHandler();
export default async function handler(request, response) {
  if (request.body?.action === 'getGoalSelectionOptions') return selectionHandler(request,response);
  if (process.env.GOAL_EXPLORATION_LOCAL !== '1' || process.env.VERCEL || process.env.NODE_ENV === 'production') return sharedHandler(request, response);
  try {
    assertLocalGoalRuntime();
    localHandler ??= createGoalsHandler({
      secret: process.env.SESSION_SECRET,
      store: createFileExplorationStore(resolve(process.env.GOAL_EXPLORATION_STORE_DIR || 'outputs/goal-exploration-local')),
      loadEntry: matricula => callAppsScript('getStudentEntry', { matricula, cycleScope: 'active' }),
      loadCatalog: async () => {
        const result = await callAppsScript('getGoalsCatalog', {});
        const items = result.items || [];
        return { prioritarias: items };
      },
    });
    return await localHandler(request, response);
  } catch (error) { sendApiError(response, error); }
}
