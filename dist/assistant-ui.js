import { request } from './portal-ui.js';
import { beginSubmission, isSubmitting } from './form-state.js';
import { localAnswer } from './browser-retrieval.js';
const library = document.querySelector('.library-layout');
if (library) {
  const panel = document.createElement('details');
  panel.className = 'assistant-panel'; panel.id = 'assistant';
  panel.innerHTML = `<summary>Hỏi trợ lý Musuroom <span>Tra cứu kèm nguồn ↗</span></summary><div class="assistant-content"><p id="assistant-mode">Đang kiểm tra chế độ trợ lý…</p><form id="assistant-form"><label for="assistant-question">Câu hỏi của bạn</label><div class="assistant-input"><input id="assistant-question" name="question" required minlength="2" maxlength="1000" placeholder="Ví dụ: Hoạt độ nước khác độ ẩm như thế nào?"><button type="submit" class="button dark">Gửi câu hỏi →</button></div></form><div id="assistant-answer" role="status" aria-live="polite"></div><div id="assistant-sources"></div></div>`;
  library.prepend(panel);
  const mode = document.getElementById('assistant-mode');
  let remoteReady=false,aiEnabled=false;
  const consentLabel=document.createElement('label');consentLabel.className='check-label';consentLabel.hidden=true;
  const consent=document.createElement('input');consent.type='checkbox';
  consentLabel.append(consent,document.createTextNode(' Tôi đồng ý gửi câu hỏi và tối đa 3 bài liên quan đến OpenRouter để tổng hợp.'));
  document.getElementById('assistant-form').append(consentLabel);
  const retry=document.createElement('button');retry.type='button';retry.className='text-button';retry.textContent='Kiểm tra kết nối trợ lý';mode.after(retry);
  async function checkConnection() {
  if(retry.disabled)return;retry.disabled=true;
  try {
    const response = await fetch('/api/status', { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('unavailable');
    const status = await response.json();
    if(typeof status.aiEnabled!=='boolean')throw Error('invalid_status');
    remoteReady=true;aiEnabled=status.aiEnabled;consentLabel.hidden=!aiEnabled;
    mode.textContent = status.aiEnabled ? 'Trợ lý có kết nối OpenRouter: câu hỏi và nội dung tối đa ba bài liên quan sẽ được gửi để tổng hợp câu trả lời. Vui lòng tránh nhập thông tin cá nhân và đối chiếu với nguồn. Musuroom không lưu lịch sử hỏi đáp vào database.' : 'Tra cứu từ kho tri thức: hiển thị nội dung liên quan và nguồn để bạn đọc lại.';
  } catch {remoteReady=false;aiEnabled=false;consentLabel.hidden=true;consent.checked=false; mode.textContent = 'Máy chủ chưa kết nối được. Trợ lý tra cứu bản đi kèm ngay trong trình duyệt; câu hỏi không được gửi ra ngoài.'; }
  finally{retry.disabled=false;}
  }
  retry.addEventListener('click',checkConnection);void checkConnection();
  const form = document.getElementById('assistant-form');
  const answer = document.getElementById('assistant-answer');
  const sources = document.getElementById('assistant-sources');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(isSubmitting(form)||!form.reportValidity())return;
    const question = document.getElementById('assistant-question').value.trim();
    if (question.length < 2) return;
    const finish = beginSubmission(form);
    answer.setAttribute('aria-busy', 'true');
    answer.textContent = 'Đang tra cứu…'; sources.replaceChildren();
    try {
      let data;
      if(!remoteReady||(aiEnabled&&!consent.checked))data=localAnswer(question);
      else try{data=await request('/api/chat', {method:'POST',body:{question,allow_remote:aiEnabled&&consent.checked}});}
      catch(error){if(error.status&&error.status<500)throw error;data=localAnswer(question,{requestAttempted:true});}
      answer.textContent = (data.mode === 'ai' ? 'Tổng hợp có trích dẫn\n\n' : data.mode==='bundled'?'Trích đoạn từ bản đi kèm\n\n':'Trích đoạn từ kho tri thức\n\n') + data.answer;
      for (const source of data.sources) {
        const link = document.createElement('a'); link.textContent = `[${source.ref}] ${source.title} (${source.year})`; link.href = `tri-thuc.html?doc=${encodeURIComponent(source.id)}`; sources.append(link);
      }
      if(data.note){const note=document.createElement('p');note.textContent=data.note;sources.append(note);}
      if (data.reason && !['ai_disabled', 'no_matches'].includes(data.reason)) {
        const note = document.createElement('p'); note.textContent = data.reason === 'provider_cooldown' ? `Dịch vụ tổng hợp đang tạm nghỉ; bạn vẫn có thể đọc nội dung và nguồn bên trên. Có thể thử lại sau ${data.retry_after} giây.` : 'Đang hiển thị nội dung từ kho tri thức do dịch vụ tổng hợp chưa sẵn sàng hoặc phản hồi chưa đạt yêu cầu.'; sources.append(note);
      }
    } catch (error) { answer.textContent = error.name === 'TimeoutError' ? 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.' : error.message; }
    finally { finish(); answer.setAttribute('aria-busy', 'false'); }
  });
}
