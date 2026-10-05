import { printReport } from './technical-report.js';
import { element, number, date, request, feedback, radar } from './portal-ui.js';
import { dataWorkspace } from './data-workspace.js';
const $=id=>document.getElementById(id);
let reportData=null;
let auth=null, groups=[], offset=0, expiryTimer, selectionVersion=0;
function clearSession(message='') {
 reportData=null;sentimentNote.textContent='';dataPanel.clear();
 auth=null; clearTimeout(expiryTimer); selectionVersion++; groups=[]; offset=0; $('access-code').value='';
 $('dashboard').hidden=true; $('login-panel').hidden=false;
 for(const id of ['documents','metric-rows','radar','lead-rows','jev-result','jev-status','insight-result','welcome','session-info','project-note','portal-feedback'])$(id).replaceChildren();
 jevCheck.hidden=true;jevCheckNote.textContent='';
 $('group-select').replaceChildren(); $('jev-form').reset(); $('analytics-panel').hidden=true;
 feedback($('login-feedback'),message,Boolean(message));
}
function failed(error,target=$('portal-feedback')) { if(error.status===401)clearSession(error.message);else feedback(target,error.message||'Không thể kết nối máy chủ. Hãy thử lại.',true); }
const dataPanel=dataWorkspace(failed);
function selected(){const group=groups[Number($('group-select').value)];return group?{session_code:group.session_code,sample_code:group.sample_code}:null;}
async function metrics(){
 const selection=selected(); if(!selection)return; const version=++selectionVersion;
 reportData=null; sentimentNote.textContent=''; $('analytics-panel').hidden=true; $('analytics-empty').hidden=false; $('analytics-empty').textContent='Đang tải kết quả…'; $('insight-result').textContent='';
 try{const data=await request('/api/v1/sensory/analytics?'+new URLSearchParams(selection));if(!auth||version!==selectionVersion)return;
 reportData=data;
 $('analytics-count').textContent=`${data.count} phiếu · Đợt ${data.session_code} · Mẫu ${data.sample_code}`;
 $('metric-rows').replaceChildren();Object.values(data.metrics).forEach((m,i)=>{const row=element('tr');for(const value of [data.radar.labels[i],number(m.mean),number(m.median),number(m.sd)])row.append(element('td',value));$('metric-rows').append(row);});
 radar($('radar'),data.radar.values,data.radar.labels);$('analytics-panel').hidden=false;$('analytics-empty').hidden=true;
 }catch(error){$('analytics-empty').textContent='Không thể tải kết quả. Chọn lại đợt để thử lại.';failed(error);}
}
async function loadLeads(){if(auth?.user.role!=='ADMIN')return;
 try{const data=await request(`/api/v1/admin/leads?limit=20&offset=${offset}`);if(!auth)return;$('lead-rows').replaceChildren();
 for(const lead of data.items){const row=element('tr');row.append(element('td',lead.full_name),element('td',`${lead.contact} · ${lead.organization_type}`));
 const cell=element('td');const select=element('select');select.setAttribute('aria-label',`Trạng thái của ${lead.full_name}`);
 for(const [value,label]of [['PENDING','Chờ liên hệ'],['SENT','Đã gửi mẫu'],['FEEDBACK_RECEIVED','Đã nhận góp ý'],['CANCELLED','Đã hủy']]){const option=element('option',label);option.value=value;select.append(option);}select.value=lead.status;
 select.addEventListener('change',async()=>{select.disabled=true;try{await request(`/api/v1/admin/leads/${lead.id}`,{method:'PATCH',body:{status:select.value},csrf:auth?.csrf_token});lead.status=select.value;feedback($('portal-feedback'),'Đã cập nhật trạng thái.');}catch(error){select.value=lead.status;failed(error);}finally{select.disabled=false;}});cell.append(select);row.append(cell);$('lead-rows').append(row);}
 if(!data.items.length){const row=element('tr');const cell=element('td','Chưa có đăng ký ở trang này.');cell.colSpan=3;row.append(cell);$('lead-rows').append(row);}
 $('lead-page').textContent=`Trang ${offset/20+1}`;$('previous-leads').disabled=offset===0;$('next-leads').disabled=data.items.length<20;
 }catch(error){failed(error);}
}
async function showSession(session){
 auth=session;$('login-panel').hidden=true;$('dashboard').hidden=false;feedback($('portal-feedback'),'');
 $('welcome').textContent=`Xin chào, ${session.user.name}.`;$('session-info').textContent=`${session.user.role==='ADMIN'?'Quản trị':'Giám khảo'} · Phiên kết thúc lúc ${date(session.expires_at)} · Tự kết thúc khi không hoạt động.`;
 clearTimeout(expiryTimer);expiryTimer=setTimeout(()=>clearSession('Phiên đã hết hạn. Vui lòng đăng nhập lại.'),Math.max(0,new Date(session.expires_at)-Date.now()));
 $('admin-panel').hidden=session.user.role!=='ADMIN';
 try{const [dossier,result]=await Promise.all([request('/api/v1/judge/dossier'),request('/api/v1/judge/groups')]);if(!auth)return;
 $('project-note').textContent=dossier.project.note;$('documents').replaceChildren();
 for(const doc of dossier.documents){const card=element('article','','document-card');card.append(element('span',`${doc.doc_type} · ${doc.evidence_status==='DRAFT'?'Bản nháp':'Bản hoàn thiện'}`,'eyebrow'),element('h4',doc.title),element('p',`${number(doc.size_bytes/1024)} KB · ${date(doc.created_at)}`,'small'));
 const link=element('a','Tải tài liệu ↓','arrow-link');link.href=doc.download_url;card.append(link);$('documents').append(card);}
 if(!dossier.documents.length)$('documents').append(element('p','Chưa có tài liệu được cung cấp.','library-note'));
 $('jev-status').textContent=dossier.jev_enabled?'Jev đã cấu hình; đang kiểm tra trạng thái phản hồi.':'Phân loại cục bộ theo từ khóa đang sẵn sàng. JevAI chưa được cấu hình.';
 jevCheck.hidden=session.user.role!=='ADMIN';jevCheck.disabled=!dossier.jev_enabled;await refreshJevStatus();if(!auth)return;
 $('allow-remote').disabled=!dossier.jev_enabled; $('allow-remote').checked=false;
 groups=result.items;$('group-select').replaceChildren();groups.forEach((g,i)=>{const option=element('option',`${g.session_code} / ${g.sample_code} (${g.count} phiếu)`);option.value=String(i);$('group-select').append(option);});$('group-select').disabled=!groups.length;
 $('analytics-empty').hidden=false;$('analytics-panel').hidden=true;if(groups.length)await metrics();else $('analytics-empty').textContent='Chưa có phiếu khảo sát. Kết quả sẽ xuất hiện sau khi nhận phiếu hợp lệ.';
 if(session.user.role==='ADMIN'){await loadLeads();if(auth)await dataPanel.show(session);}
 }catch(error){failed(error);}
}
$('login-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;const access_code=$('access-code').value;$('access-code').value='';feedback($('login-feedback'),'Đang xác thực…');try{await showSession(await request('/api/v1/judge/verify',{method:'POST',body:{access_code}}));}catch(error){failed(error,$('login-feedback'));}finally{button.disabled=false;}});
$('logout').addEventListener('click',async()=>{try{await request('/api/v1/auth/logout',{method:'POST',body:{},csrf:auth?.csrf_token});clearSession();}catch(error){failed(error);}});
$('group-select').addEventListener('change',metrics);
$('csv-export').addEventListener('click',async event=>{const body=selected();if(!body)return;event.target.disabled=true;try{const blob=await request('/api/v1/sensory/export',{method:'POST',body,csrf:auth?.csrf_token});if(!auth)return;const url=URL.createObjectURL(blob);const link=element('a');link.href=url;link.download=`sensory-${body.session_code}-${body.sample_code}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){failed(error);}finally{event.target.disabled=false;}});
$('insights').addEventListener('click',async event=>{const body=selected();if(!body)return;event.target.disabled=true;const version=selectionVersion;try{const data=await request('/api/v1/sensory/insights',{method:'POST',body,csrf:auth?.csrf_token});if(auth&&version===selectionVersion)$('insight-result').textContent=`${data.mode==='ai'?'Nhận xét AI — cần kiểm tra':'Thống kê mô tả'}: ${data.text}`;}catch(error){failed(error);}finally{event.target.disabled=false;}});
$('jev-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;try{const data=await request('/api/v1/judge/classify',{method:'POST',csrf:auth?.csrf_token,body:{comment:$('jev-comment').value,allow_remote:$('allow-remote').checked}});if(auth){feedback($('jev-result'),data.mode==='jev'?`${data.label} · Độ tin cậy mô hình: ${number(data.confidence*100)}%. ${data.requires_review?'Cần đối chiếu thêm. ':''}${data.message}`:data.mode==='local'?`${data.label} · Luật từ khóa cục bộ. ${data.message}${data.retry_after?' Có thể thử lại sau '+data.retry_after+' giây.':''}`:data.message);await refreshJevStatus();}}catch(error){failed(error,$('jev-result'));}finally{button.disabled=false;}});
$('refresh-leads').addEventListener('click',loadLeads);$('previous-leads').addEventListener('click',()=>{offset=Math.max(0,offset-20);loadLeads();});$('next-leads').addEventListener('click',()=>{offset+=20;loadLeads();});
window.addEventListener('focus',async()=>{if(auth)try{const session=await request('/api/v1/auth/session');auth=session;await refreshJevStatus();}catch(error){failed(error);}});
request('/api/v1/auth/session').then(showSession).catch(error=>{if(error.status!==401)failed(error,$('login-feedback'));});

const pdfButton=element('button','In báo cáo / Lưu PDF ↓','text-button');pdfButton.type='button';$('analytics-panel').append(pdfButton);pdfButton.onclick=()=>{if(auth&&reportData)printReport(reportData);};
const sentimentButton=element('button','Xem xu hướng góp ý','text-button'),sentimentNote=element('p','','small');sentimentButton.type='button';$('analytics-panel').append(sentimentButton,sentimentNote);sentimentButton.onclick=async()=>{const selection=selected(),version=selectionVersion;if(!auth||!selection)return;sentimentButton.disabled=true;try{const data=await request('/api/v1/judge/research/sentiment?'+new URLSearchParams(selection));if(auth&&version===selectionVersion)sentimentNote.textContent=`${data.count} góp ý (tối đa ${data.limit} gần nhất): ${data.counts.positive} tích cực, ${data.counts.negative} cần cải thiện, ${data.counts.mixed} hỗn hợp, ${data.counts.unclear} chưa rõ. ${data.notice}`;}catch(e){failed(e);}finally{sentimentButton.disabled=false;}};

const jevCheck=element('button','Kiểm tra Jev bằng câu minh họa','text-button'),jevCheckNote=element('p','','small');jevCheck.type='button';jevCheck.hidden=true;jevCheckNote.setAttribute('role','status');$('jev-form').before(jevCheck,jevCheckNote);
function showJevStatus(state){const labels={disabled:'Chưa cấu hình kết nối',untested:'Đã cấu hình, chưa xác minh phản hồi',responded:'Dịch vụ đã trả phản hồi có cấu trúc',unavailable:'Chưa nhận được phản hồi hợp lệ'};const reasons={jev_auth_failed:'Key hoặc quyền model bị từ chối.',jev_rate_limited:'Dịch vụ đang giới hạn lượt gọi.',provider_unavailable:'Dịch vụ chưa đáp ứng.',invalid_response:'Phản hồi chưa đúng cấu trúc.'};$('jev-status').textContent=`JevAI · ${labels[state.status]||'Chưa xác minh'}. ${reasons[state.reason]||''}${state.last_checked_at?' Kiểm tra gần nhất: '+date(state.last_checked_at)+'.':''} Phân loại cục bộ luôn sẵn sàng; đối chiếu đề xuất trước khi sử dụng.`;}
async function refreshJevStatus(){try{const session=auth;if(!session)return;const state=await request('/api/v1/judge/jev/status');if(auth===session)showJevStatus(state);}catch(e){failed(e);}}
jevCheck.onclick=async()=>{if(auth?.user.role!=='ADMIN'||jevCheck.disabled)return;const session=auth;jevCheck.disabled=true;jevCheckNote.textContent='Đang gửi câu minh họa cố định đến JevAI để kiểm tra; thao tác có thể dùng một lượt gọi.';try{const data=await request('/api/v1/admin/jev/check',{method:'POST',csrf:session.csrf_token,body:{allow_remote:true}});if(auth!==session)return;showJevStatus(data.connection);jevCheckNote.textContent=data.verification.mode==='jev'?'Đã nhận kết quả Jev cho câu minh họa. Kết quả thực vẫn cần đối chiếu.':'Chưa xác minh được suy luận Jev. '+(data.connection.reason==='jev_auth_failed'?'Kiểm tra personal key và quyền model tại www.jevai.org/agent/keys. ':'')+(data.connection.retry_after?'Chờ khoảng '+data.connection.retry_after+' giây trước lần thử tiếp theo. ':'')+data.notice;}catch(e){failed(e,jevCheckNote);}finally{if(auth===session)jevCheck.disabled=false;}};
