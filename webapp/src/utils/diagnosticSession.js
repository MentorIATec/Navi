import { DIAGNOSTIC_BANK } from '../data/diagnosticBank';

export function normalizeDiagnosticResponse(response) {
  return response?.data || response || null;
}

export function persistDiagnosticSession(diagnostic) {
  const normalized = normalizeDiagnosticResponse(diagnostic);
  if (!normalized?.etapa) {
    return false;
  }

  const { etapa, scores = {} } = normalized;
  const questions = DIAGNOSTIC_BANK[etapa] || [];
  const answers = {};

  questions.forEach((question) => {
    answers[question.key] = scores[question.category] || 0;
  });

  localStorage.setItem('navi_diagnostic_payload', JSON.stringify({
    stage: etapa,
    answers,
    questions,
  }));
  localStorage.setItem('navi_diagnostic_answers', JSON.stringify(answers));
  localStorage.setItem('navi_diagnostic_stage', etapa);
  localStorage.removeItem('navi_missing_remote_test');

  return true;
}

export async function fetchAndPersistExistingDiagnostic(apiClient, matricula) {
  const response = await apiClient.post('getTestResponse', { matricula });
  return persistDiagnosticSession(response);
}
