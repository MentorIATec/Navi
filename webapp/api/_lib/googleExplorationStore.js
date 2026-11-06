import { randomUUID } from 'node:crypto';

function includesCommittedPage(recovered, attempted) {
  if (!recovered || recovered.responseId !== attempted.responseId || recovered.expiresAt <= Date.now()
    || !attempted.seen.every(id => recovered.seen?.includes(id))) return false;
  return Object.entries(attempted.pages).every(([key, pages]) => pages.every((page, index) =>
    JSON.stringify(recovered.pages?.[key]?.[index]) === JSON.stringify(page)))
    && Object.entries(attempted.cursors).every(([key, value]) => JSON.stringify(recovered.cursors?.[key]) === JSON.stringify(value));
}

// Each instance may be a different Vercel worker. Google owns the shared CAS.
export function createGoogleExplorationStore(call, initialSnapshot) {
  let initial = initialSnapshot;
  const read = async key => {
    if (initial) { const value = await initial(); initial = null; if (value.scope === key) return value; }
    return call('readGoalExplorationState', { scope: key });
  };
  return { kind: 'google-cas', async withScope(key, update) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const snapshot = await read(key);
      if (snapshot.scope !== key || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) throw new Error('Invalid exploration snapshot');
      const { state, result } = update(structuredClone(snapshot.state));
      const commitId = randomUUID();
      let receipt;
      try {
        receipt = await call('commitGoalExplorationState', { scope: key, revision: snapshot.revision, state, commitId });
      } catch (error) {
        // An uncertain commit is recovered in reading, never by resetting the budget.
        const recovered = await call('readGoalExplorationState', { scope: key });
        if (recovered.scope === key && ((recovered.commitId === commitId && recovered.revision === snapshot.revision + 1)
          || (recovered.revision > snapshot.revision && includesCommittedPage(recovered.state, state)))) return result;
        throw error;
      }
      if (receipt.scope !== key || typeof receipt.committed !== 'boolean') throw new Error('Invalid exploration acknowledgement');
      if (!receipt.committed) continue;
      if (receipt.commitId !== commitId || receipt.revision !== snapshot.revision + 1) throw new Error('Invalid exploration acknowledgement');
      return result;
    }
    throw Object.assign(new Error('No pudimos completar la solicitud.'), { statusCode: 409, code: 'GOAL_STATE_BUSY' });
  } };
}
