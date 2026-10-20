const frame = document.querySelector('#app');
const output = document.querySelector('#cefem-shell-results');
const expected = JSON.parse(document.querySelector('#expected-contact').textContent);
const report = { status: 'running', cases: [], viewports: [] };
const check = (condition, message) => { if (!condition) throw new Error(message); };
const pause = () => new Promise(done => setTimeout(done, 40));
let sequence = 0;
async function load(path, width = 1440, scripts = true) {
  frame.width = String(width);
  if (scripts) frame.removeAttribute('sandbox'); else frame.setAttribute('sandbox', 'allow-same-origin');
  await new Promise((done, reject) => {
    frame.onload = done;
    frame.onerror = () => reject(new Error('No cargó el documento de prueba.'));
    frame.src = `${path}?cefem-shell-test=${++sequence}`;
  });
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  await pause();
  return doc;
}
async function scenario(id, action) {
  try { await action(); report.cases.push({ id, passed: true }); }
  catch (error) { report.cases.push({ id, passed: false, error: String(error.stack || error) }); }
  output.textContent = JSON.stringify(report);
}
await scenario('responsive-public-shell', async () => {
  for (const path of ['/', '/turnos/', '/contacto/', '/entrevistas-medicas/', '/especialidades/', '/mis-estudios/', '/blog/', '/blog/2/', '/blog/pediatria/beneficios-lactancia-materna/', '/categorias/pediatria/', '/legal/', '/legal/privacidad/', '/legal/terminos-y-condiciones/', '/nutricion/', '/pediatria/', '/traumatologia/', '/ginecologia/', '/ginecologia-obstetricia/', '/ecografias-las-rosas/', '/ecografias-abdominales-las-rosas/', '/ecografias-doppler-embarazo-las-rosas/', '/ecografias-partes-blandas-lesiones-deportivas/', '/cirugia-vascular-varices-las-rosas/', '/urologia/', '/clinica-medica/', '/depilacion-definitiva/', '/blog/urologia/prevencion-cancer-prostata/', '/blog/como-sacar-turno/', '/blog/controles-pediatricos/', '/blog/doppler-embarazo-cuando-hacerlo/', '/blog/octubre-rosa/']) {
    for (const width of [320, 390, 768, 1024, 1101, 1440, 1920]) {
      const doc = await load(path, width);
      const win = doc.defaultView;
      check(doc.body.classList.contains('institutional-surface'), `${path}: falta el marco institucional.`);
      check(win.getComputedStyle(doc.body).display !== 'none' && doc.body.getBoundingClientRect().height > 0, `${path}: el cuerpo no se renderiza.`);
      check(doc.documentElement.scrollWidth <= width + 1, `${path} ${width}: desbordamiento ${doc.documentElement.scrollWidth}.`);
      check(doc.querySelectorAll('main').length === 1 && doc.querySelectorAll('h1').length === 1, `${path}: estructura principal duplicada.`);
      const ids = [...doc.querySelectorAll('[id]')].map(node => node.id);
      check(new Set(ids).size === ids.length, `${path}: IDs duplicados.`);
      check(doc.querySelectorAll('.site-header').length === 1 && doc.querySelectorAll('.site-footer').length === 1 && doc.querySelectorAll('#whatsappCta').length === 1, `${path}: marco duplicado.`);
      const campaignRibbon = doc.querySelector('[data-october-rose="header"]');
      if (campaignRibbon && !campaignRibbon.hidden) {
        const nameRange = doc.createRange();
        nameRange.selectNodeContents(doc.querySelector('.brand-name'));
        const gap = campaignRibbon.querySelector('svg').getBoundingClientRect().left - nameRange.getBoundingClientRect().right;
        check(gap >= 6, `${path} ${width}: el lazo invade la marca (${gap}px de separación).`);
      }
      check(parseFloat(win.getComputedStyle(doc.body).fontSize) >= 16, `${path}: cuerpo menor a 16 px.`);
      if (path === '/blog/pediatria/beneficios-lactancia-materna/') {
        const relatedTitles = [...doc.querySelectorAll('.blog-related h3.blog-card-title')];
        check(relatedTitles.length > 0, 'Falta la muestra de títulos de artículos relacionados.');
        check(relatedTitles.every(title => win.getComputedStyle(title).fontFamily.includes('Manrope')), 'Los H3 relacionados deben usar la sans institucional, no la serif de H1/H2.');
      }
      const menu = doc.querySelector('#menu-toggle');
      check((win.getComputedStyle(menu).display !== 'none') === (width <= 1100), `${path}: breakpoint del menú.`);
      if (width > 1100) {
        const brand = doc.querySelector('.brand').getBoundingClientRect();
        const nav = doc.querySelector('.desktop-nav').getBoundingClientRect();
        const actions = doc.querySelector('.header-actions').getBoundingClientRect();
        check(brand.right <= nav.left + 1 && nav.right <= actions.left + 1, `${path} ${width}: solapamiento del header.`);
      }
      report.viewports.push({ path, width });
    }
  }
});
await scenario('article-reading-seo', async () => {
  for (const path of ['/blog/urologia/prevencion-cancer-prostata/', '/blog/como-sacar-turno/', '/blog/controles-pediatricos/', '/blog/doppler-embarazo-cuando-hacerlo/', '/blog/octubre-rosa/']) {
    for (const width of [390, 1440]) {
      const doc = await load(path, width);
      const header = doc.querySelector('.article-header');
      const reading = doc.querySelector('[data-blog-content]');
      check(header && reading, `${path}: falta la estructura editorial.`);
      check(reading.getBoundingClientRect().width <= 781, `${path}: la lectura supera 780 px.`);
      check(Math.abs(header.querySelector('h1').getBoundingClientRect().left - reading.getBoundingClientRect().left) <= 1, `${path}: cabecera y lectura desalineadas.`);
      const image = doc.querySelector('.blog-featured-image');
      if (image) {
        const limit = width <= 650 ? 220 : 360;
        check(parseFloat(doc.defaultView.getComputedStyle(image).maxHeight) <= limit, `${path}: falta limitar la imagen editorial.`);
        check(image.getBoundingClientRect().height <= limit + 1, `${path}: la imagen domina el artículo.`);
      }
      for (const paragraph of reading.querySelectorAll('p')) check(parseFloat(doc.defaultView.getComputedStyle(paragraph).fontSize) >= 16, `${path}: párrafo menor a 16 px.`);
      for (const link of doc.querySelectorAll('nav[aria-label="En este artículo"] a')) check(reading.contains(doc.getElementById(decodeURIComponent(link.hash.slice(1)))), `${path}: índice sin sección real.`);
      const article = [...doc.head.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(schema => schema['@type'] === 'BlogPosting');
      check(article && article.datePublished === doc.querySelector('.blog-publish-date').getAttribute('datetime'), `${path}: fecha editorial y esquema no coinciden.`);
      check(!('dateModified' in article) && !('author' in article) && !('reviewedBy' in article), `${path}: se atribuyeron revisiones o autoría no informadas.`);
      check(doc.querySelector('meta[property="og:type"]')?.content === 'article', `${path}: falta OpenGraph de artículo.`);
    }
  }
});
await scenario('clinical-and-legal-interactions', async () => {
  const clinical = await load('/nutricion/', 390);
  const disclosure = clinical.querySelector('.clinical-faq details');
  check(disclosure && !disclosure.open, 'Faltan preguntas frecuentes nativas.');
  disclosure.querySelector('summary').click();
  check(disclosure.open && disclosure.querySelector('p').getBoundingClientRect().height > 0, 'La respuesta no abre.');
  const legal = await load('/legal/privacidad/', 390);
  const content = legal.querySelector('[data-legal-content]');
  check(content?.textContent.includes('19 de Septiembre de 2025'), 'Se perdió la fecha original del documento legal.');
  check(!legal.querySelector('main').textContent.includes('Last updated'), 'Quedó una fecha de interfaz en inglés.');
  const link = legal.querySelector('a.legal-back');
  check(link?.getAttribute('href') === '/legal/', 'Falta volver al índice legal.');
});
await scenario('lazy-video-real-dom', async () => {
  for (const path of ['/traumatologia/', '/blog/controles-pediatricos/']) {
    const doc = await load(path, 390);
    const player = doc.querySelector('.yt-lite');
    check(player && !player.querySelector('iframe'), `${path}: falta el reproductor diferido.`);
    const id = player.dataset.id;
    player.querySelector('button').click();
    await pause();
    const iframe = player.querySelector('iframe');
    check(iframe?.getAttribute('src') === `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, `${path}: el clic no inicializa el mismo video.`);
    player.click();
    check(player.querySelectorAll('iframe').length === 1, `${path}: el clic duplica el reproductor.`);
  }
});
await scenario('whatsapp-supplied-logo', async () => {
  for (const width of [390, 1440]) {
    const doc = await load('/', width);
    const button = doc.querySelector('#whatsappCta');
    const image = button.querySelector('img');
    check(image?.complete && image.naturalWidth > 0, 'No carga el logo enviado.');
    check(image.getAttribute('src').includes('/_astro/whatsapp-logo.'), 'No se usa el archivo proporcionado.');
    check(doc.defaultView.getComputedStyle(button).backgroundColor === 'rgba(0, 0, 0, 0)', 'El logo no debe tener el círculo anterior detrás.');
    check(Math.abs(image.getBoundingClientRect().width - button.getBoundingClientRect().width) <= 1 && button.getBoundingClientRect().width >= 44, 'Se alteró el área de contacto o la imagen no encaja.');
    const prompt = doc.querySelector('#whatsappPrompt');
    button.focus();
    check(!prompt.hidden, 'El aviso dejó de abrirse al enfocar el botón.');
    const dismiss = doc.querySelector('#whatsapp-dismiss');
    dismiss.focus(); dismiss.click();
    check(prompt.hidden && doc.activeElement === button, 'Cerrar no oculta el aviso o no devuelve el foco.');
    button.dispatchEvent(new doc.defaultView.Event('mouseenter'));
    check(prompt.hidden, 'El aviso reaparece después de cerrarlo.');
  }
});
await scenario('october-campaign', async () => {
  for (const path of ['/', '/blog/', '/blog/octubre-rosa/']) {
    const doc = await load(path, 390);
    const win = doc.defaultView;
    const OriginalDate = win.Date;
    const freeze = iso => {
      const fixed = new OriginalDate(iso).getTime();
      win.Date = class extends OriginalDate {
        constructor(...args) { if (args.length) super(...args); else super(fixed); }
        static now() { return fixed; }
      };
      win.dispatchEvent(new win.Event('pageshow'));
    };
    try {
      freeze('2026-10-20T15:00:00Z');
      const entries = [...doc.querySelectorAll('[data-october-rose]')];
      check(entries.length === (path === '/blog/octubre-rosa/' ? 1 : 2), `${path}: faltan accesos de campaña.`);
      check(entries.every(node => !node.hidden && win.getComputedStyle(node).display !== 'none'), `${path}: la campaña no se muestra en octubre.`);
      const ribbon = doc.querySelector('[data-october-rose="header"]');
      const box = ribbon.getBoundingClientRect();
      check(box.width >= 44 && box.height >= 44, 'El lazo necesita un área de contacto accesible.');
      ribbon.focus();
      check(doc.activeElement === ribbon, 'El lazo no es accesible mediante foco.');
      check(ribbon.getAttribute('href') === '/blog/octubre-rosa/' && !doc.querySelector('.brand').contains(ribbon), 'El lazo no debe cambiar el enlace del logo ni anidar enlaces.');
      freeze('2026-11-01T03:00:00Z');
      check(entries.every(node => node.hidden && win.getComputedStyle(node).display === 'none'), `${path}: la campaña sigue visible después de octubre.`);
      check(doc.querySelector('h1').getBoundingClientRect().height > 0, 'Ocultar la campaña no debe ocultar el contenido.');
      if (path === '/blog/octubre-rosa/') check(doc.querySelector('[data-blog-content]').textContent.includes('Fuentes de información'), 'El artículo debe permanecer después de la campaña.');
    } finally { win.Date = OriginalDate; win.dispatchEvent(new win.Event('pageshow')); }
  }
  const doc = await load('/blog/octubre-rosa/', 390, false);
  check([...doc.querySelectorAll('[data-october-rose]')].every(node => node.hidden), 'Sin JavaScript, la decoración temporal debe quedar oculta.');
  check(doc.querySelector('h1').getBoundingClientRect().height > 0 && doc.querySelector('[data-blog-content] a[href*="who.int"]'), 'El artículo y las fuentes deben funcionar sin JavaScript.');
});
await scenario('mobile-menu', async () => {
  const doc = await load('/contacto/', 390);
  const menu = doc.querySelector('#mobile-menu');
  const toggle = doc.querySelector('#menu-toggle');
  toggle.click();
  check(!menu.hidden && toggle.getAttribute('aria-expanded') === 'true', 'El menú no abre.');
  menu.querySelector('a').focus();
  doc.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check(menu.hidden && toggle.getAttribute('aria-expanded') === 'false', 'Escape no cierra el menú.');
  check(doc.activeElement === toggle, 'El menú no devuelve el foco.');
});
await scenario('contact-channels', async () => {
  const doc = await load('/contacto/', 390);
  const main = doc.querySelector('main');
  const links = [...main.querySelectorAll('a')].map(a => a.href);
  for (const href of Object.values(expected)) check(links.includes(href), `Falta canal: ${href}`);
  check(!main.querySelector('form'), 'Contacto no debe agregar otro formulario.');
  check(Boolean(main.querySelector('.map-preview img')), 'Falta el mapa estático.');
  const email = main.querySelector('a[href^="mailto:"]');
  check(email.getBoundingClientRect().width <= doc.documentElement.clientWidth, 'El correo desborda en móvil.');
});
await scenario('interview-modal', async () => {
  const doc = await load('/entrevistas-medicas/', 390);
  const dialog = doc.querySelector('#interview-dialog');
  const links = [...doc.querySelectorAll('.interview-watch')];
  check(links.length === 14, 'Faltan entrevistas.');
  check(!doc.querySelector('iframe'), 'No debe cargar reproductores antes del clic.');
  check(links[0].getAttribute('aria-controls') === dialog.id, 'El controlador del reproductor no se inicializó.');
  // Bubble after the real link handler: retain the native fallback but suppress
  // external navigation in this isolated fixture, including a broken handler.
  doc.addEventListener('click', event => { if (event.target.closest?.('a[target="_blank"]')) event.preventDefault(); });
  const previous = doc.body.style.overflow = 'auto';
  links[0].focus(); links[0].click();
  check(dialog.open && dialog.matches(':modal'), 'No abrió un diálogo modal real.');
  check(!doc.querySelector('main').contains(dialog), 'El diálogo no debe quedar dentro del contenido desactivado.');
  check(doc.activeElement === dialog.querySelector('button'), 'El foco no entra en el diálogo.');
  check(dialog.querySelector('iframe')?.src === `https://www.youtube-nocookie.com/embed/${links[0].dataset.videoId}?autoplay=1&rel=0`, 'Destino incorrecto del reproductor.');
  doc.querySelector('.brand').focus();
  check(dialog.contains(doc.activeElement), 'El fondo modal debe ser inerte al foco.');
  dialog.dispatchEvent(new doc.defaultView.Event('cancel', { cancelable: true }));
  await pause();
  check(!dialog.open && dialog.hidden && !dialog.querySelector('iframe'), 'Cancelar no cierra y destruye el reproductor.');
  check(doc.activeElement === links[0] && doc.body.style.overflow === previous, 'No restauró foco y desplazamiento.');
  links[7].focus(); links[7].click();
  check(dialog.open && dialog.querySelector('iframe')?.title === 'Prevención del cáncer de mama', 'No cambia al siguiente video.');
  dialog.querySelector('button').click();
  await pause();
  check(!dialog.open && !dialog.querySelector('iframe') && doc.activeElement === links[7], 'El cierre por botón no limpia o devuelve foco.');
});
await scenario('interview-archive', async () => {
  const doc = await load('/entrevistas-medicas/', 390);
  const archive = doc.querySelector('.interview-archive');
  check(!archive.open, 'El archivo no debe competir con el catálogo al entrar.');
  archive.querySelector('summary').click();
  check(archive.open && archive.querySelectorAll('.archive-list > li').length === 7, 'No se conservó el archivo.');
  for (const link of doc.querySelectorAll('.interview-topics a')) check(Boolean(doc.querySelector(link.hash)), `Ancla inexistente: ${link.hash}`);
});
await scenario('no-javascript-public-links', async () => {
  for (const path of ['/contacto/', '/entrevistas-medicas/', '/mis-estudios/']) {
    const doc = await load(path, 390, false);
    check(doc.querySelector('h1').getBoundingClientRect().height > 0, 'La página debe servir sin JavaScript.');
    if (path === '/contacto/') check(Boolean(doc.querySelector('main a[href^="mailto:"]')), 'Falta contacto sin JavaScript.');
    else if (path === '/mis-estudios/') {
      const link = doc.querySelector('.portal-entry');
      check(link?.href === 'https://resultados.cefem.ar/' && !doc.querySelector('main form, main iframe'), 'El acceso público debe conservar el destino del backend, sin duplicar autenticación.');
    } else {
      const links = [...doc.querySelectorAll('.interview-watch')];
      check(links.length === 14 && links.every(link => /^https:\/\/www.youtube.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(link.href)), 'Faltan destinos nativos de YouTube.');
      check(doc.querySelector('dialog').hidden && !doc.querySelector('iframe'), 'Un reproductor no debe quedar abierto sin JavaScript.');
    }
  }
});
const options = new URLSearchParams(location.search);
const capturePages = { contacto: '/contacto/', entrevistas: '/entrevistas-medicas/', home: '/', turnos: '/turnos/', especialidades: '/especialidades/', estudios: '/mis-estudios/', blog: '/blog/', articulo: '/blog/pediatria/beneficios-lactancia-materna/', categoria: '/categorias/pediatria/', prostata: '/blog/urologia/prevencion-cancer-prostata/', nutricion: '/nutricion/', privacidad: '/legal/privacidad/', octubre: '/blog/octubre-rosa/' };
const capture = capturePages[options.get('capture')];
if (capture) {
  try { await load(capture, Number(options.get('width')) || 1440); }
  catch (error) { report.captureError = String(error); }
}
report.status = 'complete';
output.textContent = JSON.stringify(report);
