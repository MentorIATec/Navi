import { callAppsScript } from '../_lib/appsScript.js';
import { assertMethod, sendApiError, sendJson } from '../_lib/http.js';
import { requireSession } from '../_lib/session.js';

export default async function handler(request, response) {
  try {
    assertMethod(request, ['GET']);
    const actor = requireSession(request);
    const data = await callAppsScript('getMentorDashboard', { actor });
    sendJson(response, 200, { status: 'success', data });
  } catch (error) {
    sendApiError(response, error);
  }
}

