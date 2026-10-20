import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as reception from '../src/data/appointments.ts';

test('los enlaces de recepción se derivan de una única configuración', () => {
  const contact = reception.appointmentContact;
  assert.deepEqual(reception.appointmentLinks, {
    whatsapp: `https://wa.me/${contact.whatsappNumber}`,
    phone: `tel:${contact.phoneE164}`,
    email: `mailto:${contact.email}`,
    maps: contact.mapsUrl,
  });
  const maps = new URL(reception.appointmentLinks.maps);
  assert.equal(maps.searchParams.get('api'), '1');
  assert.equal(maps.searchParams.get('query'), '-32.4783729,-61.5705029');
  assert.match(contact.phoneE164, /^\+[1-9]\d{7,14}$/);
});

test('los consumidores institucionales no duplican destinos ni datos de recepción', async () => {
  const contact = reception.appointmentContact;
  const repeatedValues = [contact.phoneE164, contact.phoneDisplay, contact.email,
    contact.address, contact.locality, contact.openingHours,
    contact.openingHours.split(' · ')[1], 'https://wa.me/'];
  const paths = ['components/institutional/Hero.astro', 'components/institutional/Visit.astro',
    'components/institutional/WhatsApp.astro', 'components/institutional/AppointmentForm.astro',
    'utils/appointments.ts'];
  for (const path of paths) {
    const source = await readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');
    assert.equal(repeatedValues.some(value => source.includes(value)), false,
      `${path}: los contactos deben provenir de appointments.ts, no de literales repetidos`);
  }
});
