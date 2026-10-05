import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadConfig} from '../backend/config.mjs';
import {diagnoseJev} from '../scripts/diagnose-jev.mjs';
import {jevMcpHeaders} from '../scripts/jev-mcp-headers.mjs';
import {sensoryLabels} from '../backend/services/jev-rubric.mjs';

test('MCP headers read the private file afresh without inheriting stale process keys',()=>{
 const dir=mkdtempSync(join(tmpdir(),'jev-headers-'));const path=join(dir,'.env');
 try{writeFileSync(path,'JEV_API_KEY=fixture-first');assert.equal(jevMcpHeaders(path).Authorization,'Bearer fixture-first');writeFileSync(path,'JEV_API_KEY=fixture-replaced');assert.equal(jevMcpHeaders(path).Authorization,'Bearer fixture-replaced');writeFileSync(path,'JEV_API_KEY="bad key"');assert.throws(()=>jevMcpHeaders(path));}finally{rmSync(dir,{recursive:true,force:true});}
});
test('MCP diagnostics require validated decision probabilities before reporting inference success',async()=>{
 const keys=Object.keys(sensoryLabels),choice=keys[0];
 const answer={type:'choice',choice,confidence:1,probabilities:Object.fromEntries(keys.map(key=>[key,key===choice?1:0]))};
 for(const valid of [true,false]){
  const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'fixture-private-secret'});
  const report=await diagnoseJev(config,async(url,init)=>{
   const method=JSON.parse(init.body).method;
   return Response.json({jsonrpc:'2.0',id:1,result:method==='initialize'?{protocolVersion:'2025-03-26'}:method==='tools/list'?{tools:[{name:'jev_decide'}]}:{structuredContent:{model:'typesafe-ai/jev',answers:{topic:valid?answer:{...answer,confidence:2}}}}});
  });
  assert.equal(report.inference_verified,valid);assert.equal(report.reason,valid?null:'invalid_decision_response');
 }
 let calls=0;const missing=await diagnoseJev(loadConfig({}),async()=>{calls++;});assert.equal(missing.reason,'missing_key');assert.equal(calls,0);
});
test('MCP diagnostics do not confuse handshake success with inference access or expose provider errors',async()=>{
 for(const status of [200,401,403,429]){
  const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'fixture-private-secret',JEV_TRANSPORT:'mcp'});let count=0;
  const report=await diagnoseJev(config,async(url,init)=>{
   assert.equal(url,'https://www.jevai.org/api/mcp');assert.equal(init.redirect,'error');count++;
   if(status!==200)return new Response('fixture-private-secret',{status});
   const method=JSON.parse(init.body).method;
   return Response.json({jsonrpc:'2.0',id:1,result:method==='initialize'?{protocolVersion:'2025-03-26'}:method==='tools/list'?{tools:[{name:'jev_decide'}]}:{isError:true,content:[{type:'text',text:'credentials or model access rejected fixture-private-secret'}]}});
  });
  assert.equal(report.inference_verified,false);assert.ok(!JSON.stringify(report).includes('fixture-private-secret'));
  if(status===200){assert.equal(report.handshake_ok,true);assert.equal(report.reason,'inference_credentials_or_model_rejected');assert.equal(count,3);}else{assert.equal(count,1);assert.equal(report.reason,status===429?'quota_or_rate_limit':'http_auth_rejected');}
 }
});
