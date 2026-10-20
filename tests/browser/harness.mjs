import { spawn } from 'node:child_process';
import { isAbsolute, join, posix, relative, resolve, sep } from 'node:path';

export function isPrivateRoute(route) {
  return typeof route === 'string' && /^\/(?:mis-estudios|api)(?:\/|$)/i.test(route);
}

// Pure request mapping: canonicalize for deny/audit before allowing any I/O.
export function resolveRequestTarget(requestUrl, dist, { allowStudyLanding = false } = {}) {
  if (typeof requestUrl !== 'string' || !requestUrl.startsWith('/') || requestUrl.startsWith('//')) {
    return { route: null, status: 400 };
  }
  const rawPath = requestUrl.split(/[?#]/, 1)[0];
  let decoded = rawPath, unsafe = false;
  try {
    for (let depth = 0; depth < 4; depth++) {
      unsafe ||= /%2f|%5c|\\|(?:^|\/)\.{1,2}(?:\/|$)/i.test(decoded);
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
      if (depth === 3 && /%[\da-f]{2}/i.test(decoded)) return { route: null, status: 400 };
    }
  } catch { return { route: null, status: 400 }; }
  const route = posix.normalize(decoded.replaceAll('\\', '/').replace(/\/+/g, '/'));
  if (/[\x00-\x1f\x7f]/.test(route)) return { route: null, status: 400 };
  const studyLanding = allowStudyLanding === true && route === '/mis-estudios/';
  if ((isPrivateRoute(route) && !studyLanding) || unsafe || route !== decoded) return { route, status: 403 };
  if (route === '/__cefem-tests__/') return { route, status: 200, kind: 'fixture' };
  if (route === '/__cefem-tests__/appointments.js') return { route, status: 200, kind: 'script' };
  if (route === '/__cefem-tests__/shell/') return { route, status: 200, kind: 'shell-fixture' };
  if (route === '/__cefem-tests__/shell.js') return { route, status: 200, kind: 'shell-script' };
  const publicFiles = new Map([
    ['/', 'index.html'], ['/turnos/', 'turnos/index.html'],
    ['/contacto/', 'contacto/index.html'], ['/entrevistas-medicas/', 'entrevistas-medicas/index.html'],
    ['/especialidades/', 'especialidades/index.html'], ['/blog/', 'blog/index.html'], ['/blog/2/', 'blog/2/index.html'],
    ['/blog/pediatria/beneficios-lactancia-materna/', 'blog/pediatria/beneficios-lactancia-materna/index.html'],
    ['/categorias/pediatria/', 'categorias/pediatria/index.html'], ['/mis-estudios/', 'mis-estudios/index.html'],
    ...['legal', 'legal/privacidad', 'legal/terminos-y-condiciones', 'nutricion', 'pediatria', 'traumatologia', 'ginecologia', 'ginecologia-obstetricia', 'ecografias-las-rosas', 'ecografias-abdominales-las-rosas', 'ecografias-doppler-embarazo-las-rosas', 'ecografias-partes-blandas-lesiones-deportivas', 'cirugia-vascular-varices-las-rosas', 'urologia', 'clinica-medica', 'depilacion-definitiva', 'blog/urologia/prevencion-cancer-prostata', 'blog/como-sacar-turno', 'blog/controles-pediatricos', 'blog/doppler-embarazo-cuando-hacerlo', 'blog/octubre-rosa'].map(slug => [`/${slug}/`, `${slug}/index.html`]),
  ]);
  if (publicFiles.has(route)) return { route, status: 200, file: join(dist, publicFiles.get(route)) };
  if (route.startsWith('/_astro/')) {
    const assetRoot = resolve(dist, '_astro');
    const file = resolve(assetRoot, route.slice('/_astro/'.length));
    const within = relative(assetRoot, file);
    if (!within || within === '..' || within.startsWith('..' + sep) || isAbsolute(within) || within.includes(':')) {
      return { route, status: 403 };
    }
    return { route, status: 200, file };
  }
  return { route, status: 404 };
}

// Resolve/reject only after close. If termination cannot be confirmed within the
// hard deadline, fail explicitly with terminationConfirmed=false (retain profile).
export function runChild(binary, args, {
  spawnChild = spawn, signal, timeoutMs = 45000, maxOutputBytes = 2_000_000,
  terminateGraceMs = 1000, killGraceMs = 2000,
} = {}) {
  return new Promise((resolveResult, reject) => {
    let child, settled = false, stopping = false, failure;
    let timeout, escalation, deadline;
    let stdoutBytes = 0, stdout = [], stderr = Buffer.alloc(0);
    const abortError = () => Object.assign(new Error('Ejecución cancelada.', { cause: signal?.reason }),
      { name: 'AbortError', code: 'ABORT_ERR' });
    const finish = (error, terminationConfirmed = true) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout); clearTimeout(escalation); clearTimeout(deadline);
      signal?.removeEventListener('abort', onAbort);
      if (error) reject(Object.assign(error, { terminationConfirmed }));
      else resolveResult(Buffer.concat(stdout).toString('utf8'));
    };
    const kill = signalName => {
      try { child.kill(signalName); } catch (error) { failure ||= error; }
    };
    const stop = error => {
      if (settled || stopping) return;
      failure ||= error;
      stopping = true;
      clearTimeout(timeout);
      escalation = setTimeout(() => {
        deadline = setTimeout(() => {
          const error = Object.assign(new Error('No se confirmó el cierre del proceso; se conserva el perfil temporal.', { cause: failure }),
            { code: 'ERR_CHILD_TERMINATION_UNCONFIRMED' });
          child.stdout?.destroy(); child.stderr?.destroy(); child.unref();
          finish(error, false);
        }, killGraceMs);
        kill('SIGKILL');
      }, terminateGraceMs);
      kill('SIGTERM');
    };
    const onAbort = () => stop(abortError());
    for (const value of [timeoutMs, maxOutputBytes, terminateGraceMs, killGraceMs]) {
      if (!Number.isSafeInteger(value) || value <= 0) {
        finish(new TypeError('Los límites del proceso deben ser enteros positivos.')); return;
      }
    }
    if (signal?.aborted) { finish(abortError()); return; }
    try {
      child = spawnChild(binary, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    } catch (error) { finish(error); return; }
    child.once('close', (code, exitSignal) => {
      finish(failure || (code === 0 ? null : new Error(`Chrome terminó con código ${code}, señal ${exitSignal || 'ninguna'}. ${stderr.toString('utf8')}`)));
    });
    child.on('error', error => stop(error));
    child.stdout.on('data', data => {
      if (stopping || settled) return;
      const bytes = Buffer.from(data);
      stdoutBytes += bytes.length;
      if (stdoutBytes > maxOutputBytes) {
        stdout = [];
        stop(Object.assign(new Error('La salida de Chrome superó el límite de la prueba.'), { code: 'ERR_CHILD_STDOUT_LIMIT' }));
      } else stdout.push(bytes);
    });
    child.stderr.on('data', data => { stderr = Buffer.concat([stderr, Buffer.from(data)]).subarray(-4000); });
    timeout = setTimeout(() => stop(Object.assign(new Error('El proceso excedió el tiempo límite.'), { code: 'ERR_CHILD_TIMEOUT' })), timeoutMs);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}
