export const criteria = Object.freeze([
  { key: 'color_score', label: 'Màu sắc' },
  { key: 'aroma_score', label: 'Mùi thơm' },
  { key: 'umami_taste_score', label: 'Vị umami' },
  { key: 'aftertaste_score', label: 'Hậu vị' },
  { key: 'overall_acceptance', label: 'Ưa thích chung' }
]);
export const codePattern = /^[A-Za-z0-9][A-Za-z0-9_-]{2,49}$/;
export function validateSensory(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { input: null, errors: { body: 'Cần JSON object.' } };
  const normalized = {};
  for (const key of ['session_code', 'sample_code']) {
    const value = typeof input[key] === 'string' ? input[key].trim() : '';
    if (!codePattern.test(value)) errors[key] = 'Mã cần 3–50 ký tự chữ, số, dấu _ hoặc -.';
    else normalized[key] = value;
  }
  normalized.tester_type = input.tester_type;
  if (!['JUDGE', 'STUDENT', 'CONSUMER', 'OTHER'].includes(input.tester_type)) errors.tester_type = 'Loại người thử không hợp lệ.';
  for (const { key } of criteria) {
    if (!Number.isInteger(input[key]) || input[key] < 1 || input[key] > 9) errors[key] = 'Điểm phải là số nguyên từ 1 đến 9.';
    else normalized[key] = input[key];
  }
  if (input.comments !== undefined && (typeof input.comments !== 'string' || input.comments.length > 1000)) errors.comments = 'Nhận xét tối đa 1.000 ký tự.';
  normalized.comments = typeof input.comments === 'string' ? input.comments.trim() : '';
  if (input.submission_key !== undefined) {
    if (typeof input.submission_key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submission_key)) errors.submission_key = 'Cần UUID hợp lệ.';
    else normalized.submission_key = input.submission_key.toLowerCase();
  } else normalized.submission_key = null;
  return { input: normalized, errors };
}
const round = value => Math.round((value + Number.EPSILON) * 10000) / 10000;
function metric(values) {
  const n = values.length;
  const distribution = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index + 1, 0]));
  for (const score of values) distribution[score]++;
  if (!n) return { n, mean: null, median: null, sd: null, distribution };
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(n / 2);
  const median = n % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  const sd = n < 2 ? null : Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1));
  return { n, mean: round(mean), median: round(median), sd: sd === null ? null : round(sd), distribution };
}
export function sensoryMetrics(rows, sessionCode, sampleCode) {
  const metrics = Object.fromEntries(criteria.map(({ key }) => [key, metric(rows.map(row => row[key]))]));
  const byTesterType = Object.fromEntries(['JUDGE','STUDENT','CONSUMER','OTHER'].map(type => [type, rows.filter(row => row.tester_type === type).length]));
  return {
    session_code: sessionCode, sample_code: sampleCode, count: rows.length,
    metrics,
    radar: { labels: criteria.map(x => x.label), values: criteria.map(x => metrics[x.key].mean), min: 1, max: 9 },
    by_tester_type: byTesterType,
    method: { scale: 'Hedonic 1–9', sd: 'sample standard deviation (n−1)', sd_for_n_less_than_2: null, rounding: 4, missing_scores: 'not accepted', grouping: 'session_code + sample_code' }
  };
}
export function sensoryMetricsFromDistribution(groups, sessionCode, sampleCode) {
  const distributions = Object.fromEntries(criteria.map(({ key }) => [key, Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, 0]))]));
  const byTesterType = Object.fromEntries(['JUDGE','STUDENT','CONSUMER','OTHER'].map(type => [type, 0]));
  for (const group of groups) {
    if (!Number.isSafeInteger(group.n) || group.n < 0) throw new Error('invalid_distribution');
    if (group.criterion === 'tester_type' && Object.hasOwn(byTesterType, group.tester_type)) byTesterType[group.tester_type] += group.n;
    else if (Object.hasOwn(distributions, group.criterion) && Number.isInteger(group.score) && group.score >= 1 && group.score <= 9) distributions[group.criterion][group.score] += group.n;
    else throw new Error('invalid_distribution');
  }
  const count = Object.values(byTesterType).reduce((sum, n) => sum + n, 0);
  if (!Number.isSafeInteger(count)) throw new Error('invalid_distribution');
  const metrics = Object.fromEntries(criteria.map(({ key }) => {
    const distribution = distributions[key];
    const bins = Object.entries(distribution).map(([value, n]) => ({ value: Number(value), n }));
    const n = bins.reduce((sum, bin) => sum + bin.n, 0);
    if (n !== count) throw new Error('inconsistent_distribution');
    if (!n) return [key, { n, mean: null, median: null, sd: null, distribution }];
    const mean = bins.reduce((sum, bin) => sum + bin.value * bin.n, 0) / n;
    const positions = [Math.floor((n - 1) / 2), Math.floor(n / 2)];
    // Locate each middle position independently, including the repeated position for odd n.
    const at = position => { let seen = 0; for (const bin of bins) { seen += bin.n; if (seen > position) return bin.value; } };
    const median = (at(positions[0]) + at(positions[1])) / 2;
    const sd = n < 2 ? null : Math.sqrt(bins.reduce((sum, bin) => sum + bin.n * (bin.value - mean) ** 2, 0) / (n - 1));
    return [key, { n, mean: round(mean), median, sd: sd === null ? null : round(sd), distribution }];
  }));
  return { session_code: sessionCode, sample_code: sampleCode, count, metrics,
    radar: { labels: criteria.map(x => x.label), values: criteria.map(x => metrics[x.key].mean), min: 1, max: 9 },
    by_tester_type: byTesterType,
    method: { scale: 'Hedonic 1–9', sd: 'sample standard deviation (n−1)', sd_for_n_less_than_2: null, rounding: 4, missing_scores: 'not accepted', grouping: 'session_code + sample_code' }
  };
}
export function sensoryCsv(rows) {
  const headers = ['id','session_code','sample_code','tester_type',...criteria.map(x => x.key),'comments','created_at'];
  const escape = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [headers, ...rows.map(row => headers.map(key => row[key]))].map(row => row.map(escape).join(',')).join('\r\n');
}
