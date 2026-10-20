import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { isPrivateRoute, resolveRequestTarget, runChild } from './harness.mjs';

// Synthetic strings only: never read dist, the private portal, or an HTTP endpoint.
const dist = resolve('synthetic-dist-never-created');

test('asset traversal is denied and audited as its canonical private route', () => {
  const target = resolveRequestTarget('/_astro/%2e%2e%2fmis-estudios/index.html', dist);
  assert.equal(target.status, 403, 'encoded traversal must not grant a dist file');
  assert.equal(target.route, '/mis-estudios/index.html');
  assert.equal(target.file, undefined);
});

test('legales, fichas médicas y las muestras SEO son permisos públicos exactos', () => {
  const slugs = ['legal', 'legal/privacidad', 'legal/terminos-y-condiciones', 'nutricion', 'pediatria', 'traumatologia', 'ginecologia', 'ginecologia-obstetricia', 'ecografias-las-rosas', 'ecografias-abdominales-las-rosas', 'ecografias-doppler-embarazo-las-rosas', 'ecografias-partes-blandas-lesiones-deportivas', 'cirugia-vascular-varices-las-rosas', 'urologia', 'clinica-medica', 'depilacion-definitiva', 'blog/urologia/prevencion-cancer-prostata', 'blog/como-sacar-turno', 'blog/controles-pediatricos', 'blog/doppler-embarazo-cuando-hacerlo', 'blog/octubre-rosa'];
  for (const slug of slugs) assert.equal(resolveRequestTarget(`/${slug}/`, dist).file, resolve(dist, `${slug}/index.html`), slug);
  for (const path of ['/urologia/index.html', '/clinica-medica/../api/login', '/legal/%2e%2e/mis-estudios/', '/nutricion//', '/blog/urologia/no-autorizado/']) assert.notEqual(resolveRequestTarget(path, dist).status, 200, path);
});

test('las familias públicas y el acceso estático a estudios tienen permisos separados del backend', () => {
  for (const [route, file] of [
    ['/especialidades/', 'especialidades/index.html'], ['/blog/', 'blog/index.html'], ['/blog/2/', 'blog/2/index.html'],
    ['/blog/pediatria/beneficios-lactancia-materna/', 'blog/pediatria/beneficios-lactancia-materna/index.html'],
    ['/categorias/pediatria/', 'categorias/pediatria/index.html'],
  ]) assert.equal(resolveRequestTarget(route, dist).file, resolve(dist, file), route);
  assert.equal(resolveRequestTarget('/mis-estudios/', dist).status, 403);
  assert.equal(resolveRequestTarget('/mis-estudios/', dist, { allowStudyLanding: true }).file, resolve(dist, 'mis-estudios/index.html'));
  for (const route of ['/mis-estudios/login', '/mis-estudios/index.html', '/api/login', '/_astro/../mis-estudios/', '/blog/%2e%2e/mis-estudios/']) {
    const target = resolveRequestTarget(route, dist, { allowStudyLanding: true });
    assert.notEqual(target.status, 200, route);
    assert.equal(target.file, undefined, route);
  }
});

test('el fixture de pilotos solo habilita sus páginas públicas exactas', () => {
  for (const [route, file] of [['/', 'index.html'], ['/contacto/', 'contacto/index.html'], ['/%63ontacto/', 'contacto/index.html'], ['/entrevistas-medicas/', 'entrevistas-medicas/index.html']]) {
    const target = resolveRequestTarget(route, dist);
    assert.equal(target.status, 200, route);
    assert.equal(target.file, resolve(dist, file));
  }
  assert.equal(resolveRequestTarget('/__cefem-tests__/shell/', dist).kind, 'shell-fixture');
  assert.equal(resolveRequestTarget('/__cefem-tests__/shell.js', dist).kind, 'shell-script');
  for (const route of ['/contacto/index.html', '/entrevistas-medicas/index.html', '/contacto/../mis-estudios/', '/contacto//', '/blog/unreviewed/']) {
    const target = resolveRequestTarget(route, dist);
    assert.notEqual(target.status, 200, route);
    assert.equal(target.file, undefined);
  }
});

test('stdout overflow cannot settle before owned child close; escalates SIGTERM to SIGKILL', { timeout: 5000 }, async () => {
  let child, realKill, closed = false, settled = false;
  let observeTerm;
  const term = new Promise(done => { observeTerm = done; });
  const signals = [];
  const result = runChild(process.execPath, ['-e', "process.stdout.write('x'.repeat(2_100_000)); setInterval(() => {}, 1000)"], {
    timeoutMs: 3000, terminateGraceMs: 50, killGraceMs: 500,
    spawnChild(binary, args, options) {
      child = spawn(binary, args, options);
      realKill = child.kill.bind(child);
      child.once('close', () => { closed = true; });
      // Deterministically withhold SIGTERM delivery, including on Windows.
      child.kill = (signal = 'SIGTERM') => {
        signals.push(signal);
        if (signal === 'SIGTERM') { observeTerm(); return true; }
        return realKill(signal);
      };
      return child;
    },
  }).then(value => ({ value }), error => ({ error })).finally(() => { settled = true; });
  try {
    await term;
    await nextTurn();
    assert.equal(closed, false, 'gate keeps the actual Node child alive');
    assert.equal(settled, false, 'profile cleanup must not run while the child is alive');
    const outcome = await result;
    assert.equal(closed, true);
    assert.match(outcome.error?.message || '', /salida.*límite/);
    assert.deepEqual(signals, ['SIGTERM', 'SIGKILL']);
  } finally {
    if (child && !closed) { const close = once(child, 'close'); realKill('SIGKILL'); await close; }
    await result;
  }
});

test('canonical private identities cover decoded separators, backslashes and repeated encoding', () => {
  for (const [url, route] of [
    ['/_astro/../mis-estudios/index.html', '/mis-estudios/index.html'],
    ['/_astro/%2E%2E%2Fapi/private', '/api/private'],
    ['/_astro/%2e%2e%5cmis-estudios/index.html', '/mis-estudios/index.html'],
    ['/_astro/..\\api/private', '/api/private'],
    ['/_astro/%252e%252e%252fmis-estudios/index.html', '/mis-estudios/index.html'],
    ['/MIS-ESTUDIOS/index.html', '/MIS-ESTUDIOS/index.html'],
    ['/api', '/api'],
  ]) {
    const target = resolveRequestTarget(url, dist);
    assert.equal(target.status, 403, url);
    assert.equal(target.route, route, url);
    assert.equal(isPrivateRoute(target.route), true, url);
    assert.equal(target.file, undefined, url);
  }
  assert.equal(isPrivateRoute('/api-public/'), false);
  assert.equal(isPrivateRoute(null), false);
});

test('only contained asset files and exact fixture/turnos routes are allowlisted', () => {
  for (const url of ['/_astro/main.js', '/_astro/fonts/font.woff2?v=1']) {
    const target = resolveRequestTarget(url, dist);
    assert.equal(target.status, 200, url);
    assert.ok(target.file.startsWith(resolve(dist, '_astro') + sep));
  }
  assert.equal(resolveRequestTarget('/turnos/', dist).file, resolve(dist, 'turnos/index.html'));
  assert.equal(resolveRequestTarget('/__cefem-tests__/', dist).kind, 'fixture');
  assert.equal(resolveRequestTarget('/__cefem-tests__/appointments.js', dist).kind, 'script');
  for (const url of ['/_astro/../public.txt', '/_astro/%2e%2e%2f_astro-sibling/file.js',
    '/_astro/nested%2ffile.js', '/_astro/nested%5cfile.js', '/_astro//file.js',
    '/_astro/', '/_astro/%2e/file.js', '/_astro/C:/file.js', '/_astro/%00file.js',
    '/_astro/%zz', '/_astro/%2525252525252ffile.js', '/unknown/', '/turnos/index.html',
    '//example.invalid/_astro/main.js', 'https://example.invalid/_astro/main.js']) {
    const target = resolveRequestTarget(url, dist);
    assert.notEqual(target.status, 200, url);
    assert.equal(target.file, undefined, url);
  }
});
