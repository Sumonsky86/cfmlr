import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'parse5';
const all = node => [node, ...(node.childNodes || []).flatMap(all)];
const attr = (node, name) => node?.attrs?.find(a => a.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const page = () => parse(readFileSync(new URL('../dist/blog/doppler-embarazo-cuando-hacerlo/index.html', import.meta.url), 'utf8'));

test('la redacción es informativa, cita fuentes y conserva la fecha original sin atribuciones inventadas', async () => {
  const doc = page();
  const nodes = all(doc);
  assert.equal(text(nodes.find(n => n.tagName === 'h1')), 'Doppler en el embarazo: cuándo se indica y qué evalúa');
  const content = nodes.find(n => attr(n, 'data-blog-content') !== undefined);
  const copy = text(content);
  assert.doesNotMatch(copy, /Resumen de la entrevista|Dr\.? Alfonso Alamo|semana 24|semanas recomendadas|cuidados posteriores/i);
  assert.match(copy, /flujo sanguíneo/);
  assert.match(copy, /no reemplaza la consulta/i);
  const sources = (await import('../src/data/doppler-embarazo.ts')).dopplerPregnancySources;
  assert.equal(sources.length, 2);
  for (const source of sources) {
    assert.ok(all(content).some(n => attr(n, 'id') === `fuente-${source.id}`));
    assert.ok(all(content).some(n => n.tagName === 'a' && attr(n, 'href') === source.url));
    assert.ok(all(content).some(n => n.tagName === 'a' && attr(n, 'href') === `#fuente-${source.id}`));
  }
  assert.ok(all(content).some(n => n.tagName === 'a' && attr(n, 'href') === '/turnos/?especialidad=ultrasound'));
  const date = nodes.find(n => attr(n, 'class')?.split(' ').includes('blog-publish-date'));
  assert.equal(attr(date, 'datetime'), new Date('2023-06-12').toISOString());
});

test('el artículo obstétrico no asocia el video de otro título ni publica su VideoObject', () => {
  const doc = page();
  const content = all(doc).find(n => attr(n, 'data-blog-content') !== undefined);
  assert.ok(content);
  assert.ok(!all(content).some(n => attr(n, 'data-id') === 'eruZqiTysJA'), 'Retirar el video no verificado para este artículo.');
  const schemas = all(doc).filter(n => n.tagName === 'script' && attr(n, 'type') === 'application/ld+json').flatMap(n => { const value = JSON.parse(text(n)); return value['@graph'] || [value]; });
  assert.ok(!schemas.some(s => s['@type'] === 'VideoObject'), 'No atribuir tema, fecha o autoría a un video que se retiró.');
  assert.equal(attr(all(doc).find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical'), 'href'), 'https://www.cefem.ar/blog/doppler-embarazo-cuando-hacerlo/');
});
