import {readProviderJson,withProviderDeadline} from './provider-response.mjs';
import {sensoryQuestion,sensoryLabels} from './jev-rubric.mjs';
import {validChoice} from './jev-client.mjs';

const guidance={
 missing_key:['configuration','save_private_key',false],
 http_auth_rejected:['http_authentication','verify_personal_key',false],
 inference_credentials_or_model_rejected:['inference_access','contact_jev_operator',false],
 quota_or_rate_limit:['quota','wait_and_check_quota',true],
 provider_unavailable:['service','check_jev_service',true],
 non_json_response:['response_format','contact_jev_operator',false],
 invalid_rpc_response:['protocol','check_mcp_contract',false],
 invalid_decision_response:['decision_schema','check_decision_contract',false],
 decision_tool_missing:['protocol','check_mcp_contract',false],
 network_timeout_or_invalid_response:['network_or_response','check_network_and_jev_service',true],
};
export async function diagnoseJev(config,fetchImpl=fetch,{defaultModel=false}={}){
 const report={endpoint:'https://www.jevai.org/api/mcp',key_present:!!config.jevKey,model:defaultModel?'server_default':config.jevModel,checked_at:new Date().toISOString(),stages:[],inference_verified:false};
 const finish=()=>{const [failure_layer,next_action,retryable]=guidance[report.reason]||[null,'none',false];return{...report,failure_layer,next_action,retryable};};
 if(!config.jevKey){report.reason='missing_key';return finish();}
 const call=async(method,params)=>withProviderDeadline(async signal=>{
  const response=await fetchImpl(report.endpoint,{method:'POST',redirect:'error',signal,headers:{Authorization:`Bearer ${config.jevKey}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-03-26'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  const stage={method,http_status:response.status};report.stages.push(stage);
  if(!response.ok){await response.body?.cancel();report.reason=[401,403].includes(response.status)?'http_auth_rejected':response.status===429?'quota_or_rate_limit':'provider_unavailable';return null;}
  const mime=response.headers?.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if(mime&&mime!=='application/json'&&!mime.endsWith('+json')){await response.body?.cancel();stage.response_format='non_json';report.reason='non_json_response';return null;}
  let value;try{value=await readProviderJson(response,signal);}catch(error){if(error instanceof SyntaxError){stage.response_format='non_json';report.reason='non_json_response';return null;}throw error;}
  if(value?.jsonrpc!=='2.0'||value.id!==1||value.error||!value.result){report.reason='invalid_rpc_response';return null;}
  if(value.result.isError){
   const message=(value.result.content||[]).filter(x=>x.type==='text').map(x=>x.text).join(' ').slice(0,2000);stage.tool_error=true;
   report.reason=/credentials|model access|unauthorized|authentication/i.test(message)?'inference_credentials_or_model_rejected':/quota|rate.limit/i.test(message)?'quota_or_rate_limit':'provider_unavailable';return null;
  }
  stage.ok=true;return value.result;
 },config.timeout);
 try{
  const init=await call('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'musuroom-diagnostics',version:'2'}});if(!init)return finish();
  report.handshake_ok=init.protocolVersion==='2025-03-26';if(!report.handshake_ok){report.reason='invalid_rpc_response';return finish();}
  const list=await call('tools/list',{});if(!list)return finish();report.decision_tool_available=!!list.tools?.some(x=>x.name==='jev_decide');
  if(!report.decision_tool_available){report.reason='decision_tool_missing';return finish();}
  const result=await call('tools/call',{name:'jev_decide',arguments:{...(!defaultModel?{model:config.jevModel}:{}),state:{comment:'Câu minh họa kiểm tra Musuroom: mùi nấm thơm.'},questions:{topic:sensoryQuestion}}});if(!result)return finish();
  let data=result.structuredContent;if(data===undefined){try{data=JSON.parse(result.content?.find(x=>x.type==='text')?.text);}catch{}}
  if(data?.code===0)data=data.data;report.inference_verified=typeof data?.model==='string'&&validChoice(data?.answers?.topic,sensoryLabels);
  report.reason=report.inference_verified?null:'invalid_decision_response';
 }catch{report.reason='network_timeout_or_invalid_response';}
 return finish();
}
