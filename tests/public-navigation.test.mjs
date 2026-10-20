import test from 'node:test';
import assert from 'node:assert/strict';

test('las fichas médicas identifican Especialidades sin marcar rutas ajenas', async () => {
  const { publicNavCurrent } = await import('../src/utils/public-navigation.ts');
  for (const path of ['/nutricion/', '/pediatria/', '/traumatologia/', '/ginecologia/', '/ginecologia-obstetricia/', '/ecografias-las-rosas/', '/ecografias-abdominales-las-rosas/', '/ecografias-doppler-embarazo-las-rosas/', '/ecografias-partes-blandas-lesiones-deportivas/', '/cirugia-vascular-varices-las-rosas/', '/urologia/', '/clinica-medica/', '/depilacion-definitiva/']) assert.equal(publicNavCurrent(path, '/especialidades/'), 'location', path);
  for (const path of ['/urologia-falsa/', '/blog/urologia/prevencion-cancer-prostata/', '/api/urologia/', '/mis-estudios/']) assert.equal(publicNavCurrent(path, '/especialidades/'), undefined, path);
});

test('la navegación marca páginas exactas y el contexto de artículos y categorías sin falsos prefijos', async () => {
  const { publicNavCurrent } = await import('../src/utils/public-navigation.ts');
  assert.equal(publicNavCurrent('/blog/', '/blog/'), 'page');
  assert.equal(publicNavCurrent('/especialidades/', '/especialidades/'), 'page');
  assert.equal(publicNavCurrent('/mis-estudios/', '/mis-estudios/'), 'page');
  assert.equal(publicNavCurrent('/blog/pediatria/beneficios-lactancia-materna/', '/blog/'), 'location');
  assert.equal(publicNavCurrent('/blog/2/', '/blog/'), 'location');
  assert.equal(publicNavCurrent('/categorias/pediatria/', '/blog/'), 'location');
  for (const path of ['/', '/blogger/', '/api/blog/', '/mis-estudios/', '/legal/privacidad/']) assert.equal(publicNavCurrent(path, '/blog/'), undefined, path);
  assert.equal(publicNavCurrent('/blog/2/', '/contacto/'), undefined);
});
