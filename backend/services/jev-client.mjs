import { readProviderJson,withProviderDeadline } from './provider-response.mjs';
export function jevFailureMessage(reason){return{jev_disabled:'Jev chưa được cấu hình. Bạn có thể tự phân loại.',jev_auth_failed:'JevAI chưa chấp nhận key hoặc quyền model. Người vận hành cần kiểm tra tài khoản JevAI.',jev_rate_limited:'Đã đạt giới hạn JevAI. Bạn có thể thử lại sau hoặc tự phân loại.',jev_busy:'Jev đang xử lý yêu cầu khác. Hãy thử lại sau.',invalid_response:'Jev chưa trả kết quả đúng cấu trúc. Bạn có thể tự phân loại.'}[reason]||'JevAI chưa đáp ứng yêu cầu này. Bạn có thể tự phân loại và tiếp tục xem nguồn.';}
export function validChoice(answer,criteria) {
 if(!answer||answer.type!=='choice'||!Object.hasOwn(criteria,answer.choice)||!Number.isFinite(answer.confidence)||answer.confidence<0||answer.confidence>1||!answer.probabilities||Array.isArray(answer.probabilities))return false;
 const keys=Object.keys(criteria), probabilities=answer.probabilities;
 return Object.keys(probabilities).length===keys.length&&keys.every(key=>Object.hasOwn(probabilities,key)&&Number.isFinite(probabilities[key])&&probabilities[key]>=0&&probabilities[key]<=1)&&Math.abs(keys.reduce((sum,key)=>sum+probabilities[key],0)-1)<=0.01&&probabilities[answer.choice]>=Math.max(...keys.map(key=>probabilities[key]));
}
export function createJevEvaluator(config,fetchImpl=fetch) {
 let active=0;
 return async request=>{
  if(!config.jevEnabled)return{reason:'jev_disabled'};
  if(request.model!=='typesafe-ai/jev')return{reason:'unsupported_model'};
  if(active>=2)return{reason:'jev_busy'};
  const body=JSON.stringify(request);if(Buffer.byteLength(body)>20000)return{reason:'context_too_large'};
  active++;
  try{return await withProviderDeadline(async signal=>{
   let response;
   for(let attempt=0;attempt<2;attempt++){
    response=await fetchImpl('https://www.jevai.org/api/v1/decisions',{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${config.jevKey}`,'Content-Type':'application/json'},signal,body});
    if(attempt||![429,529].includes(response.status))break;
    const header=response.headers?.get('retry-after'),seconds=header==null?1:Number(header);
    if(!Number.isFinite(seconds)||seconds<0||seconds>3)break;
    await response.body?.cancel();const{setTimeout}=await import('node:timers/promises');await setTimeout(Math.max(250,seconds*1000),undefined,{signal});
   }
   if(!response.ok){response.body?.cancel?.().catch(()=>{});return{reason:response.status===401||response.status===403?'jev_auth_failed':response.status===429?'jev_rate_limited':'provider_unavailable'};}
   const envelope=await readProviderJson(response,signal);
   if(envelope.code!==0||!envelope.data||typeof envelope.data!=='object')return{reason:'invalid_response'};
   return{data:envelope.data};
  },config.timeout);}catch{return{reason:'provider_unavailable'};}finally{active--;}
 };
}
