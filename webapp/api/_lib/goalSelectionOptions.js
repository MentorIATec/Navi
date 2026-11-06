// Profile-scoped, read-only recommendations. No exposure budget or per-card RPC.
import { createHmac } from 'node:crypto';
import { callAppsScript } from './appsScript.js';
import { requireStudentSession } from './studentSession.js';
import { assertMethod, assertTrustedOrigin, sendApiError, sendJson } from './http.js';
import { prepareGoalCatalog, recommendGoals } from './goalCatalog.js';
import { recoverContext } from './goalExploration.js';

const fail = (statusCode, code) => { throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode, code }); };
export async function selectionOptions(data, session, loadContext, secret) {
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || Object.keys(data).some(key => !['matricula', 'operationalCycle'].includes(key))
    || typeof data.operationalCycle !== 'string' || !data.operationalCycle.trim() || data.operationalCycle.length > 80) fail(400, 'GOAL_INPUT_INVALID');
  if (data.matricula && data.matricula !== session.matricula) fail(409, 'STUDENT_SESSION_CHANGED');
  if (String(secret || '').length < 32) fail(503, 'GOAL_CONFIGURATION_REQUIRED');
  const scope = createHmac('sha256', secret).update(`${session.matricula}:${data.operationalCycle}`).digest('hex');
  const loaded = await loadContext({ matricula: session.matricula, scope });
  const context = recoverContext(loaded.entry, session, data.operationalCycle);
  const catalog = prepareGoalCatalog(loaded.catalog);
  const primary = recommendGoals(catalog.prioritarias, context.diagnostic);
  const complementary = recommendGoals(catalog.complementarias, context.diagnostic);
  const publicOption = goal => ({
    id: createHmac('sha256', secret).update(`${scope}:${context.responseId}:${goal.id}`).digest('base64url'),
    text: goal.text, dimension: goal.dimension, horizontesugerido: goal.horizontesugerido || '',
    pasosbase: goal.pasosbase || '', preguntasparaafinar: goal.preguntasparaafinar || '',
  });
  const recommended = primary.recommended.map(publicOption);
  const alternatives = primary.alternatives.map(publicOption);
  return {
    prioritarias: [...recommended, ...alternatives],
    complementarias: [...complementary.recommended, ...complementary.alternatives].map(publicOption),
    recommendation: { recommended, alternatives, priorities: primary.priorities.map(({ label }) => ({ label })) },
  };
}

export function createSelectionOptionsHandler({ call = callAppsScript, secret = () => process.env.SESSION_SECRET } = {}) {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Vary', 'Cookie, Origin');
    try {
      assertMethod(request, ['POST']);
      assertTrustedOrigin(request);
      const session = requireStudentSession(request);
      if (request.body?.action !== 'getGoalSelectionOptions') fail(400, 'GOAL_ACTION_INVALID');
      const result = await selectionOptions(request.body.data, session,
        // Google68 safely ignores this internal marker. The local Google
        // candidate handles it without changing the old explorer contract.
        data => call('getGoalExplorationContext', { ...data, r2Read: true }), secret());
      sendJson(response, 200, { status: 'success', data: result });
    } catch (error) { sendApiError(response, error); }
  };
}
