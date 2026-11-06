// Selective local extension over the approved Google68 engine. No deployment.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const additions = [
  ['function getGoalExplorationContext_(ss, data, timing) {',
    'function getGoalExplorationContext_(ss, data, timing) {\n  if (data && data.r2Read === true) return getGoalSelectionContext_(ss, data, timing);'],
  ['function buildStudentLookupFast_(ss, data, timing) {',
    'function buildStudentLookupFast_(ss, data, timing, identityOnly) {'],
  ["  if (!student) return { student: null, mentor: null };\n\n  var productSnapshot = getStudentProductSnapshot_(ss, matricula, operationalCycle, timing);",
    "  if (!student) return { student: null, mentor: null };\n  // Internal R2 reader: admission above is identical; no product/progress read.\n  if (identityOnly === true) return { student: { matricula: matricula }, operationalCycle: operationalCycle };\n\n  var productSnapshot = getStudentProductSnapshot_(ss, matricula, operationalCycle, timing);"],
];

export function integrateR2GoalRead(source) {
  for (const [before, after] of additions) {
    if (source.split(before).length !== 2) throw new Error('Unexpected R2 Google read baseline');
    source = source.replace(before, after);
  }
  return source;
}

export function removeR2GoalRead(source) {
  for (const [before, after] of [...additions].reverse()) {
    if (source.split(after).length !== 2) throw new Error('Unexpected R2 Google read candidate');
    source = source.replace(after, before);
  }
  return source;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [baselineDirectory, destination] = process.argv.slice(2);
  if (!baselineDirectory || !destination) throw new Error('Supply verified Google68 directory and NEW local output directory');
  const original = ['NaviEngine.js', 'GoalExplorationBridge.js']
    .map(name => readFileSync(resolve(baselineDirectory, name), 'utf8')).join('\n');
  const sha = value => createHash('sha256').update(value).digest('hex');
  if (sha(original) !== 'ceadf3d05657530d2c4057ec9acc08d74fe4929a711d981f31dc08555b38e02c') throw new Error('Verified Google68 baseline changed');
  const modified = integrateR2GoalRead(original);
  const boundary = '\n// Shared, bounded technical state in the EXISTING Config sheet.';
  if (modified.split(boundary).length !== 2 || removeR2GoalRead(modified) !== original) throw new Error('Nonselective Google diff');
  const offset = modified.indexOf(boundary);
  const files = {
    'NaviEngine.js': modified.slice(0, offset),
    'GoalExplorationBridge.js': modified.slice(offset + 1),
    'GoalSelectionRead.js': readFileSync(new URL('../google-apps-script/GoalSelectionRead.gs', import.meta.url), 'utf8'),
    'appsscript.json': readFileSync(resolve(baselineDirectory, 'appsscript.json'), 'utf8'),
  };
  mkdirSync(destination, { recursive: false });
  for (const [name, content] of Object.entries(files)) writeFileSync(resolve(destination, name), content);
  writeFileSync(resolve(destination, 'manifest-local.json'), JSON.stringify({
    localOnly: true, baseline: 'Google68', baselineHash: sha(original),
    files: Object.fromEntries(Object.entries(files).map(([name, content]) => [name, sha(content)])),
    existingWritersPreserved: true, createdServices: false, deployed: false,
  }, null, 2) + '\n');
  console.log('Prepared local selective R2 read. No clasp configuration, remote calls or deployment.');
}
