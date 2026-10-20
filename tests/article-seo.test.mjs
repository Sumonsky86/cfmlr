import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'parse5';
import { parse as parseYaml } from 'yaml';
import { siteConfig } from '../src/data/config.ts';

const dist = process.env.ARTICLE_TEST_DIST || new URL('../dist/', import.meta.url);
const read = path => readFileSync(typeof dist === 'string' ? resolve(dist, path) : new URL(path, dist), 'utf8');
const descendants = node => [node, ...(node.childNodes || []).flatMap(descendants)];
const elements = (node, tag) => descendants(node).filter(n => n.tagName === tag);
const attr = (node, name) => node?.attrs?.find(a => a.name === name)?.value;
const text = node => node?.nodeName === '#text' ? node.value : (node?.childNodes || []).map(text).join('');
const normalizedText = node => text(node).replace(/\s+/g, ' ').trim();
const byClass = (node, name) => descendants(node).find(n => (attr(n, 'class') || '').split(/\s+/).includes(name));
const contentRoot = new URL('../src/content/blog/', import.meta.url);
const posts = readdirSync(contentRoot, { recursive: true }).filter(path => /\.mdx?$/.test(path)).map(path => {
  const raw = readFileSync(new URL(path.replaceAll('\\', '/'), contentRoot), 'utf8');
  return { slug: path.replaceAll('\\', '/').replace(/\.mdx?$/, ''), data: parseYaml(raw.split('---')[1]) };
});
const page = slug => parse(read(`blog/${slug}/index.html`));
const schemas = doc => elements(doc, 'script').filter(n => attr(n, 'type') === 'application/ld+json').flatMap(n => {
  const value = JSON.parse(text(n));
  return value['@graph'] || [value];
});

test('título, entradilla y metadatos comparten la columna de lectura y las migas reflejan el esquema', () => {
  for (const post of posts) {
    const doc = page(post.slug);
    const frame = byClass(doc, 'blog-reading-frame');
    const header = byClass(frame, 'article-header');
    assert.ok(header, `Falta la cabecera dentro de la columna editorial: ${post.slug}`);
    assert.equal(normalizedText(elements(header, 'h1')[0]), post.data.title);
    assert.equal(normalizedText(byClass(header, 'article-lead')), post.data.excerpt);
    assert.ok(byClass(header, 'blog-publish-date'));
    assert.equal(Boolean(byClass(doc, 'page-intro')), false, 'No debe coexistir la cabecera ancha anterior');
    const nav = elements(header, 'nav').find(n => attr(n, 'aria-label') === 'Ruta de navegación');
    assert.ok(nav, post.slug);
    const crumbs = elements(nav, 'li');
    assert.equal(crumbs.length, 3);
    assert.deepEqual(crumbs.map(normalizedText), ['Inicio', 'Blog', post.data.title]);
    assert.equal(attr(crumbs.at(-1), 'aria-current'), 'page');
    const breadcrumbSchemas = schemas(doc).filter(n => n['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumbSchemas.length, 1);
    const canonical = attr(elements(doc, 'link').find(n => attr(n, 'rel') === 'canonical'), 'href');
    assert.deepEqual(breadcrumbSchemas[0].itemListElement, crumbs.map((crumb, index) => ({
      '@type': 'ListItem', position: index + 1, name: normalizedText(crumb),
      item: index === crumbs.length - 1 ? canonical : new URL(attr(elements(crumb, 'a')[0], 'href'), siteConfig.siteUrl).href,
    })));
  }
});

test('el índice enlaza las secciones principales reales sin alterar sus niveles ni inventar temas', () => {
  let checked = 0;
  let withoutToc = 0;
  for (const post of posts) {
    const doc = page(post.slug);
    const content = descendants(doc).find(n => attr(n, 'data-blog-content') !== undefined);
    const h2s = elements(content, 'h2').filter(n => attr(n, 'id'));
    const sections = h2s.length ? h2s : elements(content, 'h3').filter(n => attr(n, 'id'));
    const toc = elements(byClass(doc, 'blog-article'), 'nav').find(n => attr(n, 'aria-label') === 'En este artículo');
    assert.equal(Boolean(toc), sections.length >= 2, `Índice condicionado a secciones útiles: ${post.slug}`);
    if (!toc) { withoutToc++; continue; }
    assert.deepEqual(elements(toc, 'a').map(n => [normalizedText(n), attr(n, 'href')]), sections.map(n => [normalizedText(n), `#${attr(n, 'id')}`]), post.slug);
    const frame = byClass(doc, 'blog-reading-frame');
    assert.ok(descendants(frame).includes(toc), 'El índice respeta la columna editorial');
    checked++;
  }
  assert.ok(checked > 0);
  assert.ok(withoutToc > 0, 'No fabricar un índice para el MDX sin secciones Markdown');
});

test('los enlaces contextuales apuntan a las páginas públicas de especialidad sin atribuir profesionales', () => {
  const specialties = new Map([
    ['Urología', '/urologia/'], ['Pediatría', '/pediatria/'],
    ['Ginecología', '/ginecologia/'], ['Nutrición', '/nutricion/'],
  ]);
  for (const post of posts) {
    const doc = page(post.slug);
    const expected = post.data.categories.filter(name => specialties.has(name));
    const context = byClass(doc, 'article-context');
    assert.equal(Boolean(context), expected.length > 0, post.slug);
    if (!context) continue;
    assert.deepEqual(elements(context, 'a').map(n => [normalizedText(n), attr(n, 'href')]), expected.map(name => [`Información de ${name}`, specialties.get(name)]));
    assert.doesNotMatch(normalizedText(context), /doctor|dra?\.|revisad|autor|disponib|equipo|especialista/i);
    for (const link of elements(context, 'a')) assert.ok(elements(parse(read(`${attr(link, 'href').replace(/^\//, '')}index.html`)), 'h1').length, attr(link, 'href'));
  }
});

test('la serialización JSON-LD mantiene inertes cierres de script y etiquetas procedentes del contenido', async () => {
  const helper = await import('../src/utils/article-seo.ts').catch(() => null);
  assert.equal(typeof helper?.serializeJsonLd, 'function', 'Falta un serializador JSON-LD seguro y compartido');
  const payload = { headline: '</script><script>alert("x")</script><!--', description: '<b>Texto</b> & salud', nested: ['<', 'á', '\u2028'] };
  const serialized = helper.serializeJsonLd(payload);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), payload);
  const doc = parse(`<script type="application/ld+json">${serialized}</script>`);
  assert.equal(elements(doc, 'script').length, 1);
  assert.deepEqual(JSON.parse(text(elements(doc, 'script')[0])), payload);
});

test('la imagen editorial declara la proporción real del archivo generado, sin deformación ni reserva falsa', async () => {
  const { default: sharp } = await import('sharp');
  const { fileURLToPath } = await import('node:url');
  const base = typeof dist === 'string' ? dist : fileURLToPath(dist);
  for (const post of posts) {
    const image = byClass(page(post.slug), 'blog-featured-image');
    if (!image) continue;
    const dimensions = await sharp(resolve(base, decodeURIComponent(attr(image, 'src').replace(/^\//, '')))).metadata();
    const ratio = Number(attr(image, 'width')) / Number(attr(image, 'height'));
    assert.ok(Math.abs(ratio - dimensions.width / dimensions.height) < 0.01, `${post.slug}: atributos e imagen difieren (${attr(image, 'width')}×${attr(image, 'height')} frente a ${dimensions.width}×${dimensions.height})`);
  }
});

test('cada artículo declara solo hechos editoriales reales y OpenGraph de artículo', () => {
  for (const post of posts) {
    const doc = page(post.slug);
    const items = schemas(doc).filter(n => n['@type'] === 'BlogPosting');
    assert.equal(items.length, 1, `Falta un BlogPosting único: ${post.slug}`);
    const article = items[0];
    const canonical = attr(elements(doc, 'link').find(n => attr(n, 'rel') === 'canonical'), 'href');
    assert.equal(article['@context'], 'https://schema.org');
    assert.equal(article.headline, post.data.title);
    assert.equal(article.description, post.data.excerpt);
    assert.equal(article.datePublished, new Date(post.data.publishDate).toISOString());
    assert.equal(article.url, canonical);
    assert.deepEqual(article.mainEntityOfPage, { '@type': 'WebPage', '@id': canonical });
    assert.equal(article.inLanguage, 'es-AR');
    assert.deepEqual(article.publisher, { '@type': 'Organization', name: siteConfig.companyName, url: siteConfig.siteUrl });
    for (const invented of ['author', 'reviewedBy', 'dateModified', 'lastReviewed']) assert.equal(invented in article, false, `${invented}: ${post.slug}`);
    const socialImage = attr(elements(doc, 'meta').find(n => attr(n, 'property') === 'og:image'), 'content');
    assert.equal(article.image, socialImage);
    assert.equal(attr(elements(doc, 'meta').find(n => attr(n, 'property') === 'og:type'), 'content'), 'article');
    assert.equal(attr(elements(doc, 'meta').find(n => attr(n, 'property') === 'article:published_time'), 'content'), article.datePublished);
  }
  for (const path of ['index.html', 'blog/index.html', 'categorias/urologia/index.html']) {
    const doc = parse(read(path));
    assert.equal(attr(elements(doc, 'meta').find(n => attr(n, 'property') === 'og:type'), 'content'), 'website', path);
    assert.equal(schemas(doc).filter(n => n['@type'] === 'BlogPosting').length, 0, path);
    assert.equal(elements(doc, 'meta').filter(n => attr(n, 'property') === 'article:published_time').length, 0, path);
  }
});
