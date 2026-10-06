import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve,sep } from 'node:path';
import { openDatabase } from '../backend/db/database.mjs';
import { loadConfig } from '../backend/config.mjs';
import { dataJobs,projectDocument,dataStatus } from '../backend/services/data-projections.mjs';
import { syncData } from '../backend/services/data-sync.mjs';
import { createKnowledgeClassifier,knowledgeDecisionRequest } from '../backend/services/knowledge-decisions.mjs';
import { cloudEnvironment } from '../scripts/cloud-config.mjs';
import { checkCloud } from '../scripts/cloud-preflight.mjs';
import { generateQr } from '../scripts/generate-qr.mjs';
import { releaseInfo } from '../backend/version.mjs';
import { createApp } from '../backend/app.mjs';
import { createAccount } from '../backend/security/auth.mjs';
import { mongoFailureCode } from '../backend/services/mongo-store.mjs';

test('Atlas diagnostics distinguish authentication, permission, network and TLS without exposing error messages',()=>{
 assert.equal(mongoFailureCode({code:8000,message:'private-uri'}),'atlas_authentication_failed');
 assert.equal(mongoFailureCode({code:13}),'atlas_permission_denied');
 assert.equal(mongoFailureCode({name:'MongoServerSelectionError'}),'atlas_network_unavailable');
 assert.equal(mongoFailureCode({name:'MongoServerSelectionError',reason:{servers:new Map([['host',{error:{code:'CERT_HAS_EXPIRED'}}]])}}),'atlas_tls_failed');
 assert.equal(mongoFailureCode({message:'private-uri'}),'connection_unavailable');
});
const fixtureConfig=loadConfig({DATABASE_PATH:':memory:'});
const sensor=(db,id,session='TEST',sample='NAM')=>db.prepare('INSERT INTO sensory_evaluations(id,session_code,sample_code,tester_type,color_score,aroma_score,umami_taste_score,aftertaste_score,overall_acceptance,comments) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,session,sample,'CONSUMER',7,7,7,7,7,'private-comment@example.invalid');
test('Durable jobs share the source transaction, preserve tombstones and omit private tables',async()=>{
 const db=openDatabase(':memory:');try{
  assert.equal((await dataStatus(db,fixtureConfig)).pending,6);
  const before=db.prepare("SELECT revision FROM data_sync_jobs WHERE job_key='knowledge:umami'").get().revision;
  db.exec('BEGIN');db.prepare("UPDATE knowledge_articles SET title='rollback test' WHERE id='umami'").run();db.exec('ROLLBACK');
  assert.equal(db.prepare("SELECT revision FROM data_sync_jobs WHERE job_key='knowledge:umami'").get().revision,before);
  sensor(db,'private-tester-id');db.prepare("INSERT INTO sample_requests(id,full_name,contact,contact_normalized,organization_type,consent_at) VALUES('lead','Private Person','private@example.invalid','private@example.invalid','INDIVIDUAL','2026-10-01')").run();
  const document=await projectDocument(db,db.prepare("SELECT * FROM data_sync_jobs WHERE resource_type='sensory'").get(),'musuroom-test');
  assert.equal(document.data.count,1);for(const privateValue of ['private-tester-id','private-comment@example.invalid','Private Person','private@example.invalid'])assert.ok(!JSON.stringify(document).includes(privateValue));
  db.prepare("DELETE FROM knowledge_articles WHERE id='umami'").run();const tombstone=await projectDocument(db,db.prepare("SELECT * FROM data_sync_jobs WHERE job_key='knowledge:umami'").get(),'musuroom-test');assert.equal(tombstone.active,false);assert.equal(tombstone.data,null);
  assert.throws(()=>dataJobs(db,{limit:101}));assert.throws(()=>dataJobs(db,{after:[] }));
 }finally{db.close();}
});
test('Mirror retries are idempotent; revision changes during a write remain pending',async()=>{
 const db=openDatabase(':memory:');try{
  const config={...fixtureConfig,mongoBatchSize:100};const records=new Map();let fail=true,change=true;
  const store={async write(items){if(fail){fail=false;throw Error('contains secret URI');}for(const item of items)records.set(item._id,item);if(change){change=false;db.prepare("UPDATE knowledge_articles SET title='Changed while synchronizing' WHERE id='umami'").run();}}};
  assert.equal((await syncData({db,config,store,now:()=>1000})).mode,'unavailable');assert.equal(db.prepare('SELECT max(attempts) AS n FROM data_sync_jobs').get().n,1);
  assert.equal((await syncData({db,config,store,now:()=>2000})).synced,6);assert.equal((await dataStatus(db,config)).pending,1);assert.equal(records.size,6);
  assert.equal((await syncData({db,config,store,now:()=>3000})).synced,1);assert.equal(records.size,6);assert.equal(records.get('musuroom-local:knowledge:umami').data.title,'Changed while synchronizing');
  db.prepare("DELETE FROM knowledge_articles WHERE id='umami'").run();await syncData({db,config,store,now:()=>4000});assert.equal(records.get('musuroom-local:knowledge:umami').data,null);
 }finally{db.close();}
});
test('Lease excludes another worker and recovers after expiry without holding a SQL transaction',async()=>{
 const db=openDatabase(':memory:');try{
  db.prepare("UPDATE data_sync_state SET lock_owner='other',lease_until=5000").run();let writes=0;
  const args={db,config:fixtureConfig,store:{write:async()=>{writes++;}}};assert.equal((await syncData({...args,now:()=>4999})).mode,'busy');assert.equal(writes,0);assert.equal((await syncData({...args,now:()=>5000})).mode,'synced');assert.equal(writes,1);
 }finally{db.close();}
});
test('Jev enrichment is opt-in and limits model requests to public knowledge per run',async()=>{
 const db=openDatabase(':memory:');try{
  sensor(db,'fixture');let calls=0;
  const classify=async document=>{assert.equal(document.type,'knowledge');calls++;return{mode:'jev',topic:'flavor'};};
  await syncData({db,config:{...fixtureConfig,mongoEnrichment:true,mongoJevMax:2},store:{write:async()=>{}},classify});assert.equal(calls,2);
  db.prepare("UPDATE knowledge_articles SET title=title").run();await syncData({db,config:fixtureConfig,store:{write:async()=>{}},classify});assert.equal(calls,2);
 }finally{db.close();}
});
test('Knowledge Jev validates typed choices, confidence and public input; never edits source categories',async()=>{
 const db=openDatabase(':memory:');try{
  const item=await projectDocument(db,(await dataJobs(db,{limit:1}))[0],'test');const original=item.data.category;
  const config=loadConfig({JEV_ENABLED:'true',JEV_API_KEY:'mock-private-key'});const request=knowledgeDecisionRequest(item);
  assert.equal(request.questions.topic.type,'choice');assert.deepEqual(Object.keys(request.state),['title','summary','body','limitation','truncated']);assert.ok(!JSON.stringify(request).includes('mock-private-key'));
  const answer={model:'jev-test',answers:{topic:{type:'choice',choice:'flavor',confidence:0.5,probabilities:{ingredients:0.1,flavor:0.5,safety:0.15,methods:0.15,other:0.1}}}};
  const classify=createKnowledgeClassifier(config,async()=>Response.json({code:0,data:answer}));assert.equal((await classify(item)).requires_review,true);assert.equal(item.data.category,original);
  answer.answers.topic.choice='grant_admin';assert.equal((await classify(item)).reason,'invalid_response');assert.throws(()=>knowledgeDecisionRequest({...item,type:'sensory'}));
 }finally{db.close();}
});
test('Data API enforces role/CSRF, validates cursors and previews a single source without credentials',async t=>{
 const db=openDatabase(':memory:'),judge=await createAccount(db,{name:'Test judge'}),admin=await createAccount(db,{name:'Test admin',role:'ADMIN'});
 const server=createApp({database:db,config:fixtureConfig});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));await server.databaseClosed;});const base='http://127.0.0.1:'+server.address().port;
 const call=(path,session,body)=>fetch(base+'/api/v1/'+path,{method:body?'POST':'GET',headers:{...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const login=async account=>{const res=await call('judge/verify',null,{access_code:account.access_code});return{cookie:res.headers.get('set-cookie').split(';')[0],csrf:(await res.json()).csrf_token};};
 assert.equal((await call('admin/data/status')).status,401);const reader=await login(judge);assert.equal((await call('admin/data/documents',reader)).status,403);
 const operator=await login(admin);const page=await(await call('admin/data/documents?limit=2',operator)).json();assert.equal(page.items.length,2);assert.ok(page.next_cursor);assert.equal((await call('admin/data/documents?after=x&after=y',operator)).status,400);
 assert.equal((await call('admin/data/jev-preview',{...operator,csrf:''},{article_id:'umami'})).status,403);
 const preview=await(await call('admin/data/jev-preview',operator,{article_id:'umami'})).json();assert.equal(preview.request.state.title,db.prepare("SELECT title FROM knowledge_articles WHERE id='umami'").get().title);assert.equal((await call('admin/data/classify',operator,{article_id:'umami'})).status,422);
 assert.equal((await(await call('admin/data/classify',operator,{article_id:'umami',allow_remote:true})).json()).reason,'jev_disabled');
 const local=await call('admin/data/classify',operator,{article_id:'umami',allow_remote:false});assert.equal(local.status,200);assert.equal((await local.json()).mode,'local');
});
test('Cloud preflight rejects private bucket, hides auth errors and includes every runtime control',async()=>{
 const values={DATABASE_PROVIDER:'postgres',DATABASE_URL:'postgresql://postgres:mock-password@pooler.example:5432/postgres',STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'mock-secret'};
 const{config,env}=cloudEnvironment(values,'https://musuroom.example');assert.equal(env.MONGO_SOURCE_ID,'musuroom-production');assert.equal(env.API_WRITE_TOKEN,'');assert.equal(env.AUTH_IDLE_MINUTES,'20');assert.equal(env.AI_MAX_CONCURRENT,'2');
 const atlas=cloudEnvironment({...values,MONGO_ENABLED:'true',MONGODB_URI:'mongodb+srv://user:secret@cluster.mongodb.net',JUDGE_BOOTSTRAP_CODE:'fixture-judge-code-2026'},'https://musuroom.example');
 assert.equal(atlas.env.DATABASE_PROVIDER,'sqlite');assert.equal(atlas.env.STORAGE_PROVIDER,'local');assert.equal(atlas.env.DATABASE_URL,'');assert.equal(atlas.env.SUPABASE_SERVICE_ROLE_KEY,'');assert.equal(atlas.env.JUDGE_BOOTSTRAP_CODE,'fixture-judge-code-2026');
 const bad=await checkCloud(config,{openDatabase:async()=>{throw Error('Postgres connection failed (28P01). mock-password');},fetchImpl:async()=>Response.json({public:true})});assert.equal(bad.ready,false);assert.ok(!JSON.stringify(bad).includes('mock-password'));assert.equal(bad.checks[0].reason,'database_password_rejected');
 assert.throws(()=>cloudEnvironment({...values,DATABASE_URL:'postgresql://postgres:mock-password@pooler.example:6543/postgres'}));assert.throws(()=>loadConfig({MONGO_ENABLED:'true',MONGODB_URI:'mongodb+srv://user:secret@cluster.mongodb.net/?tls=false'}));
});
test('Public QR uses current release, aborts stale/unhealthy deployments and records verified destinations',async t=>{
 const root=await mkdtemp(resolve(tmpdir(),'musuroom-qr-'));t.after(async()=>{assert.ok(root.startsWith(resolve(tmpdir())+sep));await rm(root,{recursive:true,force:true});});
 await writeFile(resolve(root,'manifest.json'),'unchanged');
 await assert.rejects(generateQr('https://musuroom.example',root,{fetchImpl:async()=>Response.json({...releaseInfo,version:'1.4.0',database:'ok'})}));assert.equal(await readFile(resolve(root,'manifest.json'),'utf8'),'unchanged');
 await generateQr('https://musuroom.example',root,{fetchImpl:async url=>String(url).endsWith('/healthz')?Response.json({...releaseInfo,database:'ok'}):new Response('Musuroom',{headers:{'Content-Type':'text/html'}})});
 const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));assert.equal(manifest.version,releaseInfo.version);assert.equal(manifest.access_codes_included,false);assert.equal(manifest.links.judge,'https://musuroom.example/giam-khao.html');
});
