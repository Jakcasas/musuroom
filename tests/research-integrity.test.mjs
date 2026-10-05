import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { openDatabase } from '../backend/db/database.mjs';
import { postgresAdapter, initializePostgres } from '../backend/db/postgres.mjs';
import { createAccount } from '../backend/security/auth.mjs';
import { createApp } from '../backend/app.mjs';
import { loadConfig } from '../backend/config.mjs';

for (const dialect of ['sqlite','postgres']) test(`${dialect}: score guards reject wrong kinds, totals, shapes and stale writes; averages separate record revisions`, async t => {
 const engine=dialect==='postgres'?new PGlite():null;
 const db=engine?postgresAdapter({query:(text,values)=>values===undefined?engine.exec(text):engine.query(text,values),end:()=>engine.close()}):openDatabase(':memory:');
 if(engine){await engine.exec('CREATE ROLE anon; CREATE ROLE authenticated;');await initializePostgres(db);}
 const judge=await createAccount(db,{name:'Research test',role:'ADMIN'});
 const record=async(id,kind,data)=>db.prepare('INSERT INTO research_records(id,kind,title,data_json,public_token,revision,created_at,updated_at) VALUES(?,?,?,?,?,1,?,?)').run(id,kind,data.title,JSON.stringify(data),id+'-token','test','test');
 await record('sample','sample',{title:'Sample',sample_code:'NAM-01',jar_code:'HU-01',lot_code:'LO-01',origin:'Test'});
 await record('rubric','rubric',{title:'Rubric',criteria:[{label:'Taste',weight:70},{label:'Method',weight:30}]});
 const insert=(rubric='rubric',sample='sample',scores='[8,6]',total=74,sampleRevision=1)=>db.prepare('INSERT INTO research_scores(rubric_id,sample_id,judge_id,scores_json,total,revision,sample_revision,updated_at) VALUES(?,?,?,?,?,1,?,?)').run(rubric,sample,judge.account_id,scores,total,sampleRevision,'test');
 const reject=async action=>{let failed=false;try{await action();}catch{failed=true;}assert.equal(failed,true,'invalid score must be rejected');};
 for(const args of [['sample','rubric'],['rubric','sample','[8,6]',99],['rubric','sample','[8]'],['rubric','sample','["8",6]'],['rubric','sample','[11,6]'],['rubric','sample','{}'],['rubric','sample','[8,6]',74,0],['rubric','sample','[8,6]',74,2]])await reject(()=>insert(...args));
 await insert();
 await reject(()=>db.prepare("UPDATE research_records SET data_json=? WHERE id='rubric'").run(JSON.stringify({criteria:[{label:'Changed',weight:100}]})));
 await reject(()=>db.prepare("UPDATE research_records SET kind='clause' WHERE id='sample'").run());
 await reject(()=>db.prepare("UPDATE research_records SET title='Changed' WHERE id='sample'").run());
 await db.prepare("UPDATE research_records SET title='Changed',revision=2 WHERE id='sample'").run();
 await reject(()=>db.prepare("UPDATE research_scores SET total=74 WHERE sample_id='sample'").run());
 const server=createApp({database:db,config:loadConfig({DATABASE_PATH:':memory:'})});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));await server.databaseClosed;});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const login=await fetch(origin+'/api/v1/judge/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_code:judge.access_code})});const cookie=login.headers.get('set-cookie').split(';')[0],auth=await login.json();
 const summary=async()=>{const response=await fetch(origin+'/api/v1/judge/research/scores',{headers:{Cookie:cookie}});assert.equal(response.status,200);return response.json();};
 let state=await summary();assert.equal(state.items[0].stale_judges,1);assert.equal(state.items[0].current_judges,0);assert.equal(state.items[0].current_mean_total,null);assert.equal(state.items[0].mean_total,74);
 const response=await fetch(origin+'/api/v1/judge/research/scores',{method:'POST',headers:{Cookie:cookie,'X-CSRF-Token':auth.csrf_token,'Content-Type':'application/json'},body:JSON.stringify({sample_id:'sample',rubric_id:'rubric',revision:1,sample_revision:2,scores:[9,7]})});assert.equal(response.status,200);
 state=await summary();assert.equal(state.items[0].current_mean_total,84);assert.equal(state.items[0].stale_judges,0);assert.equal(state.items[0].current_judges,1);
 if(engine)assert.equal((await engine.query("SELECT has_function_privilege('anon','public.musuroom_validate_research_score()','EXECUTE') allowed")).rows[0].allowed,false);
});
