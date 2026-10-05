export const element=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
export const number=value=>value===null||value===undefined?'—':Number(value).toLocaleString('vi-VN',{maximumFractionDigits:4});
export const date=value=>new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
function transportError(error,method) {
 const timeout=error?.name==='TimeoutError'||error?.name==='AbortError';
 const message=timeout?'Máy chủ phản hồi quá lâu.':'Chưa kết nối được máy chủ.';
 const guidance=method==='GET'?' Kiểm tra kết nối rồi tải lại.':' Chưa xác nhận thao tác đã hoàn tất. Kiểm tra kết nối và trạng thái trước khi gửi lại.';
 return Object.assign(new Error(message+guidance),{kind:timeout?'timeout':'network'});
}
export async function request(path,{method='GET',body,csrf}={}) {
 let response;
 try{response=await fetch(path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(csrf?{'X-CSRF-Token':csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(65000)});}
 catch(error){throw transportError(error,method);}
 if(!response.ok){const data=await response.json().catch(()=>({}));const wait=Math.max(1,Math.min(600,Number(response.headers.get('Retry-After'))||60));const messages={sample_revision_conflict:'Hồ sơ mẫu đã thay đổi. Tải lại trang, đọc hồ sơ hiện tại rồi chấm lại.',revision_conflict:'Thông tin đã được cập nhật trong phiên khác. Tải lại trang trước khi lưu.',duplicate_sample_jar:'Cặp mã mẫu và mã hũ đã tồn tại. Hãy chọn mã khác.',evidence_not_found:'Tài liệu minh chứng không còn tồn tại. Tải lại danh sách để chọn tài liệu khác.'};const error=new Error(response.status===401?'Mã truy cập không hợp lệ, đã hết hạn hoặc phiên đã kết thúc.':response.status===403?'Bạn chưa có quyền cho thao tác này. Hãy đăng nhập lại nếu phiên đã thay đổi.':response.status===429?`Bạn đã đạt giới hạn thao tác. Hãy thử lại sau ${wait} giây.`:data.error==='submission_key_conflict'?'Phiếu này đã được nhận với nội dung khác. Chọn “Phiếu mới” nếu bạn muốn gửi đánh giá mới.':messages[data.error]||Object.values(data.errors||{}).join(' ')||'Không thể hoàn tất. Kiểm tra thông tin và thử lại.');error.status=response.status;error.fields=data.errors;throw error;}
 if(response.status===204)return null;
 try{return await (response.headers.get('content-type')?.includes('text/csv')?response.blob():response.json());}
 catch(error){if(error?.name==='TimeoutError'||error?.name==='AbortError'||error instanceof TypeError)throw transportError(error,method);throw Object.assign(new Error('Chưa đọc được phản hồi của máy chủ. Kiểm tra trạng thái trước khi thử lại.'),{kind:'invalid_response'});}
}
export function feedback(node,message,bad=false){node.textContent=message;node.classList.toggle('error',bad);}
export function formErrors(form,fields={}) {
 let firstInvalid;
 for(const input of form.querySelectorAll('input,select,textarea')) {
  if(!input.name)continue;
  const message=fields&&Object.hasOwn(fields,input.name)&&typeof fields[input.name]==='string'?fields[input.name]:'';
  input.setAttribute('aria-invalid',String(Boolean(message)));
  let error=[...form.querySelectorAll('[data-error]')].find(node=>node.dataset.error===input.name);
  if(message&&!error){error=element('span','','field-error');error.dataset.error=input.name;input.after(error);}
  if(error){error.textContent=message;if(!error.id)error.id=`${form.id}-${input.name}-error`;const ids=new Set((input.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(error.id);input.setAttribute('aria-describedby',[...ids].join(' '));}
  if(message&&!firstInvalid)firstInvalid=input;
 }
 return firstInvalid;
}
export function radar(target,values,labels){
 target.replaceChildren();if(values.some(x=>x===null)){target.append(element('p','Chưa có phiếu để vẽ biểu đồ.','empty-chart'));return;}
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 480 360');svg.setAttribute('role','group');svg.setAttribute('aria-label','Điểm trung bình cảm quan trên thang 1 đến 9. Xem bảng để đọc giá trị chính xác.');
 const point=(i,r)=>[240+Math.cos(-Math.PI/2+i*2*Math.PI/5)*r,180+Math.sin(-Math.PI/2+i*2*Math.PI/5)*r];
 const shape=(name,attrs)=>{const n=document.createElementNS(ns,name);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n;};
 for(const level of [3,6,9])shape('polygon',{points:labels.map((_,i)=>point(i,level/9*110).join(',')).join(' '),class:'radar-grid'});
 labels.forEach((label,i)=>{const[x,y]=point(i,110);shape('line',{x1:240,y1:180,x2:x,y2:y,class:'radar-grid'});const[lx,ly]=point(i,140);const n=shape('text',{x:lx,y:ly,'text-anchor':lx>260?'start':lx<220?'end':'middle',class:'radar-label'});n.textContent=label;});
 shape('polygon',{points:values.map((v,i)=>point(i,v/9*110).join(',')).join(' '),class:'radar-data'});
 const detail=element('p','Di chuột hoặc dùng phím Tab tới từng điểm để xem giá trị.','small');detail.setAttribute('role','status');
 values.forEach((value,i)=>{const[x,y]=point(i,value/9*110);const dot=shape('circle',{cx:x,cy:y,r:6,fill:'#10271e',tabindex:0,role:'button','aria-label':`${labels[i]}: ${number(value)} trên 9`});const show=()=>{detail.textContent=`${labels[i]}: ${number(value)} / 9`;};dot.addEventListener('focus',show);dot.addEventListener('mouseenter',show);dot.addEventListener('click',show);dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});});
 target.append(svg,detail);
}
