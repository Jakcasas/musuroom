import { calculate, makeCsv } from './core.js';
document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
if (toggle && nav) {
  toggle.hidden = false;
  const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); toggle.focus(); } });
  matchMedia('(min-width: 761px)').addEventListener('change', close);
}
const form = document.querySelector('#batch-form');
if (form) {
  let current;
  const number = value => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  const update = () => {
    const values = Object.fromEntries([...form.querySelectorAll('input')].map(input => [input.name, input.valueAsNumber]));
    const result = calculate(values);
    for (const input of form.querySelectorAll('input')) {
      input.setAttribute('aria-invalid', String(Boolean(result.errors[input.name])));
      document.getElementById(`${input.name}-error`).textContent = result.errors[input.name] || '';
    }
    const invalid = Object.keys(result.errors).length > 0;
    document.getElementById('powder').textContent = invalid ? '—' : `${number(result.powder)} kg`;
    document.getElementById('batch-detail').textContent = invalid ? 'Vui lòng sửa các giá trị được đánh dấu.' : `${number(result.accepted)} kg được chọn · ${number(result.rejected)} kg loại bỏ · Tỷ lệ thu bột ${number(result.yield)}% trên đầu vào.`;
    document.getElementById('export').disabled = invalid;
    current = { values, result };
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('reset', () => setTimeout(update, 0));
  document.getElementById('export').addEventListener('click', () => {
    update();
    if (Object.keys(current.result.errors).length) return;
    const url = URL.createObjectURL(new Blob([makeCsv(current.values, current.result)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'Musuroom-me-thu.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  update();
}
