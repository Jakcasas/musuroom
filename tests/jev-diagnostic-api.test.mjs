import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../backend/db/database.mjs';
import {createApp} from '../backend/app.mjs';
import {loadConfig} from '../backend/config.mjs';
import {createAccount} from '../backend/security/auth.mjs';
test('admin diagnostics enforce role, CSRF, consent, shared rate limit and redact tool errors',async t=>{
 const db=openDatabase(':memory:');const admin=await createAccount(db,{name:'Test admin',role:'ADMIN'}),judge=await createAccount(db,{name:'Test judge',role:'JUDGE'});let calls=0;
 const server=createApp({database:db,config:loadConfig({DATABASE_PATH:':memory:',JEV_ENABLED:'true',JEV_API_KEY:'fixture-private-secret',JEV_TRANSPORT:'mcp'}),fetchImpl:async(url,init)=>{
  calls++;const method=JSON.parse(init.body).method;
  return Response.json({jsonrpc:'2.0',id:1,result:method==='initialize'?{protocolVersion:'2025-03-26'}:method==='tools/list'?{tools:[{name:'jev_decide'}]}:{isError:true,content:[{type:'text',text:'credentials rejected fixture-private-secret'}]}});
 }});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));await server.databaseClosed;});const base=`http://127.0.0.1:${server.address().port}`;
 const call=(path,body,session)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:JSON.stringify(body)});
 const login=async account=>{const r=await call('/api/v1/auth/login',{access_code:account.access_code});return{cookie:r.headers.get('set-cookie').split(';')[0],csrf:(await r.json()).csrf_token};};
 const a=await login(admin),j=await login(judge),path='/api/v1/admin/jev/diagnose';
 assert.equal((await call(path,{allow_remote:true})).status,401);
 assert.equal((await call(path,{allow_remote:true},j)).status,403);
 assert.equal((await call(path,{allow_remote:true},{...a,csrf:''})).status,403);
 assert.equal((await call(path,{},a)).status,422);assert.equal(calls,0);
 const response=await call(path,{allow_remote:true},a);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 const report=await response.json();assert.equal(report.failure_layer,'inference_access');assert.equal(report.inference_verified,false);assert.equal(calls,3);assert.ok(!JSON.stringify(report).includes('fixture-private-secret'));
 assert.equal((await call('/api/v1/admin/jev/check',{allow_remote:true},a)).status,429);assert.equal(calls,3);
});
