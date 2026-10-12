import { request, feedback, formErrors, element } from './portal-ui.js';
import { beginSubmission, isSubmitting } from './form-state.js';
import { draftStore } from './offline-draft.js';
const labels = ['Rất không thích','Không thích nhiều','Không thích','Hơi không thích','Bình thường','Hơi thích','Thích','Thích nhiều','Rất thích'];
for (const select of document.querySelectorAll('.hedonic')) {
  const blank = element('option', 'Chọn mức 1–9'); blank.value = ''; select.append(blank);
  labels.forEach((text, i) => { const option = element('option', `${i+1} — ${text}`); option.value = i+1; select.append(option); });
}
const survey = document.getElementById('sensory-form');
const surveyNote = document.getElementById('sensory-feedback');
let key = crypto.randomUUID();
let drafts;try{drafts=draftStore(localStorage);}catch{drafts={read:()=>null,save:()=>{throw Error('Trình duyệt không cho lưu phiếu trên máy.');},clear:()=>{}};}
const keepLabel=element('label','','check-label'),keep=element('input');keep.type='checkbox';keepLabel.append(keep,document.createTextNode(' Lưu phiếu trên máy này nếu mất mạng (tối đa 7 ngày). Không ghi thông tin cá nhân trong nhận xét.'));survey.append(keepLabel);
const removeDraft=element('button','Xóa phiếu đang lưu trên máy','text-button');removeDraft.type='button';survey.append(removeDraft);
removeDraft.addEventListener('click',()=>survey.reset());
const params = new URLSearchParams(location.search);
for (const [name, q] of [['session_code','session'],['sample_code','sample']]) {
  const value = params.get(q) || '';
  if (/^[A-Za-z0-9][A-Za-z0-9_-]{2,49}$/.test(value)) survey.elements[name].value = survey.elements[name].defaultValue = value;
}
const pending=drafts.read();
let recoverDraft;
if(pending){
  const restore=()=>{
    for(const name of ['session_code','sample_code','tester_type','color_score','aroma_score','umami_taste_score','aftertaste_score','overall_acceptance','comments']) {
      if(survey.elements[name] && pending[name] != null) survey.elements[name].value=pending[name];
    }
    key=pending.submission_key;keep.checked=true;
    feedback(surveyNote,'Đã khôi phục phiếu chưa xác nhận gửi. Kiểm tra mã đợt/mẫu rồi bấm gửi khi có mạng.');
  };
  const mismatch=['session_code','sample_code'].some(name=>survey.elements[name].defaultValue && survey.elements[name].defaultValue!==pending[name]);
  if(mismatch){
    const recover=element('button','Khôi phục phiếu cũ (đổi mã đợt/mẫu)','text-button');recover.type='button';survey.append(recover);
    recoverDraft=recover;
    feedback(surveyNote,'Có phiếu lưu cho mã đợt/mẫu khác. Đang giữ mã từ QR; chỉ khôi phục nếu bạn muốn tiếp tục phiếu cũ.');
    recover.addEventListener('click',()=>{restore();recover.remove();});
    survey.addEventListener('reset',()=>recover.remove());
  }else restore();
}
survey.addEventListener('submit', async event => {
  event.preventDefault();
  if (isSubmitting(survey) || survey.dataset.saved === 'true' || !survey.reportValidity()) return;
  formErrors(survey);
  const input = Object.fromEntries(new FormData(survey));
  for (const name of ['color_score','aroma_score','umami_taste_score','aftertaste_score','overall_acceptance']) input[name] = Number(input[name]);
  input.submission_key = key;
  const finish = beginSubmission(survey);
  let invalidField;
  let draftSaved=false;
  let draftWarning='';
  feedback(surveyNote, 'Đang gửi phiếu…');
  try {
    if(keep.checked){try{drafts.save(input);draftSaved=true;}catch{draftWarning=' Không lưu được bản nháp trên máy; hãy giữ trang này mở để gửi lại.';}}
    await request('/api/v1/sensory/submit', { method:'POST', body:input });
    let cleanupWarning='';
    try{drafts.clear();}catch{cleanupWarning=' Trình duyệt chưa xóa được bản nháp. Không cần gửi lại phiếu đã được nhận.';}
    feedback(surveyNote, 'Đã nhận phiếu. Cảm ơn bạn đã góp ý cho mẫu thử. Chọn “Phiếu mới” nếu cần đánh giá mẫu khác.'+cleanupWarning);
    survey.dataset.saved = 'true';
    recoverDraft?.remove();
  } catch (error) {
    invalidField=formErrors(survey, error.fields); feedback(surveyNote, draftSaved?'Chưa xác nhận gửi thành công. Phiếu đã lưu trên máy; giữ nguyên nội dung và bấm gửi lại khi có mạng. '+(error.status?error.message:''):error.message+draftWarning, true);
  } finally {
    finish();
    invalidField?.focus();
    if (survey.dataset.saved === 'true') for (const control of survey.querySelectorAll('input,select,textarea,button[type=submit]')) control.disabled = true;
  }
});
survey.addEventListener('reset', event => {
  if (isSubmitting(survey)) return event.preventDefault();
  let cleared=true;try{drafts.clear();}catch{cleared=false;}
  key = crypto.randomUUID(); delete survey.dataset.saved;
  for (const control of survey.querySelectorAll('input,select,textarea,button')) control.disabled = false;
  formErrors(survey); feedback(surveyNote, cleared?'Đã bắt đầu phiếu mới và xóa bản nháp trên máy.':'Đã bắt đầu phiếu mới nhưng chưa xóa được bản nháp. Kiểm tra quyền lưu trữ của trình duyệt.',!cleared);
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
  let invalidField;
  feedback(sampleNote, 'Đang tiếp nhận đăng ký…');
  try {
    const result = await request('/api/v1/leads/register', { method:'POST', body:input });
    feedback(sampleNote, result.message); accepted = true;
  } catch (error) {
    invalidField=formErrors(sample, error.fields); feedback(sampleNote, error.message, true);
  } finally {
    finish(); invalidField?.focus(); if (accepted) sample.reset();
  }
});
sample.addEventListener('reset', event => { if (isSubmitting(sample)) event.preventDefault(); else formErrors(sample); });
