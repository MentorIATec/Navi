const DEFAULT_POLICY = Object.freeze({
  access: 'server',
  route: 'action',
  kind: 'read',
  timeoutClass: 'interactive',
  clientTimeoutMs: 25000,
  gatewayTimeoutMs: 20000,
  idempotencyKey: '',
  sheets: [],
});

function policy(overrides = {}) {
  return Object.freeze({ ...DEFAULT_POLICY, ...overrides });
}

/**
 * Contrato operativo compartido por el navegador y el gateway de Vercel.
 * No contiene secretos ni sustituye la autorización que aplica api/action.js.
 */
export const ACTION_POLICIES = Object.freeze({
  findStudent: policy({ access: 'public', sheets: ['Students', 'DirectoryStudents', 'Staff'] }),
  getStudentEntry: policy({ access: 'public', sheets: ['Students', 'DirectoryStudents', 'Staff', 'StudentPreferences', 'CheckIns', 'Responses', 'GoalSelections', 'Sesiones'] }),
  startStudentCheckIn: policy({ access: 'public', kind: 'write', idempotencyKey: 'requestId', sheets: ['Students', 'DirectoryStudents', 'Staff', 'StudentPreferences', 'CheckIns', 'Responses', 'GoalSelections', 'Sesiones'] }),
  getGoalSelectionOptions: policy({ access: 'student', route: 'goals', clientTimeoutMs: 45000, sheets: ['Responses', 'GoalsCatalog', 'Config'] }),
  getMetas: policy({ access: 'server', sheets: [] }),
  getGoalOptions: policy({ access: 'student', route: 'goals', clientTimeoutMs: 90000, sheets: ['Responses', 'GoalsCatalog', 'Config'] }),
  getGoalDetails: policy({ access: 'student', route: 'goals', clientTimeoutMs: 90000, sheets: ['Responses', 'GoalsCatalog', 'Config'] }),
  getGoalExplorationContext: policy({ access: 'server', route: 'internal', clientTimeoutMs: 45000, gatewayTimeoutMs: 35000, sheets: ['Responses', 'GoalsCatalog', 'Config'] }),
  readGoalExplorationState: policy({ access: 'server', route: 'internal', clientTimeoutMs: 45000, gatewayTimeoutMs: 35000, sheets: ['Config'] }),
  commitGoalExplorationState: policy({ access: 'server', route: 'internal', kind: 'write', clientTimeoutMs: 45000, gatewayTimeoutMs: 35000, idempotencyKey: 'commitId', sheets: ['Config'] }),
  getGoalsCatalog: policy({ access: 'admin', clientTimeoutMs: 45000, gatewayTimeoutMs: 20000, sheets: ['GoalsCatalog'] }),
  getOperationalTelemetry: policy({ access: 'admin', clientTimeoutMs: 45000, gatewayTimeoutMs: 35000, sheets: [] }),
  prepareDashboardReadModelPreview: policy({ access: 'admin', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'active-version-cycle', sheets: ['DirectoryStudents', 'Staff', 'StudentPreferences', 'CheckIns', 'Responses', 'GoalSelections', 'Sesiones'] }),
  getDashboardReadModelPreview: policy({ access: 'admin', clientTimeoutMs: 25000, gatewayTimeoutMs: 20000, sheets: ['Staff'] }),
  runDashboardReadModelEvaluation: policy({ access: 'admin', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'explicit-evaluation', sheets: ['DirectoryStudents', 'Staff', 'StudentPreferences', 'CheckIns', 'Responses', 'GoalSelections', 'Sesiones'] }),
  resolveWorkspaceUser: policy({ access: 'workspace', route: 'internal', sheets: ['Staff'] }),
  getMentorDashboard: policy({ access: 'workspace', route: 'internal', clientTimeoutMs: 30000, gatewayTimeoutMs: 25000, sheets: ['DirectoryStudents', 'Staff', 'StudentPreferences', 'CheckIns', 'Responses', 'GoalSelections', 'Sesiones'] }),

  saveStudentPreference: policy({ access: 'student', kind: 'write', idempotencyKey: 'matricula', sheets: ['StudentPreferences'] }),
  startNewMentoringEncounter: policy({ access: 'workspace', kind: 'write', idempotencyKey: 'requestId', sheets: ['CheckIns', 'Staff', 'DirectoryStudents'] }),
  registerCheckIn: policy({ access: 'student', kind: 'write', idempotencyKey: 'requestId', sheets: ['StudentPreferences', 'CheckIns'] }),
  completeCheckInPreTest: policy({ access: 'student', kind: 'write', idempotencyKey: 'checkInId', sheets: ['CheckIns'] }),
  saveTestResponse: policy({ access: 'student', kind: 'write', idempotencyKey: 'responseId', sheets: ['Responses'] }),
  getTestResponse: policy({ access: 'student', sheets: ['Responses'] }),
  saveGoalSelection: policy({ access: 'student', kind: 'write', idempotencyKey: 'selectionId', sheets: ['GoalSelections'] }),
  saveMentoringSession: policy({ access: 'workspace', kind: 'write', clientTimeoutMs: 45000, gatewayTimeoutMs: 20000, idempotencyKey: 'sessionId', sheets: ['Sesiones'] }),

  saveGoalsCatalog: policy({ access: 'admin', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'payload-replacement', sheets: ['GoalsCatalog'] }),
  saveMetasConfig: policy({ access: 'admin', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'payload-replacement', sheets: ['Config'] }),
  previewManagedDirectoryImport: policy({ access: 'admin', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, sheets: ['Config', 'Staff'] }),
  publishManagedDirectoryImport: policy({ access: 'admin', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'previewFingerprint', sheets: ['DirectoryVersions', 'DirectoryStudents'] }),
  rollbackDirectoryImport: policy({ access: 'admin', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'targetVersionId', sheets: ['DirectoryVersions', 'DirectoryStudents'] }),
  resetDemoStudentJourney: policy({ access: 'admin', kind: 'write', clientTimeoutMs: 45000, gatewayTimeoutMs: 20000, idempotencyKey: 'matricula', sheets: ['Responses', 'GoalSelections'] }),

  runSyntheticDirectoryLifecycle: policy({ access: 'operator', route: 'internal', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'runId', sheets: [] }),
  runSyntheticProductMigrationLifecycle: policy({ access: 'operator', route: 'internal', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'runId', sheets: [] }),
  publishApprovedLegacyProductMigrationScope: policy({ access: 'operator', route: 'internal', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'migrationId', sheets: [] }),
  rollbackApprovedLegacyProductMigration: policy({ access: 'operator', route: 'internal', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'migrationId', sheets: [] }),
  previewPilotDirectory: policy({ access: 'operator', route: 'internal', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, sheets: [] }),
  publishPilotDirectory: policy({ access: 'operator', route: 'internal', kind: 'write', timeoutClass: 'admin', clientTimeoutMs: 75000, gatewayTimeoutMs: 50000, idempotencyKey: 'previewFingerprint', sheets: [] }),
});

export function getActionPolicy(action) {
  return ACTION_POLICIES[String(action || '').trim()] || DEFAULT_POLICY;
}

export function getClientTimeoutMs(action) {
  return getActionPolicy(action).clientTimeoutMs;
}

export function getGatewayTimeoutMs(action) {
  return getActionPolicy(action).gatewayTimeoutMs;
}

export function isWriteAction(action) {
  return getActionPolicy(action).kind === 'write';
}
