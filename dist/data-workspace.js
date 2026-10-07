import { element,request,feedback,date } from './portal-ui.js';
import { reviewWorkspace } from './review-workspace.js';
import {labelRunWorkspace} from './label-run-workspace.js';
export function dataWorkspace(onError) {
 const $=id=>document.getElementById(id),labels={ingredients:'Nguyên liệu',flavor:'Hương vị',safety:'Ổn định & an toàn thực phẩm',methods:'Phương pháp nghiên cứu',other:'Chưa rõ chủ đề'};
 let session=null,version=0,items=[],cursor=null,after='',history=[],busy=false,loading=false,jevEnabled=false;
 const selected=new Set(),selectionInputs=new Map();
 const tools=element('div','','form-actions'),batchPreview=element('button','Xem yêu cầu của lô','text-button'),batchButton=element('button','Phân loại bài đã chọn →','button dark'),clearSelection=element('button','Bỏ chọn tất cả','text-button'),selectionStatus=element('p','','small');
 for(const button of [batchPreview,batchButton,clearSelection])button.type='button';tools.append(batchPreview,batchButton,clearSelection);
 selectionStatus.setAttribute('role','status');selectionStatus.setAttribute('aria-live','polite');$('data-classify').parentElement.after(selectionStatus,tools);
 $('data-consent').parentElement.lastChild.textContent=' Tôi đồng ý gửi nội dung bài đã chọn, hoặc những bài đánh dấu trong lô, đến JevAI để gợi ý chủ đề.';
 const reviews=reviewWorkspace($('data-decision').parentElement,{getSession:()=>session,isBusy:()=>busy||loading,setBusy,onError,labels});
 const labelRuns=labelRunWorkspace($('data-panel'),{getSession:()=>session,isBusy:()=>busy||loading,onError});
 const current=v=>session&&version===v;
 function setBusy(value){busy=value;sync();}
 function sync(){
  const blocked=!session||busy||loading,hasArticle=$('data-article').options.length>0;
  for(const id of ['data-refresh','data-type','data-article'])$(id).disabled=blocked;
  for(const id of ['data-preview','data-classify'])$(id).disabled=blocked||!hasArticle;
  $('data-consent').disabled=blocked||!jevEnabled;$('data-download').disabled=blocked||!items.length;
  $('data-next').disabled=blocked||!cursor;$('data-back').disabled=blocked||!history.length;
  batchPreview.disabled=blocked||!selected.size;batchButton.disabled=blocked||!selected.size;clearSelection.disabled=blocked||!selected.size;
  batchButton.textContent=`Phân loại bài đã chọn (${selected.size}) →`;selectionStatus.textContent=`Chọn 1–5 bài trong bảng để phân loại theo lô · ${selected.size} / 5 đã chọn.`;
  for(const [id,input]of selectionInputs)input.disabled=blocked||(!selected.has(id)&&selected.size>=5);reviews.sync();
 }
 function clear(){session=null;version++;busy=false;loading=false;items=[];cursor=null;after='';history=[];selected.clear();selectionInputs.clear();jevEnabled=false;reviews.clear();labelRuns.clear();$('data-panel').hidden=true;for(const id of ['data-rows','data-status','data-json','data-decision','data-article'])$(id).replaceChildren();$('data-consent').checked=false;sync();}
 function selectionChanged(){$('data-consent').checked=false;$('data-json').textContent='Danh sách đã thay đổi. Xem yêu cầu của lô trước khi phân loại.';$('data-decision').textContent='';sync();}
 async function load(nextAfter=after,nextHistory=history){
  if(!session||busy)return;const v=++version;loading=true;sync();
  try{
   const query=new URLSearchParams({after:nextAfter,limit:'25'});if($('data-type').value)query.set('type',$('data-type').value);
   const [data,status]=await Promise.all([request('/api/v1/admin/data/documents?'+query),request('/api/v1/admin/data/status')]);if(!current(v))return;
   after=nextAfter;history=nextHistory;items=data.items;cursor=data.next_cursor;jevEnabled=status.jev_enabled;selected.clear();selectionInputs.clear();
   $('data-status').textContent=`${status.mongo_enabled?'Đồng bộ Atlas đã cấu hình':'Atlas chưa kết nối'} · ${status.total} bản ghi · ${status.pending} chờ đồng bộ${status.last_completed_at?' · Lần xử lý gần nhất: '+date(status.last_completed_at):''}${status.last_error_code?' · Cần kiểm tra kết nối đồng bộ':''}`;
   $('data-rows').replaceChildren();$('data-article').replaceChildren();$('data-json').textContent='Xem JSON của một bản ghi hoặc đánh dấu các bài tri thức để xem yêu cầu của lô.';$('data-decision').textContent='';$('data-consent').checked=false;
   for(const item of items){
    const row=element('tr'),title=element('td');
    if(item.type==='knowledge'&&item.active){const checkbox=element('input');checkbox.type='checkbox';checkbox.setAttribute('aria-label','Chọn bài: '+item.data.title);const label=element('label','','check-label');label.append(checkbox,document.createTextNode(item.data.title));title.append(label);selectionInputs.set(item.resource_id,checkbox);checkbox.addEventListener('change',()=>{if(checkbox.checked){if(selected.size>=5){checkbox.checked=false;return;}selected.add(item.resource_id);}else selected.delete(item.resource_id);selectionChanged();});
     const option=element('option',item.data.title);option.value=item.resource_id;$('data-article').append(option);
    }else title.textContent=item.data?.title||item.data?.label||item.resource_id;
    row.append(title,element('td',({knowledge:'Tri thức',sensory:'Cảm quan tổng hợp',product:'Mẫu đo'})[item.type]),element('td',item.active?'Đang dùng':'Đã rút dữ liệu'));
    const cell=element('td'),button=element('button','Xem JSON','text-button');button.type='button';button.addEventListener('click',()=>{$('data-json').textContent=JSON.stringify(item,null,2);});cell.append(button);row.append(cell);$('data-rows').append(row);
   }
   if(!items.length){const row=element('tr'),cell=element('td','Chưa có bản ghi trong nhóm này.');cell.colSpan=4;row.append(cell);$('data-rows').append(row);}
   $('data-page').textContent=`Trang ${history.length+1} · ${items.length} bản ghi`;
   $('data-jev-status').textContent=jevEnabled?'Luật từ khóa sẵn sàng tại server. JevAI chỉ nhận nội dung khi bạn đồng ý và thực hiện phân loại; dịch vụ chưa đáp ứng sẽ dùng luật cục bộ.':'Phân loại cục bộ theo từ khóa đang sẵn sàng. JevAI chưa được cấu hình.';
   await reviews.load();
  }catch(error){if(current(v))onError(error);}finally{if(current(v)){loading=false;sync();}}
 }
 async function perform(path,body,done){
  if(!session||busy||loading)return;const v=version,auth=session;setBusy(true);
  try{const data=await request('/api/v1/admin/data/'+path,{method:'POST',csrf:auth.csrf_token,body});if(current(v))await done(data);}
  catch(error){if(current(v))onError(error);}finally{if(current(v))setBusy(false);}
 }
 clearSelection.addEventListener('click',()=>{selected.clear();for(const input of selectionInputs.values())input.checked=false;selectionChanged();});
 batchPreview.addEventListener('click',()=>perform('jev-batch-preview',{article_ids:[...selected]},data=>{$('data-json').textContent=JSON.stringify(data,null,2);feedback($('data-decision'),`Bản xem trước: ${data.articles.length} bài · ${data.request_bytes.toLocaleString('vi-VN')} bytes · ${data.articles.filter(item=>!item.remote_eligible).length} bài chỉ xử lý tại server. Chưa gửi đến JevAI.`);}));
 batchButton.addEventListener('click',()=>perform('classify-batch',{article_ids:[...selected],allow_remote:$('data-consent').checked},async data=>{const jev=data.items.filter(item=>item.mode==='jev').length,review=data.items.filter(item=>item.requires_review).length;feedback($('data-decision'),`Đã lưu ${data.items.length} đề xuất · ${jev} từ Jev · ${data.items.length-jev} từ luật cục bộ · ${review} cần xem lại. Xem hàng chờ để đối chiếu từng bài.`);await reviews.load();}));
 $('data-refresh').addEventListener('click',()=>load());$('data-type').addEventListener('change',()=>load('',[]));
 $('data-next').addEventListener('click',()=>{if(cursor)load(cursor,[...history,after]);});$('data-back').addEventListener('click',()=>{if(history.length)load(history.at(-1),history.slice(0,-1));});
 $('data-article').addEventListener('change',()=>{$('data-consent').checked=false;$('data-json').textContent='Xem yêu cầu Jev để kiểm tra bài vừa chọn.';$('data-decision').textContent='';});
 $('data-download').addEventListener('click',()=>{if(!session||!items.length||busy||loading)return;const url=URL.createObjectURL(new Blob([JSON.stringify({source:items[0].source,items,next_cursor:cursor},null,2)],{type:'application/json'})),link=element('a');link.href=url;link.download=`musuroom-json-page-${history.length+1}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('data-preview').addEventListener('click',()=>perform('jev-preview',{article_id:$('data-article').value},data=>{$('data-json').textContent=JSON.stringify(data.request,null,2);}));
 $('data-classify').addEventListener('click',()=>perform('classify',{article_id:$('data-article').value,allow_remote:$('data-consent').checked},async data=>{feedback($('data-decision'),data.mode==='jev'?`${labels[data.topic]} · Độ tin cậy mô hình ${(data.confidence*100).toFixed(1)}% · ${data.requires_review?'Cần xem lại':'Đề xuất để đối chiếu nguồn'}.`: `${labels[data.topic]} · Luật từ khóa cục bộ. ${data.message}`);await reviews.load();}));
 return {clear,async show(auth){clear();if(auth.user.role==='ADMIN'){session=auth;$('data-panel').hidden=false;await load('');await labelRuns.load();}}};
}
