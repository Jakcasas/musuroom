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
test('Only JevAI Community receives its key; model and response envelope are validated without provider fallback',async()=>{
 const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'fixture-private-key'});assert.equal(config.jevModel,'typesafe-ai/jev');assert.throws(()=>loadConfig({JEV_MODEL:'other/provider'}));
 let calls=0;const evaluate=createJevEvaluator(config,async(url,options)=>{calls++;assert.equal(url,'https://www.jevai.org/api/v1/decisions');assert.equal(options.headers.Authorization,'Bearer fixture-private-key');assert.equal(options.redirect,'error');return Response.json({code:0,data:{model:'typesafe-ai/jev',answers:{}}});});
 assert.equal((await evaluate({model:'other/provider'})).reason,'unsupported_model');assert.equal(calls,0);assert.equal((await evaluate({model:config.jevModel,state:'Public mushroom knowledge',questions:{}})).data.model,'typesafe-ai/jev');assert.equal(calls,1);
 for(const response of [Response.json({code:-1,data:{answers:{}}}),Response.json({answers:{}}),new Response('<html>Bad gateway</html>',{status:502}),new Response('',{status:401})]){
  const result=await createJevEvaluator(config,async()=>response)({model:config.jevModel,state:'public',questions:{}});assert.ok(result.reason);assert.ok(!JSON.stringify(result).includes('fixture-private-key'));
 }
});
