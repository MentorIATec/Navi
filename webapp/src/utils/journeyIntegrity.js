const JOURNEY_KEY = 'faro_journey_v1';
export const JOURNEY_TTL_MS = 4 * 60 * 60 * 1000;
const id = () => globalThis.crypto?.randomUUID?.() || `journey-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function readJourney(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(JOURNEY_KEY) || 'null');
    return value?.version === 1 && /^A\d{8}$/.test(value.matricula)
      && typeof value.operationalCycle === 'string' && value.operationalCycle.trim()
      && typeof value.id === 'string' && value.id
      && Number.isFinite(value.expiresAt) && value.expiresAt > now ? value : null;
  } catch { return null; }
}

export function beginJourney(storage, { matricula, operationalCycle, checkInId = '', entryRequestId = '', displayName = '', community = '', color = '', slogan = '', mode = 'remoto', mentorName = '', mentorWhatsApp = '' }, now = Date.now()) {
  const normalized = String(matricula || '').trim().toUpperCase();
  if (!/^A\d{8}$/.test(normalized) || typeof operationalCycle !== 'string' || !operationalCycle.trim()) {
    throw new Error('Confirma nuevamente tu matrícula para iniciar este recorrido.');
  }
  const previous = readJourney(storage, now);
  const same = previous?.matricula === normalized && previous.operationalCycle === operationalCycle
    && previous.checkInId === checkInId;
  const journey = { version: 1, id: same ? previous.id : id(), matricula: normalized,
    operationalCycle, checkInId, entryRequestId, displayName, community, color, slogan, mode, mentorName, mentorWhatsApp,
    expiresAt: same ? previous.expiresAt : now + JOURNEY_TTL_MS };
  storage.setItem(JOURNEY_KEY, JSON.stringify(journey));
  return journey;
}

export function assertCurrentJourney(storage, journey) {
  const current = readJourney(storage);
  if (!journey || current?.id !== journey.id || current.matricula !== journey.matricula
    || current.operationalCycle !== journey.operationalCycle) {
    throw new Error('La sesión cambió o expiró. Confirma nuevamente tu matrícula antes de continuar.');
  }
  return current;
}

function operationKey(journey, kind) {
  return `faro_operation_v1:${journey.matricula}:${journey.operationalCycle}:${journey.id}:${kind}`;
}

// Read only: recovery never creates an identifier or sends a request.
export function readPendingSubmission(storage, journey, kind) {
  assertCurrentJourney(storage, journey);
  if (!['test', 'goal'].includes(kind)) throw new Error('Tipo de envío no válido.');
  const raw = storage.getItem(operationKey(journey, kind));
  if (!raw) return null;
  try {
    const operation = JSON.parse(raw);
    const payload = JSON.parse(operation.fingerprint);
    if (operation.version !== 1 || typeof operation.id !== 'string' || !operation.id
      || !payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.matricula !== journey.matricula || payload.operationalCycle !== journey.operationalCycle
      || JSON.stringify(payload) !== operation.fingerprint) throw new Error('invalid');
    if (kind === 'goal' && !['metaPrioritaria', 'metaComplementaria', 'tiempo', 'obstaculo', 'plan']
      .every(field => typeof payload[field] === 'string' && payload[field].trim())) throw new Error('invalid');
    return { operation, payload };
  } catch {
    throw new Error('No pudimos recuperar tus datos pendientes. No iniciaremos otro envío. Pide apoyo a tu mentor o mentora.');
  }
}

export function pendingOperation(storage, journey, kind, payload) {
  assertCurrentJourney(storage, journey);
  if (!['test', 'goal'].includes(kind)) throw new Error('Tipo de envío no válido.');
  const key = operationKey(journey, kind);
  const fingerprint = JSON.stringify(payload);
  const raw = storage.getItem(key);
  let existing;
  try { existing = raw ? JSON.parse(raw) : null; }
  catch { throw new Error('No pudimos recuperar el envío pendiente. Confirma tu sesión antes de continuar.'); }
  if (raw && (existing?.version !== 1 || !existing.id || existing.fingerprint !== fingerprint)) {
    throw new Error('El envío pendiente tiene otro contenido. Conserva las respuestas o metas originales para volver a intentarlo.');
  }
  if (existing) return existing;
  const receipt = readConfirmedOperation(storage, journey, kind);
  if (!receipt && storage.getItem(`${key}:receipt`)) {
    throw new Error('No pudimos validar la confirmación anterior. Confirma tu sesión antes de continuar.');
  }
  if (receipt && JSON.stringify(receipt.payload) === fingerprint) {
    return { version: 1, id: receipt.operationId, fingerprint };
  }
  const operation = { version: 1, id: id(), fingerprint };
  storage.setItem(key, JSON.stringify(operation));
  return operation;
}

export function acknowledgeOperation(storage, journey, kind, operation, acknowledgement, payload) {
  assertCurrentJourney(storage, journey);
  if (!['test', 'goal'].includes(kind)) throw new Error('Tipo de envío no válido.');
  const expected = kind === 'test' ? acknowledgement?.responseId : acknowledgement?.selectionId;
  if (expected !== operation.id || typeof acknowledgement?.reused !== 'boolean'
    || operation.fingerprint !== JSON.stringify(payload)) {
    throw new Error('No pudimos confirmar el guardado de este envío. Vuelve a intentarlo con el mismo contenido.');
  }
  const key = operationKey(journey, kind);
  const receipt = { version: 1, journeyId: journey.id, matricula: journey.matricula,
    operationalCycle: journey.operationalCycle, expiresAt: journey.expiresAt,
    operationId: operation.id, payload, completedAt: acknowledgement.completedAt || '', confirmedAt: Date.now() };
  storage.setItem(`${key}:receipt`, JSON.stringify(receipt));
  storage.removeItem(key);
  return receipt;
}

export function readConfirmedOperation(storage, journey, kind) {
  try {
    assertCurrentJourney(storage, journey);
    if (!['test', 'goal'].includes(kind)) return null;
    const receipt = JSON.parse(storage.getItem(`${operationKey(journey, kind)}:receipt`) || 'null');
    return receipt?.version === 1 && receipt.journeyId === journey.id
      && receipt.matricula === journey.matricula && receipt.operationalCycle === journey.operationalCycle
      && receipt.expiresAt === journey.expiresAt && receipt.expiresAt > Date.now()
      && typeof receipt.operationId === 'string' && receipt.operationId
      && receipt.payload && typeof receipt.payload === 'object' && !Array.isArray(receipt.payload) ? receipt : null;
  } catch { return null; }
}

export function readConfirmedPlan(storage, journey) {
  const receipt = readConfirmedOperation(storage, journey, 'goal');
  return receipt?.payload?.metaPrioritaria ? receipt : null;
}

export function suggestedTimeframeId(goal) {
  const value = String(goal?.horizontesugerido || '').trim().toLowerCase();
  if (!value) return null;
  if (value.includes('semestre')) return 't3';
  if (value.includes('periodo') || value.includes('parcial') || value.includes('5 semanas')) return 't1';
  if (/\bmes(?:es)?\b/.test(value) || /30 d[ií]as/.test(value) || /(?:2|4|6|8) semanas/.test(value)) return 't2';
  return 't4';
}
