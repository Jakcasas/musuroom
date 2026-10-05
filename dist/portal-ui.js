export const element=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
export const number=value=>value===null||value===undefined?'—':Number(value).toLocaleString('vi-VN',{maximumFractionDigits:4});
export const date=value=>new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
export async function request(path,{method='GET',body,csrf}={}) {
 const response=await fetch(path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(csrf?{'X-CSRF-Token':csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(65000)});
 if(!response.ok){const data=await response.json().catch(()=>({}));const wait=Math.max(1,Math.min(600,Number(response.headers.get('Retry-After'))||60));const messages={sample_revision_conflict:'Hồ sơ mẫu đã thay đổi. Tải lại trang, đọc hồ sơ hiện tại rồi chấm lại.',revision_conflict:'Thông tin đã được cập nhật trong phiên khác. Tải lại trang trước khi lưu.',duplicate_sample_jar:'Cặp mã mẫu và mã hũ đã tồn tại. Hãy chọn mã khác.',evidence_not_found:'Tài liệu minh chứng không còn tồn tại. Tải lại danh sách để chọn tài liệu khác.'};const error=new Error(response.status===401?'Mã truy cập không hợp lệ, đã hết hạn hoặc phiên đã kết thúc.':response.status===403?'Bạn chưa có quyền cho thao tác này. Hãy đăng nhập lại nếu phiên đã thay đổi.':response.status===429?`Bạn đã đạt giới hạn thao tác. Hãy thử lại sau ${wait} giây.`:data.error==='submission_key_conflict'?'Phiếu này đã được nhận với nội dung khác. Chọn “Phiếu mới” nếu bạn muốn gửi đánh giá mới.':messages[data.error]||Object.values(data.errors||{}).join(' ')||'Không thể hoàn tất. Kiểm tra thông tin và thử lại.');error.status=response.status;error.fields=data.errors;throw error;}
 if(response.status===204)return null;
 return response.headers.get('content-type')?.includes('text/csv')?response.blob():response.json();
}
export function feedback(node,message,bad=false){node.textContent=message;node.classList.toggle('error',bad);}
export function formErrors(form,fields={}){for(const input of form.querySelectorAll('input,select,textarea')){input.setAttribute('aria-invalid',String(Boolean(fields[input.name])));const error=form.querySelector(`[data-error="${input.name}"]`);if(error)error.textContent=fields[input.name]||'';}}
export function radar(target,values,labels){
 target.replaceChildren();if(values.some(x=>x===null)){target.append(element('p','Chưa có phiếu để vẽ biểu đồ.','empty-chart'));return;}
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 480 360');svg.setAttribute('role','group');svg.setAttribute('aria-label','Điểm trung bình cảm quan trên thang 1 đến 9. Xem bảng để đọc giá trị chính xác.');
 const point=(i,r)=>[240+Math.cos(-Math.PI/2+i*2*Math.PI/5)*r,180+Math.sin(-Math.PI/2+i*2*Math.PI/5)*r];
 const shape=(name,attrs)=>{const n=document.createElementNS(ns,name);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n;};
 for(const level of [3,6,9])shape('polygon',{points:labels.map((_,i)=>point(i,level/9*110).join(',')).join(' '),class:'radar-grid'});
 labels.forEach((label,i)=>{const[x,y]=point(i,110);shape('line',{x1:240,y1:180,x2:x,y2:y,class:'radar-grid'});const[lx,ly]=point(i,140);const n=shape('text',{x:lx,y:ly,'text-anchor':lx>260?'start':lx<220?'end':'middle',class:'radar-label'});n.textContent=label;});
 shape('polygon',{points:values.map((v,i)=>point(i,v/9*110).join(',')).join(' '),class:'radar-data'});
 const detail=element('p','Chạm hoặc dùng Tab tới từng điểm để xem giá trị.','small');detail.setAttribute('role','status');
 values.forEach((value,i)=>{const[x,y]=point(i,value/9*110);const dot=shape('circle',{cx:x,cy:y,r:6,fill:'#10271e',tabindex:0,role:'button','aria-label':`${labels[i]}: ${number(value)} trên 9`});const show=()=>{detail.textContent=`${labels[i]}: ${number(value)} / 9`;};dot.addEventListener('focus',show);dot.addEventListener('mouseenter',show);dot.addEventListener('click',show);dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')show();});});
 target.append(svg,detail);
}
