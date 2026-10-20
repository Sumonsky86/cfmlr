import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentContact, appointmentLinks } from '../src/data/appointments.ts';

test('el enlace de llamada usa el teléfono de recepción confirmado y un E.164 válido', () => {
  assert.equal(appointmentContact.phoneDisplay, '3471 594801');
  const confirmedPhone = '+54' + appointmentContact.phoneDisplay.replace(/\D/g, '');
  assert.match(appointmentContact.phoneE164, /^\+[1-9]\d{7,14}$/);
  assert.equal(appointmentContact.phoneE164, confirmedPhone);
  assert.equal(appointmentLinks.phone, `tel:${confirmedPhone}`);
});
