const target = document.querySelector('[data-privacy-contact]');
if (target) {
  try {
    const response = await fetch('/api/public/contact', { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw Error('unavailable');
    const { email } = await response.json();
    if (typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const link = document.createElement('a');
      link.href = 'mailto:' + email;
      link.textContent = email;
      target.replaceChildren(document.createTextNode('Góp ý hoặc yêu cầu xóa đăng ký: '), link);
    }
  } catch { /* The visible organizer contact guidance remains available. */ }
}
