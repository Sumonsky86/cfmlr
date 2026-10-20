import test from 'node:test';
import assert from 'node:assert/strict';

async function appointmentModule() {
  try {
    return await import('../src/utils/appointments.ts');
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
    throw error;
  }
}

test('prepara un enlace de WhatsApp con todos los datos y caracteres especiales intactos', async () => {
  const { prepareAppointment } = await appointmentModule();
  assert.equal(typeof prepareAppointment, 'function', 'Falta el preparador real de solicitudes');
  const result = prepareAppointment({
    name: 'María Ñúñez & Ana + José',
    phone: '+54 9 3471 123456',
    specialty: 'pediatrics',
    preferredDate: '2026-10-20',
    comment: 'Preferencia administrativa: después de las 16 h. #turno',
  }, '2026-10-15');
  assert.equal(result.ok, true);
  const url = new URL(result.url);
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/5493471341461');
  assert.equal(url.searchParams.get('text'), result.message);
  assert.match(result.message, /María Ñúñez & Ana \+ José/);
  assert.match(result.message, /Teléfono de contacto: \+54 9 3471 123456/);
  assert.match(result.message, /Especialidad: Pediatría/);
  assert.match(result.message, /Fecha preferida: 20\/10\/2026/);
  assert.match(result.message, /después de las 16 h\. #turno/);
  assert.match(result.message, /disponibilidad y confirmación/);
  assert.doesNotMatch(result.message, /turno confirmado|solicitud enviada|undefined|null/i);
});

test('rechaza campos obligatorios vacíos y espacios sin crear un enlace', async () => {
  const { prepareAppointment } = await appointmentModule();
  const result = prepareAppointment({ name: '   ', phone: '', specialty: '' }, '2026-10-15');
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['name', 'phone', 'specialty']);
  assert.equal('url' in result, false);
  assert.equal('message' in result, false);
});

test('rechaza especialidades que no pertenecen al catálogo', async () => {
  const { prepareAppointment } = await appointmentModule();
  const result = prepareAppointment({ name: 'Ana Pérez', phone: '3471 123456', specialty: 'servicio-inventado' }, '2026-10-15');
  assert.equal(result.ok, false);
  assert.match(result.errors.specialty, /especialidad|servicio/i);
});

test('valida teléfonos sin imponer un único formato local', async () => {
  const { prepareAppointment } = await appointmentModule();
  for (const phone of ['123', 'abc3471123456', '++543471123456', '1234567890123456', '3471\n123456']) {
    const result = prepareAppointment({ name: 'Ana Pérez', phone, specialty: 'pediatrics' }, '2026-10-15');
    assert.equal(result.ok, false, phone);
    assert.ok(result.errors.phone);
  }
  for (const phone of ['3471 123456', '+54 9 3471 123456', '(3471) 123-456']) {
    assert.equal(prepareAppointment({ name: 'Ana Pérez', phone, specialty: 'pediatrics' }, '2026-10-15').ok, true);
  }
});

test('usa el día local tanto cerca del inicio como del final del día', async () => {
  const { getLocalDateISO } = await appointmentModule();
  assert.equal(typeof getLocalDateISO, 'function');
  assert.equal(getLocalDateISO(new Date(2026, 9, 15, 0, 30)), '2026-10-15');
  assert.equal(getLocalDateISO(new Date(2026, 9, 15, 23, 30)), '2026-10-15');
});

test('rechaza fechas pasadas o inexistentes y conserva el día elegido', async () => {
  const { prepareAppointment } = await appointmentModule();
  for (const preferredDate of ['2026-10-14', '2027-02-31', '2026-13-01', '20/10/2026', 'invalid']) {
    const result = prepareAppointment({ name: 'Ana Pérez', phone: '3471 123456', specialty: 'pediatrics', preferredDate }, '2026-10-15');
    assert.equal(result.ok, false, preferredDate);
    assert.ok(result.errors.preferredDate);
  }
  for (const preferredDate of ['2026-10-15', '2026-10-20', '2028-02-29']) {
    const result = prepareAppointment({ name: 'Ana Pérez', phone: '3471 123456', specialty: 'pediatrics', preferredDate }, '2026-10-15');
    assert.equal(result.ok, true, preferredDate);
    assert.equal(result.data.preferredDate, preferredDate);
    assert.ok(result.message.includes(preferredDate.split('-').reverse().join('/')));
  }
});

test('limita nombre y comentario sin pedir datos clínicos ni inventar valores opcionales', async () => {
  const { prepareAppointment } = await appointmentModule();
  for (const name of ['A', 'A'.repeat(121), 'Ana\nPaciente']) {
    const result = prepareAppointment({ name, phone: '3471 123456', specialty: 'pediatrics' }, '2026-10-15');
    assert.equal(result.ok, false);
    assert.ok(result.errors.name);
  }
  const tooLong = prepareAppointment({ name: 'Ana Pérez', phone: '3471 123456', specialty: 'pediatrics', comment: 'x'.repeat(301) }, '2026-10-15');
  assert.equal(tooLong.ok, false);
  assert.ok(tooLong.errors.comment);
  const minimal = prepareAppointment({ name: '  Ana Pérez  ', phone: ' 3471 123456 ', specialty: 'pediatrics', preferredDate: '', comment: '   ', motivo: 'NO COPIAR ESTE DATO' }, '2026-10-15');
  assert.equal(minimal.ok, true);
  assert.equal(minimal.data.name, 'Ana Pérez');
  assert.doesNotMatch(minimal.message, /Fecha preferida:|Comentario administrativo:|undefined|null|NO COPIAR ESTE DATO/);
});

test('no convierte objetos o archivos en datos de un mensaje', async () => {
  const { prepareAppointment } = await appointmentModule();
  for (const field of ['name', 'phone', 'specialty', 'preferredDate', 'comment']) {
    const result = prepareAppointment({ name: 'Ana Pérez', phone: '3471 123456', specialty: 'pediatrics', [field]: { injected: true } }, '2026-10-15');
    assert.equal(result.ok, false, field);
    assert.ok(result.errors[field], field);
  }
});
