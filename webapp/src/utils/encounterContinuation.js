import { acknowledgeOperation } from './journeyIntegrity.js';

export function resumeEncounter(storage, journey, continuation) {
  if (!continuation || continuation.checkInId !== journey.checkInId) throw new Error('Confirma nuevamente tu llegada antes de continuar.');
  if (continuation.plan) {
    const { selectionId, completedAt, ...fields } = continuation.plan;
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(selectionId || '') || !['metaPrioritaria', 'metaComplementaria', 'tiempo', 'obstaculo', 'plan'].every(key => typeof fields[key] === 'string' && fields[key].trim())) {
      throw new Error('No pudimos recuperar tu plan completo. Pide apoyo a tu mentor o mentora.');
    }
    const payload = { ...fields, matricula: journey.matricula, operationalCycle: journey.operationalCycle, checkInId: journey.checkInId };
    acknowledgeOperation(storage, journey, 'goal', { id: selectionId, fingerprint: JSON.stringify(payload) }, { selectionId, completedAt, reused: true }, payload);
    return '/plan-accion';
  }
  return continuation.preTestSummary ? '/seleccion-metas' : '/pre-test';
}
