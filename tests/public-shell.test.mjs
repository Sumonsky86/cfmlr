import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appointmentContact, appointmentLinks } from '../src/data/appointments.ts';

const page = (path) => readFileSync(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const expectedNavigation = [
  ['/especialidades/', 'Especialidades'],
  ['/entrevistas-medicas/', 'Entrevistas médicas'],
  ['/blog/', 'Blog'],
  ['/contacto/', 'Contacto'],
];
const navigation = (html, className) => {
  const nav = html.match(new RegExp(`<nav\\b[^>]*class="${className}"[^>]*>([\\s\\S]*?)<\\/nav>`))?.[1] || '';
  return [...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .slice(0, 4).map(([, href, body]) => [href, body.replace(/<[^>]*>/g, '').trim()]);
};

test('el menú público usa iguales etiquetas y destinos canónicos en desktop y móvil', () => {
  for (const path of ['index.html', 'turnos/index.html']) {
    const html = page(path);
    assert.deepEqual(navigation(html, 'desktop-nav'), expectedNavigation, path);
    assert.deepEqual(navigation(html, 'mobile-nav'), expectedNavigation, path);
  }
});

test('contacto comparte el marco aprobado y presenta canales reales sin otro formulario', () => {
  const html = page('contacto/index.html');
  assert.match(html, /<body class="institutional-surface"/);
  assert.deepEqual(navigation(html, 'desktop-nav'), expectedNavigation);
  assert.deepEqual(navigation(html, 'mobile-nav'), expectedNavigation);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.equal([...html.matchAll(/id="main-content"/g)].length, 1);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.equal([...html.matchAll(/id="whatsappCta"/g)].length, 1);
  assert.equal(html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0], page('index.html').match(/<footer\b[\s\S]*?<\/footer>/)?.[0]);
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '';
  const mainLinks = [...main.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(([, href]) => href.replaceAll('&amp;', '&'));
  for (const href of Object.values(appointmentLinks)) assert.ok(mainLinks.includes(href), href);
  for (const value of [appointmentContact.address, appointmentContact.locality, appointmentContact.openingDays, appointmentContact.openingTimeRanges]) assert.ok(main.includes(value), value);
  assert.match(main, /<img\b[^>]*alt="Mapa/);
  assert.doesNotMatch(main, /<form\b/);
  assert.match(html, /<title>Contacto y Ubicación \| Cefem<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/www.cefem.ar\/contacto\/"/);
});

test('las páginas piloto indican su enlace actual en ambos menús', () => {
  for (const [path, href] of [['contacto/index.html', '/contacto/'], ['entrevistas-medicas/index.html', '/entrevistas-medicas/']]) {
    const html = page(path);
    const current = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*aria-current="page"/g)].map(m => m[1]);
    assert.deepEqual(current, [href, href]);
  }
});

test('entrevistas conserva los 14 videos con títulos contrastados, marco único y archivo accesible', () => {
  const html = page('entrevistas-medicas/index.html');
  assert.match(html, /<body class="institutional-surface"/);
  assert.deepEqual(navigation(html, 'desktop-nav'), expectedNavigation);
  assert.deepEqual(navigation(html, 'mobile-nav'), expectedNavigation);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.equal([...html.matchAll(/id="main-content"/g)].length, 1);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.equal([...html.matchAll(/id="whatsappCta"/g)].length, 1);
  assert.equal(html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0], page('index.html').match(/<footer\b[\s\S]*?<\/footer>/)?.[0]);
  const ids = [...html.matchAll(/class="interview-watch"[^>]*data-video-id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids.sort(), ['Ip3cp_Sifuo','M4_HOnatb5c','CXTaYAMYgEQ','JaOhVfsBd6A','VuSxn48YRv4','-vakwjjRW6g','Z0CjDqEcKNE','eruZqiTysJA','qz4ytAzTPAg','ssJ_NY_H5Io','zirkVTzkrM4','39Wd_DulN4M','YemQ4dCJDvw','KtYDxy8dYP8'].sort());
  for (const title of ['Niños prematuros', 'Semana Mundial de la Lactancia Materna', 'Sarampión', 'Prevención del cáncer de mama', 'La artrosis', 'Dolores 2.0', 'Dr. Alfonso Alamo', 'Dr. Alejandro Alamo']) assert.ok(html.includes(title), title);
  assert.doesNotMatch(html, /Álamo|<iframe\b/);
  assert.equal([...html.matchAll(/<dialog\b/g)].length, 1);
  assert.match(html, /<details\b[^>]*class="interview-archive"/);
  assert.match(html, /2021-10-01/);
  assert.match(html, /2023-09-01/);
  assert.match(html, /rel="canonical" href="https:\/\/www.cefem.ar\/entrevistas-medicas\/"/);
  assert.match(html, /<title>Entrevistas Médicas – Cefem Las Rosas<\/title>/);
});
