import { element, number } from './portal-ui.js';

const status = document.getElementById('sample-status');
const list = document.getElementById('sample-list');
const retry = element('button', 'Thử tải lại hồ sơ', 'button dark');
retry.type = 'button';
retry.hidden = true;
status.after(retry);
const metrics = {
  moisture_percent: ['Độ ẩm', '%'], water_activity: ['Hoạt độ nước (aw)', ''],
  cielab_l: ['Màu CIELAB L*', ''], cielab_a: ['Màu CIELAB a*', ''],
  cielab_b: ['Màu CIELAB b*', ''], solubility_percent: ['Độ hòa tan', '%'],
};
const nutrients = {
  energy_kcal: ['Năng lượng', 'kcal'], protein_g: ['Protein', 'g'], fat_g: ['Chất béo', 'g'],
  carbohydrate_g: ['Carbohydrate', 'g'], sodium_mg: ['Natri', 'mg'],
};

function sampleCard(sample) {
  const card = element('article', '', 'feature-card');
  card.append(
    element('p', sample.sample_code, 'eyebrow'), element('h2', sample.label),
    element('p', 'Nguồn nguyên liệu: ' + sample.origin),
    element('p', 'Ngày đo: ' + new Date(sample.measured_at + 'T00:00:00Z').toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })),
  );
  if (sample.process_notes) card.append(element('p', sample.process_notes));
  for (const [group, definitions, title] of [[sample.metrics, metrics, 'Chỉ tiêu đo'], [sample.nutrition, nutrients, 'Dinh dưỡng / 100 g']]) {
    if (!group || !Object.keys(group).length) continue;
    card.append(element('h3', title));
    for (const [key, value] of Object.entries(group)) {
      const [label, unit] = definitions[key] || [key, ''];
      card.append(element('p', `${label}: ${number(value)} ${unit}`));
    }
  }
  const link = element('a', 'Xem minh chứng trong cổng giám khảo ↗', 'arrow-link');
  link.href = 'giam-khao.html';
  card.append(link);
  return card;
}

let loading = false;
async function loadSamples() {
  if (loading) return;
  const returnFocus = document.activeElement === retry;
  loading = true;
  retry.disabled = true;
  status.classList.remove('error');
  status.textContent = 'Đang tải hồ sơ mẫu thử…';
  list.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/v1/product/batches', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('invalid_response');
    const cards = data.items.map(sampleCard);
    list.replaceChildren(...cards);
    status.textContent = cards.length
      ? `${cards.length} mẫu có hồ sơ được công bố.`
      : 'Chưa có số liệu đo được công bố. Bạn có thể đọc nguồn nghiên cứu và góp ý cho mẫu thử trong lúc dự án hoàn thiện minh chứng.';
    retry.hidden = true;
    status.setAttribute('tabindex', '-1');
    if (returnFocus) status.focus();
  } catch {
    status.textContent = 'Chưa thể tải hồ sơ. Kiểm tra kết nối rồi thử lại; các nguồn nghiên cứu bên dưới vẫn có thể truy cập.';
    status.classList.add('error');
    retry.hidden = false;
  } finally {
    loading = false;
    retry.disabled = false;
    list.setAttribute('aria-busy', 'false');
  }
}
retry.addEventListener('click', loadSamples);
loadSamples();
