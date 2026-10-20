import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { parse } from 'parse5';
import { parse as parseYaml } from 'yaml';
import { parse as parseCss } from 'postcss';
import { categories } from '../src/data/categories.ts';
import { categoryPath, paginationPath } from '../src/utils/public-routes.ts';
import { createHash } from 'node:crypto';
import { blogSetting, SEO, siteConfig } from '../src/data/config.ts';

const contentRoot = new URL('../src/content/blog/', import.meta.url);
const posts = readdirSync(contentRoot, { recursive: true }).filter(path => /\.mdx?$/.test(path)).map(path => {
  const raw = readFileSync(new URL(path.replaceAll('\\', '/'), contentRoot), 'utf8');
  return { slug: path.replaceAll('\\', '/').replace(/\.mdx?$/, ''), data: parseYaml(raw.split('---')[1]) };
});
const published = posts.filter(post => post.data.publish !== false);

// Historical fingerprints, plus the user-authorized Doppler correction and new October article.
// Their dedicated editorial/campaign tests also enforce provenance, dates and safe claims.
const baseline = {
  'blog/index.html': ['9c9e788f96352d685b65df51113d3d0d7ba4db95a7d0d705de3518fe818febb7'],
  'blog/2/index.html': ['6c414189cfaa92ea62dafc32e0c86f0d9b9ebcc0a8bdc9b2942809972194cd6a'],
  'blog/chequeo-anual-salud/index.html': ['9e3d5717454a4d2e22224139189a721a0e4cc78d2c4417028570c61444a9fdfa', 'f009ace710a838a27b0588a0079412fe7cf5d36ad279e7c8293dd316462f3d15'],
  'blog/como-sacar-turno/index.html': ['65505f4e6ab7ba855a253aec81a2d7dcc197ba4889bb421244b6e483ebc00fca', 'bee7c46ee771f5dadcc6293df2830bf215f3bdd2581bc7aad57458a74a723094'],
  'blog/conoce-cefem/index.html': ['b231b49e1f467095e1b256c3726d5c3cdbd4f8aa91bc8b1fa8867753b65dafc8', 'aa044cd686b5466aa2c30df5384718329357ffea46806fdb5caf6911090f2203'],
  'blog/controles-pediatricos/index.html': ['67b6f20050573ce8129a98121be30b6725f313e5e10c215613fab93441c00987', '11209005588364c2213f62cb80e3502542e59530db34812f658577dc7b18d0f3'],
  'blog/cronologia-entrevistas-servicios/index.html': ['aacd1b54131d09025160c8f060b48c98d0b72d821263ed16ed08f939dc3dcfe5', '36f5296afb0ec8993377a831f0f027b17325e8c6ae5cb34f2e22c9f5e32c6d43'],
  'blog/doppler-embarazo-cuando-hacerlo/index.html': ['85634f4fbac64fd1ef9947e8b2db845e2e21e99b71457f188d747fb30422e8cf', '74a4d25234e5d898a776838bc452e8aa877d1140ea6077759be59b0ac27169d8'],
  'blog/octubre-rosa/index.html': ['7e4a8257b96ee13ce02db1441580113ade64e81fd56ddd105b0219f6ca27c994', '8652ac7e59bec8321b42104be330c9b15c0bf776b9a9c1b0a2fc9239ec39db6b'],
  'blog/guia-primera-visita-ginecologo/index.html': ['15e7ba92279cb1763734939faff514ea6b82b9a046bae1dbfba4b01c5c6c1630', 'c22fd0078fb1afbf4cb6c5a6f2ec759b0f2f21641d8fb2dbc49e7b7010abd61e'],
  'blog/nuestras-especialidades-blog/index.html': ['42201715c31dfd05ae96dfa6ea4b72f3b1e65c1cddf4de34a4252090b8eec600', '8ffeed44fe463b5a2d7ea0652baa2c83f6b2b205a45c1a68c5174a60d8c49edc'],
  'blog/nutricion-balanceada/index.html': ['812190f391326600d12c06511d964554f8831172108fa1a9f8217642ee82145d', '113effd730c7c5a33494f604019c3503dc2c433320e84ab6ec84c780177bbf5f'],
  'blog/pediatria/beneficios-lactancia-materna/index.html': ['4ec9c05960063aa7c0fa8e5c61e843b9d59bfdd048c12a816074a23adce0c1d0', 'b7c3003e2d67090aea1690a980b2f5c42c71f60d3795d387c2519f2b08cb3aa0'],
  'blog/urologia/prevencion-cancer-prostata/index.html': ['12c803e79425b094133425eab9fc6f44cf1e13bbf19d755f0dda37d5acf30eee', 'f0d4ae71c50311b988fe851bd894ad3e83617444b79d4fe82daa636491c33173'],
  'categorias/especialidades/index.html': ['ef6678dba05237e6a1830eac630a34fbb43c2b4e43e2a6a0eb05fda458665ccd'],
  'categorias/ginecologia/index.html': ['c607f9b308f7b2519dd3cc71c7422fa0ae762c291feac36715ca895acd787fe9'],
  'categorias/guias/index.html': ['0834eaaa1b2d9853886a9d04827bd4f92b3316e76aad155d94879ec299efa2d3'],
  'categorias/institucional/index.html': ['8bb6cf47d7ef115b616bdc3509773fd6db9c25278d343715cb6ef97c53056465'],
  'categorias/medicina-general/index.html': ['f402ccbc970046910c05c5c1665157f2ed80b346e998b72482426207278f718d'],
  'categorias/nutricion/index.html': ['d2f024d947306543eec5bbae9653e70593761a4860727701014b001f96ae2d4c'],
  'categorias/pediatria/index.html': ['1043db70f49dc2fb52fe6eeb284e7c694008bb715991f6438f93ac5951565dd0'],
  'categorias/salud-preventiva/index.html': ['95b746b8cdc4ad2799d3ad302eb4b1c9877e0adcab1c042dcd1bc2245e5aa874'],
  'categorias/urologia/index.html': ['d843185dcc5cc558106ed56b5f77d17f90ca7a0848e81542e2b3b7893e7f4672'],
};
const sourceHashes = {
  'chequeo-anual-salud.md': 'e375e9ac04aec617e7f0865ca7ee56925e12fc08a376d2319026bf963fb4d499',
  'como-sacar-turno.md': '4cb0d7d312e6b9189fadebd59cf579ca9949a7050d10d441b6a29e38ee637ea6',
  'conoce-cefem.md': 'b8a3edb66e6dcfc95f925d19cb5ecec31700de6d55e94afabe8a50ea39b3cf77',
  'controles-pediatricos.mdx': '9b5373e5aa5ef2913e990945fa111ee347ef9c522aec73c139943d1f2c5d3349',
  'cronologia-entrevistas-servicios.mdx': '67081733ad8eb214cde3518267a3c0527f029dd2219743a70421c5e16c74b3eb',
  'doppler-embarazo-cuando-hacerlo.mdx': 'c03c80be292c2f9da1057c28c68f1b706d6b75d490862a6cefc1e4b83e6cebfd',
  'octubre-rosa.mdx': 'eb564ceb79fbb38a0a34866032b52149104c41826095465081f3dd25e359937a',
  'guia-primera-visita-ginecologo.md': '0c9c1198dcaa5200ed217abfa20227d420a1bf7a731795c233a1166e10041bfe',
  'nuestras-especialidades-blog.md': '016d75b044cca9cc229ba5608f4f4fdf1d7f442b03f330754d00dd6ff068892c',
  'nutricion-balanceada.md': 'a52c8d61b435b8d030b3d55935fddabbeeca78dddc43d33b7efcec929a553dad',
  'pediatria/beneficios-lactancia-materna.md': '1d71927965711ad82c99994447deb24458c2528ba4b21d111fabcef0acf389c1',
  'urologia/prevencion-cancer-prostata.md': '626637d3e0a53d769ab066f8adacbfcade2e7c5d0584e022d6b860972ca82e3f',
};
const sha256 = value => createHash('sha256').update(value).digest('hex');

const dist = process.env.ARTICLE_TEST_DIST ? pathToFileURL(resolve(process.env.ARTICLE_TEST_DIST) + '/') : new URL('../dist/', import.meta.url);
const read = path => readFileSync(new URL(path, dist), 'utf8');
const descendants = node => [node, ...(node.childNodes || []).flatMap(descendants)];
const elements = (node, tag) => descendants(node).filter(n => n.tagName === tag);
const attr = (node, name) => node?.attrs?.find(a => a.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const normalizedText = node => text(node).replace(/\s+/g, ' ').trim();
const byClass = (node, name) => descendants(node).find(n => hasClass(n, name));
const page = path => parse(read(path));
const categoryPaths = readdirSync(new URL('categorias/', dist)).map(slug => `categorias/${slug}/index.html`);
const listingPaths = ['blog/index.html', 'blog/2/index.html', ...categoryPaths];

test('listados y categorías comparten el marco institucional sin main anidado', () => {
  const home = page('index.html');
  for (const path of listingPaths) {
    const doc = page(path);
    assert.ok(hasClass(elements(doc, 'body')[0], 'institutional-surface'), path);
    assert.equal(elements(doc, 'main').length, 1, path);
    assert.equal(elements(doc, 'h1').length, 1, path);
    assert.ok(byClass(doc, 'page-intro'), path);
    assert.equal(normalizedText(elements(doc, 'footer')[0]), normalizedText(elements(home, 'footer')[0]), path);
    assert.equal(attr(descendants(doc).find(n => attr(n, 'id') === 'whatsappCta'), 'href'), 'https://wa.me/5493471341461', path);
    assert.ok(descendants(doc).some(n => attr(n, 'id') === 'whatsapp-dismiss'), path);
  }
});

test('tarjetas semánticas conservan datos reales y ofrecen enlaces independientes', () => {
  for (const path of listingPaths) {
    const doc = page(path);
    const cards = elements(doc, 'article').filter(n => hasClass(n, 'blog-card'));
    const category = categories.find(c => path === `categorias/${c.slug}/index.html`);
    const expectedPosts = published.filter(p => !category || p.data.categories.includes(category.name))
      .sort((a, b) => new Date(b.data.publishDate) - new Date(a.data.publishDate));
    const start = path === 'blog/2/index.html' ? blogSetting.postsPerPage : 0;
    const expected = expectedPosts.slice(start, start + blogSetting.postsPerPage);
    assert.equal(cards.length, expected.length, path);
    cards.forEach((card, index) => {
      const post = expected[index];
      const href = `/blog/${post.slug}`;
      const title = elements(card, 'h2')[0];
      assert.equal(normalizedText(title), post.data.title, href);
      assert.equal(attr(elements(title, 'a')[0], 'href'), href);
      assert.equal(normalizedText(byClass(card, 'blog-card-excerpt')), post.data.excerpt);
      assert.equal(attr(elements(card, 'time')[0], 'datetime'), new Date(post.data.publishDate).toISOString());
      const readLink = elements(card, 'a').find(n => normalizedText(n) === 'Leer artículo →');
      assert.equal(attr(readLink, 'href'), href);
      if (post.data.featuredImage) {
        const img = elements(card, 'img')[0];
        assert.equal(attr(img, 'alt'), post.data.featuredImage.alt);
        assert.ok(attr(img, 'src').includes(post.data.featuredImage.src.split('/').at(-1).split('.')[0] + '.'));
        assert.equal(attr(img.parentNode, 'href'), href);
      } else assert.equal(elements(card, 'img').length, 0);
      const expectedCategories = post.data.categories.map(name => categories.find(c => c.name === name)).filter(Boolean);
      const topics = byClass(card, 'blog-card-topics');
      assert.deepEqual(elements(topics, 'a').map(a => [normalizedText(a), attr(a, 'href')]), expectedCategories.map(c => [c.name, categoryPath(c.slug)]));
      for (const link of elements(card, 'a')) assert.equal(elements(link, 'a').length, 1, 'No debe haber enlaces anidados');
    });
  }
});

test('artículos conservan una sola imagen editorial, fecha original y lectura institucional', () => {
  const home = page('index.html');
  for (const post of posts) {
    const path = `blog/${post.slug}/index.html`;
    const doc = page(path);
    assert.ok(hasClass(elements(doc, 'body')[0], 'institutional-surface'), path);
    assert.equal(elements(doc, 'main').length, 1, path);
    assert.equal(elements(doc, 'h1').length, 1, path);
    assert.equal(normalizedText(elements(doc, 'h1')[0]), post.data.title, path);
    const article = byClass(doc, 'blog-article');
    assert.ok(article, path);
    const content = descendants(article).find(n => attr(n, 'data-blog-content') !== undefined);
    assert.ok(content, path);
    assert.ok(hasClass(content, 'institutional-reading'));
    const date = byClass(article, 'blog-publish-date');
    assert.equal(attr(date, 'datetime'), new Date(post.data.publishDate).toISOString(), path);
    assert.equal(normalizedText(date), new Date(post.data.publishDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
    const editorialImages = elements(article, 'img').filter(n => !descendants(content).includes(n));
    assert.equal(editorialImages.length, post.data.featuredImage ? 1 : 0, path);
    if (editorialImages.length) assert.equal(attr(editorialImages[0], 'alt'), post.data.featuredImage.alt);
    const topics = byClass(article, 'blog-article-topics');
    assert.deepEqual(elements(topics, 'a').map(a => [normalizedText(a), attr(a, 'href')]), post.data.categories.map(name => {
      const c = categories.find(c => c.name === name);
      return [name, categoryPath(c.slug)];
    }));
    assert.equal(normalizedText(elements(doc, 'footer')[0]), normalizedText(elements(home, 'footer')[0]));
    assert.ok(descendants(doc).some(n => attr(n, 'id') === 'whatsapp-dismiss'));
  }
});

test('relacionados reutilizan tarjetas, sin incluir el artículo actual ni borradores', () => {
  for (const post of posts) {
    const path = `blog/${post.slug}/index.html`;
    const doc = page(path);
    const eligible = published.filter(p => p.slug !== post.slug && p.data.categories.some(c => post.data.categories.includes(c)));
    const section = byClass(doc, 'blog-related');
    assert.equal(Boolean(section), eligible.length > 0, path);
    if (!section) continue;
    assert.equal(normalizedText(elements(section, 'h2')[0]), 'Artículos relacionados');
    const cards = elements(section, 'article').filter(n => hasClass(n, 'blog-card'));
    assert.equal(cards.length, Math.min(eligible.length, 3), path);
    const seen = new Set();
    cards.forEach(card => {
      const heading = elements(card, 'h3')[0];
      const related = eligible.find(p => p.data.title === normalizedText(heading));
      assert.ok(related, path);
      assert.ok(!seen.has(related.slug), path);
      seen.add(related.slug);
      assert.equal(attr(elements(heading, 'a')[0], 'href'), `/blog/${related.slug}`);
      assert.equal(normalizedText(byClass(card, 'blog-card-excerpt')), related.data.excerpt);
      assert.equal(attr(elements(card, 'time')[0], 'datetime'), new Date(related.data.publishDate).toISOString());
      assert.equal(elements(card, 'h2').length, 0);
      for (const link of elements(card, 'a')) assert.equal(elements(link, 'a').length, 1);
      assert.ok(elements(card, 'a').every(a => attr(a, 'href') !== `/blog/${post.slug}`));
    });
  }
});

test('el layout institucional conserva la regla histórica del sufijo SEO', () => {
  const source = readFileSync(new URL('../src/layouts/InstitutionalLayout.astro', import.meta.url), 'utf8');
  const rule = source.match(/const normalizedSiteName[\s\S]+?(?=const canonical =)/)?.[0];
  assert.ok(rule, 'Falta la regla histórica de composición del título');
  const resolveTitle = new Function('title', 'SEO', 'siteConfig', `${rule}; return pageTitle;`);
  assert.equal(resolveTitle('Artículo de salud', SEO, siteConfig), `Artículo de salud ${SEO.Separator} ${SEO.SiteName}`);
  assert.equal(resolveTitle('CEFEM: salud', SEO, siteConfig), 'CEFEM: salud');
  assert.equal(resolveTitle(SEO.SiteName.toUpperCase(), SEO, siteConfig), SEO.SiteName.toUpperCase());
  assert.equal(resolveTitle('', SEO, siteConfig), SEO.SiteName);
  assert.equal(resolveTitle('Nota', { ...SEO, SiteName: 'Nombre institucional' }, siteConfig), `Nota ${SEO.Separator} Nombre institucional`);
  for (const element of ['<title>{pageTitle}</title>', 'property="og:title" content={pageTitle}', 'name="twitter:title" content={pageTitle}']) assert.ok(source.includes(element), element);
});

test('protege las rutas, metadatos y cuerpos, incluidas las correcciones editoriales autorizadas', () => {
  const actualPaths = ['blog', 'categorias'].flatMap(root => readdirSync(new URL(`${root}/`, dist), { recursive: true })
    .map(path => `${root}/${path.replaceAll('\\', '/')}`).filter(path => path.endsWith('index.html')));
  assert.deepEqual(actualPaths.sort(), Object.keys(baseline).sort());
  const semantic = node => node.nodeName === '#text' ? node.value.replace(/\s+/g, ' ').trim() : [node.tagName || '',
    (node.attrs || []).filter(a => ['href', 'src', 'alt', 'datetime', 'data-id', 'data-video-id', 'data-video-title', 'type'].includes(a.name)).map(a => [a.name, a.value]).sort(),
    (node.childNodes || []).map(semantic).filter(v => v !== '')];
  for (const [path, [headHash, bodyHash]] of Object.entries(baseline)) {
    const doc = page(path);
    const head = elements(doc, 'head')[0];
    const metadata = Object.fromEntries(elements(head, 'meta')
      .filter(n => ['description', 'robots', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].includes(attr(n, 'name')) || attr(n, 'property')?.startsWith('og:'))
      .map(n => [attr(n, 'name') || attr(n, 'property'), attr(n, 'content')]).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
    // Only article og:type intentionally changes; retain the original fingerprint
    // for every other social field, title, description, image and canonical URL.
    assert.equal(metadata['og:type'], bodyHash ? 'article' : 'website', path);
    if (bodyHash) {
      const post = posts.find(p => path === `blog/${p.slug}/index.html`);
      assert.equal(attr(elements(head, 'meta').find(n => attr(n, 'property') === 'article:published_time'), 'content'), new Date(post.data.publishDate).toISOString(), path);
      metadata['og:type'] = 'website';
    }
    const original = { canonical: attr(elements(head, 'link').find(n => attr(n, 'rel') === 'canonical'), 'href'), meta: metadata, title: text(elements(head, 'title')[0]) };
    assert.equal(sha256(JSON.stringify(original)), headHash, `Metadatos alterados: ${path}: ${JSON.stringify(original)}`);
    assert.ok(elements(head, 'script').some(n => attr(n, 'type') === 'application/ld+json' && text(n).includes('MedicalOrganization')), path);
    assert.doesNotMatch(read(path), /titan-core\.vercel\.app/);
    if (bodyHash) {
      const content = descendants(doc).find(n => attr(n, 'data-blog-content') !== undefined);
      assert.ok(content, path);
      assert.equal(sha256(JSON.stringify((content.childNodes || []).map(semantic).filter(v => v !== ''))), bodyHash, `Contenido alterado: ${path}`);
    }
  }
  for (const [path, hash] of Object.entries(sourceHashes)) assert.equal(sha256(readFileSync(new URL(path, contentRoot))), hash, path);
});

test('la anchura editorial vence al contenedor compartido en el CSS servido', () => {
  const doc = page('blog/nutricion-balanceada/index.html');
  const styles = elements(doc, 'link').filter(n => attr(n, 'rel') === 'stylesheet').map(n => read(attr(n, 'href').replace(/^\//, '')));
  styles.push(...elements(doc, 'style').map(text));
  const candidates = [];
  for (const css of styles) parseCss(css).walkRules(rule => {
    for (const selector of rule.selector.split(',')) {
      if (!/\.blog-reading-frame(?:\[|\s|$)/.test(selector) && selector.trim() !== 'body.institutional-surface .wrap') continue;
      const declaration = rule.nodes.find(n => n.prop === 'max-width');
      if (!declaration) continue;
      // These two matching selectors contain only type, class and attribute selectors.
      const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]/g) || []).length;
      const types = (selector.replace(/\.[\w-]+|\[[^\]]+\]/g, '').match(/\b[a-z][\w-]*\b/g) || []).length;
      candidates.push({ selector, value: declaration.value, weight: classes * 100 + types, order: candidates.length });
    }
  });
  assert.ok(candidates.length >= 2, 'Comparar la regla editorial con el contenedor de 1180 px');
  candidates.sort((a, b) => b.weight - a.weight || b.order - a.order);
  assert.equal(candidates[0].value, '780px', JSON.stringify(candidates));
});

test('CSS del blog mantiene tres, dos y una columnas y el Markdown queda acotado', () => {
  const readRules = path => {
    const doc = page(path);
    const css = elements(doc, 'link').filter(n => attr(n, 'rel') === 'stylesheet').map(n => read(attr(n, 'href').replace(/^\//, ''))).join('\n') + elements(doc, 'style').map(text).join('\n');
    const rules = [];
    parseCss(css).walkRules(rule => rules.push(rule));
    return rules;
  };
  for (const [path, grid] of [['blog/index.html', '.blog-grid'], ['blog/nutricion-balanceada/index.html', '.blog-related-grid']]) {
    const rules = readRules(path).filter(rule => rule.selector.startsWith(`${grid}[`));
    const columns = rules.map(rule => ({ media: rule.parent.type === 'atrule' ? rule.parent.params.replace(/\s/g, '') : '', value: rule.nodes.find(n => n.prop === 'grid-template-columns')?.value })).filter(rule => rule.value);
    assert.deepEqual(columns, [
      { media: '', value: 'repeat(3,minmax(0,1fr))' },
      { media: '(max-width:1000px)', value: 'repeat(2,minmax(0,1fr))' },
      { media: '(max-width:650px)', value: 'minmax(0,1fr)' },
    ]);
  }
  const reading = readRules('blog/nutricion-balanceada/index.html').filter(rule => rule.selector.includes('.institutional-reading['));
  assert.ok(reading.length > 15);
  for (const rule of reading) for (const selector of rule.selector.split(',')) assert.ok(selector.trim().startsWith('.institutional-reading['), selector);
  for (const [element, prop, value] of [['p', 'font-size', '16px'], ['h2', 'font-family', 'var(--serif)'], ['pre', 'overflow-x', 'auto'], ['table', 'overflow-x', 'auto'], ['a', 'text-decoration', 'underline']]) {
    assert.ok(reading.some(rule => rule.selector.split(',').some(s => new RegExp(`\\] ${element}$`).test(s)) && rule.nodes.some(n => n.prop === prop && n.value === value)), `${element}: ${prop}`);
  }
  for (const path of [...listingPaths, ...posts.map(p => `blog/${p.slug}/index.html`)]) {
    for (const [card] of read(path).matchAll(/<article\b[^>]*class="blog-card"[\s\S]*?<\/article>/g)) {
      let open = false;
      for (const [, closing] of card.matchAll(/<(\/?)a(?:\s[^>]*)?>/g)) {
        if (!closing) assert.equal(open, false, `Enlace anidado: ${path}`);
        open = !closing;
      }
      assert.equal(open, false, path);
    }
  }
});

test('artículos con YoutubeLite conservan el activador de video existente', () => {
  // Vite may factor the shared player into a clinical-page chunk. Inspect only
  // modules actually imported by this article, not unrelated files in dist.
  const moduleSources = (source, base, seen = new Set()) => {
    const code = base ? read(base.replace(/^\//, '')) : source;
    const sources = [code];
    for (const match of code.matchAll(/(?:import|export)\s*(?:[^'";]*?\bfrom\s*)?['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      if (!specifier.startsWith('.') && !specifier.startsWith('/_astro/')) continue;
      const path = new URL(specifier, `https://local.invalid${base || '/'}`).pathname;
      if (seen.has(path)) continue;
      seen.add(path);
      sources.push(...moduleSources('', path, seen));
    }
    return sources;
  };
  let checked = 0;
  for (const post of posts) {
    const doc = page(`blog/${post.slug}/index.html`);
    if (!byClass(doc, 'yt-lite')) continue;
    const modules = elements(doc, 'script').filter(n => attr(n, 'type') === 'module').flatMap(n => moduleSources(text(n), attr(n, 'src'))).join('\n');
    assert.ok(modules.includes('youtube-nocookie.com/embed/'), post.slug);
    assert.ok(modules.includes('.yt-lite'), post.slug);
    assert.ok(modules.includes('cefem:video_play'), post.slug);
    checked++;
  }
  assert.ok(checked > 0, 'Se deben comprobar los MDX reales que incluyen YoutubeLite');
});

test('filtros y paginación hablan español y cuentan la categoría actual', () => {
  for (const path of listingPaths) {
    const doc = page(path);
    const main = elements(doc, 'main')[0];
    const category = categories.find(c => path === `categorias/${c.slug}/index.html`);
    const expectedPosts = published.filter(p => !category || p.data.categories.includes(category.name));
    const currentPage = path === 'blog/2/index.html' ? 2 : 1;
    const shown = Math.min(blogSetting.postsPerPage, expectedPosts.length - (currentPage - 1) * blogSetting.postsPerPage);
    assert.ok(normalizedText(main).includes('Filtrar por tema'), path);
    assert.equal(normalizedText(byClass(main, 'blog-count')), `Mostrando ${shown} de ${expectedPosts.length} artículos`, path);
    const filters = elements(main, 'nav').find(n => attr(n, 'aria-label') === 'Temas del blog');
    assert.ok(filters, path);
    const links = elements(filters, 'a');
    assert.equal(normalizedText(links[0]), 'Todos');
    assert.equal(attr(links[0], 'href'), '/blog');
    for (const c of categories.filter(c => published.some(p => p.data.categories.includes(c.name)))) {
      const link = links.find(a => normalizedText(a) === c.name);
      assert.equal(attr(link, 'href'), categoryPath(c.slug), c.name);
      assert.equal(attr(link, 'aria-current'), category?.name === c.name ? 'page' : undefined);
    }
    assert.equal(attr(links[0], 'aria-current'), category ? undefined : 'page');
    assert.doesNotMatch(normalizedText(main), /Filter by|Show All|Showing|Previous|Next|posts found/);
    if (!category) {
      const pager = elements(main, 'nav').find(n => attr(n, 'aria-label') === 'Paginación del blog');
      assert.ok(pager, path);
      assert.ok(normalizedText(pager).includes(currentPage === 1 ? 'Siguiente' : 'Anterior'));
      const targetPage = currentPage === 1 ? 2 : 1;
      assert.ok(elements(pager, 'a').some(a => attr(a, 'href') === paginationPath('/blog', targetPage)));
      assert.equal(elements(pager, 'a').filter(a => attr(a, 'aria-current') === 'page').length, 1);
    }
  }
});
