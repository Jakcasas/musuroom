import { articles as snapshot, updated } from './knowledge-data.js';
import { searchArticles } from './core.js';
let articles = snapshot;
let databaseOnline = false;
const loadingControls=document.querySelectorAll('#search-form input,#search-form select,#search-form button');
for(const control of loadingControls)control.disabled=true;
try {
  const response = await fetch('/api/knowledge', { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error('API unavailable');
  const data = await response.json();
  if (!Array.isArray(data.items)) throw new Error('Invalid data');
  articles = data.items; databaseOnline = true;
} catch { /* Static library remains readable when the API is unavailable. */ }
for(const control of loadingControls)control.disabled=false;
const input = document.querySelector('#search');
const category = document.querySelector('#category');
const grid = document.querySelector('#articles');
const form = document.querySelector('#search-form');
const count = document.querySelector('#result-count');
const status = document.createElement('p'); status.className = 'library-data-status';
status.textContent = databaseOnline ? 'Kho tri thức đang đọc từ database Musuroom.' : 'Đang dùng bản dữ liệu đi kèm website; chưa kết nối được database.';
document.querySelector('.library-note').prepend(status);
const node = (tag, text, className) => { const e = document.createElement(tag); if (text) e.textContent = text; if (className) e.className = className; return e; };
const consentLabel=node('label','','check-label'),consent=node('input');consent.type='checkbox';consentLabel.append(consent,document.createTextNode(' Tôi đồng ý gửi từ khóa và tối đa 5 bài đang tìm được đến JevAI để sắp xếp mức liên quan.'));
const rankButton=node('button','Sắp xếp cùng Jev →','text-button');rankButton.type='button';
const rankStatus=node('p','','small');rankStatus.setAttribute('role','status');rankStatus.setAttribute('aria-live','polite');
form.append(consentLabel,rankButton,rankStatus);
let searchVersion=0,rankingController;
for (const value of [...new Set(articles.map(a => a.category))]) {
  const option = node('option', value); option.value = value; category.append(option);
}
function card(a, selected) {
  const card = node('article', '', 'knowledge-card' + (selected ? ' selected' : '')); card.id = a.id;
  const meta = node('div', '', 'card-meta'); meta.append(node('span', a.category, 'tag'), node('span', `${a.type} · ${a.year}`, 'tag-type'));
  card.append(meta, node('h2', a.title), node('p', a.summary, 'summary'));
  const detail = node('details'); detail.open = selected;
  detail.append(node('summary', 'Đọc nội dung & giới hạn'), node('p', a.body), node('h3', 'Áp dụng cho dự án'), node('p', a.application), node('p', a.limitation, 'limit'));
  card.append(detail, node('div', '', 'source-spacer'));
  const source = node('div', '', 'source-block');
  source.append(node('p', `[${a.ref}] ${a.source}`, 'source-title'), node('p', `Phạm vi tham khảo: ${a.access}.`), node('p', `Năm xuất bản: ${a.year} · Biên soạn/đối chiếu: ${updated}`));
  const actions = node('div', '', 'card-actions');
  const link = node('a', a.url.startsWith('https://') ? 'Mở nguồn gốc ↗' : 'Xem trên website →'); link.href = a.url;
  if (a.url.startsWith('https://')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', `Mở nguồn của bài ${a.title} (tab mới)`); }
  const permalink = node('a', 'Liên kết bài', 'share-link'); permalink.href = `tri-thuc.html?doc=${encodeURIComponent(a.id)}`;
  actions.append(link, permalink); source.append(actions); card.append(source); return card;
}
function render(selectedId = '', ranked) {
  const results = ranked || searchArticles(articles, input.value, category.value);
  rankButton.disabled=!databaseOnline||input.value.trim().length<2||results.length<2||!consent.checked;
  grid.replaceChildren();
  count.textContent = `${results.length} / ${articles.length} bài viết` + (input.value.trim() ? ` cho “${input.value.trim()}”` : ' trong kho tri thức');
  if (!results.length) { const empty = node('div', '', 'empty'); empty.append(node('h2', 'Chưa tìm thấy bài phù hợp'), node('p', 'Thử từ khóa ngắn hơn, ví dụ “nấm”, “umami”, hoặc xóa bộ lọc chủ đề.')); grid.append(empty); }
  for (const a of results) grid.append(card(a, a.id === selectedId));
}
function restore() {
  const params = new URLSearchParams(location.search);
  input.value = (params.get('q') || '').slice(0, 200);
  category.value = params.get('category') || '';
  if (category.selectedIndex < 0) category.value = '';
  const id = params.get('doc');
  if (id && articles.some(a => a.id === id)) { input.value = ''; category.value = ''; }
  render(id);
  if (id && document.getElementById(id)?.classList.contains('knowledge-card')) requestAnimationFrame(() => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }));
  else if (id) count.textContent += ' · Liên kết bài không tồn tại; đang hiển thị thư viện.';
}
function search() {
  searchVersion++;rankingController?.abort();rankStatus.textContent='';
  const params = new URLSearchParams();
  if (input.value.trim()) params.set('q', input.value.trim());
  if (category.value) params.set('category', category.value);
  history.replaceState(null, '', location.pathname + (params.size ? `?${params}` : ''));
  render();
}
consent.addEventListener('change',()=>render());
rankButton.addEventListener('click',async()=>{
 const version=++searchVersion;rankingController?.abort();rankingController=new AbortController();rankButton.disabled=true;rankStatus.textContent='Đang đối chiếu mức liên quan…';
 try{
  const response=await fetch('/api/knowledge/rerank',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:input.value.trim(),category:category.value,allow_remote:consent.checked}),signal:AbortSignal.any([rankingController.signal,AbortSignal.timeout(65000)])});
  if(!response.ok)throw Error('unavailable');const data=await response.json();if(version!==searchVersion)return;
  render('',data.items);rankStatus.textContent=data.mode==='jev'?`Đã sắp xếp ${data.reranked_count} bài cùng Jev. Đọc nguồn gốc để đối chiếu nội dung.`:'Giữ thứ tự tìm kiếm hiện tại: Jev chưa trả đề xuất đủ tin cậy hoặc chưa sẵn sàng.';
 }catch{if(version===searchVersion)rankStatus.textContent='Chưa thể sắp xếp cùng Jev. Các bài và nguồn tham khảo vẫn sẵn sàng.';}
 finally{if(version===searchVersion)rankButton.disabled=!consent.checked;}
});
input.addEventListener('input', search);
category.addEventListener('change', search);
form.addEventListener('submit', event => { event.preventDefault(); search(); });
form.addEventListener('reset', () => { input.value = ''; category.value = ''; search(); });
window.addEventListener('popstate',()=>{searchVersion++;rankingController?.abort();rankStatus.textContent='';restore();});
restore();
