import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readdirSync,readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { postgresAdapter,initializePostgres } from '../backend/db/postgres.mjs';
import { createApp } from '../backend/app.mjs';
import { loadConfig } from '../backend/config.mjs';
import { createAccount } from '../backend/security/auth.mjs';
import { documentStorage } from '../backend/services/document-storage.mjs';
import { rateLimit } from '../backend/security/rate-limit.mjs';
import { request as httpRequest } from 'node:http';
import { projectDocument,dataJobs } from '../backend/services/data-projections.mjs';
const production={NODE_ENV:'production',PUBLIC_ORIGIN:'https://musuroom.example',DATABASE_PROVIDER:'postgres',DATABASE_URL:'postgresql://postgres:test@localhost/postgres',STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-private-key'};
test('Supabase Preview replays committed migrations on an empty database without server bootstrap, then server startup preserves existing rows',async()=>{
 const engine=new PGlite();
 try{
  const directory=resolve(import.meta.dirname,'../supabase/migrations'),files=readdirSync(directory).filter(file=>file.endsWith('.sql')).sort();
  for(const file of files){assert.match(file,/^\d{14}_\w+\.sql$/);await engine.exec('BEGIN');try{await engine.exec(readFileSync(resolve(directory,file),'utf8'));await engine.exec('COMMIT');}catch(error){await engine.exec('ROLLBACK');throw error;}}
  assert.equal((await engine.query('SELECT count(*)::int AS n FROM public.schema_migrations')).rows[0].n,files.length);
  await engine.query("INSERT INTO public.sources(id,citation,url,publication_year,evidence_type,access_scope,reviewed_at) VALUES(99,'Preserve existing fixture','https://example.invalid',2026,'Test','public','2026-10-01')");
  const db=postgresAdapter({query:(text,values)=>values===undefined?engine.exec(text):engine.query(text,values)});
  await initializePostgres(db);await initializePostgres(db);
  assert.equal((await engine.query('SELECT citation FROM public.sources WHERE id=99')).rows[0].citation,'Preserve existing fixture');
  assert.equal((await engine.query('SELECT count(*)::int AS n FROM public.schema_migrations')).rows[0].n,files.length);
  assert.equal((await engine.query("SELECT relrowsecurity FROM pg_class WHERE relname='data_sync_jobs'")).rows[0].relrowsecurity,true);
 }finally{await engine.close();}
});
test('Production fails closed without HTTPS, PostgreSQL and private cloud storage',()=>{
 for(const extra of [{DATABASE_PROVIDER:'sqlite'},{STORAGE_PROVIDER:'local'},{PUBLIC_ORIGIN:''},{PUBLIC_ORIGIN:'http://example.test'},{PUBLIC_ORIGIN:'https://user:secret@example.test'},{PUBLIC_ORIGIN:'https://example.test/path'},{SUPABASE_SERVICE_ROLE_KEY:''}])assert.throws(()=>loadConfig({...production,...extra}));
 assert.equal(loadConfig(production).host,'0.0.0.0');
});
test('Real PostgreSQL migration + API: HTTPS sessions, concurrent retries, sensory metrics, private leads, evidence-backed samples',async t=>{
 const engine=new PGlite();await engine.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE unrelated_table(id INTEGER); GRANT SELECT ON unrelated_table TO anon;');
 const db=postgresAdapter({query:(text,values)=>values===undefined?engine.exec(text):engine.query(text,values),end:()=>engine.close()});
 await initializePostgres(db);await initializePostgres(db);
 assert.equal((await db.prepare('SELECT count(*)::integer n FROM knowledge_articles').get()).n,6);
 assert.equal((await dataJobs(db)).length,6);
 assert.equal((await engine.query("SELECT has_table_privilege('anon','data_sync_jobs','SELECT') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT has_table_privilege('anon','knowledge_decision_reviews','SELECT') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT has_table_privilege('authenticated','knowledge_decision_reviews','SELECT') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT has_table_privilege('authenticated','data_sync_state','SELECT') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT has_table_privilege('anon','judge_accounts','SELECT') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT has_table_privilege('anon','unrelated_table','SELECT') AS allowed")).rows[0].allowed,true);
 assert.equal((await engine.query("SELECT relrowsecurity FROM pg_class WHERE relname='sample_requests'")).rows[0].relrowsecurity,true);
 assert.equal((await engine.query("SELECT has_function_privilege('anon','public.musuroom_sensory_distribution(text,text)','EXECUTE') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT has_function_privilege('authenticated','public.musuroom_sensory_distribution(text,text)','EXECUTE') AS allowed")).rows[0].allowed,false);
 assert.equal((await engine.query("SELECT count(*)::int n FROM pg_constraint WHERE conrelid='product_samples'::regclass AND conname IN ('product_metrics_object','product_nutrition_object','product_measurements_required','product_metrics_supported','product_nutrition_supported')")).rows[0].n,5);
 const judge=await createAccount(db,{name:'Cloud test judge'});const admin=await createAccount(db,{name:'Cloud test admin',role:'ADMIN'});
 const server=createApp({config:loadConfig(production),database:db});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));await server.databaseClosed;});
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=(path,method='GET',body,session,extra={})=>new Promise((resolve,reject)=>{
  const req=httpRequest(base+path,{method,headers:{Host:'musuroom.example','X-Forwarded-Proto':'https',...(body===undefined?{}:{'Content-Type':'application/json'}),...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...extra}},res=>{const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>resolve(new Response(res.statusCode===204?null:Buffer.concat(chunks),{status:res.statusCode,headers:Object.fromEntries(Object.entries(res.headers).map(([key,value])=>[key,Array.isArray(value)?value.join(', '):value]))})));});req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body));
 });
 assert.equal((await fetch(base+'/healthz')).status,200);
 assert.equal((await call('/api/status','GET',undefined,null,{'X-Forwarded-Proto':'http'})).status,403);
 assert.equal((await call('/api/status','GET',undefined,null,{Host:'evil.example'})).status,403);
 assert.equal((await call('/api/status','GET',undefined,null,{Origin:'https://evil.example'})).status,403);
 assert.equal((await call('/api/v1/judge/dossier')).status,401);
 const login=async account=>{const response=await call('/api/v1/judge/verify','POST',{access_code:account.access_code});assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/^__Host-musuroom_session=.*; Secure$/);assert.equal(response.headers.get('strict-transport-security'),'max-age=31536000');return{cookie:response.headers.get('set-cookie').split(';')[0],csrf:(await response.json()).csrf_token};};
 const signed=await login(judge);const operator=await login(admin);
 const score={session_code:'PG-ROUND',sample_code:'PG-MUSH',tester_type:'CONSUMER',color_score:1,aroma_score:1,umami_taste_score:1,aftertaste_score:1,overall_acceptance:1,submission_key:'11111111-1111-4111-8111-111111111111'};
 const responses=await Promise.all([call('/api/v1/sensory/submit','POST',score),call('/api/v1/sensory/submit','POST',score)]);assert.deepEqual(responses.map(x=>x.status).sort(),[200,201]);
 for(const n of [5,9])assert.equal((await call('/api/v1/sensory/submit','POST',{...score,submission_key:undefined,color_score:n,aroma_score:n,umami_taste_score:n,aftertaste_score:n,overall_acceptance:n})).status,201);
 const metrics=await(await call('/api/v1/sensory/analytics?session_code=PG-ROUND&sample_code=PG-MUSH','GET',undefined,signed)).json();assert.equal(metrics.count,3);assert.equal(metrics.metrics.color_score.mean,5);assert.equal(metrics.metrics.color_score.sd,4);
 const csv=await call('/api/v1/sensory/export','POST',{session_code:'PG-ROUND',sample_code:'PG-MUSH'},signed);assert.equal(csv.status,200);assert.match(await csv.text(),/PG-MUSH/);
 const lead={full_name:'Test person',phone_or_email:'test@example.test',consent:true};const registrations=await Promise.all([call('/api/v1/leads/register','POST',lead),call('/api/v1/leads/register','POST',lead)]);assert.deepEqual(registrations.map(x=>x.status).sort(),[200,201]);const leadId=(await registrations[0].json()).id;
 assert.equal((await call('/api/v1/admin/leads','GET',undefined,signed)).status,403);assert.equal((await call('/api/v1/admin/leads/'+leadId,'PATCH',{status:'SENT'},operator)).status,200);
 const evidence='22222222-2222-4222-8222-222222222222';await db.prepare('INSERT INTO quality_documents(id,title,doc_type,file_name,mime,size_bytes,sha256,evidence_status) VALUES(?,?,?,?,?,?,?,?)').run(evidence,'Fixture report','COA',evidence+'.txt','text/plain',1,'fixture','DRAFT');
 const sample={sample_code:'PG-MUSH',label:'Measured fixture',origin:'Test supplier',measured_at:'2026-09-30',evidence_document_id:evidence,metrics:{water_activity:0.4,moisture_percent:8},nutrition:{protein_g:12}};
 assert.equal((await call('/api/v1/admin/product-samples','POST',sample,operator)).status,422);await db.prepare("UPDATE quality_documents SET evidence_status='FINAL' WHERE id=?").run(evidence);
 await db.prepare("UPDATE quality_documents SET doc_type='BRIEF' WHERE id=?").run(evidence);assert.equal((await call('/api/v1/admin/product-samples','POST',sample,operator)).status,422);
 await db.prepare("UPDATE quality_documents SET doc_type='COA' WHERE id=?").run(evidence);
 assert.equal((await call('/api/v1/admin/product-samples','POST',sample,operator)).status,201);assert.equal((await(await call('/api/v1/product/batches')).json()).count,0);
 await db.prepare("UPDATE product_samples SET publication_status='PUBLIC' WHERE sample_code=?").run(sample.sample_code);
 const productJob=(await dataJobs(db,{type:'product'}))[0];assert.equal((await projectDocument(db,productJob,'cloud-test')).data.sample_code,sample.sample_code);
 const published=await(await call('/api/v1/product/batches')).json();assert.equal(published.count,1);assert.equal(published.items[0].metrics.water_activity,0.4);assert.equal((await(await call('/api/v1/product/nutrition')).json()).available,true);
 await assert.rejects(db.prepare('UPDATE product_samples SET metrics_json=? WHERE sample_code=?').run('[]',sample.sample_code));
 await assert.rejects(db.prepare('UPDATE product_samples SET metrics_json=? WHERE sample_code=?').run('{"constructor":1}',sample.sample_code));
 await db.prepare("UPDATE quality_documents SET evidence_status='DRAFT' WHERE id=?").run(evidence);assert.equal((await(await call('/api/v1/product/batches')).json()).count,0);
 const withdrawn=(await dataJobs(db,{type:'product'}))[0];assert.ok(withdrawn.revision>productJob.revision);assert.equal((await projectDocument(db,withdrawn,'cloud-test')).data,null);
 await db.prepare("UPDATE quality_documents SET evidence_status='FINAL' WHERE id=?").run(evidence);
 assert.equal((await call('/api/v1/admin/product-samples','POST',sample,operator)).status,409);assert.equal((await call('/api/v1/admin/product-samples','POST',{...sample,sample_code:'OTHER',metrics:{water_activity:2}},operator)).status,422);
 assert.equal((await call('/api/v1/auth/logout','POST',{},signed)).status,204);assert.equal((await call('/api/v1/judge/dossier','GET',undefined,signed)).status,401);
});
test('Supabase storage authenticates server-side, refuses public buckets and never constructs public object links',async()=>{
 const config=loadConfig(production);const name='11111111-1111-4111-8111-111111111111.txt';const bytes=Buffer.from('private fixture');let publicBucket=true;let upload=0;
 const storage=documentStorage(config,async(url,options)=>{assert.ok(!url.includes(config.storageKey));assert.equal(options.headers.Authorization,'Bearer '+config.storageKey);assert.equal(options.redirect,'error');if(url.includes('/bucket/'))return Response.json({public:publicBucket});if(options.method==='POST'){upload++;assert.equal(options.headers['x-upsert'],'false');return Response.json({ok:true});}return new Response(bytes);});
 await assert.rejects(storage.write(name,bytes,'text/plain'),/Private Supabase bucket/);assert.equal(upload,0);publicBucket=false;await storage.write(name,bytes,'text/plain');assert.equal(upload,1);assert.deepEqual(await storage.read(name),bytes);await assert.rejects(storage.read('../.env'),/invalid_document_path/);
});
test('Rate limits isolate visitors and reset after the window',()=>{
 let now=0;const limit=rateLimit(1,'limited',()=>now);let status;const res={status:x=>(status=x,res),set:()=>res,json:()=>res};let accepted=0;const call=ip=>{status=undefined;limit({ip},res,()=>accepted++);return status;};assert.equal(call('a'),undefined);assert.equal(call('a'),429);assert.equal(call('b'),undefined);now=60000;assert.equal(call('a'),undefined);assert.equal(accepted,3);
});
