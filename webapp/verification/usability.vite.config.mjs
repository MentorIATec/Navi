// Loopback-only review, synthetic in-memory Sheets. No credentials or outbound transport.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createGoogleBridgeJourney } from '../api/_lib/testing/googleBridgeJourney.js';
import { selectionOptions } from '../api/_lib/goalSelectionOptions.js';
import { privateGoalGlobs, protectGoalSources } from './goalSourceProtection.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = readFileSync(new URL('../google-apps-script/NaviEngine.gs', import.meta.url), 'utf8');
const h = createGoogleBridgeJourney({ source });
const fixtureStudents = h.sheets.get('Students');
fixtureStudents.rows[1][fixtureStudents.rows[0].indexOf('Nombre')] = 'Ana (ejemplo ficticio)';
fixtureStudents.rows[1][fixtureStudents.rows[0].indexOf('NombrePreferido')] = 'Ana';
const seed = JSON.parse(readFileSync(new URL('../src/data/goalsCatalogSeed.json', import.meta.url), 'utf8'));
const run = (action, data = {}) => h.run(action, data).result;
run('saveTestResponse', { responseId: 'usability-test-0001', etapa: 'exploracion', modalidad: 'remoto', claridad_carrera: 3, desempeno_academico: 2, plan_practicas: 3, servicio_social: 3 });
const preview = { name: 'synthetic-usability', configureServer(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = new URL(req.url, 'http://127.0.0.1:5199');
    if (!url.pathname.startsWith('/api/')) return next();
    res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
    const send = data => res.end(JSON.stringify(data));
    try {
      if (url.pathname === '/api/auth/session') return send(run('resolveWorkspaceUser', { actor: h.actor }));
      if (url.pathname === '/api/mentor/dashboard') return send(run('getMentorDashboard', { actor: h.actor }));
      let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 16384) throw Error('Solicitud demasiado grande'); }
      const { action, data = {} } = JSON.parse(raw || '{}');
      if (data.matricula && data.matricula !== h.student) throw Error('Sólo se permite la identidad ficticia A12345678');
      if (action === 'getGoalSelectionOptions') {
        const entry = run('getStudentEntry').data;
        return send({ status: 'success', data: await selectionOptions({ matricula: h.student, operationalCycle: h.cycle }, { matricula: h.student },
          async () => ({ entry, catalog: { prioritarias: seed } }), 'synthetic-review-secret-00000000000000000') });
      }
      if (!['getStudentEntry', 'startStudentCheckIn', 'completeCheckInPreTest', 'saveGoalSelection', 'saveMentoringSession', 'startNewMentoringEncounter'].includes(action)) throw Error('Acción bloqueada en esta revisión');
      return send(run(action, { ...data, actor: h.actor }));
    } catch (error) { res.statusCode = 400; send({ status: 'error', message: error.message }); }
  });
} };
export default defineConfig({ root, plugins: [preview, protectGoalSources(), react(), tailwindcss()], server: {
  host: '127.0.0.1', port: 5199, strictPort: true,
  fs: { strict: true, allow: [root], deny: ['**/.env*', '**/.git/**', ...privateGoalGlobs] },
} });
