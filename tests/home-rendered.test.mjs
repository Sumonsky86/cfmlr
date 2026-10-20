import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const matches = (actual, expression) => assert.ok(expression.test(actual), `Expected rendered output to match ${expression}`);
const excludes = (actual, expression) => assert.ok(!expression.test(actual), `Unexpected rendered output matching ${expression}`);
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const text = (markup) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const section = (className) => html.match(new RegExp(`<section\\b[^>]*class="${className}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1] ?? '';

test('el hero aprobado ofrece turno local y llamada a recepción', () => {
  const hero = section('hero');
  assert.match(text(hero), /Especialidades médicas en Las Rosas\./);
  assert.match(hero, /href="\/turnos\/"[^>]*>Solicitar turno/);
  assert.match(hero, /href="tel:\+543471594801"/);
  assert.match(text(hero), /Boulevard Kemmis 843 · Las Rosas/);
  assert.match(text(hero), /Lun–vie · 8 a 12 h y 16 a 20 h/);
  assert.doesNotMatch(text(hero), /Completá tus datos y continuá por WhatsApp/);
  assert.match(html, /<body[^>]*class="institutional-surface"/);
});

test('las ocho especialidades conservan descripciones y cuatro enlaces médicos visibles', () => {
  const services = section('services');
  assert.equal([...services.matchAll(/<article\b/g)].length, 8);
  for (const label of ['Ecografías', 'Traumatología', 'Pediatría', 'Urología', 'Ginecología y Obstetricia', 'Nutrición', 'Clínica Médica', 'Depilación Definitiva']) {
    assert.ok(text(services).includes(label), label);
  }
  assert.match(text(services), /Generales, obstétricas, Doppler y urológicas\./);
  const medicalLinks = services.match(/<nav[^>]*class="medical-links"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.equal([...medicalLinks.matchAll(/<a\b/g)].length, 4);
  for (const route of ['ecografias-abdominales-las-rosas', 'ecografias-doppler-embarazo-las-rosas', 'ecografias-partes-blandas-lesiones-deportivas', 'cirugia-vascular-varices-las-rosas']) {
    assert.ok(medicalLinks.includes(`href="/${route}/"`), route);
  }
  assert.doesNotMatch(medicalLinks, /<details|hidden/);
});

test('la sección de entrevistas presenta los tres temas verificados sin cambiar sus videos', () => {
  const interviews = section('conversations');
  for (const [id, title, author] of [
    ['JaOhVfsBd6A', 'Niños prematuros', 'Dr. Gustavo Blanco'],
    ['eruZqiTysJA', 'Prevención del cáncer de mama', 'Dr. Alfonso Alamo'],
    ['qz4ytAzTPAg', 'Cirugías endovasculares y tradicionales', 'Dr. Alejandro Alamo'],
  ]) {
    const link = interviews.match(new RegExp(`<a[^>]*href="https://www.youtube.com/watch\\?v=${id}"[\\s\\S]*?<\\/a>`))?.[0] ?? '';
    assert.ok(text(link).includes(title), `${id}: ${title}`);
    assert.ok(text(link).includes(author), author);
    assert.match(link, /rel="noopener noreferrer"/);
  }
  assert.match(interviews, /href="\/entrevistas-medicas\/"/);
});

test('contacto reúne dirección real, recepción, horarios y dos respuestas desplegables', () => {
  const visit = section('visit');
  assert.match(text(visit), /Boulevard Kemmis 843/);
  assert.match(text(visit), /Las Rosas, Santa Fe, Argentina/);
  assert.match(text(visit), /8 a 12 h y 16 a 20 h · Con turno programado/);
  for (const href of ['tel:+543471594801', 'mailto:info@cefem.com.ar', 'https://wa.me/5493471341461']) assert.ok(visit.includes(`href="${href}"`), href);
  assert.equal([...visit.matchAll(/<details>/g)].length, 2);
  assert.match(text(visit), /¿Cómo puedo sacar un turno\?/);
  assert.match(text(visit), /¿Atienden con obras sociales\?/);
  assert.match(text(visit), /Te recomendamos consultarnos por WhatsApp para confirmar tu cobertura\./);
});

test('el blog conserva los tres artículos aprobados y permite explorar sus nueve categorías', () => {
  const blog = section('journal');
  assert.equal([...blog.matchAll(/<article\b/g)].length, 3);
  for (const title of ['Beneficios de la Lactancia Materna', 'Prevención del Cáncer de Próstata', '5 Beneficios Clave de una Nutrición Balanceada']) assert.ok(text(blog).includes(title), title);
  assert.match(blog, /<summary>Explorar temas del blog<\/summary>/);
  assert.equal([...blog.matchAll(/href="\/categorias\//g)].length, 9);
  assert.match(blog, /href="\/blog\/pediatria\/beneficios-lactancia-materna"/);
  assert.match(blog, /href="\/blog\/urologia\/prevencion-cancer-prostata"/);
  assert.match(blog, /href="\/blog\/nutricion-balanceada"/);
});

test('el layout compartido conserva accesos, logo real, menú móvil y WhatsApp descartable', () => {
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /href="\/mis-estudios\/"/);
  assert.match(header, /href="\/turnos\/"/);
  assert.match(header, /alt="Logo de CEFEM"/);
  assert.match(header, /id="menu-toggle"[^>]*aria-expanded="false"[^>]*aria-controls="mobile-menu"/);
  assert.match(header, /id="mobile-menu"[^>]*hidden/);
  assert.match(html, /id="whatsappCta"[^>]*href="https:\/\/wa.me\/5493471341461"/);
  assert.match(html, /id="whatsapp-dismiss"[^>]*aria-label="Cerrar aviso de WhatsApp"/);
  assert.match(html, /<footer\b[\s\S]*?Privacidad[\s\S]*?Términos y condiciones[\s\S]*?<\/footer>/);
  assert.doesNotMatch(text(html), /Maqueta v\d|flujo de turnos aún no está implementado/);
});

test('SEO de producción sigue indexable con título, descripción, canonical y schema originales', () => {
  assert.match(html, /<title>Cefem – Centro Familiar de Especialidades Médicas en Las Rosas<\/title>/);
  assert.match(html, /name="description" content="Cefem en Las Rosas: Atención integral en Pediatría, Urología, Ginecología y más. Cuidamos de tu familia con especialistas de confianza\."/);
  assert.match(html, /rel="canonical" href="https:\/\/www.cefem.ar\/"/);
  assert.match(html, /name="robots" content="index, follow"/);
  assert.match(html, /"@type":"MedicalOrganization"/);
  assert.doesNotMatch(html, /noindex/);
});

test('el CSS servido nunca oculta la superficie institucional completa', () => {
  const hrefs = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length > 0);
  for (const href of hrefs) {
    const css = readFileSync(new URL('../dist' + href, import.meta.url), 'utf8');
    const hidingBody = [...css.matchAll(/(?:^|[{}])([^{}]+)\{([^{}]*)\}/g)].filter(([, selectors, declarations]) => selectors.split(',').some(s => s.trim() === 'body.institutional-surface') && /(?:^|;)display:none(?:;|$)/.test(declarations));
    assert.equal(hidingBody.length, 0, 'Una regla vacía transformada en selector de body está ocultando todo el contenido');
  }
});
