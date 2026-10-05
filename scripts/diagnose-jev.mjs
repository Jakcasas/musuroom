import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {resolve} from 'node:path';
import {loadConfig,projectRoot} from '../backend/config.mjs';
import {readCloudEnvironment} from './cloud-config.mjs';
import {readProviderJson,withProviderDeadline} from '../backend/services/provider-response.mjs';
import {sensoryQuestion} from '../backend/services/jev-rubric.mjs';
import {validChoice} from '../backend/services/jev-client.mjs';
import {sensoryLabels} from '../backend/services/jev-rubric.mjs';

export async function diagnoseJev(config,fetchImpl=fetch){
 const report={endpoint:'https://www.jevai.org/api/mcp',key_present:!!config.jevKey,model:config.jevModel,stages:[],inference_verified:false};
 if(!config.jevKey){report.reason='missing_key';return report;}
 const call=async(method,params)=>withProviderDeadline(async signal=>{
  const response=await fetchImpl(report.endpoint,{method:'POST',redirect:'error',signal,headers:{Authorization:`Bearer ${config.jevKey}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':'2025-03-26'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  const stage={method,http_status:response.status};
  report.stages.push(stage);
  if(!response.ok){await response.body?.cancel();report.reason=[401,403].includes(response.status)?'http_auth_rejected':response.status===429?'quota_or_rate_limit':'provider_unavailable';return null;}
  const value=await readProviderJson(response,signal);
  if(value.jsonrpc!=='2.0'||value.id!==1||value.error||!value.result){report.reason='invalid_rpc_response';return null;}
  if(value.result.isError){
   const message=(value.result.content||[]).filter(x=>x.type==='text').map(x=>x.text).join(' ');
   stage.tool_error=true;
   report.reason=/credentials|model access|unauthorized|authentication/i.test(message)?'inference_credentials_or_model_rejected':/quota|rate.limit/i.test(message)?'quota_or_rate_limit':'provider_unavailable';
   return null;
  }
  stage.ok=true;return value.result;
 },config.timeout);
 try{
  const init=await call('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'musuroom-diagnostics',version:'1'}});if(!init)return report;
  report.handshake_ok=init.protocolVersion==='2025-03-26';
  const list=await call('tools/list',{});if(!list)return report;
  report.decision_tool_available=!!list.tools?.some(x=>x.name==='jev_decide');
  if(!report.decision_tool_available){report.reason='decision_tool_missing';return report;}
  const result=await call('tools/call',{name:'jev_decide',arguments:{model:config.jevModel,state:{comment:'Câu minh họa kiểm tra Musuroom: mùi nấm thơm.'},questions:{topic:sensoryQuestion}}});if(!result)return report;
  let data=result.structuredContent;
  if(data===undefined){try{data=JSON.parse(result.content?.find(x=>x.type==='text')?.text);}catch{}}
  if(data?.code===0)data=data.data;
  report.inference_verified=typeof data?.model==='string'&&validChoice(data?.answers?.topic,sensoryLabels);
  report.reason=report.inference_verified?null:'invalid_decision_response';
 }catch{report.reason='network_timeout_or_invalid_response';}
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.dirname,'diagnose-jev.mjs')){
 try{
  const config=process.argv.includes('--cloud')?readCloudEnvironment().config:loadConfig(parseEnv(readFileSync(resolve(projectRoot,'.env'),'utf8')));
  const report=await diagnoseJev(config);console.log(JSON.stringify(report,null,2));if(!report.inference_verified)process.exitCode=1;
 }catch{console.error('Không đọc được cấu hình Jev riêng tư; không in secret.');process.exitCode=1;}
}
