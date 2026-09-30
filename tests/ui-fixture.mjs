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
const server=createApp({database:db,config:{...loadConfig({DATABASE_PATH:':memory:'}),documentRoot:resolve(projectRoot,'tests/fixtures')}});
server.listen(8767,'127.0.0.1',()=>console.log('Disposable UI fixture at http://127.0.0.1:8767'));
