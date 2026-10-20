import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { isPrivateRoute, resolveRequestTarget, runChild } from './harness.mjs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appointmentLinks } from '../../src/data/appointments.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = ['required-fields', 'encoded-draft-retains-inputs', 'edited-draft-invalidated',
  'past-date-rejected', 'clipboard-copy', 'clipboard-denied', 'native-whatsapp-handoff',
  'specialty-prefill-allowlist', 'no-javascript-contact'];

async function chromeBinary() {
  const candidates = process.env.CHROME_BIN ? [process.env.CHROME_BIN] : [
    join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
    join(process.env.LOCALAPPDATA || 'C:/Users/Default/AppData/Local', 'Google/Chrome/Application/chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try the next installed browser. */ }
  }
  throw new Error('Se necesita Chrome/Chromium/Edge instalado. Indicá su ejecutable en CHROME_BIN. No se omiten pruebas por falta de navegador.');
}

function dumpDOM(binary, profile, url, signal) {
  return runChild(binary, ['--headless', '--disable-background-networking', '--disable-sync',
    '--no-first-run', '--no-default-browser-check', '--no-proxy-server', '--window-size=1440,1000',
    `--user-data-dir=${profile}`, '--dump-dom', '--virtual-time-budget=30000', '--timeout=30000', url], { signal });
}

test('turnos: regresiones en Chromium real, sin solicitudes externas', { timeout: 60000 }, async t => {
  const binary = await chromeBinary();
  const dist = resolve(process.env.CEFEM_BROWSER_DIST || join(root, 'dist'));
  await access(join(dist, 'turnos/index.html'));
  const fixture = (await readFile(new URL('./fixture.html', import.meta.url), 'utf8'))
    .replace('__EXPECTED_CONTACT_JSON__', JSON.stringify(appointmentLinks).replace(/</g, '\\u003c'));
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
    '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.html': 'text/html' };
  const requested = [];
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'self'; base-uri 'none'; form-action 'self'");
    response.setHeader('Cache-Control', 'no-store');
    try {
      const target = resolveRequestTarget(request.url, dist);
      requested.push(target.route);
      if (target.status !== 200) { response.writeHead(target.status); response.end(); return; }
      if (target.kind === 'fixture') {
        response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(fixture); return;
      }
      const file = target.kind === 'script'
        ? fileURLToPath(new URL('./appointments.js', import.meta.url)) : target.file;
      const body = await readFile(file);
      response.setHeader('Content-Type', `${mime[extname(file)] || 'application/octet-stream'}${extname(file) === '.html' ? '; charset=utf-8' : ''}`);
      response.end(body);
    } catch {
      response.writeHead(404); response.end();
    }
  });
  const temporaryRoot = resolve(process.env.CEFEM_BROWSER_TMP_DIR || tmpdir());
  await mkdir(temporaryRoot, { recursive: true });
  const profile = await mkdtemp(join(temporaryRoot, 'cefem-chrome-'));
  let retainProfile = false;
  try {
    await new Promise((resolveListening, reject) => {
      server.once('error', reject); server.listen(0, '127.0.0.1', resolveListening);
    });
    const output = await dumpDOM(binary, profile, `http://127.0.0.1:${server.address().port}/__cefem-tests__/`, t.signal);
    const match = output.match(/<script id="cefem-browser-results" type="application\/json">([\s\S]*?)<\/script>/);
    assert.ok(match, 'Chrome debe devolver el informe real del fixture.');
    const report = JSON.parse(match[1]);
    assert.equal(report.status, 'complete', 'El navegador no terminó la suite; no se acepta una ejecución vacía.');
    assert.deepEqual(report.cases.map(item => item.id), cases, 'Deben ejecutarse todos los escenarios, sin duplicados ni omisiones.');
    assert.equal(requested.some(isPrivateRoute), false,
      'La prueba no debe acceder a Mis estudios ni a APIs privadas.');
    for (const result of report.cases) {
      await t.test(result.id, () => assert.equal(result.passed, true, result.error || result.id));
    }
  } catch (error) {
    retainProfile = error.terminationConfirmed === false;
    if (retainProfile) error.message += ` Perfil retenido: ${profile}`;
    throw error;
  } finally {
    server.closeAllConnections();
    if (server.listening) await new Promise(done => server.close(done));
    if (!retainProfile) await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  }
});
