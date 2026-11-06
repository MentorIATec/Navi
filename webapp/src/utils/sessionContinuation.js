const KEY = 'navi_session_continuation_v1';

export function clearSessionContinuation(storage) {
  storage.removeItem(KEY);
}

export function selectMentorAssistedContinuation(storage, matricula, checkInId) {
  const normalized = String(matricula || '').trim().toUpperCase();
  if (!/^A\d{8}$/.test(normalized) || !checkInId) return false;
  storage.setItem(KEY, JSON.stringify({ matricula: normalized, checkInId, intent: 'mentor-assisted' }));
  return true;
}

export function consumePostPreTestRoute(storage, { matricula, checkInId, missingTest }) {
  let continuation;
  try { continuation = JSON.parse(storage.getItem(KEY) || 'null'); }
  catch { continuation = null; }
  clearSessionContinuation(storage);
  const assisted = continuation?.intent === 'mentor-assisted'
    && continuation.matricula === String(matricula || '').trim().toUpperCase()
    && Boolean(checkInId) && continuation.checkInId === checkInId;
  return missingTest && !assisted ? '/test' : '/resultados';
}
