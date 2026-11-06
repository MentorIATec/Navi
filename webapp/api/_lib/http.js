export function assertMethod(request, allowedMethods) {
  if (!allowedMethods.includes(request.method)) {
    const error = new Error('Método no permitido.');
    error.statusCode = 405;
    throw error;
  }
}

export function assertTrustedOrigin(request) {
  const origin = String(request.headers.origin || '').trim();
  if (!origin) return;

  const configuredOrigins = String(process.env.APP_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const forwardedHost = String(request.headers['x-forwarded-host'] || request.headers.host || '').trim();
  const forwardedProto = String(request.headers['x-forwarded-proto'] || 'https').trim();
  const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : '';
  const allowedOrigins = new Set([...configuredOrigins, requestOrigin].filter(Boolean));

  if (!allowedOrigins.has(origin)) {
    const error = new Error('Origen no autorizado.');
    error.statusCode = 403;
    throw error;
  }
}

export function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

export function sendApiError(response, error) {
  const statusCode = Number(error?.statusCode) || 500;
  const isServerError = statusCode >= 500;
  if (isServerError) {
    console.error('[faro api]', error);
  }
  sendJson(response, statusCode, {
    status: 'error',
    message: isServerError ? 'No pudimos completar la solicitud.' : error.message,
    code: String(error?.code || (isServerError ? 'SERVER_ERROR' : 'REQUEST_ERROR')),
    ...(error?.traceId ? { traceId: String(error.traceId) } : {}),
  });
}
