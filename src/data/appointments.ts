/** Reception details used by the new institutional pages and appointment flow. */
const city = 'Las Rosas';
const openingTimeRanges = '8 a 12 h y 16 a 20 h';
export const appointmentContact = {
  whatsappNumber: '5493471341461',
  phoneE164: '+543471594801',
  phoneDisplay: '3471 594801',
  email: 'info@cefem.com.ar',
  address: 'Boulevard Kemmis 843',
  city,
  locality: `${city}, Santa Fe, Argentina`,
  openingDays: 'Lunes a viernes',
  openingTimeRanges,
  openingHours: `Lun–vie · ${openingTimeRanges}`,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-32.4783729,-61.5705029',
} as const;

/** Channel destinations stay synchronized with the reception details above. */
export const appointmentLinks = {
  whatsapp: `https://wa.me/${appointmentContact.whatsappNumber}`,
  phone: `tel:${appointmentContact.phoneE164}`,
  email: `mailto:${appointmentContact.email}`,
  maps: appointmentContact.mapsUrl,
} as const;

/** Stable IDs are independent of marketing headings and public route slugs. */
export const appointmentServices = [
  { id: 'ultrasound', label: 'Ecografías' },
  { id: 'traumatology', label: 'Traumatología' },
  { id: 'pediatrics', label: 'Pediatría' },
  { id: 'urology', label: 'Urología' },
  { id: 'gynecology-obstetrics', label: 'Ginecología y Obstetricia' },
  { id: 'nutrition', label: 'Nutrición' },
  { id: 'general-medicine', label: 'Clínica Médica' },
  { id: 'laser-hair-removal', label: 'Depilación Definitiva' },
] as const;
