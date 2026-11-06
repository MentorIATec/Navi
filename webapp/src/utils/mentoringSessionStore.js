// Local recovery for an unacknowledged session write. Not a business data store.
const KEY = 'faro_mentoring_attempts_v1';
const unavailable = () => Object.assign(new Error('No pudimos completar la solicitud.'), { code: 'WRITE_OUTCOME_UNKNOWN' });
const idOf = draft => String(draft?.sessionId || '').trim();

function read(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable();
    return value;
  } catch { throw unavailable(); }
}

function write(storage, value) {
  try { storage.setItem(KEY, JSON.stringify(value)); }
  catch { throw unavailable(); } // Never send a new ID without durable recovery.
}

function validate(record, contextKey) {
  if (!record || record.contextKey !== contextKey || !/^[A-Za-z0-9:_-]{8,100}$/.test(record.sessionId)
    || !record.draft || typeof record.timestampCreacion !== 'string'
    || !Number.isFinite(Date.parse(record.timestampCreacion))) throw unavailable();
  let key;
  try { key = JSON.parse(record.key); } catch { throw unavailable(); }
  if (!Array.isArray(key) || key.length !== 2 || key[0] !== contextKey || typeof key[1] !== 'string') throw unavailable();
  return record;
}

function find(records, contextKey, sessionId) {
  const key = JSON.stringify([contextKey, sessionId]);
  if (records[key]) return validate(records[key], contextKey);
  if (!sessionId) return null;
  return Object.values(records).find(record => record?.contextKey === contextKey && record.sessionId === sessionId) || null;
}

function snapshot(draft, record) {
  return { sessionId: record.sessionId, timestampCreacion: record.timestampCreacion,
    checkInId: draft.checkInId || '', fechaSesion: draft.fechaSesion, notasMentor: draft.notasMentor,
    documentadoCrm: draft.documentadoCrm, _contextKey: record.contextKey, _confirmed: false };
}

export function prepareMentoringAttempt(storage, contextKey, draft, matricula, createId, now) {
  let scope;
  try { scope = JSON.parse(contextKey); } catch { throw unavailable(); }
  if (!Array.isArray(scope) || !scope[0] || scope[1] !== matricula) throw unavailable();
  const records = read(storage);
  const previous = find(records, contextKey, idOf(draft));
  const key = previous?.key || JSON.stringify([contextKey, idOf(draft)]);
  const record = previous ? validate(previous, contextKey) : {
    key, contextKey, sessionId: idOf(draft) || createId(matricula, draft.fechaSesion),
    timestampCreacion: draft.timestampCreacion || now,
  };
  record.draft = snapshot(draft, record);
  record.updatedAt = now;
  validate(record, contextKey);
  records[key] = record;
  write(storage, records);
  return record;
}

export function readPendingMentoringDraft(storage, contextKey) {
  const records = read(storage);
  const matches = Object.values(records).filter(record => record?.contextKey === contextKey)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  if (!matches.length) return null;
  const record = validate(matches[0], contextKey);
  return snapshot(record.draft, record);
}

export function updatePendingMentoringDraft(storage, contextKey, draft) {
  const records = read(storage);
  const record = find(records, contextKey, idOf(draft));
  if (!record) return;
  validate(record, contextKey);
  record.draft = snapshot(draft, record);
  records[record.key] = record;
  write(storage, records);
}

export function clearMentoringAttempt(storage, contextKey, key, sessionId) {
  const records = read(storage);
  const record = records[key];
  if (record && validate(record, contextKey).sessionId !== sessionId) throw unavailable();
  delete records[key];
  write(storage, records);
}
