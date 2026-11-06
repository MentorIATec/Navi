// The exact production66 engine plus the additive bridge, on synthetic RAM only.
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createV55RequestMap } from './v55RequestMap.js';
import { integrateGoogleBridge } from '../../../scripts/prepare-google-bridge.mjs';
import seed from '../../../src/data/goalsCatalogSeed.json' with { type: 'json' };
import { integrateR2GoalRead } from '../../../scripts/prepare-r2-goal-read.mjs';

export const googleReleaseSource = integrateGoogleBridge(readFileSync(new URL('../../../docs/plan-actualizacion-faro/rc1-local/maintenance-utilities/google-apps-script/Code.gs', import.meta.url), 'utf8'))
  + '\n' + readFileSync(new URL('../../../google-apps-script/GoalExplorationBridge.gs', import.meta.url), 'utf8');

export const googleR2ReadSource = integrateR2GoalRead(googleReleaseSource) + '\n'
  + readFileSync(new URL('../../../google-apps-script/GoalSelectionRead.gs', import.meta.url), 'utf8');

export function createGoogleBridgeJourney({ r2Read = false, source } = {}) {
  const h=createV55RequestMap({source:source || (r2Read ? googleR2ReadSource : googleReleaseSource),rowsPerSheet:0,activeVersion:false});
  const destination='synthetic-bridge-journey-0001';
  h.props.set('NAVI_DATA_SPREADSHEET_ID',destination);
  for(const name of ['Responses','CheckIns','GoalSelections','Sesiones'])h.sheets.get(name).rows.splice(1);
  function makeSheet(rows){const sheet={rows,getLastRow:()=>rows.length,getLastColumn:()=>rows[0]?.length||0,getRange:(r,c,n=1,w=1)=>({getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),setValues:values=>values.forEach((row,i)=>{rows[r-1+i]||=[];row.forEach((v,j)=>{rows[r-1+i][c-1+j]=v;});})}),appendRow:row=>rows.push([...row])};sheet.getDataRange=()=>sheet.getRange(1,1,rows.length,rows[0].length);return sheet;}
  h.sheets.set('Config',makeSheet([['Key','Value','Description'],['preserve','original','untouched']]));
  const headers=Object.keys(seed[0]);h.sheets.set('GoalsCatalog',makeSheet([headers,...seed.map(row=>headers.map(k=>row[k]))]));
  for(const sheet of h.sheets.values()){
    const original=sheet.getRange;sheet.getRange=(r,c,n=1,w=1)=>{const range=original(r,c,n,w);return{...range,setValue:v=>range.setValues([[v]]),createTextFinder:value=>({sensitive:true,regex:false,matchEntireCell(){return this;},matchCase(v){this.sensitive=v;return this;},useRegularExpression(v){this.regex=v;return this;},findAll(){return sheet.rows.slice(r-1,r-1+n).flatMap((row,i)=>{const text=String(row[c-1]);const match=this.regex?new RegExp(value,this.sensitive?'':'i').test(text):(this.sensitive?text===String(value):text.toLowerCase()===String(value).toLowerCase());return match?[{getRow:()=>r+i}]:[];});}})};};
    sheet.getParent=()=>({getId:()=>destination});
  }
  const staff=h.sheets.get('Staff');for(const [key,v] of Object.entries({Email:'mentor@example.invalid',GoogleSubject:'synthetic-mentor',Rol:'mentor',Activo:'Si'}))staff.rows[1][staff.rows[0].indexOf(key)]=v;
  const tools={uuid:randomUUID,digest:(_a,v)=>Array.from(createHash('sha256').update(v).digest())};
  h.sheets.get('Students').bridgeTools=tools;
  h.evaluate(`auditSpreadsheet.getId=()=>${JSON.stringify(destination)};SpreadsheetApp.openById=id=>{if(id!==${JSON.stringify(destination)})throw Error('wrong destination');return auditSpreadsheet;};const bridgeTools=auditSpreadsheet.getSheetByName('Students').bridgeTools;Utilities.getUuid=bridgeTools.uuid;Utilities.computeDigest=bridgeTools.digest;Utilities.DigestAlgorithm={SHA_256:'sha256'};Utilities.Charset={UTF_8:'utf8'};`);
  delete h.sheets.get('Students').bridgeTools;
  return {...h,cycle:h.props.get('ACTIVE_OPERATIONAL_CYCLE'),actor:{sub:'synthetic-mentor',email:'mentor@example.invalid'},counts:()=>Object.fromEntries(['CheckIns','Responses','GoalSelections','Sesiones','Config'].map(n=>[n,h.sheets.get(n).rows.length-1]))};
}
