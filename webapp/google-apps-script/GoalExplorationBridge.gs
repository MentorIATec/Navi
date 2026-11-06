// Shared, bounded technical state in the EXISTING Config sheet. No new tabs,
// business rows, historical snapshots, migrations, triggers or cron jobs.
const FARO_EXPLORATION_SLOT_PREFIX = 'FARO_EXPLORATION_SLOT_';
const FARO_EXPLORATION_MAX_SLOTS = 2048;
const FARO_EXPLORATION_TTL_MS = 4 * 60 * 60 * 1000;

function explorationFailure_(code) {
  throw new Error(code);
}

function explorationSlots_(ss) {
  var sheet = ss.getSheetByName('Config');
  if (!sheet || sheet.getLastRow() < 1) explorationFailure_('GOAL_STATE_CONFIG_REQUIRED');
  var rows = sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();
  if (String(rows[0][0]) !== 'Key' || String(rows[0][1]) !== 'Value') explorationFailure_('GOAL_STATE_SCHEMA_INVALID');
  var slots = [], names = {}, scopes = {};
  rows.slice(1).forEach(function(row, index) {
    var key = String(row[0]);
    if (key.indexOf(FARO_EXPLORATION_SLOT_PREFIX) !== 0) return;
    if (!/^FARO_EXPLORATION_SLOT_\d{4}$/.test(key) || names[key]) explorationFailure_('GOAL_STATE_DUPLICATE');
    var value;
    try { value = JSON.parse(row[1]); } catch (_) { explorationFailure_('GOAL_STATE_CORRUPT'); }
    if (!value || !/^[a-f0-9]{64}$/.test(value.scope) || scopes[value.scope] || !Number.isSafeInteger(value.revision) || value.revision < 1 || !Number.isFinite(value.expiresAt)) explorationFailure_('GOAL_STATE_CORRUPT');
    names[key] = true; scopes[value.scope] = true;
    slots.push({ row: index + 2, key: key, value: value });
  });
  if (slots.length > FARO_EXPLORATION_MAX_SLOTS) explorationFailure_('GOAL_STATE_CAPACITY');
  return { sheet: sheet, slots: slots, names: names };
}

function explorationSnapshot_(scope, slot) {
  return slot ? { scope: scope, revision: slot.value.revision, state: slot.value.state, commitId: slot.value.commitId }
    : { scope: scope, revision: 0, state: null, commitId: null };
}

function goalExplorationState_(ss, action, data) {
  if (!data || !/^[a-f0-9]{64}$/.test(data.scope)) explorationFailure_('GOAL_STATE_SCOPE_INVALID');
  var lock = LockService.getScriptLock();
  lock.waitLock(INTERACTIVE_WRITE_LOCK_TIMEOUT_MS);
  try {
    var context = explorationSlots_(ss);
    var slot = context.slots.find(function(item) { return item.value.scope === data.scope; });
    if (action === 'readGoalExplorationState') return explorationSnapshot_(data.scope, slot);
    if (action !== 'commitGoalExplorationState' || !Number.isSafeInteger(data.revision) || data.revision < 0 || !/^[a-zA-Z0-9-]{20,80}$/.test(data.commitId)) explorationFailure_('GOAL_STATE_INPUT_INVALID');
    var now = Date.now(), state = data.state;
    if (!state || !Number.isFinite(state.expiresAt) || state.expiresAt <= now || state.expiresAt > now + FARO_EXPLORATION_TTL_MS + 60000
      || typeof state.responseId !== 'string' || state.responseId.length > 160 || !Array.isArray(state.seen) || state.seen.length > 16 || new Set(state.seen).size !== state.seen.length
      || !Array.isArray(state.requests) || state.requests.length > 60 || !state.pages || !state.cursors) explorationFailure_('GOAL_STATE_INPUT_INVALID');
    if ((slot ? slot.value.revision : 0) !== data.revision) return { scope: data.scope, committed: false };
    // Replays of the exact commit cannot append another row.
    var record = { scope: data.scope, revision: data.revision + 1, expiresAt: state.expiresAt, state: state, commitId: data.commitId };
    var serialized = JSON.stringify(record);
    if (serialized.length > 42000) explorationFailure_('GOAL_STATE_SIZE_LIMIT');
    if (!slot) {
      // Expired slots are reused in place. Config never accumulates old versions.
      slot = context.slots.find(function(item) { return item.value.expiresAt <= now; });
      if (!slot) {
        if (context.slots.length >= FARO_EXPLORATION_MAX_SLOTS) explorationFailure_('GOAL_STATE_CAPACITY');
        var key;
        for (var i = 0; i < FARO_EXPLORATION_MAX_SLOTS; i++) {
          key = FARO_EXPLORATION_SLOT_PREFIX + String(i).padStart(4, '0');
          if (!context.names[key]) break;
        }
        slot = { row: context.sheet.getLastRow() + 1, key: key };
      }
    }
    context.sheet.getRange(slot.row, 1, 1, 3).setValues([[slot.key, serialized, 'faro: estado temporal de exploración; reutilizable']]);
    SpreadsheetApp.flush();
    return { scope: data.scope, committed: true, revision: record.revision, commitId: data.commitId };
  } finally { lock.releaseLock(); }
}

function getGoalExplorationContext_(ss, data, timing) {
  if (!data || !/^A\d{8}$/.test(data.matricula) || !/^[a-f0-9]{64}$/.test(data.scope)) explorationFailure_('GOAL_STATE_SCOPE_INVALID');
  var entry = JSON.parse(getStudentEntry(ss, { matricula: data.matricula, cycleScope: 'active' }, timing).getContent());
  if (entry.status !== 'success') explorationFailure_('GOAL_DIAGNOSTIC_REQUIRED');
  if (entry.data.testResponse) {
    var test = entry.data.testResponse;
    var diagnosticCycle = String(test.operationalCycle || getLegacyOperationalCycle_());
    // Read-only identity for an unmodified legacy snapshot, not a fabricated
    // ResponseId or a claim that it is linked to a goal/session record.
    var reference = test.responseId || 'legacy:' + Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify([data.matricula, diagnosticCycle, test.fechaTest, test.etapa, test.scores]), Utilities.Charset.UTF_8)
      .map(function(byte) { return ('0' + (byte & 255).toString(16)).slice(-2); }).join('');
    entry.data.diagnosticContext = { cycle: diagnosticCycle, reference: reference };
  }
  // Preserve the approved mentor-assisted journey without inventing answers.
  if (!entry.data.testResponse) {
    var checkIn = findLatestCheckInForStudentCycle_(ss, data.matricula, entry.data.operationalCycle, timing);
    entry.data.assistedExploration = Boolean(checkIn && String(checkIn.modalidad).toLowerCase() === 'presencial' && String(checkIn.pretestresumen || '').trim());
  }
  return { entry: entry.data, catalog: { prioritarias: getGoalsCatalogData(ss) }, snapshot: goalExplorationState_(ss, 'readGoalExplorationState', data) };
}
