import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
const read = slug => readFileSync(new URL(`../dist/${slug}/index.html`, import.meta.url), 'utf8');

test('home y especialidades enlazan los tres servicios que antes no tenían destino', () => {
  for (const path of ['../dist/index.html', '../dist/especialidades/index.html']) {
    const html = readFileSync(new URL(path, import.meta.url), 'utf8');
    for (const [slug, title] of [['urologia', 'Urología'], ['clinica-medica', 'Clínica Médica'], ['depilacion-definitiva', 'Depilación Definitiva']]) {
      assert.ok(new RegExp(`href="/${slug}/"[^>]*>${title}`).test(html), `${path}: ${title}`);
    }
  }
});

test('Clínica Médica y Depilación Definitiva tienen destinos y preselección propios', () => {
  for (const [slug, title, id, description] of [
    ['clinica-medica', 'Clínica Médica', 'general-medicine', 'Atención primaria y seguimiento de enfermedades comunes para toda la familia.'],
    ['depilacion-definitiva', 'Depilación Definitiva', 'laser-hair-removal', 'Servicio de depilación con tecnología de vanguardia para resultados duraderos, seguros y efectivos.'],
  ]) {
    assert.ok(existsSync(new URL(`../dist/${slug}/index.html`, import.meta.url)), slug);
    const html = read(slug);
    assert.match(html, /<body class="institutional-surface"/);
    assert.ok(html.includes(`>${title}</h1>`));
    assert.ok(html.includes(description));
    assert.ok(html.includes(`href="/turnos/?especialidad=${id}"`));
    assert.ok(html.includes(`href="https://www.cefem.ar/${slug}/"`));
    assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  }
});

test('Urología tiene una página real y prepara turnos con su ID permitido', () => {
  assert.ok(existsSync(new URL('../dist/urologia/index.html', import.meta.url)), 'Debe generarse /urologia/, no apuntar a una página inexistente.');
  const html = read('urologia');
  assert.match(html, /<body class="institutional-surface"/);
  assert.match(html, /<h1[^>]*>Urología<\/h1>/);
  assert.ok(html.includes('Diagnóstico y tratamiento urológico profesional para hombres y mujeres en Cefem.'));
  assert.ok(html.includes('href="/turnos/?especialidad=urology"'));
  assert.match(html, /href="https:\/\/wa.me\/5493471341461"/);
  assert.match(html, /rel="canonical" href="https:\/\/www.cefem.ar\/urologia\/"/);
  assert.doesNotMatch(html, /127\.0\.0\.1|próximamente|en construcción/i);
});
