import { request, feedback, formErrors, element } from './portal-ui.js';
import { beginSubmission, isSubmitting } from './form-state.js';
const labels = ['Rất không thích','Không thích nhiều','Không thích','Hơi không thích','Bình thường','Hơi thích','Thích','Thích nhiều','Rất thích'];
for (const select of document.querySelectorAll('.hedonic')) {
  const blank = element('option', 'Chọn mức 1–9'); blank.value = ''; select.append(blank);
  labels.forEach((text, i) => { const option = element('option', `${i+1} — ${text}`); option.value = i+1; select.append(option); });
}
const survey = document.getElementById('sensory-form');
const surveyNote = document.getElementById('sensory-feedback');
let key = crypto.randomUUID();
const params = new URLSearchParams(location.search);
for (const [name, q] of [['session_code','session'],['sample_code','sample']]) {
  const value = params.get(q) || '';
  if (/^[A-Za-z0-9][A-Za-z0-9_-]{2,49}$/.test(value)) survey.elements[name].value = survey.elements[name].defaultValue = value;
}
survey.addEventListener('submit', async event => {
  event.preventDefault();
  if (isSubmitting(survey) || survey.dataset.saved === 'true' || !survey.reportValidity()) return;
  formErrors(survey);
  const input = Object.fromEntries(new FormData(survey));
  for (const name of ['color_score','aroma_score','umami_taste_score','aftertaste_score','overall_acceptance']) input[name] = Number(input[name]);
  input.submission_key = key;
  const finish = beginSubmission(survey);
  feedback(surveyNote, 'Đang gửi phiếu…');
  try {
    await request('/api/v1/sensory/submit', { method:'POST', body:input });
    feedback(surveyNote, 'Đã nhận phiếu. Cảm ơn bạn đã góp ý cho mẫu thử. Chọn “Phiếu mới” nếu cần đánh giá mẫu khác.');
    survey.dataset.saved = 'true';
  } catch (error) {
    formErrors(survey, error.fields); feedback(surveyNote, error.message, true);
  } finally {
    finish();
    if (survey.dataset.saved === 'true') for (const control of survey.querySelectorAll('input,select,textarea,button[type=submit]')) control.disabled = true;
  }
});
survey.addEventListener('reset', event => {
  if (isSubmitting(survey)) return event.preventDefault();
  key = crypto.randomUUID(); delete survey.dataset.saved;
  for (const control of survey.querySelectorAll('input,select,textarea,button')) control.disabled = false;
  formErrors(survey); feedback(surveyNote, '');
});
const sample = document.getElementById('sample-form');
const sampleNote = document.getElementById('sample-feedback');
sample.addEventListener('submit', async event => {
  event.preventDefault();
  if (isSubmitting(sample) || !sample.reportValidity()) return;
  formErrors(sample);
  const input = Object.fromEntries(new FormData(sample)); input.consent = sample.elements.consent.checked;
  const finish = beginSubmission(sample);
  let accepted = false;
  feedback(sampleNote, 'Đang tiếp nhận đăng ký…');
  try {
    const result = await request('/api/v1/leads/register', { method:'POST', body:input });
    feedback(sampleNote, result.message); accepted = true;
  } catch (error) {
    formErrors(sample, error.fields); feedback(sampleNote, error.message, true);
  } finally {
    finish(); if (accepted) sample.reset();
  }
});
sample.addEventListener('reset', event => { if (isSubmitting(sample)) event.preventDefault(); else formErrors(sample); });
