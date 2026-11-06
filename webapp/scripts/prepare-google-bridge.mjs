import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export function integrateGoogleBridge(baseline) {
  const actions = "const SERVICE_ACTIONS = [";
  const dispatch = 'function dispatchServiceAction_(ss, action, data, timing) {';
  if (baseline.includes("'commitGoalExplorationState'") || baseline.split(actions).length !== 2 || baseline.split(dispatch).length !== 2) throw new Error('Unexpected Google baseline');
  return baseline.replace(actions, `${actions}\n  'getGoalExplorationContext',\n  'readGoalExplorationState',\n  'commitGoalExplorationState',`)
    .replace(dispatch, `${dispatch}\n  if (action === 'getGoalExplorationContext') return jsonResponse_({ status: 'success', data: getGoalExplorationContext_(ss, data, timing) });\n  if (action === 'readGoalExplorationState' || action === 'commitGoalExplorationState') return jsonResponse_({ status: 'success', data: goalExplorationState_(ss, action, data) });`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [source, destination] = process.argv.slice(2);
  if (!source || !destination) throw new Error('Supply approved baseline directory and NEW release directory');
  mkdirSync(destination, { recursive: false });
  const base = readFileSync(resolve(source, 'NaviEngine.js'), 'utf8');
  if (createHash('sha256').update(base).digest('hex') !== '7118349fe452a098eb1995e996819ade623a690909b5373744c05b2853a7b5e9') throw new Error('Production66 baseline changed');
  writeFileSync(resolve(destination, 'NaviEngine.js'), integrateGoogleBridge(base));
  writeFileSync(resolve(destination, 'GoalExplorationBridge.js'), readFileSync(new URL('../google-apps-script/GoalExplorationBridge.gs', import.meta.url)));
  writeFileSync(resolve(destination, 'appsscript.json'), readFileSync(resolve(source, 'appsscript.json')));
  writeFileSync(resolve(destination, '.clasp.json'), readFileSync(resolve(source, '.clasp.json')));
  writeFileSync(resolve(destination, '.claspignore'), '**/**\n!NaviEngine.js\n!GoalExplorationBridge.js\n!appsscript.json\n');
  console.log('Prepared selective Google bridge over exact production66; manifest and prior functions preserved.');
}
