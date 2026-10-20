const output = document.querySelector('#cefem-browser-results');
const expected = JSON.parse(document.querySelector('#expected-contact').textContent);
const results = [];
const pause = () => new Promise(resolve => setTimeout(resolve, 0));
function check(value, message) { if (!value) throw new Error(message); }

async function page({ javascript = true, query = '' } = {}) {
  const previous = document.querySelector('#app');
  const frame = document.createElement('iframe');
  frame.id = 'app'; frame.title = 'Formulario bajo prueba'; frame.width = '1440'; frame.height = '1000';
  // No popups/top-level navigation; the parent CSP additionally restricts frame destinations to localhost.
  frame.setAttribute('sandbox', `allow-same-origin allow-forms${javascript ? ' allow-scripts' : ''}`);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('La página de turnos no terminó de cargar.')), 10000);
    frame.onload = () => {
      if (frame.contentWindow.location.pathname !== '/turnos/') return;
      clearTimeout(timer); resolve();
    };
    frame.src = `/turnos/${query}`;
    previous.replaceWith(frame);
  });
  const w = frame.contentWindow, d = frame.contentDocument;
  const f = d.querySelector('[data-appointment-form]');
  check(f, 'Debe cargarse el formulario compilado real.');
  check(d.querySelector('[data-appointment-fields]').disabled === !javascript,
    javascript ? 'El módulo real no habilitó el formulario.' : 'Sin JavaScript los campos deben permanecer deshabilitados.');
  return { w, d, f };
}

function fill({ d, f }) {
  const values = { name: 'Prueba Ñúñez & Ana + José', phone: '0000000000', specialty: 'pediatrics',
    preferredDate: d.querySelector('[name=preferredDate]').min, comment: 'Después de las 16 h. #prueba & + administración' };
  for (const [name, value] of Object.entries(values)) f.elements.namedItem(name).value = value;
  return values;
}
function cancelReady({ f }) {
  const events = [];
  f.addEventListener('cefem:appointment-ready', event => {
    events.push(event); event.preventDefault();
  });
  return events;
}
function submit({ f }) { f.requestSubmit(f.querySelector('[type=submit]')); }
async function run(id, body) {
  try { await body(); results.push({ id, passed: true }); }
  catch (error) { results.push({ id, passed: false, error: String(error.message || error) }); }
  output.textContent = JSON.stringify({ status: 'running', cases: results });
}

await run('required-fields', async () => {
  const app = await page(); const events = cancelReady(app); submit(app);
  check([...app.d.querySelectorAll('[aria-invalid=true]')].map(e => e.name).join(',') === 'name,phone,specialty',
    'Se deben marcar exactamente los tres campos obligatorios.');
  check(app.d.activeElement.name === 'name', 'El primer campo inválido debe recibir foco.');
  check(!events.length && app.d.querySelector('[data-message-fallback]').hidden, 'No debe prepararse un mensaje inválido.');
});

await run('encoded-draft-retains-inputs', async () => {
  const app = await page(); const values = fill(app); const events = cancelReady(app); submit(app);
  const { d, f } = app;
  check(events.length === 1 && events[0].detail === null, 'El evento de integración no debe transportar datos personales.');
  const url = new URL(d.querySelector('[data-whatsapp-retry]').href);
  const message = d.querySelector('[data-prepared-message]').value;
  check(url.origin + url.pathname === expected.whatsapp, 'El destino debe ser la recepción configurada.');
  check(url.searchParams.get('text') === message && message.includes(values.name) && message.includes(values.comment),
    'El mensaje debe conservar Unicode, signos y el texto completo.');
  check(Object.entries(values).every(([name, value]) => f.elements.namedItem(name).value === value), 'Los campos no deben borrarse.');
  check(!d.querySelector('[data-message-fallback]').hidden, 'Debe quedar una alternativa a la vista para continuar.');
  check(/recepción confirma/.test(d.querySelector('[data-form-status]').textContent), 'Preparar el mensaje no confirma el turno.');
});

await run('edited-draft-invalidated', async () => {
  const app = await page(); fill(app); cancelReady(app); submit(app);
  const field = app.f.elements.namedItem('comment');
  field.value = 'Nueva preferencia administrativa'; field.dispatchEvent(new app.w.Event('input', { bubbles: true }));
  check(app.d.querySelector('[data-message-fallback]').hidden, 'Un borrador editado no debe continuar en pantalla.');
  check(!app.d.querySelector('[data-whatsapp-retry]').hasAttribute('href'), 'Se debe invalidar el enlace anterior.');
  check(app.d.querySelector('[data-prepared-message]').value === '', 'Se debe invalidar el texto anterior.');
});

await run('past-date-rejected', async () => {
  const app = await page(); fill(app); const events = cancelReady(app);
  app.f.elements.namedItem('preferredDate').value = '1900-01-01'; submit(app);
  check(app.d.querySelector('[name=preferredDate]').getAttribute('aria-invalid') === 'true', 'La fecha pasada debe marcarse inválida.');
  check(!events.length && app.d.querySelector('[data-message-fallback]').hidden, 'No debe continuarse con una fecha pasada.');
});

await run('clipboard-copy', async () => {
  const app = await page(); fill(app); cancelReady(app); submit(app); let copied;
  Object.defineProperty(app.w.navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied = text; } } });
  app.d.querySelector('[data-copy-message]').click(); await pause();
  check(copied === app.d.querySelector('[data-prepared-message]').value, 'La copia debe contener exactamente el borrador actual.');
  check(/Mensaje copiado/.test(app.d.querySelector('[data-copy-status]').textContent), 'Debe indicarse que se copió, no que se envió.');
});

await run('clipboard-denied', async () => {
  const app = await page(); fill(app); cancelReady(app); submit(app);
  Object.defineProperty(app.w.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Permiso denegado para la prueba'); } } });
  app.d.querySelector('[data-copy-message]').click(); await pause();
  const message = app.d.querySelector('[data-prepared-message]');
  check(app.d.activeElement === message && message.selectionStart === 0 && message.selectionEnd === message.value.length,
    'Si falla el portapapeles debe seleccionarse el mensaje para copia manual.');
  check(/No se pudo copiar/.test(app.d.querySelector('[data-copy-status]').textContent), 'El fallo debe explicarse sin perder el borrador.');
});

await run('native-whatsapp-handoff', async () => {
  const app = await page(); const values = fill(app); const attempts = [];
  check(app.w.navigation, 'La prueba requiere Navigation API para interceptar de forma segura el destino real.');
  app.w.navigation.addEventListener('navigate', event => {
    attempts.push({ url: event.destination.url, cancelable: event.cancelable });
    if (event.cancelable) event.preventDefault();
  });
  // Do NOT cancel cefem:appointment-ready: exercise the actual location.assign branch.
  submit(app); await pause();
  check(attempts.length === 1 && attempts[0].cancelable, 'Debe observarse y cancelarse la navegación nativa, sin enviar solicitudes externas.');
  const destination = new URL(attempts[0].url);
  check(destination.origin + destination.pathname === expected.whatsapp && destination.searchParams.get('text').includes(values.name),
    'La navegación nativa debe usar recepción y el mensaje codificado.');
  check(app.w.location.origin === location.origin, 'La prueba debe seguir local; nunca se debe abrir WhatsApp realmente.');
  check(!app.d.querySelector('[data-message-fallback]').hidden, 'Si la navegación no continúa debe conservarse el enlace alternativo.');
});

await run('specialty-prefill-allowlist', async () => {
  const accepted = await page({ query: '?especialidad=pediatrics' });
  check(accepted.f.elements.namedItem('specialty').value === 'pediatrics', 'Debe aceptarse una especialidad válida del catálogo.');
  const rejected = await page({ query: '?especialidad=not-in-catalog' });
  check(rejected.f.elements.namedItem('specialty').value === '', 'Una especialidad desconocida no debe inventarse ni seleccionarse.');
});

await run('no-javascript-contact', async () => {
  const { d, f } = await page({ javascript: false });
  check(f.method === 'post' && new URL(f.action).pathname === '/turnos/', 'El fallback no debe serializar datos personales por GET.');
  check([...d.querySelectorAll('noscript a')].some(a => a.href === expected.whatsapp), 'Debe existir WhatsApp directo sin JavaScript.');
  check([...d.querySelectorAll('noscript a')].some(a => a.href === expected.phone), 'Debe existir llamada directa sin JavaScript.');
  const notice = d.querySelector('noscript p');
  check(notice && getComputedStyle(notice).display !== 'none' && notice.getClientRects().length > 0, 'La explicación sin JavaScript debe mostrarse en pantalla.');
});

output.textContent = JSON.stringify({ status: 'complete', cases: results }).replace(/</g, '\\u003c');
