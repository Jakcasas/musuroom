import { element,request,feedback,date } from './portal-ui.js';
export function reviewWorkspace(parent,{getSession,isBusy,setBusy,onError,labels}) {
 let generation=0,loading=false,items=[],after='',history=[],cursor=null;
 const filter=element('select'),label=element('label','Trạng thái đề xuất');
 filter.id='review-filter';filter.setAttribute('aria-label','Trạng thái đề xuất');label.htmlFor=filter.id;
 for(const[value,text]of [['all','Tất cả'],['pending','Chưa đối chiếu'],['confirmed','Đã đối chiếu'],['rejected','Không sử dụng'],['stale','Bài nguồn đã thay đổi']]){const option=element('option',text);option.value=value;filter.append(option);}
 label.append(filter);
 const list=element('div'),status=element('p','','small');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const actions=element('div','','form-actions'),back=element('button','← Trang đề xuất trước','text-button'),next=element('button','Trang đề xuất sau →','text-button'),download=element('button','Tải JSON đề xuất ↓','text-button');
 for(const button of [back,next,download])button.type='button';actions.append(back,next,download);
 parent.append(element('h4','Đối chiếu đề xuất'),element('p','Mở bài gốc, xem lý do và độ tin cậy trước khi đối chiếu. Trạng thái đối chiếu được lưu riêng với nội dung công bố.','small'),label,status,list,actions);
 function sync(){const blocked=!getSession()||isBusy()||loading;filter.disabled=blocked;back.disabled=blocked||!history.length;next.disabled=blocked||!cursor;download.disabled=blocked||!items.length;for(const button of list.querySelectorAll('button'))button.disabled=blocked;}
 function clear(){generation++;loading=false;items=[];after='';history=[];cursor=null;filter.value='all';list.replaceChildren();status.textContent='';sync();}
 function row(item){
  const article=element('article','','library-note'),link=element('a',item.title);link.href='tri-thuc.html?doc='+encodeURIComponent(item.article_id);link.target='_blank';link.rel='noopener noreferrer';
  const state=item.stale?'Bài đã thay đổi, cần phân loại lại':({pending:'Chưa đối chiếu',confirmed:'Đã đối chiếu',rejected:'Không sử dụng'})[item.review_status];
  article.append(link,element('p',`${labels[item.decision.topic]||'Chưa rõ'} · ${item.decision.mode==='jev'?'JevAI':'Luật từ khóa'} · ${state}`,'small'));
  const details=element('details');details.append(element('summary','Chi tiết đề xuất'));
  details.append(element('p',item.decision.mode==='jev'&&Number.isFinite(item.decision.confidence)?`Độ tin cậy mô hình: ${(item.decision.confidence*100).toFixed(1)}% · ${item.decision.requires_review?'Cần xem lại':'Đề xuất để đối chiếu'}`:'Luật cục bộ không có độ tin cậy xác suất; cần người vận hành xem lại.','small'));
  if(Array.isArray(item.decision.matched_terms)&&item.decision.matched_terms.length)details.append(element('p','Từ khóa khớp: '+item.decision.matched_terms.join(', '),'small'));
  const reasons={jev_auth_failed:'JevAI chưa chấp nhận quyền truy cập.',jev_disabled:'JevAI chưa được cấu hình.',remote_consent_required:'Đã chọn xử lý tại server.',provider_unavailable:'JevAI chưa đáp ứng yêu cầu.',instruction_like_input:'Nội dung có dấu hiệu chỉ dẫn cần xem lại.',sensitive_input:'Nội dung có dấu hiệu chứa bí mật.',invalid_response:'Phản hồi chưa đúng cấu trúc.',jev_busy:'Jev đang bận.',jev_rate_limited:'Đã đạt giới hạn JevAI.'};
  if(item.decision.reason)details.append(element('p',reasons[item.decision.reason]||'Đề xuất cần được đối chiếu với nguồn.','small'));
  details.append(element('p',`Tạo lúc ${date(item.updated_at)} · Phiên bản bài ${item.source_revision}${item.reviewed_at?' · Đối chiếu lúc '+date(item.reviewed_at):''}`,'small'));article.append(details);
  if(item.review_status==='pending'&&!item.stale){const controls=element('div','','form-actions');for(const[value,text]of [['confirmed','Đã đối chiếu'],['rejected','Không sử dụng']]){const button=element('button',text,'text-button');button.type='button';button.addEventListener('click',async()=>{
   const auth=getSession();if(!auth||isBusy()||loading)return;const token=generation;setBusy(true);
   try{await request('/api/v1/admin/data/review',{method:'POST',csrf:auth.csrf_token,body:{article_id:item.article_id,decision_version:item.decision_version,status:value}});if(getSession()===auth&&token===generation)await load(after,history);}
   catch(error){if(getSession()===auth&&token===generation){onError(error);if(error.status===409)await load(after,history);}}
   finally{if(getSession()===auth)setBusy(false);}
  });controls.append(button);}article.append(controls);}
  return article;
 }
 async function load(nextAfter='',nextHistory=[]){
  const auth=getSession();if(!auth)return;const token=++generation;loading=true;sync();
  try{const data=await request('/api/v1/admin/data/reviews?'+new URLSearchParams({after:nextAfter,limit:'25',filter:filter.value}));if(getSession()!==auth||generation!==token)return;
   items=data.items;after=nextAfter;history=nextHistory;cursor=data.next_cursor;list.replaceChildren(...items.map(row));
   if(!items.length)list.append(element('p','Chưa có đề xuất trong nhóm này.','small'));
   feedback(status,`Trang ${history.length+1} · ${items.length} đề xuất · ${items.filter(item=>item.stale).length} bài nguồn đã thay đổi trong trang này`);
  }catch(error){if(getSession()===auth&&generation===token)onError(error);}
  finally{if(getSession()===auth&&generation===token){loading=false;sync();}}
 }
 filter.addEventListener('change',()=>load());back.addEventListener('click',()=>{if(history.length)load(history.at(-1),history.slice(0,-1));});next.addEventListener('click',()=>{if(cursor)load(cursor,[...history,after]);});
 download.addEventListener('click',()=>{if(!getSession()||isBusy()||loading||!items.length)return;const url=URL.createObjectURL(new Blob([JSON.stringify({filter:filter.value,items,next_cursor:cursor},null,2)],{type:'application/json'})),link=element('a');link.href=url;link.download=`musuroom-de-xuat-${filter.value}-${history.length+1}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 sync();return {load,clear,sync};
}
