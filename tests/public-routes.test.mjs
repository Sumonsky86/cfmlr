import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { categories } from '../src/data/categories.ts';
import * as publicRoutes from '../src/utils/public-routes.ts';

const root = new URL('../', import.meta.url);
function page(path) {
  const file = new URL(`dist${path}index.html`, root);
  assert.ok(existsSync(file), `Debe generarse ${path}`);
  return readFileSync(file, 'utf8');
}
function rules() {
  const file = new URL('public/_redirects', root);
  assert.ok(existsSync(file), 'Se requieren reglas explícitas para Cloudflare Pages.');
  return readFileSync(file, 'utf8').split(/\r?\n/).map(line => line.trim())
    .filter(line => line && !line.startsWith('#')).map(line => {
      const [from, to, status, ...extra] = line.split(/\s+/);
      assert.equal(extra.length, 0, 'Cada regla debe tener origen, destino y estado.');
      return { from, to, status };
    });
}
function alias(from, to) {
  for (const source of [from, from.replace(/\/$/, '')]) {
    assert.deepEqual(rules().filter(row => row.from === source), [{ from: source, to, status: '301' }]);
  }
}
function canonical(html, path) {
  assert.ok(html.includes(`rel="canonical" href="https://www.cefem.ar${path}"`), `Canónica esperada: ${path}`);
  assert.doesNotMatch(html, /name="robots" content="noindex/);
}

test('contacto se genera en español y declara su alias 301 para Cloudflare', () => {
  const html = page('/contacto/');
  canonical(html, '/contacto/');
  assert.match(html, /Contacto y Ubicación \| Cefem/);
  alias('/contact/', '/contacto/');
  assert.ok(page('/').includes('href="/contacto/"'));
  assert.equal(existsSync(new URL('dist/contact/index.html', root)), false);
});

test('documentos legales conservan sus entradas bajo rutas españolas y alias directos', () => {
  for (const [old, current] of [
    ['/legal/privacy-policy/', '/legal/privacidad/'],
    ['/legal/terms-of-service/', '/legal/terminos-y-condiciones/'],
  ]) {
    canonical(page(current), current);
    alias(old, current);
    assert.ok(page('/legal/').includes(`href="${current}"`));
    assert.ok(page('/').includes(`href="${current}"`));
    assert.equal(existsSync(new URL(`dist${old}index.html`, root)), false);
  }
  alias('/privacy-policy/', '/legal/privacidad/');
  assert.equal(existsSync(new URL('dist/privacy-policy/index.html', root)), false,
    'El alias no debe seguir generando otra página canónica o una cadena de meta refresh.');
});

test('las nueve categorías mantienen sus slugs y se descubren desde el blog y la home', () => {
  assert.equal(categories.length, 9);
  for (const category of categories) {
    const current = `/categorias/${category.slug}/`;
    canonical(page(current), current);
    alias(`/category/${category.slug}/`, current);
    assert.ok(page('/').includes(`href="${current}"`));
    assert.ok(page('/blog/').includes(`href="${current}"`));
    assert.equal(existsSync(new URL(`dist/category/${category.slug}/index.html`, root)), false);
  }
  assert.ok(page('/blog/guia-primera-visita-ginecologo/').includes('href="/categorias/ginecologia/"'));
});

test('la paginación canónica de categorías evita barras duplicadas sin cambiar los enlaces del blog', () => {
  assert.equal(typeof publicRoutes.paginationPath, 'function');
  assert.equal(publicRoutes.paginationPath('/categorias/pediatria', 1, true), '/categorias/pediatria/');
  assert.equal(publicRoutes.paginationPath('/categorias/pediatria', 2, true), '/categorias/pediatria/2/');
  assert.equal(publicRoutes.paginationPath('/categorias/pediatria/', 3, true), '/categorias/pediatria/3/');
  assert.equal(publicRoutes.paginationPath('/blog', 1), '/blog');
  assert.equal(publicRoutes.paginationPath('/blog', 2), '/blog/2');
  for (const invalid of [0, -1, NaN]) assert.throws(() => publicRoutes.paginationPath('/categorias/pediatria', invalid, true));
});

test('el build empaqueta todos los alias exactos sin ciclos ni rutas privadas y actualiza el sitemap', () => {
  const expected = new Map([
    ['/contact/', '/contacto/'], ['/legal/privacy-policy/', '/legal/privacidad/'],
    ['/privacy-policy/', '/legal/privacidad/'], ['/legal/terms-of-service/', '/legal/terminos-y-condiciones/'],
    ...categories.map(category => [`/category/${category.slug}/`, `/categorias/${category.slug}/`]),
  ]);
  const rows = rules();
  const sources = new Set(rows.map(row => row.from));
  assert.equal(rows.length, expected.size * 2);
  assert.equal(sources.size, rows.length, 'No deben existir orígenes repetidos.');
  for (const row of rows) {
    const source = row.from.endsWith('/') ? row.from : row.from + '/';
    assert.equal(row.to, expected.get(source));
    assert.equal(row.status, '301');
    assert.equal(sources.has(row.to), false, 'El destino no debe volver a redirigir.');
    assert.doesNotMatch(row.from + row.to, /mis-estudios|\/api(?:\/|$)|\*|:splat/);
    page(row.to);
  }
  assert.equal(readFileSync(new URL('dist/_redirects', root), 'utf8'), readFileSync(new URL('public/_redirects', root), 'utf8'));
  const sitemap = readdirSync(new URL('dist/', root)).filter(name => /^sitemap.*\.xml$/.test(name))
    .map(name => readFileSync(new URL(`dist/${name}`, root), 'utf8')).join('');
  assert.ok(sitemap, 'Debe generarse el sitemap.');
  for (const [old, current] of expected) {
    assert.ok(sitemap.includes(`https://www.cefem.ar${current}`), current);
    assert.equal(sitemap.includes(`https://www.cefem.ar${old}`), false, old);
  }
});
