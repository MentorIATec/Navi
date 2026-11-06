const PRIORITY_THRESHOLD = 2;

export function buildScoreData(payload, diagnosticBank, categoryMeta) {
  if (!payload || typeof payload !== 'object') return [];

  const answers = payload.answers || {};
  const questions = payload.questions || diagnosticBank[payload.stage] || [];

  return questions.map(({ key, category, title }) => ({
    key,
    category,
    title,
    label: categoryMeta[category]?.label || title,
    recommendation:
      categoryMeta[category]?.recommendation ||
      'Conviene revisar esta área con más detalle durante la mentoría.',
    score: Number(answers[key] || 0),
  }));
}

export function getPriorityAreas(scoreData) {
  return scoreData
    .filter((item) => Number.isFinite(item.score) && item.score > 0 && item.score <= PRIORITY_THRESHOLD)
    .sort((a, b) => a.score - b.score);
}

export function getSuggestedConversationAreas(scoreData, limit = 2) {
  return scoreData
    .filter((item) => Number.isFinite(item.score) && item.score > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export function getInitialConversationAreas(priorityAreas = [], suggestedAreas = [], limit = 2) {
  if (priorityAreas.length > limit) return [];
  return (priorityAreas.length > 0 ? priorityAreas : suggestedAreas).slice(0, limit);
}

export function toggleConversationTopicSelection(selectedKeys = [], key, limit = 2) {
  if (selectedKeys.includes(key)) return selectedKeys.filter((item) => item !== key);
  if (selectedKeys.length >= limit) return selectedKeys;
  return [...selectedKeys, key];
}

export function getPriorityAreaIdsFromScores(scores) {
  return Object.entries(scores || {})
    .filter(([, score]) => Number.isFinite(Number(score)) && Number(score) > 0 && Number(score) <= PRIORITY_THRESHOLD)
    .sort(([, scoreA], [, scoreB]) => Number(scoreA) - Number(scoreB))
    .map(([area]) => area);
}

export function getFirstName(value, fallback) {
  return String(value || '').trim().split(/\s+/)[0] || fallback;
}

const NATURAL_WHATSAPP_TOPICS = {
  'claridad de carrera': 'mi elección de carrera',
  'desempeño académico': 'mi avance académico',
  'prácticas profesionales': 'mis prácticas profesionales',
  'servicio social': 'mi servicio social',
  'semestre tec': 'mi Semestre Tec',
  'certificación de idioma': 'mi certificación de idioma',
};

function getNaturalWhatsAppTopic(label) {
  const normalized = String(label || '').trim().toLocaleLowerCase('es-MX');
  if (!normalized) return '';
  return NATURAL_WHATSAPP_TOPICS[normalized]
    || normalized.charAt(0).toLocaleLowerCase('es-MX') + normalized.slice(1);
}

function joinTopics(labels) {
  const topics = labels
    .map(getNaturalWhatsAppTopic)
    .filter(Boolean)
    .filter((label, index, items) => items.indexOf(label) === index);

  if (topics.length === 0) return 'mis siguientes pasos';
  if (topics.length === 1) return topics[0];
  return `${topics.slice(0, -1).join(', ')} y ${topics.at(-1)}`;
}

export function buildWhatsAppMessage({ studentName, mentorName, topicLabels = [] }) {
  const student = getFirstName(studentName, '');
  const mentor = getFirstName(mentorName, '');
  const greeting = mentor ? `Hola, ${mentor}.` : 'Hola.';
  const introduction = student ? ` Soy ${student}.` : '';

  return `${greeting}${introduction} Terminé el test faro. Me gustaría empezar platicando contigo sobre ${joinTopics(topicLabels)}. ¿Podemos acordar una cita?`;
}

export function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length >= 8 && digits.length <= 15) return digits;
  return '';
}

export function buildWhatsAppUrl(number, message) {
  const normalizedNumber = normalizeWhatsAppNumber(number);
  if (!normalizedNumber) return '';
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(String(message || ''))}`;
}
