export function normalize(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
export function searchArticles(articles, query = '', category = '') {
  const words = normalize(query).split(' ').filter(Boolean);
  return articles.filter(a => {
    if (category && a.category !== category) return false;
    const textWords = normalize([a.title, a.summary, a.body, a.application, a.limitation, a.source, a.year, a.category, ...a.tags].join(' ')).split(' ');
    // Multiword queries match complete words: "am" must not match "pham".
    return words.every(word => words.length === 1 ? textWords.some(value => value.startsWith(word)) : textWords.includes(word));
  });
}
export const defaults = { mass: 100, reject: 10, initial: 88, final: 8, loss: 5 };
export function calculate(values) {
  const errors = {};
  for (const key of Object.keys(defaults)) {
    const v = values[key];
    const max = key === 'mass' ? 1000000 : ['initial', 'final'].includes(key) ? 99.99 : 100;
    const min = key === 'mass' ? .01 : 0;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) errors[key] = `Nhập số từ ${min.toLocaleString('vi-VN')} đến ${max.toLocaleString('vi-VN')}.`;
  }
  if (!errors.initial && !errors.final && values.final > values.initial) errors.final = 'Độ ẩm sau sấy không được lớn hơn ban đầu.';
  if (Object.keys(errors).length) return { errors };
  const accepted = values.mass * (1 - values.reject / 100);
  const powder = accepted * (1 - values.initial / 100) / (1 - values.final / 100) * (1 - values.loss / 100);
  return { errors, accepted, rejected: values.mass - accepted, powder, yield: powder / values.mass * 100 };
}
export function makeCsv(values, result) {
  if (Object.keys(result.errors).length) throw new Error('Invalid calculation');
  const rows = [['Musuroom — Mô hình mẻ thử', 'Giá trị', 'Đơn vị'], ['Khối lượng đầu vào', values.mass, 'kg'], ['Tỷ lệ loại bỏ', values.reject, '%'], ['Độ ẩm ban đầu (cơ sở ướt)', values.initial, '%'], ['Độ ẩm sau sấy (cơ sở ướt)', values.final, '%'], ['Hao hụt sau sấy', values.loss, '%'], ['Nguyên liệu được chọn', result.accepted, 'kg'], ['Nguyên liệu loại bỏ', result.rejected, 'kg'], ['Bột nền ước tính', result.powder, 'kg'], ['Tỷ lệ bột trên đầu vào', result.yield, '%'], ['Phạm vi', 'Giả định minh họa; chưa gồm phối trộn; không xác nhận an toàn hoặc mức giảm lãng phí', '']];
  return '\uFEFF' + rows.map(row => row.map(cell => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\r\n');
}
