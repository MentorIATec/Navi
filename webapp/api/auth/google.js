import { callAppsScript } from '../_lib/appsScript.js';
import { verifyWorkspaceCredential } from '../_lib/googleIdentity.js';
import { assertMethod, assertTrustedOrigin, sendApiError, sendJson } from '../_lib/http.js';
import { setSessionCookie } from '../_lib/session.js';

export default async function handler(request, response) {
  try {
    assertMethod(request, ['POST']);
    assertTrustedOrigin(request);
    const identity = await verifyWorkspaceCredential(request.body?.credential);
    const resolved = await callAppsScript('resolveWorkspaceUser', { actor: identity });
    setSessionCookie(response, identity);
    sendJson(response, 200, { status: 'success', user: resolved.user || resolved });
  } catch (error) {
    sendApiError(response, error);
  }
}

