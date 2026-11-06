import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGoogleBridgeJourney } from './testing/googleBridgeJourney.js';
import { getCrmStatus } from '../../src/utils/crmStatus.js';
import { beginJourney, readConfirmedPlan, pendingOperation, readPendingSubmission, acknowledgeOperation } from '../../src/utils/journeyIntegrity.js';
import { resumeEncounter } from '../../src/utils/encounterContinuation.js';
const source = readFileSync(new URL('../../google-apps-script/NaviEngine.gs', import.meta.url), 'utf8');
const setup = () => createGoogleBridgeJourney({ source });
const call = (h, action, data = {}) => {
  const result = h.run(action, data).result;
  assert.equal(result.status, 'success', result.message); return result.data;
};
const goal = { selectionId: 'usability-goal-0001', metaPrioritaria: 'Planear mis entregas', metaComplementaria: 'Reservar tiempo de descanso', tiempo: '1 Mes', obstaculo: 'Entregas simultáneas', plan: 'Revisaré fechas cada viernes' };

test('retry, new tab, second device and elapsed days reuse the open encounter', () => {
  const h = setup();
  const first = call(h, 'startStudentCheckIn', { requestId: 'device-one-0001', modality: 'presencial' }).registration;
  for (const requestId of ['device-one-0001', 'new-tab-request-0001', 'device-two-0001']) {
    const next = call(h, 'startStudentCheckIn', { requestId, modality: 'presencial' }).registration;
    assert.equal(next.checkInId, first.checkInId); assert.equal(next.reused, true);
  }
  assert.equal(h.counts().CheckIns, 1);
  const sheet = h.sheets.get('CheckIns'); sheet.rows[1][2] = '2020-01-01T12:00:00Z'; h.cache.clear();
  const nextDay = call(h, 'startStudentCheckIn', { requestId: 'next-day-request-0001', modality: 'presencial' }).registration;
  assert.equal(nextDay.checkInId, first.checkInId); assert.equal(h.counts().CheckIns, 1);
});

test('saved plan resumes by exact encounter across devices, with recovery and double save producing one row', () => {
  const h = setup(); const first = call(h, 'startStudentCheckIn', { requestId: 'arrival-plan-0001' }).registration;
  call(h, 'completeCheckInPreTest', { checkInId: first.checkInId, preTestSummary: 'Llegada ficticia' });
  call(h, 'saveGoalSelection', { ...goal, checkInId: first.checkInId });
  assert.equal(call(h, 'saveGoalSelection', { ...goal, checkInId: first.checkInId }).reused, true);
  const resumed = call(h, 'startStudentCheckIn', { requestId: 'second-device-0001' }).registration.continuation;
  assert.equal(resumed.plan.selectionId, goal.selectionId);
  const values = new Map(); const storage = { getItem: k => values.get(k) || null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  const journey = beginJourney(storage, { matricula: h.student, operationalCycle: h.cycle, checkInId: first.checkInId });
  assert.equal(resumeEncounter(storage, journey, resumed), '/plan-accion');
  assert.equal(readConfirmedPlan(storage, journey).payload.metaComplementaria, goal.metaComplementaria);
  assert.equal(h.counts().GoalSelections, 1);
  assert.equal(h.run('saveGoalSelection', { ...goal, selectionId: 'another-goal-0002', checkInId: first.checkInId }).result.status, 'error');
  assert.equal(h.counts().GoalSelections, 1);
});

test('mentor explicitly starts another encounter; forged public flags and other portfolios cannot do so', () => {
  const h = setup(); const first = call(h, 'startStudentCheckIn', { requestId: 'first-visit-0001' }).registration;
  const fake = call(h, 'startStudentCheckIn', { requestId: 'forged-public-0001', newEncounter: true }).registration;
  assert.equal(fake.checkInId, first.checkInId);
  const second = call(h, 'startNewMentoringEncounter', { actor: h.actor, requestId: 'mentor-new-0001' });
  assert.notEqual(second.checkInId, first.checkInId);
  assert.equal(call(h, 'startNewMentoringEncounter', { actor: h.actor, requestId: 'mentor-new-0001' }).reused, true);
  const stale = call(h, 'startStudentCheckIn', { requestId: 'first-visit-0001' }).registration;
  assert.equal(stale.checkInId, second.checkInId);
  assert.equal(h.run('startNewMentoringEncounter', { actor: h.actor, matricula: 'A99999999', requestId: 'other-scope-0001' }).result.status, 'error');
  assert.equal(h.run('startNewMentoringEncounter', { requestId: 'no-identity-0001' }).result.status, 'error');
  assert.equal(h.counts().CheckIns, 2);
});

test('CRM saved with and without notes links one session, preserves retry and never inherits completion', () => {
  const h = setup(); const arrival = call(h, 'startStudentCheckIn', { requestId: 'crm-arrival-0001' }).registration;
  for (const notasMentor of ['', 'Conversación ficticia y siguiente paso.']) {
    const data = { actor: h.actor, checkInId: arrival.checkInId, sessionId: 'usability-session-0001', fechaSesion: '2026-11-05', notasMentor, documentadoCrm: false };
    call(h, 'saveMentoringSession', data); call(h, 'saveMentoringSession', data);
  }
  assert.equal(h.counts().Sesiones, 1);
  assert.equal(h.sheets.get('CheckIns').rows[1][5], 'usability-session-0001');
  const student = { hasCheckIn: true, checkInSessionId: 'usability-session-0001' };
  assert.equal(getCrmStatus(student, { sessionId: 'usability-session-0001', documentadoCrm: false }).label, 'Pendiente CRM');
  assert.equal(getCrmStatus(student, { sessionId: 'usability-session-0001', documentadoCrm: true }).label, 'CRM documentado');
  assert.equal(getCrmStatus({hasCheckIn:true}, { sessionId: 'old-session', documentadoCrm: true }).label, 'Estado CRM por confirmar');
  assert.equal(getCrmStatus({hasCheckIn:true}, null).label, 'Pendiente CRM');
  assert.equal(getCrmStatus({hasResponse:true}, null), null);
  assert.equal(h.run('saveMentoringSession', { actor: h.actor, checkInId: 'other-id', sessionId: 'bad-link-0001' }).result.status, 'error');
  assert.equal(h.counts().Sesiones, 1);
});

test('home entry resumes the saved plan; even explicit replacement cannot edit a closed encounter', () => {
  const h = setup(); const arrival = call(h, 'startStudentCheckIn', { requestId: 'home-arrival-0001' }).registration;
  call(h, 'saveGoalSelection', { ...goal, checkInId: arrival.checkInId });
  const before = h.counts();
  assert.equal(call(h, 'getStudentEntry').continuation.plan.metaPrioritaria, goal.metaPrioritaria);
  assert.deepEqual(h.counts(), before);
  const revised = { ...goal, selectionId: 'revised-goal-0002', replacesSelectionId: goal.selectionId, checkInId: arrival.checkInId, metaPrioritaria: 'Organizar entregas cada viernes' };
  assert.equal(h.run('saveGoalSelection', revised).result.code, 'PLAN_ALREADY_CONFIRMED');
  assert.equal(call(h, 'getStudentEntry').continuation.plan.metaPrioritaria, goal.metaPrioritaria);
  assert.equal(h.counts().GoalSelections, 1);
  assert.equal(h.counts().CheckIns, 1);
  assert.equal(h.run('saveGoalSelection', { ...revised, selectionId: 'stale-edit-0003', replacesSelectionId: goal.selectionId }).result.status, 'error');
  assert.equal(h.counts().GoalSelections, 1);
});

test('new encounter never inherits the previous plan or CRM completion; revoked mentor cannot create arrivals', () => {
  const h = setup(); const first = call(h, 'startStudentCheckIn', { requestId: 'separate-arrival-0001' }).registration;
  call(h, 'saveGoalSelection', { ...goal, checkInId: first.checkInId });
  call(h, 'saveMentoringSession', { actor: h.actor, checkInId: first.checkInId, sessionId: 'previous-crm-0001', documentadoCrm: true, periodo: h.cycle, fechaSesion: '2026-11-05' });
  const next = call(h, 'startNewMentoringEncounter', { actor: h.actor, requestId: 'next-encounter-0001' });
  const dashboard = call(h, 'getMentorDashboard', { actor: h.actor });
  const student = dashboard.students.find(item => item.matricula === h.student);
  assert.equal(student.hasGoalSelection, false); assert.equal(student.checkinsessionid, '');
  assert.equal(dashboard.goalSelections.length, 0);
  assert.equal(call(h, 'getStudentEntry').continuation.checkInId, next.checkInId);
  assert.equal(call(h, 'getStudentEntry').continuation.plan, null);
  const staff = h.sheets.get('Staff'); staff.rows[1][staff.rows[0].indexOf('Activo')] = 'No'; h.cache.clear();
  const count = h.counts().CheckIns;
  assert.equal(h.run('startNewMentoringEncounter', { actor: h.actor, requestId: 'revoked-actor-0001' }).result.status, 'error');
  assert.equal(h.counts().CheckIns, count);
});


test('a known new encounter stays pending even when an older encounter was documented', () => {
  assert.equal(getCrmStatus({ hasCheckIn: true, encounterManaged: true, checkInId: 'new-arrival', checkInSessionId: '' },
    { sessionId: 'previous-session', documentadoCrm: true }).label, 'Pendiente CRM');
});

test('closed plan is recovered days later and after local expiry without writing or registering arrival', () => {
  const h = setup(); const arrival = call(h, 'startStudentCheckIn', { requestId: 'close-later-0001' }).registration;
  const saved = call(h, 'saveGoalSelection', { ...goal, checkInId: arrival.checkInId });
  h.sheets.get('CheckIns').rows[1][2] = '2020-01-01T12:00:00Z'; h.cache.clear();
  const before = h.counts();
  const entry = call(h, 'getStudentEntry');
  const again = call(h, 'startStudentCheckIn', { requestId: 'fresh-device-0001' }).registration;
  assert.equal(again.continuation.plan.selectionId, saved.selectionId);
  assert.equal(entry.continuation.plan.completedAt, saved.completedAt);
  const values = new Map(); const storage = { getItem: k => values.get(k) || null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  const journey = beginJourney(storage, { matricula: h.student, operationalCycle: h.cycle, checkInId: entry.continuation.checkInId });
  assert.equal(resumeEncounter(storage, journey, entry.continuation), '/plan-accion');
  assert.equal(readConfirmedPlan(storage, journey).completedAt, saved.completedAt);
  assert.deepEqual(h.counts(), before);
  assert.equal(getCrmStatus({hasCheckIn:true, encounterManaged:true}, null).label, 'Pendiente CRM');
});

test('omitted encounter, stale tab and forged replacements cannot bypass finalization', () => {
  const h = setup(); const first = call(h, 'startStudentCheckIn', { requestId: 'guard-arrival-0001' }).registration;
  call(h, 'completeCheckInPreTest', { checkInId: first.checkInId, preTestSummary: 'Llegada ficticia' });
  call(h, 'saveGoalSelection', { ...goal, checkInId: first.checkInId });
  const before = h.counts();
  for (const extra of [{}, {checkInId:first.checkInId}, {checkInId:first.checkInId,replacesSelectionId:goal.selectionId}, {checkInId:first.checkInId,newEncounter:true}]) {
    assert.equal(h.run('saveGoalSelection', { ...goal, selectionId:'bypass-goal-0002', ...extra }).result.status, 'error');
  }
  assert.equal(h.run('completeCheckInPreTest', { checkInId:first.checkInId, preTestSummary:'Alteración tardía' }).result.status, 'error');
  const next = call(h, 'startNewMentoringEncounter', { actor:h.actor, requestId:'guard-next-0001' });
  assert.equal(h.run('saveGoalSelection', { ...goal, checkInId:first.checkInId }).result.status, 'error');
  assert.equal(h.run('completeCheckInPreTest', { checkInId:first.checkInId, preTestSummary:'Llegada ficticia' }).result.status, 'error');
  call(h, 'saveGoalSelection', { ...goal, selectionId:'mentor-next-goal-0002', checkInId:next.checkInId });
  assert.equal(h.counts().GoalSelections, before.GoalSelections + 1);
  assert.equal(h.sheets.get('CheckIns').rows[1][11], goal.selectionId);
});

test('remote/legacy confirmed plans are read-only and do not create arrivals or inferred links', () => {
  for (const historicalArrival of [false, true]) {
    const h = setup();
    if (historicalArrival) {
      const arrival = call(h, 'startStudentCheckIn', {requestId:'historic-arrival-0001'}).registration;
      call(h, 'saveGoalSelection', {...goal,checkInId:arrival.checkInId});
      h.sheets.get('CheckIns').rows[1][8] = 'legacy';
      h.sheets.get('CheckIns').rows[1][11] = '';
    } else call(h, 'saveGoalSelection', goal);
    h.cache.clear(); const before = h.counts();
    assert.equal(call(h,'getStudentEntry').continuation.plan.selectionId,goal.selectionId);
    assert.equal(call(h,'startStudentCheckIn',{requestId:'remote-reentry-0001'}).registration.continuation.plan.selectionId,goal.selectionId);
    assert.deepEqual(h.counts(),before);
    assert.equal(h.run('saveGoalSelection',{...goal,selectionId:'remote-rewrite-0002',replacesSelectionId:goal.selectionId}).result.code,'PLAN_ALREADY_CONFIRMED');
    if (historicalArrival) assert.equal(h.sheets.get('CheckIns').rows[1][11],'');
  }
});

test('only an administrative cycle change permits a new diagnostic; retries retain their ID', () => {
  const h = setup(); const data = {responseId:'single-test-0001',etapa:'exploracion',modalidad:'remoto',claridad_carrera:2};
  call(h,'saveTestResponse',data);
  assert.equal(call(h,'saveTestResponse',data).reused,true);
  assert.equal(h.run('saveTestResponse',{...data,responseId:'other-stage-0002',etapa:'enfoque'}).result.code,'TEST_ALREADY_COMPLETED');
  assert.equal(h.run('saveTestResponse',{...data,responseId:'forged-cycle-0002',operationalCycle:'AD27-FJ28'}).result.code,'OPERATIONAL_CYCLE_CHANGED');
  assert.equal(h.counts().Responses,1);
  h.props.set('ACTIVE_OPERATIONAL_CYCLE','AD27-FJ28'); h.cache.clear();
  assert.equal(call(h,'getStudentEntry').testResponse,null);
  call(h,'saveTestResponse',{...data,responseId:'next-cycle-0002',etapa:'enfoque',operationalCycle:'AD27-FJ28'});
  assert.equal(h.counts().Responses,2);
});

test('an incomplete plan cannot close a journey; no-test assisted completion cannot open a later autonomous test', () => {
  const h = setup(); const arrival = call(h,'startStudentCheckIn',{requestId:'complete-plan-0001'}).registration;
  const data = {...goal,checkInId:arrival.checkInId};
  assert.equal(h.run('saveGoalSelection',{...data,plan:' '}).result.code,'PLAN_INCOMPLETE');
  assert.equal(call(h,'getStudentEntry').continuation.plan,null);
  assert.equal(h.counts().GoalSelections,0);
  call(h,'saveGoalSelection',data);
  assert.equal(h.run('saveTestResponse',{responseId:'late-test-0001',etapa:'exploracion'}).result.code,'TEST_ALREADY_COMPLETED');
});

test('stale cached snapshots and empty indexes cannot authorize another arrival, test or plan', () => {
  const h = setup();
  call(h,'getStudentEntry');
  const staleCache = new Map(h.cache);
  const arrival = call(h,'startStudentCheckIn',{requestId:'authoritative-arrival-0001'}).registration;
  call(h,'saveTestResponse',{responseId:'authoritative-test-0001',etapa:'exploracion'});
  call(h,'saveGoalSelection',{...goal,checkInId:arrival.checkInId});
  const before = h.counts();
  for (const [key,value] of staleCache) h.cache.set(key,value);
  assert.equal(call(h,'getStudentEntry').continuation.plan.selectionId,goal.selectionId);
  assert.equal(call(h,'startStudentCheckIn',{requestId:'stale-cache-arrival-0002'}).registration.checkInId,arrival.checkInId);
  assert.equal(h.run('saveTestResponse',{responseId:'stale-cache-test-0002',etapa:'enfoque'}).result.code,'TEST_ALREADY_COMPLETED');
  assert.equal(h.run('saveGoalSelection',{...goal,checkInId:arrival.checkInId,selectionId:'stale-cache-goal-0002'}).result.code,'PLAN_ALREADY_CONFIRMED');
  assert.deepEqual(h.counts(),before);
});

test('lost acknowledgement keeps the original submission pending; retry confirms one plan and its encounter link', () => {
  const h = setup(); const arrival = call(h,'startStudentCheckIn',{requestId:'lost-ack-arrival-0001'}).registration;
  const values = new Map(); const storage = { getItem:k=>values.get(k)||null, setItem:(k,v)=>values.set(k,v), removeItem:k=>values.delete(k) };
  const journey = beginJourney(storage,{matricula:h.student,operationalCycle:h.cycle,checkInId:arrival.checkInId});
  const {selectionId: _unused, ...fields} = goal;
  const payload = {...fields,matricula:h.student,operationalCycle:h.cycle,checkInId:arrival.checkInId};
  const operation = pendingOperation(storage,journey,'goal',payload);
  h.evaluate(`SpreadsheetApp.flush=()=>{ if(!auditSpreadsheet.getSheetByName('CheckIns').rows[1][11]) throw Error('Encounter not linked before confirmation'); };`);
  call(h,'saveGoalSelection',{...payload,selectionId:operation.id}); // Simulate the response being lost on the network.
  assert.equal(readConfirmedPlan(storage,journey),null);
  const recovery = readPendingSubmission(storage,journey,'goal');
  assert.equal(recovery.operation.id,operation.id);
  const acknowledgement = call(h,'saveGoalSelection',{...recovery.payload,selectionId:recovery.operation.id});
  assert.equal(acknowledgement.reused,true);
  acknowledgeOperation(storage,journey,'goal',recovery.operation,acknowledgement,recovery.payload);
  assert.equal(readConfirmedPlan(storage,journey).operationId,operation.id);
  assert.equal(h.counts().GoalSelections,1);
  assert.equal(h.counts().CheckIns,1);
  assert.equal(h.counts().Sesiones,0);
});

test('administrative cycle transition does not reuse an old arrival even if the browser retains its request ID', () => {
  const h = setup(); const data = {requestId:'year-boundary-request-0001'};
  const first = call(h,'startStudentCheckIn',data).registration;
  call(h,'saveGoalSelection',{...goal,checkInId:first.checkInId});
  h.props.set('ACTIVE_OPERATIONAL_CYCLE','AD27-FJ28'); h.cache.clear();
  const second = call(h,'startStudentCheckIn',data).registration;
  assert.notEqual(second.checkInId,first.checkInId);
  assert.equal(second.reused,false);
  assert.equal(call(h,'startStudentCheckIn',data).registration.checkInId,second.checkInId);
  assert.equal(call(h,'getStudentEntry').continuation.plan,null);
  assert.equal(h.counts().CheckIns,2);
  assert.equal(h.counts().GoalSelections,1);
  assert.equal(h.sheets.get('CheckIns').rows[1][11],goal.selectionId);
});
