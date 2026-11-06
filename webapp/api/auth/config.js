import { assertMethod, sendApiError, sendJson } from '../_lib/http.js';

export default async function handler(request, response) {
  try {
    assertMethod(request, ['GET']);
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    sendJson(response, 200, {
      status: 'success',
      enabled: Boolean(clientId),
      clientId,
    });
  } catch (error) {
    sendApiError(response, error);
  }
}

