import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'parse5';
const page = path => parse(readFileSync(new URL('../dist/' + path, import.meta.url), 'utf8'));
const nodes = node => [node, ...(node.childNodes || []).flatMap(nodes)];
const tags = (node, tag) => nodes(node).filter(n => n.tagName === tag);
const attr = (node, key) => node?.attrs?.find(a => a.name === key)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');

test('el índice legal está en español y mantiene los dos documentos y su fecha real', () => {
  const doc = page('legal/index.html');
  assert.equal(attr(tags(doc, 'body')[0], 'class'), 'institutional-surface');
  assert.equal(text(tags(doc, 'h1')[0]), 'Información legal');
  const main = tags(doc, 'main')[0];
  for (const href of ['/legal/privacidad/', '/legal/terminos-y-condiciones/']) assert.ok(tags(main, 'a').some(a => attr(a, 'href') === href), href);
  assert.equal(tags(main, 'time').length, 2);
  for (const time of tags(main, 'time')) assert.equal(attr(time, 'datetime'), '2025-09-19T00:00:00.000Z');
  assert.doesNotMatch(text(main), /Last updated|Legal Information|Important policies/);
});

test('los documentos legales usan el marco institucional sin reescribir textos ni fechas', () => {
  for (const [slug, title] of [['privacidad', 'Política de Privacidad'], ['terminos-y-condiciones', 'Términos y Condiciones']]) {
    const doc = page(`legal/${slug}/index.html`);
    assert.equal(attr(tags(doc, 'body')[0], 'class'), 'institutional-surface', slug);
    assert.equal(tags(doc, 'main').length, 1);
    assert.equal(tags(doc, 'h1').length, 1);
    assert.equal(text(tags(doc, 'h1')[0]), title);
    assert.equal(text(tags(doc, 'footer')[0]), text(tags(page('index.html'), 'footer')[0]));
    const content = nodes(doc).find(n => attr(n, 'data-legal-content') !== undefined);
    assert.ok(content, slug);
    assert.ok(text(content).includes('19 de Septiembre de 2025'));
    assert.ok(text(content).includes('Este documento es un resumen informativo.'));
    assert.doesNotMatch(text(tags(doc, 'main')[0]), /Last updated|Legal Information/);
    assert.equal(attr(tags(doc, 'link').find(n => attr(n, 'rel') === 'canonical'), 'href'), `https://www.cefem.ar/legal/${slug}/`);
  }
});
