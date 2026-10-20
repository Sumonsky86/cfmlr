import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';
import vm from 'node:vm';
import { parse as parseCss } from 'postcss';
import { createHash } from 'node:crypto';
import { publicInterviewGroups } from '../src/data/public-interviews.ts';

const dist = process.env.CLINICAL_TEST_DIST || path.resolve('dist');
const htmlFor = slug => readFileSync(path.join(dist, slug, 'index.html'), 'utf8');

function assertClinicalFrame(slug) {
  const html = htmlFor(slug);
  assert.match(html, /<body class="institutional-surface"/, `${slug}: institutional shell`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${slug}: one main`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${slug}: one H1`);
  assert.match(html, /class="page-intro"/, `${slug}: typographic intro`);
  assert.match(html, /class="clinical-content"/, `${slug}: bounded clinical region`);
  assert.doesNotMatch(html, /blog-hero-2/, `${slug}: no generic stock hero`);
}

test('nutrition renders in the institutional public frame', () => {
  assertClinicalFrame('nutricion');
});

const jsonLdFor = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
function assertClinicalFaq(slug) {
  const html = htmlFor(slug);
  const faqRegion = html.match(/<section\b[^>]*class="clinical-faq"[\s\S]*?<\/section>/)?.[0];
  assert.ok(faqRegion, `${slug}: native FAQ region`);
  assert.equal((faqRegion.match(/<details\b/g) || []).length, 3);
  assert.equal((faqRegion.match(/<summary\b/g) || []).length, 3);
  const schemas = jsonLdFor(html).filter(item => item['@type'] === 'FAQPage');
  assert.equal(schemas.length, 1, `${slug}: exactly one valid FAQ schema`);
  assert.equal(schemas[0].mainEntity.length, 3);
  for (const question of schemas[0].mainEntity) {
    assert.ok(faqRegion.includes(question.name));
    assert.ok(faqRegion.includes(question.acceptedAnswer.text));
  }
}

test('nutrition FAQs are native disclosures with matching valid JSON-LD', () => {
  assertClinicalFaq('nutricion');
});

function assertClinicalCta(slug, service) {
  const html = htmlFor(slug);
  const cta = html.match(/<section\b[^>]*class="clinical-cta"[\s\S]*?<\/section>/)?.[0];
  assert.ok(cta, `${slug}: compact clinical CTA`);
  assert.ok(cta.includes(`href="${service ? `/turnos/?especialidad=${service}` : '/turnos/'}"`), `${slug}: valid appointment destination`);
  assert.match(cta, /href="https:\/\/wa.me\/5493471341461"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/, `${slug}: preserve safe WhatsApp destination`);
}

test('nutrition CTA links to the existing service selector and original WhatsApp', () => {
  assertClinicalCta('nutricion', 'nutrition');
});

// Portable fingerprints from the supplied pre-migration snapshot.
const baseline = {
  "nutricion": {
    "seo": "3145415dd26df0412da809d0fabb4d25a371d8aa062400305b98f040469e54d6",
    "clinical": "e33e9c5329d3d19882eb9104449f508db881bcae73dbb3201caa0eef869b8c57",
    "arrays": {
      "nutritionApproach": "8ea02a95959bd9429e79cf5a8b7d46f711a1bb7ceae1862d805c9f68e2cfc3a3",
      "programAreas": "416eb1905d80e4ed07374f720dff995383fe790bb7e9edfb363314ee6619dc7c",
      "faqItems": "127344128cf0b97e37e805a9b41b6a541229b3cde7059310d26ff1571aaaadb0"
    },
    "literalLinks": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "cta": "2b3a0f0ffccccfa4c5459db3d77ba26e060189d586a2bab50588bd70b319902a"
  },
  "pediatria": {
    "seo": "1fb24bbf5622c65c7b309dec55065c13b282226dc1a135fcf84e673782457b80",
    "clinical": "c1a6d4a187ac70308ac481a056015f35ad82e5be3d39d4ae84624ea41aac9112",
    "arrays": {
      "visitHighlights": "b54496f398d447170665089f2996180c546159c1836bdf685096a86be9b9f823",
      "serviceBlocks": "c93139f6bbbf1e94554122f32cab74af4fb39216f3d55217009fe9744e5e5920",
      "faqItems": "0ed32635aac079f40f8df48895b2f085e9741df3d6aa7c9d390cc59e90c84e87"
    },
    "literalLinks": "8879aa4f0ef9652d67a2ea90a2a3b5edf551650e7432acba63ce841191bbe4dc",
    "cta": "2a33a293e3a4e5d48214c16f2ea7e09ec874b7fa4ca754ced84a36f441a71773"
  },
  "traumatologia": {
    "seo": "ae986a56cbed5f39f29e0a83a580d1e93a7e5c17d16e5ff1e939d5b406bb4c75",
    "clinical": "4497425f7bdf46ebe415ee21d402560882452ee46c4dd6ab168609ac425023d4",
    "arrays": {
      "careAreas": "7b3f75f3fb1a9fa03f7c62341bbdd1b77e37388682b965dc8a089af630ea2e3c",
      "faqItems": "a483fdb10d2a104b3e3801441653bfb0b05b21ce2b7d659c91be7d574f2fec71"
    },
    "literalLinks": "8d3efeae87c3ccc8f4ae896e3598138044821eab7984f3b22e45ba7f21a41ac7",
    "cta": "7d7d81e31de9248c9bf057090567cdb4df4d6fb5d6e745da5c168bc2b2d03e09"
  },
  "ginecologia": {
    "seo": "2e84c3b6bd0c23b0e75f24d7fafd87558a260567d649b50647eaae28a330d76d",
    "clinical": "cc72e302b92b33ab03587be3f11f59873de34d48a3ff3f314ac888770639c114",
    "arrays": {
      "careHighlights": "d038ec436e1dce7c95b653a6759cab0c2432a1de55a37a08263e28f7e3ca5865",
      "services": "2d65f5a2143d505be4995f374923d58dab4c2de53e2e1f36c94451bc37d70ece",
      "faqItems": "220209dbd13c5258cd76e16d29e7243fe0306b87da09b599c53df24f3d77f713"
    },
    "literalLinks": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "cta": "5df4ac272811bd4db1e8ca6291a37be09044a7f69468272e8ff5537417d7ebae"
  },
  "ginecologia-obstetricia": {
    "seo": "5c430ee06612c8305355884cc66da8acc590130562377e983702b32a41249e58",
    "clinical": "e8b1fed025f713a62a63c37ebeeffa03a3233c61abe8c9a4dc77479a24675543",
    "arrays": {
      "services": "de953abff5ccaf6376be2d1c9b64fa08adfeeda834ff5b294d329f835d9c0b7e",
      "faqItems": "c134b65cbef1acd446ee0c751b8772e61f3d62ab32adbfb1f9deee84e08e3aca"
    },
    "literalLinks": "eae4dcca057d919bb06f4f75941a1796aeced17d74eae92108c6b1ce05df6777",
    "cta": "48092b91018d58fe7a8ea7f1c92927556e4e803b26a3190a1c0dfc5fedbb7e56"
  },
  "ecografias-las-rosas": {
    "seo": "b033329a1e8e1536e6c7d12a64e28687e40d5eb6b1db1fd78fa8cc9c678c831b",
    "clinical": "591ab1515b105ce53f81cd42d57692a37c222cc6a013b2c286a1b983d2890829",
    "arrays": {
      "specializedServices": "1e653c1d6123455f736ed15eedaaf0a81b028ba9ef69e24a16a6efd93f323c78",
      "examSections": "f5a8a6ac75925c332d147c5a2bcb2f84dc29547dc09a4f6a187ce307df973494",
      "preparationTips": "7ee44b0706c3a57dec764c8cc776425f1dcf62dcc5d64e98af6694061a00dcab",
      "differentiators": "8f36b1eb0aef1326f332ed8b657510b8d6964c90674be4bdfeb7eea46e005b34",
      "faqItems": "fcda1d8566d735dfb8cd12835ce267cf17d2888133ade5b2efae63ac9995c213"
    },
    "literalLinks": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "cta": "569a2275e479eb833fb95f55267fdde06d3604068a5faf19fdb4d62ab032f7ba"
  },
  "ecografias-abdominales-las-rosas": {
    "seo": "c8f1cf8a4eb31e74b6f3405793bcfc33671ed48e77e50fb47a8e169cd5a0b02d",
    "clinical": "ffc3debd6aa62f6faa589da0a56262a1519a76df29499a9e40b958ab28988f41",
    "arrays": {
      "studies": "36a8e7d284f0dd01043df4c149d7dc7d37970cf266557b4a538881d88cacab30",
      "preparation": "a1ee0813cce4a3fc84a74821f3f2720f677bb192489efe9b3aa93f6f7c9f26a7",
      "faqItems": "965b8d48338e6d0ca1adcfaa192922da2a88336b4907f6b51663c7105a78f017"
    },
    "literalLinks": "534b49e0da737a9d0a44a22ab6bfb9dd0b969328f204aa5033ab58b58b0c291d",
    "cta": "daf7564c4b153fa348328568be681410c51566f961d512aeaac20e7e7e4a5c91"
  },
  "ecografias-doppler-embarazo-las-rosas": {
    "seo": "49fc6e1df3666b7ab571409baa2ffb513c074d3afd1832074352a545967933cd",
    "clinical": "3366775e03d6554d01d1ae13ed9219db0787d093b46243101acd8fcc4c94395c",
    "arrays": {
      "benefits": "693380702a06e1295ea32152da6ffd77c916b419ff429580ea1c6b142d9c7dc3",
      "preparation": "91bb0b458a565b7436b80cd833d4fd37457771f5836cf89aa19be108498a60db",
      "faqItems": "3e7d6e03273834fc8e3062ebbe0e53b5f75fd4640f5ffb8b1793d2ac855e3af5"
    },
    "literalLinks": "7f7daeaed954fec41a6b6c08c85acfbb6640397e4613673664e8dd0a67c86dcc",
    "cta": "d7056e556e5f499408a1ee2d45fe6496b8c25e627eb2ce6fa341a1bcd8527c26"
  },
  "ecografias-partes-blandas-lesiones-deportivas": {
    "seo": "4f5240530d67b9951c787804bc418efc8b5f3bafde6d9068f9650cff93e9be76",
    "clinical": "f2ee91c83bf375fe3f94ec3635f202f0bf30ef8e661eef8bdf3f5af9da8d99fb",
    "arrays": {
      "indications": "bf6dc6f8b26681bb90352aa2ed03f00696ebe0276436ffdf7db30ef67fcb8ea9",
      "preparation": "b94232350bba597e93001c72d988e9c306f0cfee9c219c319d730e0d6602f903",
      "faqItems": "a04d9733009e8652bec5fdcacf6c8fe54c03e05316692c47b2e9a5a5ef2c460a"
    },
    "literalLinks": "33f8cc0dbcc88a2ea6c6c3ad2cdab9b8209e05aba6c09724366eb7510e6a6eb5",
    "cta": "4d49962e7ecd0b5e338c3edd8804a1faf9dd04d7043b1aa46c926e17ec69a516"
  },
  "cirugia-vascular-varices-las-rosas": {
    "seo": "345f081e3ad5559b09367b4b86a57b972015e9ef9c810d9900d63547c7a90e1e",
    "clinical": "a177eb4f711267f6f3140757652e72bcdffa239b3dbff2aa86282be1f35fe079",
    "arrays": {
      "services": "eac1648b094db3ced6f12f78b2aec3c4bdf189f266aa12f18ab1b32312164779",
      "faqItems": "4b72784e4942551b29faf853dad38a862e0a1b70da873b84088c658bbbcfcee0"
    },
    "literalLinks": "74d7f0cb059f897ab5018f16175dbcf06dc5a319f7d9523546ae037a433007c3",
    "cta": "bca33fbdddb8ae035443dfa43f0b7293d2aa47db167f06dbbc0a7ea91ffdb369"
  }
};
const sha256 = value => createHash('sha256').update(value).digest('hex');

const remainingPages = {
  pediatria: 'pediatrics',
  traumatologia: 'traumatology',
  ginecologia: 'gynecology-obstetrics',
  'ginecologia-obstetricia': 'gynecology-obstetrics',
  'ecografias-las-rosas': 'ultrasound',
  'ecografias-abdominales-las-rosas': 'ultrasound',
  'ecografias-doppler-embarazo-las-rosas': 'ultrasound',
  'ecografias-partes-blandas-lesiones-deportivas': 'ultrasound',
  'cirugia-vascular-varices-las-rosas': undefined,
};
for (const [slug, service] of Object.entries(remainingPages)) {
  test(`${slug} adopts the proven public frame, disclosures and booking adapter`, () => {
    assertClinicalFrame(slug);
    assertClinicalFaq(slug);
    assertClinicalCta(slug, service);
  });
}

const videoIds = {
  pediatria: 'M4_HOnatb5c',
  traumatologia: '39Wd_DulN4M',
  'ginecologia-obstetricia': 'eruZqiTysJA',
  'ecografias-abdominales-las-rosas': 'M4_HOnatb5c',
  'ecografias-doppler-embarazo-las-rosas': 'eruZqiTysJA',
  'ecografias-partes-blandas-lesiones-deportivas': 'YemQ4dCJDvw',
  'cirugia-vascular-varices-las-rosas': 'qz4ytAzTPAg',
};
const nodes = node => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const normalizedText = node => text(node).replace(/\s+/g, ' ').trim();
const hasClass = (node, name) => (attr(node, 'class') || '').split(/\s+/).includes(name);
const allInterviews = publicInterviewGroups.flatMap(group => group.items);

test('clinical video presentations use verified publication titles without invented topics or dates', () => {
  for (const [slug, id] of Object.entries(videoIds)) {
    const html = htmlFor(slug);
    const doc = parse(html);
    const video = allInterviews.find(video => video.id === id);
    const main = nodes(doc).find(n => n.tagName === 'main');
    assert.ok(nodes(main).some(n => n.tagName === 'h2' && normalizedText(n) === `Entrevista: ${video.title}`), `${slug}: verified heading`);
    assert.ok(normalizedText(main).includes(`Título original de la publicación: ${video.sourceTitle}.`.replace(/\s+/g, ' ')), `${slug}: no inferred topic`);
    assert.ok(!jsonLdFor(html).some(item => item['@type'] === 'VideoObject'), `${slug}: unverified video metadata omitted`);
    const image = nodes(main).find(n => n.tagName === 'img' && attr(n, 'src')?.includes(`/vi/${id}/`));
    assert.equal(attr(image, 'alt'), video.title, slug);
    const outbound = nodes(main).find(n => n.tagName === 'a' && attr(n, 'href') === video.url);
    assert.ok(outbound, `${slug}: original YouTube destination`);
    const player = nodes(main).find(n => hasClass(n, 'yt-lite'));
    if (slug === 'ecografias-abdominales-las-rosas') continue;
    assert.equal(attr(player, 'data-id'), id);
    assert.ok(nodes(player).some(n => n.tagName === 'button' && attr(n, 'aria-label') === `Reproducir video: ${video.title}`), `${slug}: native keyboard-operable play button`);
  }
});

function runtimeFor(slug) {
  const doc = parse(htmlFor(slug));
  const modules = nodes(doc).filter(n => n.tagName === 'script' && attr(n, 'type') === 'module').map(n => attr(n, 'src') ? readFileSync(path.join(dist, attr(n, 'src').replace(/^\//, '')), 'utf8') : text(n));
  return modules.filter(code => code.includes('youtube-nocookie.com/embed/') && code.includes('.yt-lite'));
}

test('each inline player loads the existing delegated lazy-video runtime', () => {
  for (const slug of Object.keys(videoIds).filter(slug => slug !== 'ecografias-abdominales-las-rosas')) {
    const runtime = runtimeFor(slug);
    assert.equal(runtime.length, 1, `${slug}: exactly one lazy-video runtime`);
    assert.match(runtime[0], /__cefemYoutubeLiteInitialized/);
  }
});

test('served video runtime initializes once and activates the same ID once after a click', () => {
  const runtime = runtimeFor('traumatologia')[0];
  assert.ok(runtime, 'Missing served lazy-video module');
  const listeners = [];
  const frames = [];
  const events = [];
  const loaded = new Set();
  const player = {
    classList: { contains: value => loaded.has(value), add: value => loaded.add(value) },
    getAttribute: key => key === 'data-id' ? videoIds.traumatologia : null,
    appendChild: frame => frames.push(frame),
    textContent: 'Thumbnail',
  };
  const context = vm.createContext({
    window: { dispatchEvent: event => events.push(event) },
    document: { addEventListener: (type, listener) => listeners.push([type, listener]), createElement: tag => ({ tag, style: {} }) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  vm.runInContext(runtime, context);
  vm.runInContext(runtime, context);
  assert.equal(listeners.length, 1);
  assert.equal(frames.length, 0, 'No iframe before interaction');
  const click = listeners.find(([type]) => type === 'click')[1];
  click({ target: { closest: selector => selector === '.yt-lite' ? player : null } });
  click({ target: { closest: () => player } });
  assert.equal(frames.length, 1);
  assert.equal(frames[0].src, `https://www.youtube-nocookie.com/embed/${videoIds.traumatologia}?autoplay=1&rel=0`);
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.id, videoIds.traumatologia);
});

function stylesFor(slug) {
  const doc = parse(htmlFor(slug));
  return nodes(doc).filter(n => n.tagName === 'link' && attr(n, 'rel') === 'stylesheet').map(n => readFileSync(path.join(dist, attr(n, 'href').replace(/^\//, '')), 'utf8')).concat(nodes(doc).filter(n => n.tagName === 'style').map(text));
}

test('served clinical heading sizes and spacing outrank shared resets', () => {
  const rules = [];
  for (const css of stylesFor('nutricion')) parseCss(css).walkRules(rule => rules.push(rule));
  function winner(tag, properties) {
    const candidates = [];
    for (const rule of rules) for (const raw of rule.selector.split(',')) {
      const selector = raw.trim();
      if (!new RegExp(`^(?:body\\.institutional-surface )?(?:\\.clinical-content )?${tag}$`).test(selector)) continue;
      const declaration = rule.nodes.findLast(n => properties.includes(n.prop));
      if (!declaration) continue;
      const classes = (selector.match(/\.[\w-]+/g) || []).length;
      const types = (selector.replace(/\.[\w-]+/g, '').match(/\b[a-z][\w-]*\b/g) || []).length;
      candidates.push({ selector, value: declaration.value, weight: classes * 100 + types, order: candidates.length });
    }
    candidates.sort((a, b) => b.weight - a.weight || b.order - a.order);
    assert.ok(candidates.length >= 2, `Must compare ${tag} with the real shared rule`);
    return candidates[0];
  }
  assert.equal(winner('h2', ['margin', 'margin-bottom']).value, '18px');
  assert.equal(winner('h3', ['font-size']).value, '20px');
  assert.equal(winner('h3', ['margin', 'margin-bottom']).value, '12px');
});

test('clinical video thumbnails retain full-height media framing over generic image rules', () => {
  const candidates = [];
  for (const css of stylesFor('traumatologia')) parseCss(css).walkRules(rule => {
    for (const raw of rule.selector.split(',')) {
      const selector = raw.trim();
      if (!(selector === 'body.institutional-surface .clinical-content img' || (/\.yt-lite/.test(selector) && /img(?:\[[^\]]+\])?$/.test(selector)))) continue;
      const declaration = rule.nodes.findLast(n => n.prop === 'height');
      if (!declaration) continue;
      const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]/g) || []).length;
      const types = (selector.replace(/\.[\w-]+|\[[^\]]+\]/g, '').match(/\b[a-z][\w-]*\b/g) || []).length;
      candidates.push({ value: declaration.value, weight: classes * 100 + types, order: candidates.length });
    }
  });
  candidates.sort((a, b) => b.weight - a.weight || b.order - a.order);
  assert.equal(candidates[0]?.value, '100%');
});

function clinicalSignature(doc) {
  const main = nodes(doc).find(n => n.tagName === 'main');
  const all = nodes(main);
  const videoHeading = all.find(n => n.tagName === 'h2' && /^(Video:|Conocé más sobre nuestros estudios|Entrevista:)/.test(normalizedText(n)));
  const excluded = new Set(videoHeading ? [videoHeading] : []);
  if (videoHeading) {
    const siblings = videoHeading.parentNode.childNodes;
    excluded.add(siblings.slice(siblings.indexOf(videoHeading) + 1).find(n => n.tagName === 'p'));
  }
  return all.filter(n => ['h1', 'h2', 'h3', 'p', 'li'].includes(n.tagName)).filter(n => {
    if (excluded.has(n) || !normalizedText(n) || (n.tagName === 'h3' && normalizedText(n).startsWith('¿')) || hasClass(n, 'eyebrow')) return false;
    for (let parent = n; parent; parent = parent.parentNode) if (parent.tagName === 'details' || hasClass(parent, 'clinical-video-fallback')) return false;
    return true;
  }).map(n => [n.tagName, normalizedText(n)]);
}

test('all ten URLs preserve original SEO, non-video clinical copy, lists, data arrays and contextual links', () => {
  assert.equal(Object.keys(baseline).length, 10);
  for (const [slug, expected] of Object.entries(baseline)) {
    const doc = parse(htmlFor(slug));
    const head = nodes(doc).find(n => n.tagName === 'head');
    const headNodes = nodes(head);
    const seo = {
      title: normalizedText(headNodes.find(n => n.tagName === 'title')),
      description: attr(headNodes.find(n => n.tagName === 'meta' && attr(n, 'name') === 'description'), 'content'),
      canonical: attr(headNodes.find(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical'), 'href'),
    };
    assert.equal(sha256(JSON.stringify(seo)), expected.seo, `${slug}: SEO`);
    assert.equal(sha256(JSON.stringify(clinicalSignature(doc))), expected.clinical, `${slug}: non-video clinical text`);
    const source = readFileSync(new URL(`../src/pages/${slug}/index.astro`, import.meta.url), 'utf8');
    const arrays = Object.fromEntries([...source.matchAll(/const (\w+)(?:: FaqItem\[\])? = (\[[\s\S]*?\n\]);/g)].map(match => [match[1], sha256(match[2].replace(/\r/g, ''))]));
    assert.deepEqual(arrays, expected.arrays, `${slug}: unchanged original data arrays including FAQs`);
    const literalLinks = [...source.matchAll(/href="([^"]*)"/g)].map(match => match[1]).sort();
    assert.equal(sha256(JSON.stringify(literalLinks)), expected.literalLinks, `${slug}: original literal links`);
    assert.equal(sha256(source.match(/const ctaContent = (\{[\s\S]*?\n\});/)[1].replace(/\r/g, '')), expected.cta, `${slug}: original CTA copy and WhatsApp`);
    const clinical = nodes(doc).find(n => hasClass(n, 'clinical-content'));
    const clinicalText = normalizedText(clinical);
    const faqArray = source.match(/const faqItems: FaqItem\[\] = (\[[\s\S]*?\n\]);/)[1];
    const faqs = vm.runInNewContext(`(${faqArray})`);
    for (const { question, answer } of faqs) {
      assert.ok(clinicalText.includes(question), `${slug}: question preserved`);
      assert.ok(clinicalText.includes(answer), `${slug}: answer preserved`);
    }
  }
});

test('clinical pages retain the same institutional header, footer and WhatsApp affordance', () => {
  const home = parse(readFileSync(path.join(dist, 'index.html'), 'utf8'));
  for (const slug of Object.keys(baseline)) {
    const doc = parse(htmlFor(slug));
    for (const tag of ['header', 'footer']) assert.equal(normalizedText(nodes(doc).find(n => n.tagName === tag)), normalizedText(nodes(home).find(n => n.tagName === tag)), `${slug}: ${tag}`);
    assert.equal(attr(nodes(doc).find(n => attr(n, 'id') === 'whatsappCta'), 'href'), 'https://wa.me/5493471341461');
    assert.ok(nodes(doc).some(n => attr(n, 'id') === 'whatsapp-dismiss'));
  }
});
