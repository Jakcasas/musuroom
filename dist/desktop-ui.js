// Progressive enhancements only; server validation and native form controls remain authoritative.
const currentPage = location.pathname === '/' ? '/index.html' : location.pathname;
for (const link of document.querySelectorAll('nav a[href]')) {
  const target = new URL(link.href, location.href);
  if (target.origin === location.origin && target.pathname === currentPage && !target.hash) {
    link.setAttribute('aria-current', 'page');
  }
}
const connectionNotice = document.createElement('div');
connectionNotice.className = 'connection-notice';
connectionNotice.setAttribute('role', 'status');
connectionNotice.setAttribute('aria-live', 'polite');
connectionNotice.hidden = true;
document.body.append(connectionNotice);
let connectionTimer;
function updateConnectionNotice() {
  clearTimeout(connectionTimer);
  connectionNotice.hidden = false;
  connectionNotice.textContent = navigator.onLine
    ? 'Kết nối mạng đã trở lại. Bạn có thể thử lại thao tác đang chờ.'
    : 'Bạn đang ngoại tuyến. Kiểm tra kết nối trước khi gửi hoặc lưu thông tin.';
  if (navigator.onLine) connectionTimer = setTimeout(() => { connectionNotice.hidden = true; }, 8000);
}
window.addEventListener('offline', updateConnectionNotice);
window.addEventListener('online', updateConnectionNotice);
if (!navigator.onLine) updateConnectionNotice();
const accessCode = document.querySelector('#access-code');
if (accessCode) {
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'password-toggle';
  toggle.textContent = 'Hiện mã truy cập';
  toggle.setAttribute('aria-controls', accessCode.id);
  toggle.setAttribute('aria-pressed', 'false');
  const conceal = () => {
    accessCode.type = 'password'; toggle.textContent = 'Hiện mã truy cập';
    toggle.setAttribute('aria-pressed', 'false');
  };
  toggle.addEventListener('click', () => {
    const show = accessCode.type === 'password';
    accessCode.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Ẩn mã truy cập' : 'Hiện mã truy cập';
    toggle.setAttribute('aria-pressed', String(show));
  });
  accessCode.closest('label').after(toggle);
  accessCode.form.addEventListener('submit', conceal);
  document.addEventListener('visibilitychange', () => { if (document.hidden) conceal(); });
}
const survey = document.querySelector('#sensory-form');
if (survey) {
  const box = document.createElement('div'); box.className = 'survey-progress';
  const progress = document.createElement('progress'); progress.max = 5;
  progress.setAttribute('aria-label', 'Số tiêu chí cảm quan đã chọn');
  const text = document.createElement('span');
  box.append(progress, text);
  survey.querySelector('.score-fields').after(box);
  const update = () => {
    const count = [...survey.querySelectorAll('.hedonic')].filter(select => /^[1-9]$/.test(select.value)).length;
    progress.value = count; text.textContent = `Đã chọn ${count}/5 tiêu chí cảm quan`;
  };
  survey.addEventListener('input', update); survey.addEventListener('change', update);
  survey.addEventListener('reset', () => setTimeout(update, 0));
  window.addEventListener('load', update, { once: true });
  update();
}
