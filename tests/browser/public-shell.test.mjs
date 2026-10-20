import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPrivateRoute, resolveRequestTarget, runChild } from './harness.mjs';
import { appointmentLinks } from '../../src/data/appointments.ts';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = ['responsive-public-shell', 'article-reading-seo', 'clinical-and-legal-interactions', 'lazy-video-real-dom', 'whatsapp-supplied-logo', 'october-campaign', 'mobile-menu', 'contact-channels', 'interview-modal', 'interview-archive', 'no-javascript-public-links'];

test('marco público: pilotos y regresión responsive en Chromium real', { timeout: 90000 }, async t => {
  const binaries = process.env.CHROME_BIN ? [process.env.CHROME_BIN] : [
    join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
    join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  let binary;
  for (const candidate of binaries) { try { await access(candidate); binary = candidate; break; } catch { /* Next installed browser. */ } }
  assert.ok(binary, 'Se necesita Chromium; no se omite la ejecución.');
  const dist = resolve(process.env.CEFEM_BROWSER_DIST || join(root, 'dist'));
  const fixture = (await readFile(new URL('./shell-fixture.html', import.meta.url), 'utf8')).replace('__EXPECTED_CONTACT_JSON__', JSON.stringify(appointmentLinks).replaceAll('<', '\\u003c'));
  const requested = [];
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.html': 'text/html' };
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'self'; base-uri 'none'; form-action 'self'");
    response.setHeader('Cache-Control', 'no-store');
    try {
      const target = resolveRequestTarget(request.url, dist, { allowStudyLanding: true });
      requested.push(target.route);
      if (target.status !== 200) { response.writeHead(target.status); response.end(); return; }
      if (target.kind === 'shell-fixture') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(fixture); return; }
      const file = target.kind === 'shell-script' ? fileURLToPath(new URL('./shell.js', import.meta.url)) : target.file;
      const body = await readFile(file);
      response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
      response.end(body);
    } catch { response.writeHead(404); response.end(); }
  });
  const temporaryRoot = resolve(process.env.CEFEM_BROWSER_TMP_DIR || tmpdir());
  await mkdir(temporaryRoot, { recursive: true });
  const profile = await mkdtemp(join(temporaryRoot, 'cefem-shell-chrome-'));
  let retainProfile = false;
  try {
    await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
    const width = Number(process.env.CEFEM_SHELL_WIDTH || 1440);
    assert.ok(Number.isSafeInteger(width) && width >= 320 && width <= 1920);
    const capture = process.env.CEFEM_SHELL_CAPTURE || '';
    assert.ok(['', 'contacto', 'entrevistas', 'home', 'turnos', 'especialidades', 'estudios', 'blog', 'articulo', 'categoria', 'prostata', 'nutricion', 'privacidad', 'octubre'].includes(capture));
    const url = `http://127.0.0.1:${server.address().port}/__cefem-tests__/shell/?capture=${capture}&width=${width}`;
    const args = ['--headless', '--disable-background-networking', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--no-proxy-server', `--window-size=${width},1000`, `--user-data-dir=${profile}`, '--dump-dom', '--virtual-time-budget=60000', '--timeout=60000'];
    if (process.env.CEFEM_SHELL_SCREENSHOT) args.push(`--screenshot=${resolve(process.env.CEFEM_SHELL_SCREENSHOT)}`);
    const output = await runChild(binary, [...args, url], { signal: t.signal, timeoutMs: 80000 });
    const match = output.match(/<script id="cefem-shell-results" type="application\/json">([\s\S]*?)<\/script>/);
    assert.ok(match, 'Chromium debe devolver un informe real.');
    const report = JSON.parse(match[1]);
    assert.equal(report.status, 'complete', JSON.stringify(report));
    assert.deepEqual(report.cases.map(result => result.id), cases);
    assert.equal(report.captureError, undefined);
    assert.equal(requested.some(route => isPrivateRoute(route) && route !== '/mis-estudios/'), false, 'El fixture solo permite la portada estática de estudios; nunca backend, archivos ni APIs.');
    for (const result of report.cases) await t.test(result.id, () => assert.equal(result.passed, true, result.error || result.id));
    const pages = ['/', '/turnos/', '/contacto/', '/entrevistas-medicas/', '/especialidades/', '/mis-estudios/', '/blog/', '/blog/2/', '/blog/pediatria/beneficios-lactancia-materna/', '/categorias/pediatria/', '/legal/', '/legal/privacidad/', '/legal/terminos-y-condiciones/', '/nutricion/', '/pediatria/', '/traumatologia/', '/ginecologia/', '/ginecologia-obstetricia/', '/ecografias-las-rosas/', '/ecografias-abdominales-las-rosas/', '/ecografias-doppler-embarazo-las-rosas/', '/ecografias-partes-blandas-lesiones-deportivas/', '/cirugia-vascular-varices-las-rosas/', '/urologia/', '/clinica-medica/', '/depilacion-definitiva/', '/blog/urologia/prevencion-cancer-prostata/', '/blog/como-sacar-turno/', '/blog/controles-pediatricos/', '/blog/doppler-embarazo-cuando-hacerlo/', '/blog/octubre-rosa/'];
    assert.deepEqual(report.viewports, pages.flatMap(path => [320, 390, 768, 1024, 1101, 1440, 1920].map(width => ({ path, width }))), 'Deben completarse exactamente todos los pares de página y viewport.');
    if (process.env.CEFEM_SHELL_SCREENSHOT) await access(resolve(process.env.CEFEM_SHELL_SCREENSHOT));
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
