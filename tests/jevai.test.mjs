import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../backend/config.mjs';
import { createJevEvaluator } from '../backend/services/jev-client.mjs';
import { deploymentId,deploymentReady } from '../scripts/deployment-status.mjs';

test('Deployment verification ignores old successful releases with the same version and stops on new failures',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 assert.equal(deploymentId('Build Logs: https://railway.com/project/example/service/example?id='+id),id);
 assert.equal(deploymentId(JSON.stringify({deploymentId:id})),id);
 assert.throws(()=>deploymentId('Upload complete without identity'));
 assert.equal(deploymentReady([{id:'old',status:'SUCCESS'},{id,status:'BUILDING'}],id),false);
 assert.equal(deploymentReady([{id,status:'SUCCESS'}],id),true);
 assert.throws(()=>deploymentReady([{id,status:'FAILED'}],id));
});
test('Official JevAI MCP transport uses only jev_decide and sanitizes credential rejection',async()=>{
 const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'fixture-private-key',JEV_TRANSPORT:'mcp'});assert.throws(()=>loadConfig({JEV_TRANSPORT:'other'}));
 let error=false;
 const evaluate=createJevEvaluator(config,async(url,options)=>{
  assert.equal(url,'https://www.jevai.org/api/mcp');const request=JSON.parse(options.body);assert.equal(request.method,'tools/call');assert.equal(request.params.name,'jev_decide');assert.equal(request.params.arguments.model,'typesafe-ai/jev');
  return Response.json({jsonrpc:'2.0',id:1,result:error?{isError:true,content:[{type:'text',text:'Request credentials or model access rejected: fixture-private-key'}]}:{structuredContent:{code:0,data:{model:'jev-fixture',answers:{}}}}});
 });
 const request={model:config.jevModel,state:'public',questions:{}};assert.equal((await evaluate(request)).data.model,'jev-fixture');error=true;const result=await evaluate(request);assert.equal(result.reason,'jev_auth_failed');assert.ok(!JSON.stringify(result).includes('fixture-private-key'));
});
test('Only JevAI Community receives its key; model and response envelope are validated without provider fallback',async()=>{
 const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'fixture-private-key'});assert.equal(config.jevModel,'typesafe-ai/jev');assert.throws(()=>loadConfig({JEV_MODEL:'other/provider'}));
 let calls=0;const evaluate=createJevEvaluator(config,async(url,options)=>{calls++;assert.equal(url,'https://www.jevai.org/api/v1/decisions');assert.equal(options.headers.Authorization,'Bearer fixture-private-key');assert.equal(options.redirect,'error');return Response.json({code:0,data:{model:'typesafe-ai/jev',answers:{}}});});
 assert.equal((await evaluate({model:'other/provider'})).reason,'unsupported_model');assert.equal(calls,0);assert.equal((await evaluate({model:config.jevModel,state:'Public mushroom knowledge',questions:{}})).data.model,'typesafe-ai/jev');assert.equal(calls,1);
 for(const response of [Response.json({code:-1,data:{answers:{}}}),Response.json({answers:{}}),new Response('<html>Bad gateway</html>',{status:502}),new Response('',{status:401})]){
  const result=await createJevEvaluator(config,async()=>response)({model:config.jevModel,state:'public',questions:{}});assert.ok(result.reason);assert.ok(!JSON.stringify(result).includes('fixture-private-key'));
 }
});
