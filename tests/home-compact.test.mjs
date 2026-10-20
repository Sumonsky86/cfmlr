import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'parse5';

const read = (relative) => parse(readFileSync(new URL(`../dist/${relative}`, import.meta.url), 'utf8'));
const attrs = (node) => Object.fromEntries((node.attrs ?? []).map(({name, value}) => [name, value]));
const nodes = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap(child => nodes(child, predicate))];
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(' ').replace(/\s+/g, ' ').trim();
const words = (value) => value.match(/[\p{L}\p{N}]+(?:[’'–-][\p{L}\p{N}]+)*/gu) ?? [];
const home = read('index.html');
const catalogue = read('especialidades/index.html');
const services = (document) => nodes(document, node => node.tagName === 'article' && attrs(node).class === 'service');
const main = nodes(home, node => node.tagName === 'main')[0];

test('la landing resume cada servicio sin convertir el catálogo en una versión abreviada', () => {
  const summaries = services(home);
  const full = services(catalogue);
  assert.equal(summaries.length, 8);
  assert.equal(full.length, 8);
  for (let index = 0; index < summaries.length; index++) {
    const summary = text(nodes(summaries[index], node => node.tagName === 'p')[0]);
    const description = text(nodes(full[index], node => node.tagName === 'p')[0]);
    assert.ok(words(summary).length <= 9, `${summary}: ${words(summary).length} palabras; máximo 9`);
    assert.ok(words(summary).length < words(description).length, 'El detalle debe seguir disponible en Especialidades');
    const links = nodes(summaries[index], node => node.tagName === 'a');
    assert.equal(links.length, 1);
    assert.equal(attrs(links[0]).href, attrs(nodes(full[index], node => node.tagName === 'a')[0]).href);
  }
});

test('el resumen de especialidades evita una introducción repetida', () => {
  const section = nodes(main, node => node.tagName === 'section' && attrs(node).id === 'especialidades')[0];
  const heading = nodes(section, node => attrs(node).class === 'section-heading')[0];
  assert.equal(nodes(heading, node => node.tagName === 'p').length, 0);
});

test('las entrevistas de la home van directo a los temas y sus profesionales', () => {
  const intro = nodes(main, node => attrs(node).class === 'conversations-intro')[0];
  assert.equal(nodes(intro, node => node.tagName === 'p').length, 0);
  assert.ok(text(main).includes('Dr. Gustavo Blanco'));
  assert.ok(text(main).includes('Dr. Alfonso Alamo'));
  assert.ok(text(main).includes('Dr. Alejandro Alamo'));
});

test('la home conserva ubicación, horarios, estudio público, turnos y enlaces clínicos visibles', () => {
  assert.ok(text(main).includes('Boulevard Kemmis 843'));
  assert.ok(text(main).includes('8 a 12 h y 16 a 20 h'));
  const destinations = nodes(home, node => node.tagName === 'a').map(node => attrs(node).href);
  for (const destination of ['/turnos/', '/mis-estudios/', '/entrevistas-medicas/', '/especialidades/', '/ecografias-abdominales-las-rosas/', '/ecografias-doppler-embarazo-las-rosas/', '/ecografias-partes-blandas-lesiones-deportivas/', '/cirugia-vascular-varices-las-rosas/']) {
    assert.ok(destinations.includes(destination), destination);
  }
  const nav = nodes(main, node => node.tagName === 'nav' && attrs(node).class === 'medical-links')[0];
  assert.equal(nodes(nav, node => node.tagName === 'a').length, 4);
  assert.equal(nodes(nav, node => node.tagName === 'details' || 'hidden' in attrs(node)).length, 0);
});
