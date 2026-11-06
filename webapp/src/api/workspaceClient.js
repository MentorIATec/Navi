import { getClientTimeoutMs } from '../../shared/actionPolicy.js';

async function request(path, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({
      status: 'error',
      message: 'La respuesta del servidor no es válida.',
    }));
    if (!response.ok || result.status === 'error') {
      const error = new Error(result.message || 'No pudimos completar la solicitud.');
      error.statusCode = response.status;
      error.code = result.code || 'REQUEST_ERROR';
      error.traceId = result.traceId || '';
      throw error;
    }
    return result.data ?? result;
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error('La solicitud tardó demasiado en responder.'), {
        statusCode: 504,
        code: 'REQUEST_TIMEOUT',
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const workspaceClient = {
  getConfig() {
    return request('/api/auth/config');
  },
  login(credential) {
    return request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }, getClientTimeoutMs('resolveWorkspaceUser'));
  },
  getSession() {
    return request('/api/auth/session', {}, getClientTimeoutMs('resolveWorkspaceUser'));
  },
  logout() {
    return request('/api/auth/logout', { method: 'POST', body: '{}' });
  },
  getMentorDashboard() {
    return request('/api/mentor/dashboard', {}, getClientTimeoutMs('getMentorDashboard'));
  },
  getOperationalTelemetry(filters = {}) {
    return request('/api/action', {
      method: 'POST',
      body: JSON.stringify({
        action: 'getOperationalTelemetry',
        data: filters,
      }),
    }, getClientTimeoutMs('getOperationalTelemetry'));
  },
};
