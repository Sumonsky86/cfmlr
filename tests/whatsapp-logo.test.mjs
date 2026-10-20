import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'parse5';
const nodes = node => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, name) => node?.attrs?.find(a => a.name === name)?.value;

test('el logo es el archivo exacto entregado por el usuario y se publica sin recodificar', async () => {
  const { createHash } = await import('node:crypto');
  const sha = data => createHash('sha256').update(data).digest('hex');
  const expected = '92dbd9610c5bf463746836b0d71372422e54cf121e95581afb34622662acc024';
  assert.equal(sha(readFileSync(new URL('../src/assets/institutional/whatsapp-logo.png', import.meta.url))), expected);
  const doc = parse(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'));
  const button = nodes(doc).find(n => attr(n, 'id') === 'whatsappCta');
  const image = nodes(button).find(n => n.tagName === 'img');
  assert.equal(sha(readFileSync(new URL('../dist' + attr(image, 'src'), import.meta.url))), expected);
});

test('el botón flotante usa el logo enviado sin cambiar su destino ni el aviso', () => {
  const doc = parse(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'));
  const all = nodes(doc);
  const button = all.find(n => attr(n, 'id') === 'whatsappCta');
  const image = nodes(button).find(n => n.tagName === 'img');
  assert.ok(image, 'El botón debe mostrar la imagen proporcionada en lugar del SVG anterior.');
  assert.match(attr(image, 'src'), /\/_astro\/whatsapp-logo\./);
  assert.equal(attr(image, 'alt'), '');
  assert.equal(attr(button, 'aria-label'), 'Contactar por WhatsApp');
  assert.equal(attr(button, 'href'), 'https://wa.me/5493471341461');
  assert.equal(nodes(button).filter(n => n.tagName === 'svg').length, 0);
  assert.ok(all.some(n => attr(n, 'id') === 'whatsappPrompt'));
  assert.ok(all.some(n => attr(n, 'id') === 'whatsapp-dismiss'));
});

test('el logo tiene un verde más oscuro al pasar el cursor sin agregar otro fondo', async () => {
  const { parse: parseCss } = await import('postcss');
  const doc = parse(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'));
  const all = nodes(doc);
  const text = n => n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join('');
  const styles = all.filter(n => n.tagName === 'link' && attr(n, 'rel') === 'stylesheet').map(n => readFileSync(new URL('../dist' + attr(n, 'href'), import.meta.url), 'utf8')).concat(all.filter(n => n.tagName === 'style').map(text));
  const brightness = [];
  for (const css of styles) parseCss(css).walkRules(rule => {
    const selector = rule.selector.replace(/\[[^\]]+\]/g, '');
    if (!selector.includes('.whatsapp-button:hover') || !selector.includes('img')) return;
    for (const declaration of rule.nodes) if (declaration.prop === 'filter') {
      const match = declaration.value.match(/brightness\(([\d.]+)\)/);
      if (match) brightness.push(Number(match[1]));
    }
  });
  assert.ok(brightness.some(value => value > 0 && value < 1), 'El hover debe oscurecer el logo original mediante CSS.');
});
