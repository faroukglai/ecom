export function validateDashboardForm(form: HTMLFormElement, showError: (message: string) => void, message: string) {
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
  let firstInvalid: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;
  fields.forEach((field) => {
    if (!field.willValidate) return;
    const invalid = !field.checkValidity();
    if (invalid && !firstInvalid) firstInvalid = field;
    if (invalid) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  });
  if (!firstInvalid) return true;
  (firstInvalid as HTMLInputElement).focus();
  showError(message);
  return false;
}

export function clearDashboardFieldError(target: EventTarget) {
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
    if (target.checkValidity()) target.removeAttribute("aria-invalid");
  }
}
