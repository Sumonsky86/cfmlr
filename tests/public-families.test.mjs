import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = path => readFileSync(new URL('../dist/' + path, import.meta.url), 'utf8');
const footer = html => html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];

test('el acceso a estudios marca el botón actual sin confundirlo con Blog', () => {
  const html = page('mis-estudios/index.html');
  assert.equal([...html.matchAll(/href="\/mis-estudios\/" aria-current="page"/g)].length, 2);
});

test('el acceso público a estudios cambia solo su presentación y conserva el destino del portal', () => {
  const html = page('mis-estudios/index.html');
  assert.match(html, /<body class="institutional-surface"/);
  assert.equal(footer(html), footer(page('index.html')));
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '';
  assert.match(main, /href="https:\/\/resultados.cefem.ar"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(main, /href="\/contacto\/"/);
  assert.match(main, /href="https:\/\/wa.me\/5493471341461"/);
  assert.match(main, /datos de acceso/);
  assert.doesNotMatch(main, /<form\b|<iframe\b|type="password"|documento y la contraseña|127\.0\.0\.1|Paciente Ficticio/);
  assert.match(html, /<title>Consultar Estudios Médicos Online \| Cefem Las Rosas<\/title>/);
});

test('especialidades adopta el marco común y conserva ocho servicios y sus enlaces médicos', () => {
  const html = page('especialidades/index.html');
  assert.match(html, /<body class="institutional-surface"/);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.equal(footer(html), footer(page('index.html')));
  for (const name of ['Ecografías', 'Traumatología', 'Pediatría', 'Urología', 'Ginecología y Obstetricia', 'Nutrición', 'Clínica Médica', 'Depilación Definitiva']) assert.ok(html.includes(name), name);
  assert.equal([...html.matchAll(/<article\b[^>]*class="service"/g)].length, 8);
  for (const route of ['ecografias-abdominales-las-rosas', 'ecografias-doppler-embarazo-las-rosas', 'ecografias-partes-blandas-lesiones-deportivas', 'cirugia-vascular-varices-las-rosas']) assert.ok(html.includes(`href="/${route}/"`), route);
  assert.match(html, /href="\/turnos\/"/);
  assert.match(html, /href="https:\/\/wa.me\/5493471341461"/);
  assert.match(html, /<title>Pediatría, Ginecología, Traumatología y Más en Las Rosas \| Cefem<\/title>/);
});
