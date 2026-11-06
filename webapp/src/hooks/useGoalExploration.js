import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { apiClient } from '../api/client';

const media = () => window.matchMedia('(max-width: 760px)');
const subscribe = listener => { const query = media(); query.addEventListener('change', listener); return () => query.removeEventListener('change', listener); };
const snapshot = () => media().matches;

export function useGoalExploration(journey, kind, enabled) {
  const compact = useSyncExternalStore(subscribe, snapshot, () => false);
  const size = compact ? 2 : 4;
  const [cache, setCache] = useState({});
  const [contexts, setContexts] = useState({ prioritaria: 'recommended', complementaria: 'recommended' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const detailsCache = useRef(new Map());
  const context = contexts[kind];
  const key = `${kind}:${context}`;
  const entry = cache[key];
  const start = Math.floor((entry?.offset || 0) / size) * size;
  const request = useCallback(async (action, data) => {
    if (!enabled || inFlight.current) return null;
    inFlight.current = true;
    setBusy(true); setError('');
    try {
      return await apiClient.post(action, { matricula: journey.matricula, operationalCycle: journey.operationalCycle, kind, ...data });
    } catch {
      setError('No pudimos cargar el banco de metas. Recarga la página o intenta más tarde.');
      return null;
    } finally { inFlight.current = false; setBusy(false); }
  }, [enabled, journey.matricula, journey.operationalCycle, kind]);
  const ensure = useCallback(async () => {
    if (!enabled || cache[key]) return;
    const result = await request('getGoalOptions', { context });
    if (result) setCache(previous => ({ ...previous, [key]: { ...result, offset: 0 } }));
  }, [enabled, cache, key, context, request]);
  useEffect(() => { void ensure(); }, [ensure]);

  const next = async () => {
    if (!entry || busy) return;
    const offset = start + size;
    if (offset < entry.options.length) { setCache(previous => ({ ...previous, [key]: { ...previous[key], offset } })); return; }
    if (!entry.cursor) return;
    const result = await request('getGoalOptions', { context, cursor: entry.cursor });
    if (result) setCache(previous => {
      const current = previous[key];
      const options = [...new Map([...current.options, ...result.options].map(goal => [goal.id, goal])).values()];
      return { ...previous, [key]: { ...result, options, offset: options.length > offset ? offset : current.offset } };
    });
  };
  const previous = () => setCache(old => ({ ...old, [key]: { ...old[key], offset: Math.max(0, start - size) } }));
  const details = async id => {
    if (detailsCache.current.has(id)) return detailsCache.current.get(id);
    const result = await request('getGoalDetails', { context, optionId: id });
    if (result?.option) { detailsCache.current.set(id, result.option); return result.option; }
    return null;
  };
  return {
    options: entry?.options.slice(start, start + size) || [],
    contexts: entry?.contexts || cache[`${kind}:recommended`]?.contexts || [],
    priorities: entry?.priorities || [], context, busy, error,
    isLoading: enabled && !cache[`${kind}:recommended`] && !error,
    compact,
    hasNext: Boolean(entry && (start + size < entry.options.length || entry.cursor)),
    hasPrevious: start > 0,
    next, previous, details, retry: ensure, canRetry: !entry,
    activate: value => { if (!busy) { setError(''); setContexts(old => ({ ...old, [kind]: value })); } },
  };
}
