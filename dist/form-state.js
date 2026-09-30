const pending = new WeakSet();
export const isSubmitting = form => pending.has(form);
export function beginSubmission(form) {
  if (pending.has(form)) return null;
  pending.add(form);
  form.setAttribute('aria-busy', 'true');
  const controls = [...form.querySelectorAll('input,select,textarea,button')].map(control => [control, control.disabled]);
  for (const [control] of controls) control.disabled = true;
  return () => {
    pending.delete(form);
    form.setAttribute('aria-busy', 'false');
    for (const [control, disabled] of controls) control.disabled = disabled;
  };
}
