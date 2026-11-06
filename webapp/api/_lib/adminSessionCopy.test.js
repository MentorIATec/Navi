import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMentoringSummary, formatSessionRecordDate, getCrmSourceReview, getSessionAreaLabel,
  getSessionAreas, getSessionScaleLabel, getSessionStageLabel } from '../../src/utils/adminSessionCopy.js';
import { DIAGNOSTIC_BANK } from '../../src/data/diagnosticBank.js';

const student = Object.freeze({ preferredName: 'Ana', matricula: 'A00000001', community: 'KREI', mentor: 'Mentora de prueba',
  agenciaCheckIn: 'Llega con algo de carga o cansancio · Quiere ordenar prioridades y saber por dónde empezar.' });
const diag = Object.freeze({ matricula: student.matricula, etapa: 'exploracion', areasprioritarias: 'servicio_social,plan_practicas',
  fechatest: '2026-10-20', operationalcycle: 'LOCAL-2026' });
const goals = Object.freeze({ matricula: student.matricula, metaprioritaria: 'Reservar dos bloques de estudio por semana',
  metacomplementaria: 'Retomar una actividad de descanso', tiempo: '4 a 6 semanas', obstaculo: 'Se acumulan entregas',
  plan: 'Si coinciden varias entregas, revisaré las fechas y pediré apoyo', timestamp: '2026-10-20', operationalcycle: 'LOCAL-2026' });
const draft = Object.freeze({ fechaSesion: '2026-10-21', notasMentor: '  Revisar el calendario.\nSin una fecha nueva acordada.\n', documentadoCrm: false });

const format = (patch = {}) => buildMentoringSummary(patch.student || student, patch.diag === undefined ? diag : patch.diag,
  patch.goals === undefined ? goals : patch.goals, patch.draft || draft);
const completeTest = (stage, score) => ({ etapa: stage, areasprioritarias: '', scores: Object.fromEntries(DIAGNOSTIC_BANK[stage].map(q => [q.category, score])) });

test('CRM integrates arrival, attributed test priorities and literal mentor notes in one encounter narrative', () => {
  const summary = format();
  assert.match(summary, /^Registro de acompañamiento con faro\nFecha de sesión: 2026-10-21\nEstudiante: Ana \(A00000001\)/);
  assert.match(summary, /Durante el encuentro\nAl inicio de la sesión, indicó que llegaba con algo de carga o cansancio. Buscaba ordenar sus prioridades y saber por dónde empezar\./);
  assert.ok(summary.includes('A partir de sus respuestas al test del 2026-10-20, se sugirió conversar sobre servicio social y prácticas profesionales.'));
  assert.ok(summary.includes(draft.notasMentor));
  const positions = ['Durante el encuentro', 'Al inicio de la sesión, indicó', 'A partir de sus respuestas', draft.notasMentor,
    'Con base en la conversación, las metas elegidas para trabajar fueron:', 'El obstáculo anticipado y la estrategia de acción elegida fueron:'].map(s => summary.indexOf(s));
  assert.ok(positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1])));
  assert.doesNotMatch(summary, /Antecedentes|Contexto para el acompañamiento|Persona mentora asignada|Metas registradas|Horizonte|Revisión de fuentes|·/);
  assert.equal(summary.split('Al inicio de la sesión, indicó').length - 1, 1);
  assert.equal(summary.split('faro').length - 1, 1);
  for (const [label, key] of [['Meta prioritaria', 'metaprioritaria'], ['Meta complementaria', 'metacomplementaria'], ['Tiempo previsto', 'tiempo'], ['Obstáculo identificado', 'obstaculo'], ['Estrategia elegida', 'plan']]) assert.ok(summary.includes(`${label}: ${goals[key]}`));
});

test('copy never upgrades a CRM checkbox or saved ID into evidence of mentor actions', () => {
  assert.equal(format(), format({ draft: { ...draft, sessionId: 'saved', documentadoCrm: true } }));
  assert.doesNotMatch(format(), /sesión completada|acuerdos confirmados|Mentoría completada|Cuando se complique/);
});

test('known mismatched student or cycle prevents export; matching cycles do not claim confirmed source linkage', () => {
  assert.equal(getCrmSourceReview(student, diag, { ...goals, operationalcycle: 'OLD' }).canCopy, false);
  assert.equal(getCrmSourceReview(student, { ...diag, matricula: 'A00000002' }, goals).canCopy, false);
  assert.equal(getCrmSourceReview(student, diag, { ...goals, matricula: 'A00000002' }).canCopy, false);
  for (const value of [goals, { ...goals, operationalcycle: undefined }, { ...goals, operationalcycle: ' local-2026 ' }]) {
    const review = getCrmSourceReview(student, diag, value); assert.equal(review.canCopy, true);
    assert.match(review.message, /Revisa la vigencia/); assert.doesNotMatch(review.message, /correspondencia confirmada/);
  }
});

test('without notes, arrival and test form the narrative without inventing conversation or mentor actions', () => {
  const summary = format({ draft: { ...draft, notasMentor: ' \n ' } });
  assert.match(summary, /Durante el encuentro\nAl inicio de la sesión, indicó/);
  assert.match(summary, /se sugirió conversar sobre servicio social y prácticas profesionales/);
  assert.match(summary, /Las metas elegidas para trabajar fueron:/);
  assert.doesNotMatch(summary, /Con base en la conversación|Revisamos|acordamos|se canalizó|estudiante identifica|eligió conversar/i);
});

test('complete scores distinguish no priorities from unavailable results without implying no needs', () => {
  for (const stage of Object.keys(DIAGNOSTIC_BANK)) {
    const summary = format({ diag: completeTest(stage, 4), draft: { ...draft, notasMentor: '' } });
    assert.match(summary, /Sus respuestas al test no señalaron temas prioritarios específicos para conversar\./);
    assert.doesNotMatch(summary, /sin necesidades|sin riesgos|todo bien|base sólida|se sugirió conversar/);
  }
  const incomplete = format({ diag: { etapa: 'exploracion', areasprioritarias: '' } });
  assert.match(incomplete, /La información disponible del test no permite precisar temas prioritarios para conversar\./);
  assert.doesNotMatch(incomplete, /no señalaron temas prioritarios/);
  const missing = format({ diag: null });
  assert.doesNotMatch(missing, /test|no señalaron temas prioritarios/);
});

test('priority prose uses the existing threshold and accepts compact/raw/sanitized score formats', () => {
  for (const input of [
    { etapa: 'exploracion', claridad_carrera: 5, desempeno_academico: 5, plan_practicas: 2, servicio_social: 1 },
    { etapa: 'exploracion', claridadcarrera: 5, desempenoacademico: 5, planpracticas: 2, serviciosocial: 1 },
    { ...completeTest('exploracion', 5), scores: { claridad_carrera: 5, desempeno_academico: 5, plan_practicas: 2, servicio_social: 1 } },
  ]) assert.match(format({ diag: input }), /se sugirió conversar sobre servicio social y prácticas profesionales\./);
  assert.match(format({ diag: { etapa: 'enfoque', areasPrioritarias: 'decision_semestre_tec' } }), /sobre Semestre Tec\./);
});

test('unknown labels and incomplete or invalid scores never become invented priority claims', () => {
  for (const input of [ { etapa: 'inventada', areasprioritarias: 'inseguridad_clinica' },
    { ...completeTest('exploracion', 4), scores: { claridad_carrera: 0, desempeno_academico: 9 } } ]) {
    const summary = format({ diag: input });
    assert.match(summary, /no permite precisar temas prioritarios/);
    assert.doesNotMatch(summary, /sobre inseguridad|se sugirió conversar|no señalaron temas prioritarios/);
  }
  assert.equal(getSessionAreaLabel('inventada_inseguridad_clinica'), 'Área sin etiqueta disponible');
  assert.equal(getSessionStageLabel('inventada'), 'Etapa sin información disponible');
  assert.equal(getSessionScaleLabel('inventada'), 'Escala no disponible');
});

test('long historical goals and mentor notes remain literal, untruncated and present once', () => {
  const text = 'Crear un CV y un perfil de LinkedIn estelar.\n' + 'Acción con acentos y + símbolos. '.repeat(400);
  const summary = format({ goals: { ...goals, metaprioritaria: text, plan: text }, draft: { ...draft, notasMentor: text } });
  assert.ok(summary.includes(`Meta prioritaria: ${text}\n`)); assert.ok(summary.endsWith(`Estrategia elegida: ${text}`));
  assert.ok(summary.includes(text)); assert.equal(summary.split(text).length - 1, 3);
  const notes = 'Revisamos sus avances.\n\nAcordamos consultar las fechas; no definimos una fecha de seguimiento.';
  const data = [{ ...student }, { ...diag }, { ...goals }, { ...draft, notasMentor: notes }]; const before = JSON.stringify(data);
  const copy = buildMentoringSummary(...data); assert.ok(copy.includes(notes)); assert.equal(copy.split('Acordamos').length - 1, 1); assert.equal(JSON.stringify(data), before);
});

test('all known arrival/intent pairs retain arrival meaning and are not observations attributed to the mentor', () => {
  for (const arrival of ['Llega con energía y ganas de avanzar', 'Llega con algo de carga o cansancio', 'Llega con muchas cosas en la cabeza', 'Llega con incertidumbre sobre sus siguientes pasos']) {
    for (const intent of ['Quiere revisar avances y ajustar lo que sigue', 'Quiere ordenar prioridades y saber por dónde empezar', 'Quiere entender algo que hoy le genera confusión', 'Quiere salir con un paso concreto']) {
      const summary = format({ student: { ...student, agenciaCheckIn: `${arrival} · ${intent}` }, draft: { ...draft, notasMentor: '' } });
      assert.match(summary, /Al inicio de la sesión, indicó/); assert.match(summary, /Buscaba/);
      assert.doesNotMatch(summary, /·|contención|se canalizó|se mostró motivado|Revisamos/);
    }
  }
});

test('unknown or legacy arrival text remains complete without guessed translations', () => {
  for (const text of ['Prefiero conversar sobre un asunto personal.\nConservar esta segunda línea.',
    'Llega con energía y ganas de avanzar · Una intención nueva', 'Llega con muchas cosas en la cabeza · Quiere salir con un paso concreto · Detalle adicional', 'Llega con incertidumbre sobre sus siguientes pasos']) {
    const summary = format({ student: { ...student, agenciaCheckIn: text }, draft: { ...draft, notasMentor: '' } });
    assert.ok(summary.includes(`En el termómetro de llegada se registró:\n${text.replace(/ *· */g, '\n')}`));
    assert.doesNotMatch(summary, /El estudiante indicó|Buscaba|Al inicio|·/);
  }
});

test('missing notes, arrival and test do not leave an empty encounter heading or fabricate commitments', () => {
  const summary = buildMentoringSummary({ matricula: 'A00000002' }, null, null, {});
  assert.match(summary, /Fecha de sesión: sin información disponible/);
  assert.match(summary, /No hay metas disponibles en esta consulta\./);
  assert.doesNotMatch(summary, /Durante el encuentro|Persona mentora asignada|Sin mentor asignado|sin riesgos|Meta prioritaria:|undefined|null/);
});

test('a sole obstacle or sole strategy gets a grammatical transition without invented missing fields', () => {
  const obstacle = format({ goals: { obstaculo: 'Entregas simultáneas' } });
  assert.match(obstacle, /El obstáculo anticipado fue:\nObstáculo identificado: Entregas simultáneas/);
  assert.doesNotMatch(obstacle, /Estrategia elegida:/);
  const strategy = format({ goals: { plan: 'Revisar fechas.' } });
  assert.match(strategy, /La estrategia de acción elegida fue:\nEstrategia elegida: Revisar fechas\./);
  assert.doesNotMatch(strategy, /Obstáculo identificado:/);
});

test('calendar dates are preserved, absent/impossible dates omitted from test prose without inventing today', () => {
  assert.equal(formatSessionRecordDate('2026-10-21'), '2026-10-21');
  for (const value of ['', null, '2026-02-30', '2026-02-30T12:00:00Z', 'invalid', '2026-13-01']) assert.equal(formatSessionRecordDate(value), '');
  const summary = format({ diag: { ...diag, fechatest: 'invalid' } });
  assert.match(summary, /Fecha de sesión: 2026-10-21/); assert.match(summary, /sus respuestas al test, se sugirió/);
  assert.doesNotMatch(summary, /Fecha del test|Metas registradas|fecha no disponible/);
});

test('legacy optional-context flags no longer split or hide the integrated narrative', () => {
  const a = format({ draft: { ...draft, incluirContextoCrm: false } });
  const b = format({ draft: { ...draft, incluirContextoCrm: true } }); assert.equal(a,b);
  assert.doesNotMatch(a, /Antecedentes|Contexto para el acompañamiento|Persona mentora asignada|Horizonte/);
});

test('authored middle dots survive while the template never introduces them', () => {
  const summary = format({ goals: { ...goals, metaprioritaria: 'Preparar proyecto A · B' }, draft: { ...draft, notasMentor: 'Revisamos A · B sin cambiar el texto.' } });
  assert.equal(summary.split('·').length - 1, 2);
  assert.match(summary, /Preparar proyecto A · B/); assert.match(summary, /Revisamos A · B/);
});

test('canonical labels and scales keep accents and match the unchanged diagnostic banks', () => {
  const before = JSON.stringify(DIAGNOSTIC_BANK);
  assert.equal(getSessionAreaLabel('desempenoacademico'), 'Desempeño académico');
  assert.equal(getSessionAreaLabel('PLAN_PRACTICAS'), 'Prácticas profesionales');
  assert.equal(getSessionAreaLabel('decision_semestretec'), 'Semestre Tec');
  assert.equal(getSessionAreaLabel('certificacion_idioma'), 'Certificación de idioma');
  assert.deepEqual(getSessionAreas({ areasprioritarias: 'plan_practicas,Plan Practicas, servicio_social' }), ['Prácticas profesionales', 'Servicio social']);
  assert.equal(getSessionStageLabel('exploracion'), 'Exploración');
  for (const stage of Object.keys(DIAGNOSTIC_BANK)) assert.equal(getSessionScaleLabel(stage), 'Escala 1–5');
  assert.equal(JSON.stringify(DIAGNOSTIC_BANK), before);
});
