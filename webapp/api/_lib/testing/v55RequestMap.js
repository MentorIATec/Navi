// Audit-only: complete archived v55 in a VM with synthetic sheets. No network.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const baseline = readFileSync(new URL('../../../docs/plan-actualizacion-faro/baselines/apps-script-v55/NaviEngine.source.txt', import.meta.url), 'utf8');
export function createV55RequestMap({ rowsPerSheet = 561, targetInDirectory = true, targetInLegacy = true, activeVersion = true, source = baseline, targetHistory = 0 } = {}) {
  assert.ok(Number.isInteger(rowsPerSheet) && rowsPerSheet >= 0);
  const student = 'A12345678', version = 'audit-version', cycle = 'AD26-FJ27';
  const events = [], cache = new Map(), props = new Map([
    ['NAVI_SERVICE_SECRET', 'audit-only'], ['ACTIVE_DIRECTORY_VERSION', activeVersion ? version : ''], ['ACTIVE_OPERATIONAL_CYCLE', cycle],
  ]);
  let held = false;
  function event(kind, details = {}) { events.push({ kind, locked: held, ...details }); }
  const properties = {
    getProperty: key => { event('propertyGet', { key }); return props.get(key) || ''; },
    setProperty: (key, value) => { event('propertySet', { key }); props.set(key, value); },
  };
  const context = vm.createContext({
    console: { log: () => event('log'), warn: () => event('warn') },
    PropertiesService: { getScriptProperties: () => properties },
    CacheService: { getScriptCache: () => ({
      get: key => { event('cacheGet', { key }); return cache.get(key) || null; },
      put: (key, value) => { if (new TextEncoder().encode(value).length > 100000) { event('cacheRejected', { key }); throw Error('mock cache size'); } cache.set(key, value); event('cachePut', { key }); },
      remove: key => cache.delete(key), removeAll: keys => keys.forEach(key => cache.delete(key)),
    }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { assert.equal(held, false); held = true; event('lockAcquire'); }, releaseLock: () => { event('lockRelease'); held = false; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => { event('responseBuilt'); return { getContent: () => text, setMimeType() { return this; } }; } },
    Utilities: { getUuid: () => 'trace-audit-local-0001' },
    SpreadsheetApp: { getActiveSpreadsheet: () => { event('openSpreadsheet'); return ss; }, flush: () => event('flush') },
  });
  vm.runInContext(source, context);
  const sheetSpecs = {
    Students: 'STUDENT_HEADERS', Staff: 'STAFF_HEADERS', DirectoryVersions: 'DIRECTORY_VERSION_HEADERS', DirectoryStudents: 'DIRECTORY_STUDENT_HEADERS',
    StudentPreferences: 'STUDENT_PREFERENCE_HEADERS', CheckIns: 'CHECKIN_HEADERS', Responses: 'RESPONSES_HEADERS', GoalSelections: 'GOAL_SELECTION_HEADERS', Sesiones: 'SESSIONS_HEADERS',
  };
  const sheets = new Map();
  for (const [name, constant] of Object.entries(sheetSpecs)) {
    const headers = Array.from(vm.runInContext(`${constant}.slice()`, context));
    const record = (matricula, v = version) => headers.map(header => ({
      'Matrícula': matricula, Matricula: matricula, VersionId: v, Nombre: 'Demo', NombrePreferido: 'Demo', Email: 'demo@example.invalid',
      NicknameMentor: 'Demo', MentorId: 'audit-mentor', Alias: 'Demo', Activo: 'Si', Status: name === 'DirectoryVersions' ? 'PUBLISHED' : 'Pendiente',
      OperationalCycle: cycle, Periodo: cycle, ResponseId: `response-${matricula}`, SelectionId: `goal-${matricula}`,
      CheckInId: `${matricula}:check-in-demo`, Session_ID: `session-${matricula}`, Etapa: 'demo', TimestampISO: '2026-10-09T12:00:00Z',
    })[header] || '');
    const include = name === 'Students' ? targetInLegacy : name === 'DirectoryStudents' ? targetInDirectory : true;
    const rows = [headers, ...(include ? [record(student)] : [])];
    if (!['Staff', 'DirectoryVersions'].includes(name)) for (let i = 0; i < rowsPerSheet; i++) rows.push(record(`A${90000000 + i}`, 'audit-previous'));
    if (['CheckIns', 'Responses', 'GoalSelections', 'Sesiones'].includes(name)) for (let i = 0; i < targetHistory; i++) {
      const historic = record(student); historic[headers.indexOf(name === 'Sesiones' ? 'Periodo' : 'OperationalCycle')] = 'AD25-FJ26';
      const idColumn = headers.findIndex(h => ['ResponseId', 'SelectionId', 'CheckInId', 'Session_ID'].includes(h));
      historic[idColumn] = `audit-history-${i}`; rows.push(historic);
    }
    const sheet = {
      rows, getLastRow: () => { event('lastRow', { sheet: name }); return rows.length; },
      getLastColumn: () => { event('lastColumn', { sheet: name }); return rows[0].length; },
      getRange: (r, c, nr = 1, nc = 1) => ({
        getValues: () => { event('getValues', { sheet: name, r, c, nr, nc, cells: nr * nc }); return rows.slice(r - 1, r - 1 + nr).map(row => row.slice(c - 1, c - 1 + nc)); },
        setValues: values => {
          assert.equal(held, true); event('setValues', { sheet: name, r, c, nr, nc });
          values.forEach((row, i) => row.forEach((value, j) => { rows[r - 1 + i] ||= []; rows[r - 1 + i][c - 1 + j] = value; }));
        },
      }),
      getDataRange: () => sheet.getRange(1, 1, rows.length, rows[0].length),
      appendRow: values => { assert.equal(held, true); event('append', { sheet: name }); rows.push(Array.from(values)); },
    };
    sheets.set(name, sheet);
  }
  const ss = { getSheetByName: name => { event('sheetByName', { sheet: name }); return sheets.get(name) || null; } };
  context.auditSpreadsheet = ss;
  function run(action, data = {}) {
    events.length = 0;
    const output = context.doPost({ postData: { contents: JSON.stringify({ action, serviceSecret: 'audit-only', data: { matricula: student, traceId: 'trace-audit-map-0002', ...data } }) } });
    const result = JSON.parse(output.getContent());
    const bySheet = {};
    for (const e of events.filter(e => e.sheet)) {
      const item = bySheet[e.sheet] ||= { calls: 0, cells: 0, headers: 0, lockedCells: 0, contextCalls: 0 };
      if (e.kind === 'getValues') { item.calls++; item.cells += e.cells; if (e.r === 1) item.headers++; if (e.locked) item.lockedCells += e.cells; }
      else if (['sheetByName', 'lastRow', 'lastColumn'].includes(e.kind)) item.contextCalls++;
    }
    return { result, events: [...events], summary: { bySheet, totals: Object.fromEntries([...new Set(events.map(e => e.kind))].map(kind => [kind, events.filter(e => e.kind === kind).length])) } };
  }
  return { run, sheets, cache, props, student, version, evaluate: code => vm.runInContext(code, context) };
}
export function measureV55RequestMap(options = {}) {
  const h = createV55RequestMap(options), operations = {};
  for (const [name, action, data] of [
    ['coldLookup', 'getStudentEntry', {}], ['warmLookup', 'getStudentEntry', {}],
    ['saveGoal', 'saveGoalSelection', { selectionId: 'audit-new-goal', metaPrioritaria: 'Demo', tiempo: '1 Mes' }],
    ['lookupAfterSave', 'getStudentEntry', {}], ['retryGoal', 'saveGoalSelection', { selectionId: 'audit-new-goal', metaPrioritaria: 'Demo', tiempo: '1 Mes' }],
  ]) {
    const measured = h.run(action, data); assert.equal(measured.result.status, 'success');
    operations[name] = { ...measured.summary, cache: measured.result.telemetry?.cache || {}, studentFound: Boolean(measured.result.data?.student), reused: measured.result.data?.reused ?? null };
  }
  const arrival = createV55RequestMap(options).run('startStudentCheckIn', { requestId: 'audit-arrival-0001', modality: 'presencial' });
  assert.equal(arrival.result.status, 'success'); operations.coldArrival = arrival.summary;
  return { ...options, method: 'Archived complete v55, synthetic full-width headers, VM call counters; no latency, TTL or gateway simulation; mock 100000-byte cache limit; preparation excluded', operations };
}
