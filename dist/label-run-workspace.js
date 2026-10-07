import {element,request,feedback} from './portal-ui.js';
export function labelRunWorkspace(parent,{getSession,onError,isBusy}){
 const section=element('section','','data-jev'),title=element('h4','Xử lý kho JSON theo lô'),note=element('p','Mỗi lần xử lý tối đa 5 bài tri thức công khai. Tiến độ lưu trên Atlas và tiếp tục được sau khi triển khai lại.','small');
 const label=element('label','Số bản ghi tối đa trong tác vụ'),limit=element('input');limit.type='number';limit.min='1';limit.max='10000';limit.value='100';label.append(limit);
 const consentLabel=element('label','','check-label'),consent=element('input');consent.type='checkbox';consentLabel.append(consent,document.createTextNode(' Tôi đồng ý gửi nội dung tri thức công khai trong tác vụ này tới JevAI. Khi bỏ chọn, chỉ dùng luật cục bộ.'));
 const actions=element('div','','form-actions'),preview=element('button','Xem JSON trước','text-button'),start=element('button','Tạo tác vụ','button dark'),refresh=element('button','Cập nhật tiến độ','text-button'),schemas=element('button','Xem JSON Schema','text-button');
 for(const button of [preview,start,refresh,schemas])button.type='button';actions.append(preview,start,refresh,schemas);
 const message=element('p','','form-feedback');message.setAttribute('role','status');const json=element('pre','','json-view');json.tabIndex=0;json.setAttribute('aria-label','JSON Schema hoặc bản xem trước tác vụ');
 const rows=element('div');section.append(title,note,label,consentLabel,actions,message,json,rows);parent.append(section);let busy=false,version=0;
 const states={queued:'Đang chờ',running:'Đang xử lý',completed:'Hoàn tất',blocked:'Cần xử lý cấu hình Jev',failed:'Cần kiểm tra dữ liệu/dịch vụ',cancelled:'Đã dừng'};
 const auth=()=>getSession();
 const call=(path,body)=>request('/api/v1/admin/data/'+path,{...(body?{method:'POST',csrf:auth().csrf_token,body}:{})});
 function toggle(){for(const input of [preview,start,refresh,schemas,limit,consent])input.disabled=busy||!auth()||isBusy();}
 async function action(fn){if(!auth()||busy||isBusy())return;const v=version;busy=true;toggle();try{await fn(v);}catch(error){if(v===version)onError(error);}finally{if(v===version){busy=false;toggle();}}}
 async function load(v=version){
  const page=await call('label-runs');if(v!==version)return;rows.replaceChildren();
  for(const run of page.items){
   const row=element('div','','research-card');row.append(element('p',`${states[run.status]||run.status} · Đã quét ${run.scanned}/${run.total} · Jev ${run.jev} · Cục bộ ${run.local} · Cần xem lại ${run.needs_review}`));
   if(run.last_error_code)row.append(element('p',`Mã chẩn đoán: ${run.last_error_code}. Tác vụ giữ vị trí để tiếp tục sau khi xử lý lỗi.`,'small'));
   const controls=element('div','','form-actions');
   for(const [name,text] of [['events','Xem nhật ký JSON'],...(['blocked','failed'].includes(run.status)?[['resume','Tiếp tục tác vụ']]:[]),...(!['completed','cancelled'].includes(run.status)?[['cancel','Dừng tác vụ']]:[])]){
    const button=element('button',text,'text-button');button.type='button';button.addEventListener('click',()=>action(async current=>{const response=await call(`label-runs/${run.id}/`+(name==='events'?'events':'control'),name==='events'?undefined:{action:name});if(current!==version)return;json.textContent=JSON.stringify(response,null,2);if(name!=='events')await load(current);}));controls.append(button);
   }row.append(controls);rows.append(row);
  }if(!page.items.length)rows.append(element('p','Chưa có tác vụ phân loại trong Atlas.','small'));
 }
 const settings=()=>({limit:Number(limit.value),allow_remote:consent.checked});
 preview.addEventListener('click',()=>action(async v=>{const data=await call('label-runs/preview',settings());if(v!==version)return;json.textContent=JSON.stringify(data,null,2);feedback(message,`Có ${data.eligible} bản ghi trong phạm vi. Chưa gọi Jev.`);}));
 start.addEventListener('click',()=>action(async v=>{const data=await call('label-runs',settings());if(v!==version)return;consent.checked=false;feedback(message,`Đã lưu tác vụ cho ${data.total} bản ghi. Bấm cập nhật để xem tiến độ.`);await load(v);}));
 schemas.addEventListener('click',()=>action(async v=>{const data=await call('schemas');if(v===version)json.textContent=JSON.stringify(data,null,2);}));refresh.addEventListener('click',()=>action(v=>load(v)));
 return {clear(){version++;busy=false;consent.checked=false;json.textContent='';message.textContent='';rows.replaceChildren();toggle();},load:()=>action(v=>load(v))};
}
