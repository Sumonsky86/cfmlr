import { appointmentLinks, appointmentServices } from '../data/appointments.ts';

export type AppointmentField = 'name' | 'phone' | 'specialty' | 'preferredDate' | 'comment';
export type AppointmentErrors = Partial<Record<AppointmentField, string>>;
export interface AppointmentDetails {
  name: string;
  phone: string;
  specialty: string;
  specialtyLabel: string;
  preferredDate: string;
  comment: string;
}
export type AppointmentPreparation =
  | { ok: true; data: AppointmentDetails; message: string; url: string }
  | { ok: false; errors: AppointmentErrors };

/** Prepare a draft only: this neither sends a message nor confirms a booking. */
export function prepareAppointment(input: Record<string, unknown>, _today?: string): AppointmentPreparation {
  const text = (key: AppointmentField): string => {
    const value = input[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  const name = text('name');
  const phone = text('phone');
  const specialty = text('specialty');
  const preferredDate = text('preferredDate');
  const comment = text('comment');
  const errors: AppointmentErrors = {};
  const fields: AppointmentField[] = ['name', 'phone', 'specialty', 'preferredDate', 'comment'];
  for (const field of fields) {
    if (input[field] != null && typeof input[field] !== 'string') errors[field] = 'Revisá el valor de este campo.';
  }
  if (!name) errors.name = 'Ingresá tu nombre y apellido.';
  else if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
    errors.name = 'Ingresá un nombre de entre 2 y 120 caracteres, en una sola línea.';
  }
  if (comment.length > 300) errors.comment = 'El comentario debe tener como máximo 300 caracteres.';
  if (!phone) errors.phone = 'Ingresá un teléfono de contacto.';
  else if (!/^\+?[\d ().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15 || phone.length > 40) {
    errors.phone = 'Ingresá un teléfono válido, con código de área y entre 7 y 15 dígitos.';
  }
  if (!specialty) errors.specialty = 'Elegí una especialidad o servicio.';
  const service = appointmentServices.find(item => item.id === specialty);
  if (specialty && !service) errors.specialty = 'Elegí una especialidad del listado.';
  if (preferredDate) {
    const parsed = new Date(`${preferredDate}T12:00:00Z`);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === preferredDate;
    if (!valid) errors.preferredDate = 'Elegí una fecha válida.';
    else if (preferredDate < (_today ?? getLocalDateISO())) errors.preferredDate = 'La fecha preferida no puede ser anterior a hoy.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const specialtyLabel = service?.label ?? specialty;
  const data = { name, phone, specialty, specialtyLabel, preferredDate, comment };
  const lines = [
    'Hola, quisiera solicitar un turno en CEFEM.',
    '',
    `Nombre y apellido: ${name}`,
    `Teléfono de contacto: ${phone}`,
    `Especialidad: ${specialtyLabel}`,
  ];
  if (preferredDate) lines.push(`Fecha preferida: ${preferredDate.split('-').reverse().join('/')}`);
  if (comment) lines.push(`Comentario administrativo: ${comment}`);
  lines.push('', 'Quedo a la espera de disponibilidad y confirmación.');
  const message = lines.join('\n');
  const url = new URL(appointmentLinks.whatsapp);
  url.searchParams.set('text', message);
  return { ok: true, data, message, url: url.toString() };
}

/** Local calendar day: UTC conversion could shift the patient's selected date. */
export function getLocalDateISO(date: Date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
