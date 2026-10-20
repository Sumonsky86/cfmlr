import { appointmentServices } from '../data/appointments.ts';
import { getLocalDateISO, prepareAppointment } from '../utils/appointments.ts';
import type { AppointmentErrors, AppointmentField } from '../utils/appointments.ts';

const form = document.querySelector<HTMLFormElement>('[data-appointment-form]');

if (form) {
  const fields: AppointmentField[] = ['name', 'phone', 'specialty', 'preferredDate', 'comment'];
  const fieldset = form.querySelector<HTMLFieldSetElement>('[data-appointment-fields]');
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const fallback = form.querySelector<HTMLElement>('[data-message-fallback]');
  const messageText = form.querySelector<HTMLTextAreaElement>('[data-prepared-message]');
  const retryLink = form.querySelector<HTMLAnchorElement>('[data-whatsapp-retry]');
  const copyButton = form.querySelector<HTMLButtonElement>('[data-copy-message]');
  const copyStatus = form.querySelector<HTMLElement>('[data-copy-status]');
  const dateField = form.querySelector<HTMLInputElement>('[name="preferredDate"]');
  const serviceField = form.querySelector<HTMLSelectElement>('[name="specialty"]');

  if (fieldset && status && fallback && messageText && retryLink && copyButton && copyStatus && dateField && serviceField) {
    const clearPreparedMessage = () => {
      fallback.hidden = true;
      messageText.value = '';
      retryLink.removeAttribute('href');
      copyStatus.textContent = '';
    };

    const showErrors = (errors: AppointmentErrors) => {
      let firstInvalid: HTMLElement | null = null;
      for (const name of fields) {
        const field = form.querySelector<HTMLElement>(`[name="${name}"]`);
        const message = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
        const error = errors[name];
        if (message) {
          message.textContent = error ?? '';
          message.hidden = !error;
        }
        if (error) {
          field?.setAttribute('aria-invalid', 'true');
          firstInvalid ??= field;
        } else {
          field?.removeAttribute('aria-invalid');
        }
      }
      firstInvalid?.focus();
    };

    form.addEventListener('submit', event => {
      event.preventDefault();
      clearPreparedMessage();
      dateField.min = getLocalDateISO();
      const result = prepareAppointment(Object.fromEntries(new FormData(form).entries()));
      if (!result.ok) {
        showErrors(result.errors);
        status.textContent = 'Revisá los campos marcados antes de continuar.';
        return;
      }
      showErrors({});
      messageText.value = result.message;
      retryLink.href = result.url;
      fallback.hidden = false;
      status.textContent = 'Se abrirá WhatsApp con tu mensaje. Revisalo y envialo para solicitar el turno; recepción confirma la disponibilidad.';

      // Privacy-safe integration point: no contact details or message in event payload.
      // Consumers can cancel navigation without changing the validated preparation.
      const ready = new CustomEvent('cefem:appointment-ready', { cancelable: true, bubbles: false, detail: null });
      if (!form.dispatchEvent(ready)) return;
      try {
        window.location.assign(result.url);
      } catch {
        status.textContent = 'No pudimos abrir WhatsApp automáticamente. Usá el enlace o copiá el mensaje que aparece abajo.';
      }
    });

    const invalidateDraft = () => {
      if (!fallback.hidden) {
        clearPreparedMessage();
        status.textContent = '';
      }
    };
    form.addEventListener('input', invalidateDraft);
    form.addEventListener('change', invalidateDraft);
    dateField.addEventListener('focus', () => { dateField.min = getLocalDateISO(); });

    copyButton.addEventListener('click', async () => {
      if (!messageText.value) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(messageText.value);
        copyStatus.textContent = 'Mensaje copiado. Podés pegarlo en el chat de recepción.';
      } catch {
        messageText.focus();
        messageText.select();
        copyStatus.textContent = 'No se pudo copiar automáticamente. El mensaje quedó seleccionado para que lo copies manualmente.';
      }
    });

    const requestedService = new URLSearchParams(window.location.search).get('especialidad');
    if (appointmentServices.some(service => service.id === requestedService)) {
      serviceField.value = requestedService!;
    }
    dateField.min = getLocalDateISO();
    // Keep the form disabled if initialization fails, including when JS is unavailable.
    // No raw GET submission can leak personal data into the page URL.
    fieldset.disabled = false;
  }
}
