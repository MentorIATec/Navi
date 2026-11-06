import { getActionPolicy, getGatewayTimeoutMs, isWriteAction } from '../../shared/actionPolicy.js';

export function getAppsScriptTimeoutMs(action) {
  const policy = getActionPolicy(action);
  const envKey = policy.timeoutClass === 'admin'
    ? 'APPS_SCRIPT_ADMIN_TIMEOUT_MS'
    : 'APPS_SCRIPT_INTERACTIVE_TIMEOUT_MS';
  const configured = Number(process.env[envKey]);
  return Number.isFinite(configured) && configured > 0 ? configured : getGatewayTimeoutMs(action);
}

export async function callAppsScript(action, data = {}) {
  const url = String(process.env.APPS_SCRIPT_URL || '').trim();
  const serviceSecret = String(process.env.APPS_SCRIPT_SERVICE_SECRET || '').trim();
  if (!url || !serviceSecret) {
    const error = new Error('La conexión protegida con Apps Script no está configurada.');
    error.statusCode = 500;
    throw error;
  }

  const startedAt = Date.now();
  const suppliedTraceId = String(data?.traceId || '').trim();
  const traceId = (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedTraceId)
    || /^trace-[A-Za-z0-9_-]{6,74}$/.test(suppliedTraceId))
    ? suppliedTraceId
    : (globalThis.crypto?.randomUUID?.() || `trace-${startedAt}-${Math.random().toString(36).slice(2)}`);
  const timeoutMs = getAppsScriptTimeoutMs(action);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data: { ...data, traceId }, serviceSecret }),
      signal: controller.signal,
    });
    const rawBody = await response.text();
    if (!response.ok) {
      const error = new Error('Apps Script no respondió correctamente.');
      error.statusCode = 502;
      error.code = 'UPSTREAM_ERROR';
      throw error;
    }

    let result;
    try {
      result = JSON.parse(rawBody);
    } catch {
      const isHtml = /<!doctype\s+html|<html[\s>]/i.test(rawBody);
      console.error('[faro apps script] Respuesta no JSON', {
        action,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || '',
        responseType: isHtml ? 'html' : 'unknown',
      });
      const isDirectoryOperator = action === 'runSyntheticDirectoryLifecycle'
        || action === 'runSyntheticProductMigrationLifecycle'
        || action === 'publishApprovedLegacyProductMigrationScope'
        || action === 'rollbackApprovedLegacyProductMigration'
        || action === 'previewPilotDirectory'
        || action === 'publishPilotDirectory';
      const error = new Error(isDirectoryOperator && isHtml
        ? 'Google detuvo la prueba antes de ejecutarla. Reautoriza Apps Script para leer las hojas fuente y vuelve a intentarlo.'
        : 'Apps Script devolvió una respuesta no válida.');
      error.statusCode = isDirectoryOperator ? 422 : 502;
      error.code = 'INVALID_UPSTREAM_RESPONSE';
      throw error;
    }
    if (result.status === 'error') {
      const message = String(result.message || 'Apps Script rechazó la solicitud.').replace(/^Error:\s*/i, '');
      const error = new Error(message);
      error.traceId = traceId;
      error.upstreamTelemetry = result.telemetry || null;
      if (/^GOAL_(STATE|DIAGNOSTIC)_/.test(message)) {
        error.statusCode = message === 'GOAL_DIAGNOSTIC_REQUIRED' ? 409 : 503;
        error.code = message;
      } else if (['IDEMPOTENCY_CONFLICT', 'OPERATIONAL_CYCLE_CHANGED'].includes(result.code)) {
        error.statusCode = 409;
        error.code = result.code;
      } else if (action === 'getTestResponse' && /no se encontraron respuestas/i.test(error.message)) {
        error.statusCode = 404;
        error.code = 'TEST_RESPONSE_NOT_FOUND';
      } else {
        error.statusCode = action === 'runSyntheticDirectoryLifecycle'
          || action === 'runSyntheticProductMigrationLifecycle'
          || action === 'publishApprovedLegacyProductMigrationScope'
          || action === 'rollbackApprovedLegacyProductMigration'
          || action === 'previewPilotDirectory'
          || action === 'publishPilotDirectory'
          ? 422
          : (/permiso|autoriz|activo|registrad/i.test(error.message) ? 403 : 502);
      }
      throw error;
    }
    const internalDurationMs = Number(result.telemetry?.internalDurationMs);
    const totalDurationMs = Date.now() - startedAt;
    console.info('[faro apps script timing]', {
      action,
      traceId,
      durationMs: totalDurationMs,
      internalDurationMs: Number.isFinite(internalDurationMs) ? internalDurationMs : null,
      transportDurationMs: Number.isFinite(internalDurationMs)
        ? Math.max(0, totalDurationMs - internalDurationMs)
        : null,
      stages: result.telemetry?.stages || null,
      cache: result.telemetry?.cache || null,
      outcome: 'success',
    });
    return result.data ?? result;
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error('La consulta tardó demasiado en responder.');
      timeoutError.statusCode = 504;
      timeoutError.code = isWriteAction(action) ? 'WRITE_OUTCOME_UNKNOWN' : 'UPSTREAM_TIMEOUT';
      timeoutError.traceId = traceId;
      console.error('[faro apps script timing]', {
        action,
        traceId,
        durationMs: Date.now() - startedAt,
        outcome: isWriteAction(action) ? 'outcome_unknown' : 'timeout',
      });
      throw timeoutError;
    }
    console.error('[faro apps script timing]', {
      action,
      traceId,
      durationMs: Date.now() - startedAt,
      internalDurationMs: Number.isFinite(Number(error?.upstreamTelemetry?.internalDurationMs))
        ? Number(error.upstreamTelemetry.internalDurationMs)
        : null,
      stages: error?.upstreamTelemetry?.stages || null,
      cache: error?.upstreamTelemetry?.cache || null,
      outcome: error?.code === 'WRITE_OUTCOME_UNKNOWN' ? 'outcome_unknown' : 'error',
      statusCode: Number(error?.statusCode) || 500,
    });
    if (!error.traceId) error.traceId = traceId;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
