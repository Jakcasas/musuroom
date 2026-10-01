import { element,request,feedback,date } from './portal-ui.js';
export function dataWorkspace(onError) {
 const $=id=>document.getElementById(id);
 let session=null,version=0,items=[],cursor=null,after='',history=[];
 function clear(){session=null;version++;items=[];cursor=null;after='';history=[];$('data-panel').hidden=true;for(const id of ['data-rows','data-status','data-json','data-decision','data-article'])$(id).replaceChildren();$('data-consent').checked=false;}
 function current(v){return session&&version===v;}
 async function load(nextAfter=after,nextHistory=history){
  if(!session)return;const v=++version;
  $('data-refresh').disabled=true;$('data-next').disabled=true;$('data-back').disabled=true;
  $('data-preview').disabled=true;$('data-classify').disabled=true;$('data-download').disabled=true;
  try{
   const query=new URLSearchParams({after:nextAfter,limit:'25'});if($('data-type').value)query.set('type',$('data-type').value);
   const[data,status]=await Promise.all([request('/api/v1/admin/data/documents?'+query),request('/api/v1/admin/data/status')]);if(!current(v))return;
   after=nextAfter;history=nextHistory;items=data.items;cursor=data.next_cursor;
   $('data-status').textContent=`${status.mongo_enabled?'Đồng bộ Atlas đã cấu hình':'Atlas chưa kết nối'} · ${status.total} bản ghi · ${status.pending} chờ đồng bộ · ${status.source}${status.last_completed_at?' · Lần xử lý gần nhất: '+date(status.last_completed_at):''}${status.last_error_code?' · Cần kiểm tra kết nối đồng bộ':''}`;
   $('data-rows').replaceChildren();$('data-article').replaceChildren();$('data-json').textContent='Chọn “Xem JSON” để xem bản ghi, hoặc “Xem yêu cầu Jev” để kiểm tra nội dung gửi đi.';$('data-decision').textContent='';$('data-consent').checked=false;
   for(const item of items){
    const row=element('tr');row.append(element('td',item.data?.title||item.data?.label||item.resource_id),element('td',({knowledge:'Tri thức',sensory:'Cảm quan',product:'Mẫu đo'})[item.type]),element('td',item.active?'Đang dùng':'Đã rút dữ liệu'));
    const cell=element('td'),button=element('button','Xem JSON','text-button');button.type='button';button.addEventListener('click',()=>{$('data-json').textContent=JSON.stringify(item,null,2);});cell.append(button);row.append(cell);$('data-rows').append(row);
    if(item.type==='knowledge'&&item.active){const option=element('option',item.data.title);option.value=item.resource_id;$('data-article').append(option);}
   }
   if(!items.length){const row=element('tr'),cell=element('td','Chưa có bản ghi trong nhóm này.');cell.colSpan=4;row.append(cell);$('data-rows').append(row);}
   $('data-page').textContent=`Trang ${history.length+1} · ${items.length} bản ghi`;
   $('data-next').disabled=!cursor;$('data-back').disabled=!history.length;$('data-download').disabled=!items.length;
   $('data-preview').disabled=!$('data-article').options.length;$('data-classify').disabled=!status.jev_enabled||!$('data-article').options.length;
   $('data-jev-status').textContent=status.jev_enabled?'Jev gợi ý chủ đề bài tri thức. Xem JSON trước khi gửi; kết quả cần được đối chiếu với nguồn.':'Jev chưa được cấu hình. Bạn vẫn có thể xem yêu cầu JSON và thử nó trong Playground.';
  }catch(error){if(current(v))onError(error);}finally{if(current(v))$('data-refresh').disabled=false;}
 }
 $('data-refresh').addEventListener('click',()=>load());
 $('data-type').addEventListener('change',()=>load('',[]));
 $('data-next').addEventListener('click',()=>{if(cursor)load(cursor,[...history,after]);});
 $('data-back').addEventListener('click',()=>{if(history.length)load(history.at(-1),history.slice(0,-1));});
 $('data-article').addEventListener('change',()=>{$('data-consent').checked=false;$('data-json').textContent='Chọn “Xem yêu cầu Jev” để kiểm tra bài vừa chọn.';$('data-decision').textContent='';});
 $('data-download').addEventListener('click',()=>{
  if(!session||!items.length)return;const url=URL.createObjectURL(new Blob([JSON.stringify({source:items[0].source,items,next_cursor:cursor},null,2)],{type:'application/json'})),link=element('a');link.href=url;link.download=`musuroom-json-page-${history.length+1}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $('data-preview').addEventListener('click',async()=>{
  const v=version;try{const data=await request('/api/v1/admin/data/jev-preview',{method:'POST',csrf:session?.csrf_token,body:{article_id:$('data-article').value}});if(current(v))$('data-json').textContent=JSON.stringify(data.request,null,2);}catch(error){if(current(v))onError(error);}
 });
 $('data-classify').addEventListener('click',async event=>{
  if(!$('data-consent').checked)return feedback($('data-decision'),'Vui lòng đồng ý gửi bài tri thức đã chọn.',true);
  const v=version;event.target.disabled=true;
  try{const data=await request('/api/v1/admin/data/classify',{method:'POST',csrf:session?.csrf_token,body:{article_id:$('data-article').value,allow_remote:true}});if(current(v)){
   const labels={ingredients:'Nguyên liệu',flavor:'Hương vị',safety:'Ổn định & an toàn thực phẩm',methods:'Phương pháp nghiên cứu',other:'Chưa rõ chủ đề'};
   feedback($('data-decision'),data.mode==='jev'?`${labels[data.topic]} · Độ tin cậy mô hình ${(data.confidence*100).toFixed(1)}% · ${data.requires_review?'Cần người vận hành xem lại':'Đề xuất để đối chiếu nguồn'}. Kết quả không thay đổi dữ liệu gốc.`:data.message||'Jev chưa trả được đề xuất hợp lệ. Bạn có thể tự phân loại.');
  }}catch(error){if(current(v))onError(error);}finally{if(current(v))event.target.disabled=false;}
 });
 return{clear,async show(auth){clear();if(auth.user.role==='ADMIN'){session=auth;$('data-panel').hidden=false;await load('');}}};
}
