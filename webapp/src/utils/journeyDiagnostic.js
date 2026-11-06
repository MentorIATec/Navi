import { DIAGNOSTIC_BANK } from '../data/diagnosticBank.js';
import { assertCurrentJourney, readConfirmedOperation, readPendingSubmission } from './journeyIntegrity.js';

export function diagnosticFromSubmission(submission) {
  const questions = DIAGNOSTIC_BANK[submission?.etapa];
  if (!questions?.length || !['remoto', 'presencial'].includes(submission.modalidad)
    || !Number.isFinite(submission.scorePromedio) || submission.scorePromedio < 1 || submission.scorePromedio > 5) {
    throw new Error('No pudimos recuperar las respuestas completas. No iniciaremos otro test. Pide apoyo a tu mentor o mentora.');
  }
  const answers = {};
  for (const question of questions) {
    const score = submission[question.category];
    if (!Number.isInteger(score) || score < 1 || score > question.options.length) {
      throw new Error('No pudimos recuperar las respuestas completas. No iniciaremos otro test. Pide apoyo a tu mentor o mentora.');
    }
    answers[question.key] = score;
  }
  return { stage: submission.etapa, answers, questions };
}

function snapshotKey(journey, name) {
  return `faro_snapshot_v1:${journey.matricula}:${journey.operationalCycle}:${journey.id}:${name}`;
}

function writeSnapshot(storage, journey, name, payload) {
  assertCurrentJourney(storage, journey);
  storage.setItem(snapshotKey(journey, name), JSON.stringify({ version: 1, journeyId: journey.id,
    matricula: journey.matricula, operationalCycle: journey.operationalCycle, expiresAt: journey.expiresAt, payload }));
}

function readSnapshot(storage, journey, name) {
  assertCurrentJourney(storage, journey);
  const value = JSON.parse(storage.getItem(snapshotKey(journey, name)) || 'null');
  return value?.version === 1 && value.journeyId === journey.id && value.matricula === journey.matricula
    && value.operationalCycle === journey.operationalCycle && value.expiresAt === journey.expiresAt
    && value.expiresAt > Date.now() ? value.payload : null;
}

// Called only after the protected entry API has returned this student's active test.
export function persistJourneyDiagnostic(storage, journey, diagnostic) {
  const normalized = diagnostic?.data || diagnostic;
  let payload = null;
  if (normalized?.etapa) {
    const scores = Object.fromEntries(Object.entries(normalized.scores || {}).map(([key, value]) => [key, Number(value)]));
    const questions = DIAGNOSTIC_BANK[normalized.etapa] || [];
    const average = questions.reduce((sum, question) => sum + scores[question.category], 0) / questions.length;
    payload = diagnosticFromSubmission({ ...scores, etapa: normalized.etapa,
      modalidad: 'remoto', scorePromedio: average });
  }
  writeSnapshot(storage, journey, 'entry-test', payload);
  return Boolean(payload);
}

export function readJourneyDiagnostic(storage, journey) {
  try {
    // An unresolved newer submission must not expose an older confirmed result.
    if (readPendingSubmission(storage, journey, 'test')) return null;
    const receipt = readConfirmedOperation(storage, journey, 'test');
    if (receipt) return { ...diagnosticFromSubmission(receipt.payload), responseId: receipt.operationId };
    const snapshot = readSnapshot(storage, journey, 'entry-test');
    if (!snapshot) return null;
    const questions = DIAGNOSTIC_BANK[snapshot.stage];
    if (!questions?.length) return null;
    const scores = Object.fromEntries(questions.map(question => [question.category, snapshot.answers?.[question.key]]));
    return diagnosticFromSubmission({ ...scores, etapa: snapshot.stage, modalidad: 'remoto',
      scorePromedio: questions.reduce((sum, question) => sum + scores[question.category], 0) / questions.length });
  } catch { return null; }
}

export function persistJourneyArrival(storage, journey, arrival) {
  writeSnapshot(storage, journey, 'arrival', arrival);
}

export function readJourneyArrival(storage, journey) {
  try {
    const snapshot = readSnapshot(storage, journey, 'arrival');
    return ['clear', 'tired', 'scattered', 'uncertain'].includes(snapshot?.arrival)
      && ['review', 'prioritize', 'understand', 'plan'].includes(snapshot?.intent) ? snapshot : null;
  } catch { return null; }
}
