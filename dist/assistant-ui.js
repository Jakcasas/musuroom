const library = document.querySelector('.library-layout');
if (library) {
  const panel = document.createElement('details');
  panel.className = 'assistant-panel'; panel.id = 'assistant';
  panel.innerHTML = `<summary>Hỏi trợ lý Musuroom <span>Tra cứu kèm nguồn ↗</span></summary><div class="assistant-content"><p id="assistant-mode">Đang kiểm tra chế độ trợ lý…</p><form id="assistant-form"><label for="assistant-question">Câu hỏi của bạn</label><div class="assistant-input"><input id="assistant-question" name="question" required minlength="2" maxlength="1000" placeholder="Ví dụ: Hoạt độ nước khác độ ẩm như thế nào?"><button type="submit" class="button dark">Gửi câu hỏi →</button></div></form><div id="assistant-answer" role="status" aria-live="polite"></div><div id="assistant-sources"></div></div>`;
  library.prepend(panel);
  const mode = document.getElementById('assistant-mode');
  try {
    const response = await fetch('/api/status', { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('unavailable');
    const status = await response.json();
    mode.textContent = status.aiEnabled ? 'AI đang bật. Câu hỏi và các đoạn tài liệu liên quan sẽ được gửi đến OpenRouter. Câu trả lời cần được đối chiếu với nguồn; lịch sử hỏi đáp không được lưu trong database của Musuroom.' : 'Chế độ tra cứu tài liệu: trả về đoạn liên quan và nguồn, chưa dùng AI tạo câu trả lời. Có thể bật AI trong cấu hình máy chủ.';
  } catch { mode.textContent = 'Trợ lý cần máy chủ Musuroom. Khởi động bằng MO_MUSUROOM.cmd để sử dụng.'; }
  const form = document.getElementById('assistant-form');
  const answer = document.getElementById('assistant-answer');
  const sources = document.getElementById('assistant-sources');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = document.getElementById('assistant-question').value.trim();
    if (question.length < 2) return;
    const button = form.querySelector('button'); button.disabled = true;
    answer.textContent = 'Đang tra cứu…'; sources.replaceChildren();
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal: AbortSignal.timeout(65000) });
      if (!response.ok) throw new Error(response.status === 429 ? 'Bạn hỏi hơi nhanh. Hãy thử lại sau một phút.' : 'Chưa thể trả lời. Kiểm tra máy chủ rồi thử lại.');
      const data = await response.json();
      answer.textContent = (data.mode === 'ai' ? 'AI tổng hợp từ tài liệu\n\n' : 'Trích đoạn từ kho tri thức\n\n') + data.answer;
      for (const source of data.sources) {
        const link = document.createElement('a'); link.textContent = `[${source.ref}] ${source.title} (${source.year})`; link.href = `tri-thuc.html?doc=${encodeURIComponent(source.id)}`; sources.append(link);
      }
      if (data.reason && !['ai_disabled', 'no_matches'].includes(data.reason)) {
        const note = document.createElement('p'); note.textContent = 'AI chưa trả về kết quả phù hợp; đang hiển thị nội dung trong kho tri thức.'; sources.append(note);
      }
    } catch (error) { answer.textContent = error.name === 'TimeoutError' ? 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.' : error.message; }
    finally { button.disabled = false; }
  });
}
