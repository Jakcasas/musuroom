import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../backend/app.mjs';
import { loadConfig } from '../backend/config.mjs';
import { openDatabase } from '../backend/db/database.mjs';
import { createHealthReporter, databaseFailure } from '../backend/services/service-health.mjs';
import { localAnswer } from '../dist/browser-retrieval.js';

test('Database outage returns 503 without leaking credentials and public pages remain readable', async t => {
  const db = openDatabase(':memory:');
  const prepare = db.prepare.bind(db);
  let unavailable = false;
  db.prepare = (...args) => {
    const statement = prepare(...args);
    return new Proxy(statement, { get(target, key) {
      const value = target[key];
      if (typeof value !== 'function') return value;
      return (...values) => {
        if (unavailable) throw Object.assign(new Error('mongodb://private-user:private-password@host'), {code:8000, name:'MongoServerError'});
        return value.apply(target, values);
      };
    } });
  };
  const logs=[];
  const server=createApp({database:db,config:loadConfig({DATABASE_PATH:':memory:'}),log:entry=>logs.push(entry)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await server.databaseClosed;});
  const origin=`http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(origin+'/healthz')).status,200);
  unavailable=true;
  for(const path of ['/healthz','/api/status','/api/knowledge','/api/v1/product/batches']) {
    const response=await fetch(origin+path);
    assert.equal(response.status,503,path);
    assert.equal(response.headers.get('Retry-After'),'30');
    assert.doesNotMatch(await response.text(),/private-user|private-password|MongoServerError/);
  }
  for(const path of ['/','/tri-thuc.html','/quyen-rieng-tu.html','/api/public/contact'])
    assert.equal((await fetch(origin+path)).status,200,path);
  assert.equal(logs.length,1);
  assert.equal(logs[0].reason,'atlas_authentication_failed');
  unavailable=false;
  assert.equal((await fetch(origin+'/healthz')).status,200);
  assert.equal(logs.length,2);
  assert.equal(logs[1].state,'recovered');
  assert.doesNotMatch(JSON.stringify(logs),/private-user|private-password/);
});

test('Health classification excludes duplicate/validation failures and rate limits transition logs', () => {
  assert.equal(databaseFailure({name:'MongoServerError',code:11000}),null);
  assert.equal(databaseFailure({name:'MongoServerError',code:121}),null);
  assert.equal(databaseFailure({name:'MongoOperationTimeoutError'}),'atlas_network_unavailable');
  const logs=[];const report=createHealthReporter(entry=>logs.push(entry));
  report({code:'atlas_authentication_failed',message:'secret'});
  report({code:'atlas_authentication_failed',message:'secret'});
  report();report();
  assert.equal(logs.length,2);assert.ok(!JSON.stringify(logs).includes('secret'));
});

test('Local assistant understands Vietnamese questions, cites sources and admits missing evidence', () => {
  const answer=localAnswer('Umami là gì?');
  assert.equal(answer.mode,'bundled');
  assert.ok(answer.sources.some(source=>source.id==='umami'));
  assert.match(answer.answer,/Giới hạn:/);
  assert.ok(answer.sources.length<=3);
  assert.equal(localAnswer('zxqvplm').sources.length,0);
});

test('Public contact validation and backend consent gate prevent unintended remote calls', async t => {
  assert.throws(()=>loadConfig({PUBLIC_CONTACT_EMAIL:'bad\r\n@example.test'}));
  let calls=0;
  const server=createApp({config:loadConfig({DATABASE_PATH:':memory:',AI_PROVIDER:'openrouter',OPENROUTER_API_KEY:'mock-key',AI_MODEL:'test/model',PUBLIC_CONTACT_EMAIL:'team@example.invalid'}),fetchImpl:async()=>{calls++;throw Error('mock provider');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await server.databaseClosed;});
  const origin=`http://127.0.0.1:${server.address().port}`;
  assert.deepEqual(await(await fetch(origin+'/api/public/contact')).json(),{email:'team@example.invalid'});
  const ask=body=>fetch(origin+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  for(const body of [{question:'Umami là gì?'},{question:'Umami là gì?',allow_remote:false}]){
    assert.equal((await(await ask(body)).json()).mode,'retrieval');assert.equal(calls,0);
  }
  assert.equal((await ask({question:'Umami là gì?',allow_remote:'true'})).status,422);
  assert.equal((await ask({question:'Umami là gì?',allow_remote:true})).status,200);
  assert.equal(calls,1);
});

test('Sitemap uses the configured origin and excludes private portals while their APIs stay protected', async t => {
  const server=createApp({config:loadConfig({DATABASE_PATH:':memory:',PUBLIC_ORIGIN:'https://custom.example'})});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await server.databaseClosed;});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const robots=await(await fetch(origin+'/robots.txt')).text();
  assert.match(robots,/Sitemap: https:\/\/custom.example\/sitemap.xml/);
  const sitemap=await(await fetch(origin+'/sitemap.xml')).text();
  assert.match(sitemap,/https:\/\/custom.example\/quyen-rieng-tu.html/);
  assert.doesNotMatch(sitemap,/giam-khao|quan-tri|bao-cao|truy-xuat/);
  const home=await(await fetch(origin+'/index.html')).text();
  assert.ok(home.includes('<link rel="canonical" href="https://custom.example/">'));
  assert.ok(home.includes('<meta property="og:image" content="https://custom.example/assets/mushroom-seasoning.webp">'));
  assert.equal((await fetch(origin+'/giam-khao.html')).headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal((await fetch(origin+'/api/v1/judge/dossier')).status,401);
});
