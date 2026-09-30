export const element=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
export const number=value=>value===null||value===undefined?'—':Number(value).toLocaleString('vi-VN',{maximumFractionDigits:4});
export const date=value=>new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
export async function request(path,{method='GET',body,csrf}={}) {
 const response=await fetch(path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(csrf?{'X-CSRF-Token':csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(65000)});
 if(!response.ok){const data=await response.json().catch(()=>({}));const wait=Math.max(1,Math.min(600,Number(response.headers.get('Retry-After'))||60));const error=new Error(response.status===401?'Mã truy cập không hợp lệ, đã hết hạn hoặc phiên đã kết thúc.':response.status===403?'Bạn chưa có quyền cho thao tác này. Hãy đăng nhập lại nếu phiên đã thay đổi.':response.status===429?`Bạn đã đạt giới hạn thao tác. Hãy thử lại sau ${wait} giây.`:data.error==='submission_key_conflict'?'Phiếu này đã được nhận với nội dung khác. Chọn “Phiếu mới” nếu bạn muốn gửi đánh giá mới.':Object.values(data.errors||{}).join(' ')||'Không thể hoàn tất. Kiểm tra thông tin và thử lại.');error.status=response.status;error.fields=data.errors;throw error;}
 if(response.status===204)return null;
 return response.headers.get('content-type')?.includes('text/csv')?response.blob():response.json();
}
export function feedback(node,message,bad=false){node.textContent=message;node.classList.toggle('error',bad);}
export function formErrors(form,fields={}){for(const input of form.querySelectorAll('input,select,textarea')){input.setAttribute('aria-invalid',String(Boolean(fields[input.name])));const error=form.querySelector(`[data-error="${input.name}"]`);if(error)error.textContent=fields[input.name]||'';}}
export function radar(target,values,labels){
 target.replaceChildren();if(values.some(x=>x===null)){target.append(element('p','Chưa có phiếu để vẽ biểu đồ.','empty-chart'));return;}
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 480 360');svg.setAttribute('role','img');svg.setAttribute('aria-label','Điểm trung bình cảm quan trên thang 1 đến 9. Xem bảng để đọc giá trị chính xác.');
 const point=(i,r)=>[240+Math.cos(-Math.PI/2+i*2*Math.PI/5)*r,180+Math.sin(-Math.PI/2+i*2*Math.PI/5)*r];
 const shape=(name,attrs)=>{const n=document.createElementNS(ns,name);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n;};
 for(const level of [3,6,9])shape('polygon',{points:labels.map((_,i)=>point(i,level/9*110).join(',')).join(' '),class:'radar-grid'});
 labels.forEach((label,i)=>{const[x,y]=point(i,110);shape('line',{x1:240,y1:180,x2:x,y2:y,class:'radar-grid'});const[lx,ly]=point(i,140);const n=shape('text',{x:lx,y:ly,'text-anchor':lx>260?'start':lx<220?'end':'middle',class:'radar-label'});n.textContent=label;});
 shape('polygon',{points:values.map((v,i)=>point(i,v/9*110).join(',')).join(' '),class:'radar-data'});target.append(svg);
}
