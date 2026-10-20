import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/turnos/index.html', import.meta.url), 'utf8');

test('la página de turnos prepara una continuación a WhatsApp, no una confirmación falsa', () => {
  assert.match(html, /Continuar por WhatsApp/);
  assert.match(html, /data-appointment-form/);
  assert.match(html, /name="name"/);
  assert.match(html, /name="phone"/);
  assert.match(html, /name="specialty"/);
  assert.match(html, /name="preferredDate"/);
  assert.match(html, /Comentario administrativo/);
  assert.match(html, /no incluyas|No incluyas/);
  assert.match(html, /<fieldset[^>]*disabled/);
  assert.match(html, /<noscript>/);
  assert.match(html, /mensaje|Mensaje/);
  assert.doesNotMatch(html, /name="motivo"|solicitud ha sido enviada/);
  assert.match(html, /<title>Solicitar Turno Online \| Cefem Las Rosas<\/title>/);
  assert.match(html, /https:\/\/www\.cefem\.ar\/turnos\//);
});
