import { JOURNEY_TTL_MS } from './journeyIntegrity.js';

const requestKey = matricula => `faro_entry_request_v1:${matricula}`;

export function applyJourneyTheme(style, journey) {
  if (journey?.color) style.setProperty('--theme-color', journey.color);
  else style.removeProperty('--theme-color');
}

// Called only by the existing arrival submit action, never on mount.
export function getCheckInRequestId(storage, matricula, now = Date.now()) {
  const normalized = String(matricula || '').trim().toUpperCase();
  if (!/^A\d{8}$/.test(normalized)) throw new Error('Confirma una matrícula válida antes de continuar.');
  const key = requestKey(normalized);
  const raw = storage.getItem(key);
  if (raw) {
    let stored;
    try { stored = JSON.parse(raw); } catch { /* Fail closed without replacing an uncertain request. */ }
    if (stored?.version !== 1 || stored.matricula !== normalized || typeof stored.id !== 'string' || !stored.id
      || !Number.isFinite(stored.createdAt) || stored.expiresAt !== stored.createdAt + JOURNEY_TTL_MS) {
      throw new Error('No pudimos recuperar esta llegada. Confirma nuevamente tu sesión antes de continuar.');
    }
    const day = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
    if (stored.expiresAt > now && day(stored.createdAt) === day(now)) return stored.id;
  }
  const id = globalThis.crypto?.randomUUID?.() || `${now}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(key, JSON.stringify({ version: 1, matricula: normalized, id,
    createdAt: now, expiresAt: now + JOURNEY_TTL_MS }));
  return id;
}

export function clearCheckInRequest(storage, journey) {
  if (!journey?.entryRequestId) return false;
  const key = requestKey(journey.matricula);
  let stored;
  try { stored = JSON.parse(storage.getItem(key) || 'null'); } catch { return false; }
  if (stored?.version !== 1 || stored.matricula !== journey.matricula || stored.id !== journey.entryRequestId) return false;
  storage.removeItem(key);
  return true;
}
