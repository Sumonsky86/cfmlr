import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const dist = process.env.CEFEM_BROWSER_DIST || fileURLToPath(new URL('../dist/', import.meta.url));
const page = (path) => readFileSync(resolve(dist, path), 'utf8');
const text = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

test('schema institucional identifica CEFEM con domicilio confirmado sin datos inventados', () => {
  for (const path of ['index.html', 'contacto/index.html', 'especialidades/index.html', '404.html']) {
    const html = page(path);
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const organization = schemas.find((schema) => schema['@type'] === 'MedicalOrganization');
    assert.ok(organization, path);
    assert.equal(organization['@id'], 'https://www.cefem.ar/#organization');
    assert.equal(organization.name, 'CEFEM Centro Familiar de Especialidades Médicas');
    assert.equal(organization.address.streetAddress, 'Boulevard Kemmis 843');
    assert.equal(organization.address.addressLocality, 'Las Rosas');
    assert.equal(organization.address.addressRegion, 'Santa Fe');
    assert.equal(organization.address.addressCountry, 'AR');
    assert.equal(organization.email, 'info@cefem.com.ar');
    assert.ok(!('telephone' in organization), 'No publicar teléfono E164 enmascarado');
    for (const unsupported of ['postalCode', 'priceRange', 'aggregateRating', 'review', 'award', 'medicalSpecialty']) {
      assert.ok(!JSON.stringify(organization).includes(`"${unsupported}"`), unsupported);
    }
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(text(footer).includes(organization.name));
    assert.ok(text(footer).includes(organization.address.streetAddress));
  }
});

test('demos del tema no generan rutas públicas ni redirecciones al inicio', () => {
  for (const path of ['components/index.html', 'theme-info/index.html', 'theme-info/TechSpecs/index.html']) {
    assert.equal(existsSync(resolve(dist, path)), false, path);
  }
  const redirects = page('_redirects');
  assert.doesNotMatch(redirects, /^\/(?:components|theme-info)(?:[\s/])/m);
});

test('sitemap usa URLs canónicas clínicas sin aliases ni fechas de compilación', () => {
  const sitemap = page('sitemap-0.xml');
  assert.equal(sitemap.includes('<lastmod>'), false, 'No asignar la fecha de compilación a contenido sin modificación confirmada');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length > 0);
  assert.equal(new Set(urls).size, urls.length);
  const aliasPaths = page('_redirects').split('\n').filter((line) => line.startsWith('/')).map((line) => line.split(/\s+/)[0].replace(/\/$/, ''));
  for (const url of urls) {
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://www.cefem.ar');
    const route = parsed.pathname.replace(/\/$/, '');
    assert.ok(!aliasPaths.includes(route), url);
    assert.doesNotMatch(route, /^\/(?:404|components|theme-info|prensa-entrevistas)(?:\/|$)/);
    assert.doesNotMatch(route, /^\/(?:mis-estudios\/|api(?:\/|$)|auth(?:\/|$))/);
    const html = page(parsed.pathname.replace(/^\//, '') + 'index.html');
    assert.ok(html.includes(`rel="canonical" href="${url}"`), url);
    assert.doesNotMatch(html, /name="robots" content="noindex/);
    assert.doesNotMatch(html, /http-equiv="refresh"/);
  }
  for (const path of ['/', '/especialidades/', '/clinica-medica/', '/urologia/', '/ecografias-las-rosas/', '/traumatologia/', '/ginecologia/', '/ginecologia-obstetricia/', '/blog/', '/categorias/pediatria/']) {
    assert.ok(urls.includes(`https://www.cefem.ar${path}`), path);
  }
  assert.match(page('robots.txt'), /Sitemap: https:\/\/www.cefem.ar\/sitemap-index.xml/);
});

test('los diez términos solicitados conservan destinos existentes sin crear páginas por sinónimo', () => {
  const destinations = new Map([
    ['clinica las rosas', '/'],
    ['cefem', '/'],
    ['centro de especialidades medicas', '/especialidades/'],
    ['centro familiar de especialidades medicas', '/'],
    ['cefem las rosas', '/'],
    ['clinico', '/clinica-medica/'],
    ['ecografias', '/ecografias-las-rosas/'],
    ['traumatologo las rosas', '/traumatologia/'],
    ['urologo las rosas', '/urologia/'],
    ['ginecologa las rosas', '/ginecologia/'],
  ]);
  assert.equal(destinations.size, 10);
  for (const [term, path] of destinations) {
    const html = page(path.slice(1) + 'index.html');
    assert.ok(html.includes(`rel="canonical" href="https://www.cefem.ar${path}"`), term);
    assert.match(html, /name="robots" content="index, follow"/);
    assert.match(html, /<h1\b/);
  }
  assert.ok(page('index.html').includes('href="/especialidades/"'));
});

test('404 española ofrece recuperación real y no se indexa', () => {
  const html = page('404.html');
  assert.match(html, /<html[^>]*lang="es-AR"/);
  assert.match(text(html), /Página no encontrada/);
  assert.match(text(html), /La página que buscás no existe o cambió de dirección/);
  assert.match(html, /name="robots" content="noindex, follow"/);
  for (const href of ['/', '/especialidades/', '/contacto/']) assert.ok(html.includes(`href="${href}"`), href);
  assert.doesNotMatch(text(html), /Page Not Found|Back to Homepage|The page you're looking/);
});
