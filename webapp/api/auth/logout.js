import { assertMethod, assertTrustedOrigin, sendApiError, sendJson } from '../_lib/http.js';
import { clearSessionCookie } from '../_lib/session.js';

export default async function handler(request, response) {
  try {
    assertMethod(request, ['POST']);
    assertTrustedOrigin(request);
    clearSessionCookie(response);
    sendJson(response, 200, { status: 'success' });
  } catch (error) {
    sendApiError(response, error);
  }
}

