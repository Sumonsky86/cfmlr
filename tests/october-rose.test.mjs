import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'parse5';
const nodes = node => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, key) => node?.attrs?.find(a => a.name === key)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const page = path => parse(readFileSync(new URL('../dist/' + path, import.meta.url), 'utf8'));

test('lazo, mención y destacado enlazan al artículo sin alterar la marca ni anidar enlaces', () => {
  for (const [path, kind] of [['index.html', 'mention'], ['blog/index.html', 'feature']]) {
    const doc = page(path);
    const all = nodes(doc);
    const header = all.find(n => attr(n, 'class')?.split(' ').includes('site-header'));
    const ribbon = nodes(header).find(n => attr(n, 'data-october-rose') === 'header');
    assert.ok(ribbon, 'Falta el lazo junto a la marca.');
    assert.equal(attr(ribbon, 'href'), '/blog/octubre-rosa/');
    assert.ok(attr(ribbon, 'aria-label')?.includes('Octubre Rosa'));
    assert.notEqual(attr(ribbon, 'hidden'), undefined, 'Sin JavaScript la decoración temporal permanece oculta.');
    const brand = nodes(header).find(n => attr(n, 'class')?.split(' ').includes('brand'));
    assert.equal(attr(brand, 'href'), '/');
    assert.ok(!nodes(brand).includes(ribbon), 'No anidar el acceso de campaña dentro del enlace de inicio.');
    const promo = all.find(n => attr(n, 'data-october-rose') === kind);
    assert.ok(promo, kind);
    assert.ok(nodes(promo).some(n => n.tagName === 'a' && attr(n, 'href') === '/blog/octubre-rosa/'));
    assert.notEqual(attr(promo, 'hidden'), undefined);
  }
});

test('la campaña se limita a octubre de 2026 según el horario de Argentina', async () => {
  const helper = await import('../src/utils/october-rose.ts').catch(() => null);
  assert.equal(typeof helper?.isOctoberRoseActive, 'function', 'Falta la ventana temporal de la campaña.');
  for (const [iso, expected] of [
    ['2026-10-01T02:59:59Z', false], ['2026-10-01T03:00:00Z', true],
    ['2026-10-20T15:00:00Z', true], ['2026-11-01T02:59:59Z', true],
    ['2026-11-01T03:00:00Z', false], ['2027-10-20T15:00:00Z', false],
  ]) assert.equal(helper.isOctoberRoseActive(new Date(iso)), expected, iso);
  assert.equal(helper.isOctoberRoseActive(new Date('invalid')), false);
  assert.equal(helper.nextOctoberRoseBoundary(new Date('2026-09-20T12:00:00Z')), Date.parse('2026-10-01T00:00:00-03:00'));
  assert.equal(helper.nextOctoberRoseBoundary(new Date('2026-10-20T12:00:00Z')), Date.parse('2026-11-01T00:00:00-03:00'));
  assert.equal(helper.nextOctoberRoseBoundary(new Date('2026-11-01T03:00:00Z')), null);
});

test('Octubre Rosa tiene un artículo permanente con fuentes y sin ofrecer estudios no confirmados', () => {
  assert.ok(existsSync(new URL('../dist/blog/octubre-rosa/index.html', import.meta.url)), 'Falta el artículo permanente.');
  const doc = page('blog/octubre-rosa/index.html');
  const all = nodes(doc);
  assert.equal(all.filter(n => n.tagName === 'h1').length, 1);
  assert.equal(text(all.find(n => n.tagName === 'h1')), 'Octubre Rosa: concientización y detección temprana del cáncer de mama');
  const content = all.find(n => attr(n, 'data-blog-content') !== undefined);
  assert.ok(content);
  const copy = text(content);
  assert.match(copy, /no reemplaza la consulta/i);
  assert.match(copy, /no reemplaza la mamografía/i);
  assert.doesNotMatch(copy, /mamografías gratis|hacemos mamografías|revisado por|cura garantizada|promoción/i);
  assert.ok(nodes(content).some(n => n.tagName === 'a' && attr(n, 'href') === '/turnos/?especialidad=gynecology-obstetrics'));
  for (const host of ['www.who.int', 'www.argentina.gob.ar']) assert.ok(nodes(content).some(n => n.tagName === 'a' && attr(n, 'href')?.includes(host)), host);
  assert.equal(attr(all.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical'), 'href'), 'https://www.cefem.ar/blog/octubre-rosa/');
});
