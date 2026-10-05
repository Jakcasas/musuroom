// Disposable local UI fixture: all records live in memory, never in the project database.
import { scryptSync, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openDatabase } from '../backend/db/database.mjs';
import { loadConfig, projectRoot } from '../backend/config.mjs';
import { createApp } from '../backend/app.mjs';
const db=openDatabase(':memory:');
const id='22222222-2222-4222-8222-222222222222';const salt='fixture-only-salt';
db.prepare('INSERT INTO judge_accounts(id,display_name,role,secret_salt,secret_hash,expires_at) VALUES(?,?,?,?,?,?)').run(id,'Quản trị kiểm thử','ADMIN',salt,scryptSync('a'.repeat(32),salt,64).toString('hex'),Date.now()+3600000);
const docId='11111111-1111-4111-8111-111111111111';const name=docId+'.txt';const bytes=readFileSync(resolve(projectRoot,'tests/fixtures',name));
db.prepare('INSERT INTO quality_documents(id,title,doc_type,file_name,mime,size_bytes,sha256) VALUES(?,?,?,?,?,?,?)').run(docId,'Hồ sơ minh họa kiểm thử','BRIEF',name,'text/plain',bytes.length,createHash('sha256').update(bytes).digest('hex'));
const insert=db.prepare('INSERT INTO sensory_evaluations(id,session_code,sample_code,tester_type,color_score,aroma_score,umami_taste_score,aftertaste_score,overall_acceptance,comments) VALUES(?,?,?,?,?,?,?,?,?,?)');
for(const score of [5,7,9])insert.run('fixture-'+score,'TEST-ONLY','NAM-01','CONSUMER',score,score,score,score,score,'Dữ liệu kiểm thử');
db.prepare('INSERT INTO sample_requests(id,full_name,contact,contact_normalized,organization_type,dietary_preference,consent_at) VALUES(?,?,?,?,?,?,?)').run('fixture-lead','Người dùng kiểm thử','test@example.invalid','test@example.invalid','INDIVIDUAL','NONE',new Date().toISOString());
if(process.env.UI_FIXTURE_RESEARCH==='true'){
 const insertRecord=db.prepare('INSERT INTO research_records(id,kind,title,data_json,public_token,revision,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)');
 insertRecord.run('fixture-sample','sample','Hũ mẫu kiểm thử (không phải dữ liệu thật)',JSON.stringify({title:'Hũ mẫu kiểm thử',sample_code:'NAM-01',jar_code:'HU-01',lot_code:'TEST-ONLY',origin:'Nguồn nguyên liệu minh họa',process_notes:'Ghi chép thử giao diện',evidence_id:docId,published:false}),'fixture-sample-token','test','test');
 insertRecord.run('fixture-rubric','rubric','Bộ tiêu chí kiểm thử',JSON.stringify({title:'Bộ tiêu chí kiểm thử',criteria:[{label:'Cảm quan',weight:70},{label:'Phương pháp',weight:30}],published:false}),'fixture-rubric-token','test','test');
 db.prepare('INSERT INTO research_scores(rubric_id,sample_id,judge_id,scores_json,total,revision,sample_revision,updated_at) VALUES(?,?,?,?,?,1,1,?)').run('fixture-rubric','fixture-sample',id,'[8,6]',74,'test');
 db.prepare("UPDATE research_records SET revision=2 WHERE id='fixture-sample'").run();
}
const delay=Math.min(5000,Math.max(0,Number(process.env.UI_FIXTURE_DELAY_MS)||0));
const fixtureDb=delay?{prepare(sql){const statement=db.prepare(sql);return{all:statement.all.bind(statement),get:statement.get.bind(statement),async run(...values){if(/^INSERT INTO (?:sensory_evaluations|sample_requests)/.test(sql))await new Promise(resolve=>setTimeout(resolve,delay));return statement.run(...values);}};},close:()=>db.close()}:db;
const mockJev=process.env.UI_FIXTURE_JEV==='true';
const fetchImpl=mockJev?async(url,init)=>{
 if(url!=='https://www.jevai.org/api/v1/decisions')throw Error('Fixture forbids real provider requests');
 await new Promise(resolve=>setTimeout(resolve,1500));const body=JSON.parse(init.body);
 const answers=Object.fromEntries(Object.entries(body.questions).map(([key,question],index)=>[key,question.type==='score'?{type:'score',score:index===0?0:2,confidence:1,probabilities:{'0':index===0?1:0,'1':0,'2':index===0?0:1}}:{type:'choice',choice:Object.keys(question.criteria)[0],confidence:1,probabilities:Object.fromEntries(Object.keys(question.criteria).map((name,i)=>[name,i===0?1:0]))}]));
 return Response.json({code:0,data:{model:'jev-fixture-only',answers}});
}:undefined;
const server=createApp({database:fixtureDb,fetchImpl,config:{...loadConfig({DATABASE_PATH:':memory:',...(mockJev?{JEV_ENABLED:'true',JEV_API_KEY:'fixture-only-key'}:{})}),documentRoot:resolve(projectRoot,'tests/fixtures')}});
server.listen(8767,'127.0.0.1',()=>console.log('Disposable UI fixture at http://127.0.0.1:8767'));
