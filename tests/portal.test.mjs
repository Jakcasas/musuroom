import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createApp } from '../backend/app.mjs';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
import { createAccount } from '../backend/security/auth.mjs';
import { createJevClassifier } from '../backend/services/jev.mjs';
async function client(t,extra={}){
 const db=openDatabase(':memory:');const config={...loadConfig({DATABASE_PATH:':memory:',AUTH_LOGIN_LIMIT:'3'}),documentRoot:resolve(projectRoot,'tests/fixtures'),...extra};
 const judge=await createAccount(db,{name:'Giám khảo kiểm thử'});const admin=await createAccount(db,{name:'Quản trị kiểm thử',role:'ADMIN'});
 const server=createApp({config,database:db});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=(path,method='GET',body,cookie,csrf)=>fetch(base+'/api/v1'+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const login=async(account,previous)=>{const response=await call('/judge/verify','POST',{access_code:account.access_code},previous);return {response,cookie:response.headers.get('set-cookie')?.split(';')[0],session:await response.json()};};
 return{db,call,login,judge,admin,base};
}
test('Portal enforces role and CSRF; stores credential/session hashes and rotates sessions',async t=>{
 const a=await client(t);assert.equal((await a.call('/judge/dossier')).status,401);assert.equal((await a.call('/auth/session')).status,401);
 const signed=await a.login(a.judge);assert.equal(signed.response.status,200);assert.match(signed.response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
 assert.equal(signed.session.user.role,'JUDGE');assert.equal(signed.session.user.name,a.judge.display_name);
 assert.equal((await a.call('/judge/dossier','GET',undefined,signed.cookie)).status,200);assert.equal((await a.call('/admin/leads','GET',undefined,signed.cookie)).status,403);
 assert.equal((await a.call('/sensory/export','POST',{session_code:'ROUND-01',sample_code:'MUSH-01'},signed.cookie)).status,403);
 assert.equal((await a.call('/sensory/export','POST',{session_code:'ROUND-01',sample_code:'MUSH-01'},signed.cookie,signed.session.csrf_token)).status,200);
 const sessions=a.db.prepare('SELECT * FROM auth_sessions').all();assert.equal(sessions.length,1);assert.ok(!JSON.stringify(sessions).includes(signed.cookie.split('=')[1]));
 assert.ok(!JSON.stringify(a.db.prepare('SELECT * FROM judge_accounts').all()).includes(a.judge.access_code.split('.')[1]));
 const rotated=await a.login(a.judge,signed.cookie);assert.notEqual(rotated.cookie,signed.cookie);assert.equal((await a.call('/auth/session','GET',undefined,signed.cookie)).status,401);
 assert.equal((await a.call('/auth/logout','POST',{},rotated.cookie,rotated.session.csrf_token)).status,204);assert.equal((await a.call('/judge/dossier','GET',undefined,rotated.cookie)).status,401);
 const admin=await a.login(a.admin);assert.equal((await a.call('/admin/leads','GET',undefined,admin.cookie)).status,200);
 const html=await fetch(a.base+'/giam-khao.html');assert.match(html.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(html.headers.get('cache-control'),'no-store');
});
test('Login brute force limit is bounded; account expiry, idle expiry, absolute expiry and revocation reject access',async t=>{
 const a=await client(t);for(let i=0;i<3;i++)assert.equal((await a.call('/judge/verify','POST',{access_code:'wrong'})).status,401);assert.equal((await a.login(a.judge)).response.status,429);
 const b=await client(t);
 for(const change of ["UPDATE auth_sessions SET last_seen=0","UPDATE auth_sessions SET expires_at=0","UPDATE judge_accounts SET enabled=0 WHERE role='JUDGE'","UPDATE judge_accounts SET expires_at=0 WHERE role='JUDGE'"]){
  b.db.prepare("UPDATE judge_accounts SET enabled=1,expires_at=? WHERE role='JUDGE'").run(Date.now()+86400000);
  const signed=await b.login(b.judge);assert.equal(signed.response.status,200);b.db.exec(change);assert.equal((await b.call('/judge/dossier','GET',undefined,signed.cookie)).status,401);
 }
 assert.equal((await b.login(b.judge)).response.status,401);
 assert.equal((await b.call('/auth/session','GET',undefined,'musuroom_session=malformed')).status,401);
});
test('Private document downloads authenticate, check hash/size and reject traversal metadata',async t=>{
 const a=await client(t);const signed=await a.login(a.judge);const id='11111111-1111-4111-8111-111111111111';const file=id+'.txt';const body=readFileSync(resolve(projectRoot,'tests/fixtures',file));
 a.db.prepare('INSERT INTO quality_documents(id,title,doc_type,file_name,mime,size_bytes,sha256) VALUES(?,?,?,?,?,?,?)').run(id,'Hồ sơ kiểm thử','BRIEF',file,'text/plain',body.length,createHash('sha256').update(body).digest('hex'));
 assert.equal((await a.call('/judge/documents/'+id)).status,401);
 const response=await a.call('/judge/documents/'+id,'GET',undefined,signed.cookie);assert.equal(response.status,200);assert.equal(await response.text(),body.toString());assert.match(response.headers.get('content-disposition'),/^attachment/);
 a.db.prepare('UPDATE quality_documents SET sha256=?').run('invalid');assert.equal((await a.call('/judge/documents/'+id,'GET',undefined,signed.cookie)).status,409);
 a.db.prepare('UPDATE quality_documents SET file_name=?').run('../.env');assert.equal((await a.call('/judge/documents/'+id,'GET',undefined,signed.cookie)).status,403);
 assert.equal((await a.call('/judge/documents/missing','GET',undefined,signed.cookie)).status,404);
 assert.ok(a.db.prepare("SELECT count(*) n FROM access_audit WHERE action='DOCUMENT_DOWNLOAD'").get().n>0);
});
test('Jev requires opt-in, strips email/phone and validates all structured probabilities',async()=>{
 const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'test-key'});let calls=0;let payload;
 const answer={type:'choice',choice:'aroma',confidence:0.8,probabilities:{color:0.04,aroma:0.8,umami:0.04,aftertaste:0.04,overall:0.04,other:0.04}};
 const mock=async(url,options)=>{calls++;assert.equal(url,'https://www.jevai.org/api/v1/decisions');payload=JSON.parse(options.body);assert.equal(payload.model,'typesafe-ai/jev');return{ok:true,json:async()=>({code:0,data:{model:'jev-test',answers:{topic:answer}}})};};
 const classify=createJevClassifier(config,mock);assert.equal((await classify('Mùi thơm',false)).reason,'remote_consent_required');assert.equal(calls,0);
 assert.equal((await classify('Mùi thơm. Liên hệ an@example.com 0901234567',true)).key,'aroma');assert.ok(!JSON.stringify(payload).includes('an@example.com'));assert.ok(!JSON.stringify(payload).includes('0901234567'));
 assert.equal(payload.questions.topic.type,'choice');
 answer.choice='grant_admin';assert.equal((await classify('Mùi thơm',true)).reason,'invalid_response');answer.choice='aroma';answer.probabilities.aroma=0.4;assert.equal((await classify('Mùi thơm',true)).reason,'invalid_response');
 assert.equal((await createJevClassifier(loadConfig({}),()=>{throw Error('must not call');})('Mùi thơm',true)).reason,'jev_disabled');
 assert.equal((await createJevClassifier(config,async()=>{throw Error('network');})('Mùi thơm',true)).reason,'provider_unavailable');
 assert.throws(()=>loadConfig({JEV_ENABLED:'true'}));assert.throws(()=>loadConfig({JEV_ENABLED:'yes'}));
});
